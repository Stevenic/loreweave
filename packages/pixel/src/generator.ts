/**
 * Pixel asset generation via agent adapters.
 *
 * Accepts any AgentAdapter (CLI proxy, LLM API, etc.) and handles:
 * - System prompt construction from schema/guide context files
 * - Palette loading and injection
 * - Post-generation validation
 *
 * Design-time: write assets to disk via CLI adapter
 * Runtime: generate assets in memory via API adapter (future)
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AgentAdapter, ExecuteOptions, ProgressEvent } from '@loreweave/agents';
import type {
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';
import { findPixelFiles } from './loader.js';
import {
	buildSizingTable,
	type ComputedDimensions,
	computeDimensions,
	DETAIL_LEVEL_PPU,
	type DetailLevel,
	inferArchetype,
} from './sizing.js';
import type { ValidationResult } from './validator.js';
import {
	validateEmitter,
	validatePalette,
	validateScene,
	validateSprite,
	validateTilemap,
	validateTileset,
} from './validator.js';

// ── Types ──

/** Supported pixel asset types for generation. */
export type PixelAssetType = 'sprite' | 'tileset' | 'tilemap' | 'scene' | 'palette' | 'emitter';

/** Options for generating a pixel asset. */
export interface GeneratePixelOptions {
	/** The generation prompt describing what to create. */
	prompt: string;

	/** Asset type to generate. Defaults to 'sprite'. */
	type?: PixelAssetType;

	/**
	 * Detail level for auto-sizing. Determines PPU and pixel dimensions.
	 * Can be a named level ('low'|'standard'|'high') or a raw PPU number.
	 * When set, the generator infers the object category from the prompt
	 * and computes dimensions automatically — no manual width/height needed.
	 * Defaults to 'standard' (32 PPU).
	 */
	detailLevel?: DetailLevel | number;

	/**
	 * Root asset directory (contains sprites/, tilesets/, palettes/, etc.).
	 * Output is written to the appropriate subdirectory unless outputDir is set.
	 */
	assetDir: string;

	/**
	 * Explicit output directory for the generated file.
	 * When set, overrides the default type-based subdirectory.
	 * Used for generating into a managed asset folder.
	 */
	outputDir?: string;

	/**
	 * Directory containing context files (pixel_format_llm_guide.md, pixel-schema.llmd).
	 * Defaults to parent of assetDir.
	 */
	contextDir?: string;

	/**
	 * Path to a palette file (relative to assetDir), or pre-loaded palette JSON string.
	 * If not set, defaults to 'palettes/fantasy32.palette.pixel.json'.
	 */
	palette?: string;

	/** Model override (e.g., "claude-sonnet-4-6-20250514"). */
	model?: string;

	/** Timeout in milliseconds. Defaults to 5 minutes. */
	timeout?: number;

	/** Extra environment variables for the adapter. */
	env?: Record<string, string>;

	/** Progress callback for streaming status updates. */
	onProgress?: (event: ProgressEvent) => void;

	/** Abort signal for cancellation. */
	abortSignal?: AbortSignal;

	/**
	 * Pre-loaded context content. When provided, skips file loading.
	 * Useful for runtime generation where context is already in memory.
	 */
	context?: {
		/** Pixel format LLM guide content. */
		guide?: string;
		/** Pixel schema LLMD content. */
		schema?: string;
		/** Palette JSON content (raw string). */
		paletteJson?: string;
		/** Palette display name (e.g., "fantasy32"). */
		paletteName?: string;
	};
}

/** Result of a pixel asset generation. */
export interface GeneratePixelResult {
	/** Whether generation completed successfully. */
	success: boolean;

	/** The agent's text output. */
	output: string;

	/** Files created or modified during generation. */
	changedFiles: string[];

	/** Validation result for the generated asset (if found). */
	validation?: ValidationResult;

	/** Path to the generated asset file (if found). */
	assetPath?: string;

	/** Auto-computed dimensions used for generation. */
	sizing?: ComputedDimensions;

