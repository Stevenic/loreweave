/**
 * Pixel Explorer web server.
 *
 * HTTP server with REST API, WebSocket for live reload, and file watcher.
 */

import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { relative, resolve } from 'node:path';
import { CliProxyAdapter, type ProgressEvent } from '@loreweave/agents';
import {
	classifyFile,
	findPixelFiles,
	generatePixelAsset,
	type GeneratePixelResult,
	loadAllPixelFiles,
	loadPixelFile,
	type PixelAssetType,
	type ValidationResult,
	validateEmitter,
	validatePalette,
	validateScene,
	validateSprite,
	validateTilemap,
	validateTileset,
} from '@loreweave/pixel';
import type {
	PixelEmitter,
	PixelPalette,
	PixelScene,
	PixelSprite,
	PixelTilemap,
	PixelTileset,
} from '@loreweave/types';
import { type WebSocket, WebSocketServer } from 'ws';
import { getAppJs, getPageHtml, getStyleCss } from './html.js';

export interface ServerOptions {
	port: number;
	assetDir: string;
	debug?: boolean;
}

let debugMode = false;

export async function startServer(opts: ServerOptions): Promise<void> {
	const { port, assetDir, debug } = opts;
	debugMode = debug ?? false;

	// ── HTTP Server ──

	const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
		try {
			await handleRequest(req, res, assetDir);
		} catch (err) {
			console.error('Request error:', err);
			res.writeHead(500, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Internal server error' }));
		}
	});

	// ── WebSocket Server ──

	const wss = new WebSocketServer({ server });
	const clients = new Set<WebSocket>();

	wss.on('connection', (ws) => {
		clients.add(ws);
		ws.on('close', () => clients.delete(ws));
	});

	function broadcast(data: object): void {
		const msg = JSON.stringify(data);
		for (const ws of clients) {
			if (ws.readyState === ws.OPEN) {
				ws.send(msg);
			}
		}
	}

	// ── File Watcher ──

	try {
		const watcher = watch(assetDir, { recursive: true });
		watcher.on('change', (_event, filename) => {
			if (!filename) return;
			const name = typeof filename === 'string' ? filename : filename.toString();
			const fileType = classifyFile(name);
			if (fileType) {
				broadcast({
					type: 'asset-changed',
					path: name.replace(/\\/g, '/'),
					fileType,
				});
			}
		});
		watcher.on('error', (err) => {
			console.error('File watcher error:', err);
		});
	} catch {
		console.warn('\x1b[33mWarning: File watcher not available. Live reload disabled.\x1b[0m');
	}

	// ── Start ──

	server.on('error', (err: NodeJS.ErrnoException) => {
		if (err.code === 'EADDRINUSE') {
			console.error(
				`\n\x1b[31mError: Port ${port} is already in use.\x1b[0m\n` +
					`  Another instance of pixel-explorer may be running.\n` +
					`  Either stop the other process or use a different port:\n\n` +
					`    pixel-explorer start --port ${port + 1}\n`,
			);
			process.exit(1);
		}
		throw err;
	});

	server.listen(port, () => {
		console.log();
		console.log(`\x1b[1m\x1b[36m  PixelExplorer\x1b[0m is running`);
		console.log();
		console.log(`  \x1b[2mLocal:\x1b[0m   http://localhost:${port}`);
		console.log(`  \x1b[2mAssets:\x1b[0m  ${assetDir}`);
		if (debugMode) {
			console.log(`  \x1b[2mDebug:\x1b[0m   \x1b[33menabled\x1b[0m`);
		}
		console.log();
	});
}

// ── Router ──

