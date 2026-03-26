#!/usr/bin/env node
/**
 * @loreweave/asset-explorer — CLI tool for browsing, validating, previewing,
 * and generating Pixel Format v1 assets
 *
 * Commands:
 *   list [dir]                    — List all pixel assets in a directory tree
 *   info <file>                   — Show detailed info about a specific asset
 *   validate [dir]                — Validate all pixel assets
 *   preview <file> [tile]         — Render a sprite/tile preview in the terminal
 *   palette <file>                — Display palette colors
 *   generate <prompt> [options]   — Generate a pixel asset using the Claude Agent SDK
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { findPixelFiles, loadAllPixelFiles, loadPixelFile, renderSpriteToTerminalString, renderTileToTerminalString, validateEmitter, validatePalette, validateScene, validateSprite, validateTilemap, validateTileset, } from '@loreweave/pixel';
// ── Formatting helpers ──────────────────────────────────────────────
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const BLUE = '\x1b[34m';
function badge(type) {
    switch (type) {
        case 'sprite':
            return `${CYAN}[sprite]${RESET}`;
        case 'tileset':
            return `${MAGENTA}[tileset]${RESET}`;
        case 'tilemap':
            return `${BLUE}[tilemap]${RESET}`;
        case 'scene':
            return `${YELLOW}[scene]${RESET}`;
        case 'palette':
            return `${GREEN}[palette]${RESET}`;
        case 'emitter':
            return `${RED}[emitter]${RESET}`;
        default:
            return `[${type}]`;
    }
}
function heading(text) {
    console.log(`\n${BOLD}${text}${RESET}`);
    console.log(DIM + '─'.repeat(text.length) + RESET);
}
// ── Commands ────────────────────────────────────────────────────────
async function cmdList(dir) {
    const files = await findPixelFiles(dir);
    if (files.length === 0) {
        console.log(`${DIM}No pixel files found in ${dir}${RESET}`);
        return;
    }
    heading(`Pixel Resources (${files.length} files)`);
    // Group by type
    const grouped = new Map();
    for (const f of files) {
        const group = grouped.get(f.fileType) ?? [];
        group.push(f);
        grouped.set(f.fileType, group);
    }
    for (const [type, items] of grouped) {
        console.log(`\n  ${badge(type)} ${BOLD}${items.length}${RESET} file(s)`);
        for (const item of items) {
            const relPath = item.path.replace(dir, '').replace(/^[/\\]/, '');
            console.log(`    ${DIM}${relPath}${RESET}`);
        }
    }
    console.log();
}
async function cmdInfo(filePath) {
    const absPath = resolve(filePath);
    const resource = await loadPixelFile(absPath, process.cwd());
    heading(`Resource: ${resource.relativePath}`);
    console.log(`  Type:   ${badge(resource.fileType)}`);
    const data = resource.data;
    if (resource.fileType === 'sprite') {
        const s = data;
        console.log(`  Name:   ${s.name}`);
        console.log(`  Size:   ${s.width}x${s.height}`);
        console.log(`  Encode: ${s.encoding}`);
        if (s.frameCount && s.frameCount > 1)
            console.log(`  Frames: ${s.frameCount}`);
        if (s.layers)
            console.log(`  Layers: ${s.layers.length}`);
        if (s.origin)
            console.log(`  Origin: (${s.origin.x}, ${s.origin.y})`);
        if (s.baseScale !== undefined)
            console.log(`  Scale:  ${s.baseScale}x`);
        if (s.symmetry && s.symmetry !== 'none')
            console.log(`  Sym:    ${s.symmetry}`);
        if (s.tags?.length)
            console.log(`  Tags:   ${s.tags.join(', ')}`);
        if (s.collision) {
            console.log(`  Collide: (${s.collision.x},${s.collision.y}) ${s.collision.width}x${s.collision.height}`);
        }
        if (s.clips)
            console.log(`  Clips:  ${Object.keys(s.clips).join(', ')}`);
        if (s.regions)
            console.log(`  Regions: ${Object.keys(s.regions).join(', ')}`);
        if (s.attachments)
            console.log(`  Attach: ${Object.keys(s.attachments).join(', ')}`);
        if (s.variants)
            console.log(`  Variants: ${Object.keys(s.variants).join(', ')}`);
        if (typeof s.palette === 'object') {
            console.log(`  Palette: inline (${Object.keys(s.palette.entries).length} entries)`);
        }
        else {
            console.log(`  Palette: ${s.palette}`);
        }
    }
    else if (resource.fileType === 'tileset') {
        const t = data;
        console.log(`  Name:     ${t.name}`);
        console.log(`  Tile size: ${t.tileWidth}x${t.tileHeight}`);
        const tileNames = Object.keys(t.tiles);
        console.log(`  Tiles:    ${tileNames.length}`);
        for (const name of tileNames) {
            const tile = t.tiles[name];
            const tags = tile.tags?.length ? ` ${DIM}(${tile.tags.join(', ')})${RESET}` : '';
            const conn = tile.connectivity
                ? ` ${DIM}[${Object.entries(tile.connectivity)
                    .map(([d, v]) => `${d}:${v}`)
                    .join(', ')}]${RESET}`
                : '';
            console.log(`    - ${name} [${tile.encoding}]${tags}${conn}`);
        }
    }
    else if (resource.fileType === 'tilemap') {
        const tm = data;
        console.log(`  Name:    ${tm.name}`);
        console.log(`  Tileset: ${tm.tileset}`);
        console.log(`  Grid:    ${tm.gridWidth}x${tm.gridHeight}`);
        console.log(`  Legend:  ${Object.keys(tm.legend).join(', ')}`);
    }
    else if (resource.fileType === 'scene') {
        const sc = data;
        console.log(`  Name:      ${sc.name}`);
        console.log(`  Canvas:    ${sc.canvas.width}x${sc.canvas.height}`);
        if (sc.canvas.background)
            console.log(`  Background: ${sc.canvas.background}`);
        if (sc.canvas.scale)
            console.log(`  Scale:     ${sc.canvas.scale}x`);
        if (sc.canvas.camera) {
            const cam = sc.canvas.camera;
            console.log(`  Camera:    (${cam.x}, ${cam.y}) zoom:${cam.zoom ?? 1}`);
        }
        console.log(`  Layers:    ${sc.layers.length}`);
        for (const layer of sc.layers) {
            const layerType = layer.type ?? 'items';
            if (layerType === 'tilemap') {
                const extras = [];
                if (layer.blend && layer.blend !== 'normal')
                    extras.push(`blend:${layer.blend}`);
                if (layer.scrollFactor !== undefined)
                    extras.push(`scroll:${layer.scrollFactor}`);
                const suffix = extras.length > 0 ? ` ${DIM}[${extras.join(', ')}]${RESET}` : '';
                console.log(`    - ${layer.name} (tilemap: ${layer.tilemap})${suffix}`);
            }
            else {
                const itemCount = layer.items?.length ?? 0;
                const extras = [];
                if (layer.blend && layer.blend !== 'normal')
                    extras.push(`blend:${layer.blend}`);
                if (layer.sort === 'y')
                    extras.push('y-sort');
                if (layer.scrollFactor !== undefined && layer.scrollFactor !== 1)
                    extras.push(`scroll:${layer.scrollFactor}`);
                const suffix = extras.length > 0 ? ` ${DIM}[${extras.join(', ')}]${RESET}` : '';
                console.log(`    - ${layer.name} (${itemCount} items)${suffix}`);
                if (layer.items) {
                    for (const item of layer.items) {
                        const parts = [];
                        if (item.flipX)
                            parts.push('flipX');
                        if (item.flipY)
                            parts.push('flipY');
                        if (item.opacity !== undefined)
                            parts.push(`opacity:${item.opacity}`);
                        if (item.scale !== undefined)
                            parts.push(`scale:${item.scale}`);
                        if (item.clip)
                            parts.push(`clip:${item.clip}`);
                        if (item.variant)
                            parts.push(`variant:${item.variant}`);
                        if (item.attach)
                            parts.push(`attach:${item.attach.parent}.${item.attach.point}`);
                        const suffix2 = parts.length > 0 ? ` ${DIM}[${parts.join(', ')}]${RESET}` : '';
                        const pos = item.attach ? '' : ` @ (${item.x}, ${item.y})`;
                        console.log(`      ${item.asset}${pos}${suffix2}`);
                    }
                }
            }
        }
    }
    else if (resource.fileType === 'palette') {
        const p = data;
        console.log(`  Name:    ${p.name ?? '(unnamed)'}`);
        console.log(`  Entries: ${Object.keys(p.entries).length}`);
        if (p.aliases)
            console.log(`  Aliases: ${Object.keys(p.aliases).length}`);
        if (p.ramps)
            console.log(`  Ramps:   ${Object.keys(p.ramps).join(', ')}`);
        printPaletteSwatches(p.entries);
    }
    else if (resource.fileType === 'emitter') {
        const e = data;
        console.log(`  Name:     ${e.name}`);
        console.log(`  Sprite:   ${e.sprite}`);
        console.log(`  Rate:     ${e.rate}/sec`);
        console.log(`  Lifetime: ${e.lifetime.min}–${e.lifetime.max}ms`);
        console.log(`  Max:      ${e.maxParticles ?? 100}`);
        if (e.gravity)
            console.log(`  Gravity:  ${e.gravity}`);
        if (e.fadeOut)
            console.log(`  FadeOut:  yes`);
        if (e.burst)
            console.log(`  Burst:    ${e.burst}`);
    }
    console.log();
}
async function cmdValidate(dir) {
    const resources = await loadAllPixelFiles(dir);
    if (resources.length === 0) {
        console.log(`${DIM}No pixel files found in ${dir}${RESET}`);
        return;
    }
    // Build palette registry from loaded palettes
    const paletteRegistry = new Map();
    for (const r of resources) {
        if (r.fileType === 'palette') {
            const p = r.data;
            if (p.name)
                paletteRegistry.set(p.name, p);
        }
    }
    // Build tileset registry for tilemap validation
    const tilesetRegistry = new Map();
    for (const r of resources) {
        if (r.fileType === 'tileset') {
            const t = r.data;
            if (t.name)
                tilesetRegistry.set(t.name, t);
        }
    }
    heading(`Validating ${resources.length} resources`);
    let passed = 0;
    let failed = 0;
    let warnings = 0;
    for (const r of resources) {
        const rel = r.relativePath;
        let result;
        switch (r.fileType) {
            case 'sprite':
                result = validateSprite(r.data, paletteRegistry);
                break;
            case 'tileset':
                result = validateTileset(r.data, paletteRegistry);
                break;
            case 'tilemap':
                result = validateTilemap(r.data, tilesetRegistry);
                break;
            case 'scene':
                result = validateScene(r.data);
                break;
            case 'palette':
                result = validatePalette(r.data);
                break;
            case 'emitter':
                result = validateEmitter(r.data);
                break;
            default:
                result = { valid: false, errors: [`Unknown type: ${r.fileType}`], warnings: [] };
        }
        if (result.valid) {
            const warnSuffix = result.warnings.length > 0 ? ` ${YELLOW}(${result.warnings.length} warnings)${RESET}` : '';
            console.log(`  ${GREEN}PASS${RESET} ${badge(r.fileType)} ${rel}${warnSuffix}`);
            passed++;
        }
        else {
            console.log(`  ${RED}FAIL${RESET} ${badge(r.fileType)} ${rel}`);
            for (const err of result.errors) {
                console.log(`       ${RED}${err}${RESET}`);
            }
            failed++;
        }
        if (result.warnings.length > 0) {
            warnings += result.warnings.length;
            for (const w of result.warnings) {
                console.log(`       ${YELLOW}${w}${RESET}`);
            }
        }
    }
    console.log();
    console.log(`  ${BOLD}Results:${RESET} ${GREEN}${passed} passed${RESET}, ${failed > 0 ? RED : DIM}${failed} failed${RESET}${warnings > 0 ? `, ${YELLOW}${warnings} warnings${RESET}` : ''}`);
    console.log();
    if (failed > 0)
        process.exitCode = 1;
}
async function cmdPreview(filePath, tileName) {
    const absPath = resolve(filePath);
    const resource = await loadPixelFile(absPath, process.cwd());
    if (resource.fileType === 'sprite') {
        const sprite = resource.data;
        const frames = sprite.frameCount ?? 1;
        heading(`Preview: ${sprite.name} (${sprite.width}x${sprite.height}, ${frames} frame(s))`);
        console.log(renderSpriteToTerminalString(sprite));
        console.log();
    }
    else if (resource.fileType === 'tileset') {
        const tileset = resource.data;
        const tileNames = tileName ? [tileName] : Object.keys(tileset.tiles);
        for (const name of tileNames) {
            const tile = tileset.tiles[name];
            if (!tile) {
                console.log(`${RED}Tile '${name}' not found in tileset${RESET}`);
                continue;
            }
            heading(`Preview: ${tileset.name}:${name} (${tileset.tileWidth}x${tileset.tileHeight})`);
            console.log(renderTileToTerminalString(tile, tileset.tileWidth, tileset.tileHeight, tileset.palette));
            console.log();
        }
    }
    else {
        console.log(`${YELLOW}Preview only supports sprites and tilesets${RESET}`);
        console.log(`Use 'info' to inspect scenes, tilemaps, palettes, and emitters.`);
    }
}
async function cmdPalette(filePath) {
    const absPath = resolve(filePath);
    const content = await readFile(absPath, 'utf-8');
    const data = JSON.parse(content);
    let entries;
    if (data.format === 'pixel-palette-v1') {
        entries = data.entries;
        heading(`Palette: ${data.name ?? '(unnamed)'}`);
    }
    else if (typeof data.palette === 'object' && data.palette.entries) {
        entries = data.palette.entries;
        heading(`Inline palette from: ${data.name ?? filePath}`);
    }
    else {
        console.log(`${YELLOW}No inline palette found. Palette is a reference: '${data.palette}'${RESET}`);
        return;
    }
    printPaletteSwatches(entries);
    console.log();
}
function printPaletteSwatches(entries) {
    for (const [key, color] of Object.entries(entries)) {
        if (color === 'transparent') {
            console.log(`    ${BOLD}${key}${RESET}  ${DIM}transparent${RESET}`);
        }
        else {
            const hex = color.slice(1);
            const r = Number.parseInt(hex.slice(0, 2), 16);
            const g = Number.parseInt(hex.slice(2, 4), 16);
            const b = Number.parseInt(hex.slice(4, 6), 16);
            const swatch = `\x1b[48;2;${r};${g};${b}m    ${RESET}`;
            console.log(`    ${BOLD}${key}${RESET}  ${swatch} ${color}`);
        }
    }
}
async function cmdGenerate(opts) {
    heading(`Generating ${opts.type}: ${opts.prompt}`);
    // Lazy-import Agent SDK so the CLI works without it installed for non-generate commands
    let agentSdk;
    try {
        agentSdk = await import('@anthropic-ai/claude-agent-sdk');
    }
    catch {
        console.log(`${RED}Error: @anthropic-ai/claude-agent-sdk is not installed.${RESET}`);
        console.log(`Run: npm install @anthropic-ai/claude-agent-sdk zod`);
        process.exitCode = 1;
        return;
    }
    let zod;
    try {
        zod = await import('zod');
    }
    catch {
        console.log(`${RED}Error: zod is not installed.${RESET}`);
        console.log(`Run: npm install zod`);
        process.exitCode = 1;
        return;
    }
    const z = zod.z;
    // Load the LLM guide and schema for context
    let llmGuide = '';
    let llmdSchema = '';
    try {
        llmGuide = await readFile(resolve(process.cwd(), 'pixel_format_llm_guide.md'), 'utf-8');
    }
    catch {
        console.log(`${YELLOW}Warning: pixel_format_llm_guide.md not found, generation quality may be reduced${RESET}`);
    }
    try {
        llmdSchema = await readFile(resolve(process.cwd(), 'pixel-schema.llmd'), 'utf-8');
    }
    catch {
        console.log(`${YELLOW}Warning: pixel-schema.llmd not found${RESET}`);
    }
    // Load palette if specified
    let paletteContext = '';
    if (opts.palette) {
        try {
            const palettePath = resolve(opts.palette);
            paletteContext = await readFile(palettePath, 'utf-8');
            paletteContext = `\n\nUse this palette:\n\`\`\`json\n${paletteContext}\n\`\`\``;
        }
        catch {
            console.log(`${YELLOW}Warning: Could not load palette file: ${opts.palette}${RESET}`);
        }
    }
    else {
        // Default: load fantasy32 palette
        try {
            paletteContext = await readFile(resolve(process.cwd(), 'assets/palettes/fantasy32.palette.pixel.json'), 'utf-8');
            paletteContext = `\n\nUse this palette (fantasy32):\n\`\`\`json\n${paletteContext}\n\`\`\``;
        }
        catch {
            // No default palette available
        }
    }
    // Build pixel MCP tools
    const validateTool = agentSdk.tool('validate_pixel', 'Validate a pixel format JSON string against the spec. Returns validation result with errors and warnings.', {
        json: z.string().describe('The pixel format JSON string to validate'),
        type: z
            .enum(['sprite', 'tileset', 'tilemap', 'scene', 'palette', 'emitter'])
            .describe('The asset type'),
    }, async (args) => {
        try {
            const data = JSON.parse(args.json);
            let result;
            switch (args.type) {
                case 'sprite':
                    result = validateSprite(data);
                    break;
                case 'tileset':
                    result = validateTileset(data);
                    break;
                case 'tilemap':
                    result = validateTilemap(data);
                    break;
                case 'scene':
                    result = validateScene(data);
                    break;
                case 'palette':
                    result = validatePalette(data);
                    break;
                case 'emitter':
                    result = validateEmitter(data);
                    break;
                default:
                    result = { valid: false, errors: [`Unknown type: ${args.type}`], warnings: [] };
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (err) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    const previewTool = agentSdk.tool('preview_pixel', 'Render a pixel sprite JSON to an ANSI terminal string for visual verification. Only works for sprites.', {
        json: z.string().describe('The pixel sprite JSON string to preview'),
    }, async (args) => {
        try {
            const sprite = JSON.parse(args.json);
            const preview = renderSpriteToTerminalString(sprite);
            return {
                content: [{ type: 'text', text: preview }],
            };
        }
        catch (err) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Preview error: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    const listAssetsTool = agentSdk.tool('list_assets', 'List all existing pixel assets in the assets directory. Returns file paths and types.', {
        dir: z.string().default('./assets').describe('Directory to scan for assets'),
    }, async (args) => {
        try {
            const files = await findPixelFiles(resolve(args.dir));
            const summary = files
                .map((f) => `[${f.fileType}] ${f.path}`)
                .join('\n');
            return {
                content: [{ type: 'text', text: summary || 'No pixel assets found.' }],
            };
        }
        catch (err) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Scan error: ${err instanceof Error ? err.message : String(err)}`,
                    },
                ],
                isError: true,
            };
        }
    });
    const pixelServer = agentSdk.createSdkMcpServer({
        name: 'pixel',
        version: '0.1.0',
        tools: [validateTool, previewTool, listAssetsTool],
    });
    // Build system prompt
    const formatSections = [];
    if (llmdSchema) {
        formatSections.push(`# Pixel Format Schema\n${llmdSchema}`);
    }
    if (llmGuide) {
        formatSections.push(`# Pixel Format Generation Guide\n${llmGuide}`);
    }
    const systemPrompt = `You are a pixel art asset generator for the LoreWeave game engine.
You generate .pixel.json assets that conform to the Pixel Format v1 spec.

${formatSections.join('\n\n')}
${paletteContext}

## Instructions
- Generate a ${opts.type} asset based on the user's prompt
- The output MUST be valid JSON conforming to the Pixel Format v1 spec
- Use the validate_pixel tool to check your output before writing
- Use the preview_pixel tool to visually verify sprites
- Use the list_assets tool to see existing assets for reference
- Write the final .pixel.json file to: ${resolve(opts.output)}
- Use the palette provided — reference keys from the palette entries
- For sprites: each pixel row must be exactly \`width\` characters long
- The file must include the correct \`format\` field (e.g., "pixel-sprite-v1")
- Name the file based on the asset name with the appropriate extension (.pixel.json, .tileset.pixel.json, etc.)`;
    console.log(`  ${DIM}Type:    ${opts.type}${RESET}`);
    console.log(`  ${DIM}Output:  ${resolve(opts.output)}${RESET}`);
    console.log(`  ${DIM}Palette: ${opts.palette ?? 'fantasy32 (default)'}${RESET}`);
    console.log();
    console.log(`  ${CYAN}Generating with Claude Agent SDK...${RESET}`);
    console.log();
    try {
        for await (const message of agentSdk.query({
            prompt: opts.prompt,
            options: {
                systemPrompt,
                mcpServers: { pixel: pixelServer },
                allowedTools: [
                    'mcp__pixel__validate_pixel',
                    'mcp__pixel__preview_pixel',
                    'mcp__pixel__list_assets',
                    'Write',
                    'Read',
                    'Glob',
                ],
                cwd: process.cwd(),
                permissionMode: 'acceptEdits',
                maxTurns: 20,
            },
        })) {
            // Log tool calls for visibility
            if (message.type === 'assistant') {
                for (const block of message.message.content) {
                    if (block.type === 'tool_use') {
                        const name = block.name.replace('mcp__pixel__', '');
                        console.log(`  ${DIM}[tool] ${name}${RESET}`);
                    }
                }
            }
            // Print final result
            if (message.type === 'result' && message.subtype === 'success') {
                console.log();
                console.log(`  ${GREEN}Generation complete!${RESET}`);
                console.log();
                console.log(message.result);
            }
            else if (message.type === 'result' && message.subtype === 'error_during_execution') {
                console.log();
                console.log(`  ${RED}Generation failed during execution${RESET}`);
                process.exitCode = 1;
            }
        }
    }
    catch (err) {
        console.log(`${RED}Error: ${err instanceof Error ? err.message : String(err)}${RESET}`);
        process.exitCode = 1;
    }
}
// ── Help ────────────────────────────────────────────────────────────
function printHelp() {
    console.log(`
${BOLD}asset-explorer${RESET} — Pixel Format v1 Asset Explorer & Generator

${BOLD}USAGE${RESET}
  asset-explorer <command> [options]

${BOLD}COMMANDS${RESET}
  list [dir]               List all pixel resources (default: ./assets)
  info <file>              Show detailed info about a resource
  validate [dir]           Validate all resources (default: ./assets)
  preview <file> [tile]    Render a sprite/tile in the terminal
  palette <file>           Display palette color swatches
  generate <prompt>        Generate a pixel asset using Claude Agent SDK
    --type <type>          Asset type: sprite, tileset, tilemap, scene (default: sprite)
    --palette <file>       Palette file to use (default: fantasy32)
    --output <dir>         Output directory (default: ./assets/sprites)

${BOLD}EXAMPLES${RESET}
  asset-explorer list
  asset-explorer list ./assets/sprites
  asset-explorer info assets/sprites/campfire_small.pixel.json
  asset-explorer validate
  asset-explorer preview assets/sprites/torch.pixel.json
  asset-explorer preview assets/tilesets/forest_ground.tileset.pixel.json grass
  asset-explorer palette assets/palettes/fantasy16.palette.pixel.json
  asset-explorer generate "a 16x16 warrior sprite with sword and shield"
  asset-explorer generate "a forest tileset with 6 ground tiles" --type tileset
`);
}
// ── Main ────────────────────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        printHelp();
        return;
    }
    switch (command) {
        case 'list':
            await cmdList(resolve(args[1] ?? './assets'));
            break;
        case 'info':
            if (!args[1]) {
                console.log(`${RED}Usage: asset-explorer info <file>${RESET}`);
                process.exitCode = 1;
                return;
            }
            await cmdInfo(args[1]);
            break;
        case 'validate':
            await cmdValidate(resolve(args[1] ?? './assets'));
            break;
        case 'preview':
            if (!args[1]) {
                console.log(`${RED}Usage: asset-explorer preview <file> [tileName]${RESET}`);
                process.exitCode = 1;
                return;
            }
            await cmdPreview(args[1], args[2]);
            break;
        case 'palette':
            if (!args[1]) {
                console.log(`${RED}Usage: asset-explorer palette <file>${RESET}`);
                process.exitCode = 1;
                return;
            }
            await cmdPalette(args[1]);
            break;
        case 'generate': {
            if (!args[1]) {
                console.log(`${RED}Usage: asset-explorer generate <prompt> [--type sprite|tileset|tilemap|scene] [--palette <file>] [--output <dir>]${RESET}`);
                process.exitCode = 1;
                return;
            }
            // Parse flags from remaining args
            const genOpts = { prompt: '', type: 'sprite', output: './assets/sprites' };
            const promptParts = [];
            let i = 1;
            while (i < args.length) {
                if (args[i] === '--type' && args[i + 1]) {
                    genOpts.type = args[i + 1];
                    i += 2;
                }
                else if (args[i] === '--palette' && args[i + 1]) {
                    genOpts.palette = args[i + 1];
                    i += 2;
                }
                else if (args[i] === '--output' && args[i + 1]) {
                    genOpts.output = args[i + 1];
                    i += 2;
                }
                else {
                    promptParts.push(args[i]);
                    i++;
                }
            }
            genOpts.prompt = promptParts.join(' ');
            // Set default output dir based on type
            if (!args.includes('--output')) {
                const outputDirs = {
                    sprite: './assets/sprites',
                    tileset: './assets/tilesets',
                    tilemap: './assets/tilemaps',
                    scene: './assets/scenes',
                };
                genOpts.output = outputDirs[genOpts.type] ?? './assets';
            }
            await cmdGenerate(genOpts);
            break;
        }
        default:
            console.log(`${RED}Unknown command: ${command}${RESET}`);
            printHelp();
            process.exitCode = 1;
    }
}
main().catch((err) => {
    console.error(`${RED}Error: ${err.message}${RESET}`);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map