	/** Error message if generation failed. */
	error?: string;

	/** Additional error details (e.g., stderr output). */
	errorDetails?: string;
}

// ── Output directory mapping ──

const OUTPUT_SUBDIRS: Record<PixelAssetType, string> = {
	sprite: 'sprites',
	tileset: 'tilesets',
	tilemap: 'tilemaps',
	scene: 'scenes',
	palette: 'palettes',
	emitter: 'emitters',
};

// ── Context loading ──

async function loadFileOptional(path: string): Promise<string> {
	try {
		return await readFile(path, 'utf-8');
	} catch {
		return '';
	}
}

async function loadContext(
	opts: GeneratePixelOptions,
): Promise<{ guide: string; schema: string; paletteSection: string }> {
	// Use pre-loaded context if provided
	if (opts.context) {
		const guide = opts.context.guide ?? '';
		const schema = opts.context.schema ?? '';
		let paletteSection = '';
		if (opts.context.paletteJson) {
			const name = opts.context.paletteName ?? 'provided';
			paletteSection = `\n\nUse this palette (${name}):\n\`\`\`json\n${opts.context.paletteJson}\n\`\`\``;
		}
		return { guide, schema, paletteSection };
	}

	// Load from files
	const contextDir = opts.contextDir ?? resolve(opts.assetDir, '..');

	const guide = await loadFileOptional(resolve(contextDir, 'pixel_format_llm_guide.md'));
	const schema = await loadFileOptional(resolve(contextDir, 'pixel-schema.llmd'));

	let paletteSection = '';
	if (opts.palette) {
		// Check if it's a file path or raw JSON
		if (opts.palette.trim().startsWith('{')) {
			paletteSection = `\n\nUse this palette:\n\`\`\`json\n${opts.palette}\n\`\`\``;
		} else {
			const palData = await loadFileOptional(resolve(opts.assetDir, opts.palette));
			if (palData) {
				paletteSection = `\n\nUse this palette:\n\`\`\`json\n${palData}\n\`\`\``;
			}
		}
	} else {
		// Default palette
		const palData = await loadFileOptional(
			resolve(opts.assetDir, 'palettes/fantasy32.palette.pixel.json'),
		);
		if (palData) {
			paletteSection = `\n\nUse this palette (fantasy32):\n\`\`\`json\n${palData}\n\`\`\``;
		}
	}

	return { guide, schema, paletteSection };
}

// ── System prompt builder ──

function buildSystemPrompt(
	assetType: PixelAssetType,
	outputDir: string,
	guide: string,
	schema: string,
	paletteSection: string,
	sizingSection: string,
): string {
	const formatSections: string[] = [];
	if (schema) formatSections.push(`# Pixel Format Schema\n${schema}`);
	if (guide) formatSections.push(`# Pixel Format Generation Guide\n${guide}`);

	return `You are a pixel art asset generator for the LoreWeave game engine.
You generate .pixel.json assets that conform to the Pixel Format v1 spec.

${formatSections.join('\n\n')}
${paletteSection}
${sizingSection}

## Instructions
- Generate a ${assetType} asset based on the user's prompt
- The output MUST be valid JSON conforming to the Pixel Format v1 spec
- Write the final .pixel.json file to: ${outputDir}
- Use the palette provided — reference keys from the palette entries
- For sprites: use the dimensions from the sizing table above based on what the object is. Each pixel row must be exactly \`width\` characters long, using single-character palette keys. Set \`ppu\` to match the detail level.
- The file must include the correct \`format\` field (e.g., "pixel-sprite-v1")
- Name the file based on the asset name with the appropriate extension (e.g., warrior.sprite.pixel.json)
- Do NOT include any explanation or commentary — just write the file
- After writing the file, respond with the file path you created`;
}

// ── Post-generation validation ──