async function handleRequest(
	req: IncomingMessage,
	res: ServerResponse,
	assetDir: string,
): Promise<void> {
	const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
	const path = url.pathname;

	// Static files
	if (path === '/' || path === '/index.html') {
		return sendHtml(res, getPageHtml());
	}
	if (path === '/app.js') {
		return sendJs(res, getAppJs());
	}
	if (path === '/style.css') {
		return sendCss(res, getStyleCss());
	}

	// API routes
	if (path === '/api/assets' && req.method === 'GET') {
		return apiListAssets(res, assetDir);
	}
	if (path === '/api/asset' && req.method === 'GET') {
		const filePath = url.searchParams.get('path');
		if (!filePath) return sendJson(res, 400, { error: 'Missing path parameter' });
		return apiGetAsset(res, assetDir, filePath);
	}
	if (path === '/api/validate' && req.method === 'GET') {
		return apiValidateAll(res, assetDir);
	}
	if (path === '/api/palettes' && req.method === 'GET') {
		return apiListPalettes(res, assetDir);
	}
	if (path === '/api/generate' && req.method === 'POST') {
		const body = await readBody(req);
		return apiGenerate(res, assetDir, body);
	}

	sendJson(res, 404, { error: 'Not found' });
}

// ── Response Helpers ──

function sendHtml(res: ServerResponse, html: string): void {
	res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
	res.end(html);
}

function sendJs(res: ServerResponse, js: string): void {
	res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
	res.end(js);
}

function sendCss(res: ServerResponse, css: string): void {
	res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
	res.end(css);
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { 'Content-Type': 'application/json' });
	res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks).toString()));
		req.on('error', reject);
	});
}

// ── API: List Assets ──

async function apiListAssets(res: ServerResponse, assetDir: string): Promise<void> {
	const files = await findPixelFiles(assetDir);

	const grouped: Record<string, Array<{ path: string; relativePath: string }>> = {};
	for (const f of files) {
		const relPath = relative(assetDir, f.path).replace(/\\/g, '/');
		if (!grouped[f.fileType]) grouped[f.fileType] = [];
		grouped[f.fileType].push({ path: f.path, relativePath: relPath });
	}

	sendJson(res, 200, { assets: grouped, total: files.length });
}

// ── API: Get Single Asset ──

async function apiGetAsset(res: ServerResponse, assetDir: string, filePath: string): Promise<void> {
	try {
		const absPath = resolve(assetDir, filePath);
		// Security: ensure the resolved path is within assetDir
		if (!absPath.startsWith(assetDir)) {
			return sendJson(res, 403, { error: 'Path traversal not allowed' });
		}
		const resource = await loadPixelFile(absPath, assetDir);
		sendJson(res, 200, {
			path: resource.relativePath.replace(/\\/g, '/'),
			fileType: resource.fileType,
			data: resource.data,
		});
	} catch (err) {
		sendJson(res, 404, { error: `Asset not found: ${(err as Error).message}` });
	}
}

// ── API: Validate All ──

async function apiValidateAll(res: ServerResponse, assetDir: string): Promise<void> {
	const resources = await loadAllPixelFiles(assetDir);

	// Build registries
	const paletteRegistry = new Map<string, PixelPalette>();
	const tilesetRegistry = new Map<string, PixelTileset>();

	for (const r of resources) {
		if (r.fileType === 'palette') {
			const p = r.data as PixelPalette;
			if (p.name) paletteRegistry.set(p.name, p);
		}
		if (r.fileType === 'tileset') {
			const t = r.data as PixelTileset;
			if (t.name) tilesetRegistry.set(t.name, t);
		}
	}

	const results: Array<{
		path: string;
		fileType: string;
		valid: boolean;
		errors: string[];
		warnings: string[];
	}> = [];

	for (const r of resources) {
		const rel = r.relativePath.replace(/\\/g, '/');
		let result: ValidationResult;

		switch (r.fileType) {
			case 'sprite':
				result = validateSprite(r.data as PixelSprite, paletteRegistry);
				break;
			case 'tileset':
				result = validateTileset(r.data as PixelTileset, paletteRegistry);
				break;
			case 'tilemap':
				result = validateTilemap(r.data as PixelTilemap, tilesetRegistry);
				break;
			case 'scene':
				result = validateScene(r.data as PixelScene);
				break;
			case 'palette':
				result = validatePalette(r.data as PixelPalette);
				break;
			case 'emitter':
				result = validateEmitter(r.data as PixelEmitter);
				break;
			default:
				result = { valid: false, errors: [`Unknown type: ${r.fileType}`], warnings: [] };
		}

		results.push({
			path: rel,
			fileType: r.fileType,
			valid: result.valid,
			errors: result.errors,
			warnings: result.warnings,
		});
	}

	const passed = results.filter((r) => r.valid).length;
	const failed = results.filter((r) => !r.valid).length;
	const warnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

	sendJson(res, 200, { results, summary: { total: results.length, passed, failed, warnings } });
}