function validateAssetByType(data: unknown, fileType: string): ValidationResult {
	switch (fileType) {
		case 'sprite':
			return validateSprite(data as PixelSprite);
		case 'tileset':
			return validateTileset(data as PixelTileset);
		case 'tilemap':
			return validateTilemap(data as PixelTilemap);
		case 'scene':
			return validateScene(data as PixelScene);
		case 'palette':
			return validatePalette(data as PixelPalette);
		case 'emitter':
			return validateEmitter(data as PixelEmitter);
		default:
			return { valid: true, errors: [], warnings: [] };
	}
}

async function validateGeneratedAsset(
	outputDir: string,
): Promise<{ validation: ValidationResult; assetPath: string } | undefined> {
	try {
		const files = await findPixelFiles(outputDir);
		if (files.length === 0) return undefined;

		// Pick the newest file (most recently modified = just generated)
		const newest = files[files.length - 1];
		const content = await readFile(newest.path, 'utf-8');
		const data: unknown = JSON.parse(content);
		const validation = validateAssetByType(data, newest.fileType);
		return { validation, assetPath: newest.path };
	} catch {
		return undefined;
	}
}

// ── Main generation function ──

/**
 * Generate a pixel asset using an agent adapter.
 *
 * Works with any adapter — CLI proxy (design-time file generation)
 * or LLM API adapter (runtime in-memory generation).
 *
 * @param adapter - The agent adapter to use for generation
 * @param options - Generation options (prompt, type, output dir, etc.)
 * @returns Generation result with validation and file info
 */
export async function generatePixelAsset(
	adapter: AgentAdapter,
	options: GeneratePixelOptions,
): Promise<GeneratePixelResult> {
	const assetType = options.type ?? 'sprite';
	const outputDir =
		options.outputDir ?? resolve(options.assetDir, OUTPUT_SUBDIRS[assetType] ?? 'sprites');
	const cwd = options.contextDir ?? resolve(options.assetDir, '..');

	// Auto-sizing: infer archetype from prompt, compute dimensions
	const detailLevel = options.detailLevel ?? 'standard';
	const ppu = typeof detailLevel === 'number' ? detailLevel : DETAIL_LEVEL_PPU[detailLevel];
	const archetype = inferArchetype(options.prompt);
	const sizing = computeDimensions(archetype, ppu);
	const sizingTable = buildSizingTable(detailLevel);

	// Build sizing instructions for the specific asset being generated
	const sizingSection = `\n\n${sizingTable}\n\n**For this specific request:** Based on the prompt, this is a "${archetype.label}" (${archetype.description}). Use dimensions **${sizing.width}×${sizing.height}** pixels with \`"ppu": ${sizing.ppu}\`.`;

	// Load context and build system prompt
	const { guide, schema, paletteSection } = await loadContext(options);
	const systemPrompt = buildSystemPrompt(
		assetType,
		outputDir,
		guide,
		schema,
		paletteSection,
		sizingSection,
	);

	// Build adapter execution options
	const executeOptions: ExecuteOptions = {
		systemPrompt,
		model: options.model,
		cwd,
		timeout: options.timeout ?? 5 * 60 * 1000,
		env: options.env,
		onProgress: options.onProgress,
		abortSignal: options.abortSignal,
	};

	try {
		const result = await adapter.execute(options.prompt, executeOptions);

		if (!result.success) {
			return {
				success: false,
				output: result.output,
				changedFiles: result.changedFiles,
				error: result.diagnostics?.timedOut
					? `Generation timed out after ${Math.round((options.timeout ?? 300000) / 1000)}s.`
					: `Generation failed (exit code ${result.diagnostics?.exitCode})`,
				errorDetails: result.diagnostics?.stderr || result.output || undefined,
			};
		}

		// Post-generation validation
		const validationResult = await validateGeneratedAsset(outputDir);

		return {
			success: true,
			output: result.output,
			changedFiles: result.changedFiles,
			validation: validationResult?.validation,
			assetPath: validationResult?.assetPath,
			sizing,
		};
	} catch (err) {
		const errMsg = err instanceof Error ? err.message : String(err);
		return {
			success: false,
			output: '',
			changedFiles: [],
			error: `Generation failed: ${errMsg}`,
		};
	}
}