// ── API: List Palettes ──

async function apiListPalettes(res: ServerResponse, assetDir: string): Promise<void> {
	const files = await findPixelFiles(assetDir);
	const palettes: Array<{ path: string; name: string; entryCount: number }> = [];

	for (const f of files) {
		if (f.fileType === 'palette') {
			try {
				const content = await readFile(f.path, 'utf-8');
				const data = JSON.parse(content) as PixelPalette;
				palettes.push({
					path: relative(assetDir, f.path).replace(/\\/g, '/'),
					name: data.name ?? '(unnamed)',
					entryCount: Object.keys(data.entries).length,
				});
			} catch {
				// skip
			}
		}
	}

	sendJson(res, 200, { palettes });
}

// ── API: Generate ──

async function apiGenerate(res: ServerResponse, assetDir: string, body: string): Promise<void> {
	let params: { prompt: string; type?: string; palette?: string; model?: string; detailLevel?: string | number };
	try {
		params = JSON.parse(body);
	} catch {
		return sendJson(res, 400, { error: 'Invalid JSON body' });
	}

	if (!params.prompt) {
		return sendJson(res, 400, { error: 'Missing prompt' });
	}

	// Claude CLI needs ANTHROPIC_API_KEY to avoid interactive credential prompts
	// that fail when running headless from a web server (exit code 11 on Windows).
	if (!process.env.ANTHROPIC_API_KEY) {
		return sendJson(res, 500, {
			error:
				'ANTHROPIC_API_KEY is required for generation. ' +
				'Add it to a .env file in the working directory or set it as an environment variable.',
		});
	}

	// Model selection: request body > CLAUDE_MODEL env var > default
	const model = params.model || process.env.CLAUDE_MODEL || undefined;
	const assetType = (params.type ?? 'sprite') as PixelAssetType;

	const prefix = '\x1b[36m[debug]\x1b[0m';

	if (debugMode) {
		console.log(`${prefix} Starting generation...`);
		console.log(`${prefix} Prompt: ${params.prompt}`);
		console.log(`${prefix} Type: ${assetType}`);
		console.log(`${prefix} Model: ${model ?? '(default)'}`);
	}

	// Debug progress callback
	const onProgress = debugMode
		? (event: ProgressEvent) => {
				switch (event.type) {
					case 'start':
						console.log(`${prefix} ${event.message}`);
						break;
					case 'text':
						console.log(`${prefix} \x1b[2m${event.content.trimEnd()}\x1b[0m`);
						break;
					case 'error':
						console.error(`${prefix} \x1b[31m${event.message}\x1b[0m`);
						break;
					case 'done':
						console.log(`${prefix} \x1b[32m${event.message}\x1b[0m`);
						break;
				}
			}
		: undefined;

	// Create adapter and delegate to @loreweave/pixel generator
	const adapter = new CliProxyAdapter({
		preset: 'claude',
		model,
		timeout: 5 * 60 * 1000,
	});

	// Detail level: request body > default 'standard'
	const detailLevel = params.detailLevel ?? 'standard';

	const result: GeneratePixelResult = await generatePixelAsset(adapter, {
		prompt: params.prompt,
		type: assetType,
		detailLevel: detailLevel as 'low' | 'standard' | 'high' | number,
		assetDir,
		palette: params.palette,
		model,
		env: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
		onProgress,
	});

	if (!result.success) {
		return sendJson(res, 500, {
			error: result.error ?? 'Generation failed',
			details: result.errorDetails,
		});
	}

	sendJson(res, 200, {
		success: true,
		result: result.output,
		changedFiles: result.changedFiles,
		validation: result.validation,
		assetPath: result.assetPath,
		sizing: result.sizing,
	});
}
