/**
 * Pixel Explorer web server.
 *
 * HTTP server with REST API, WebSocket for live reload, and file watcher.
 */
import { watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { relative, resolve } from 'node:path';
import { classifyFile, findPixelFiles, loadAllPixelFiles, loadPixelFile, renderSpriteToTerminalString, validateEmitter, validatePalette, validateScene, validateSprite, validateTilemap, validateTileset, } from '@loreweave/pixel';
import { WebSocketServer } from 'ws';
import { getAppJs, getPageHtml, getStyleCss } from './html.js';
export async function startServer(opts) {
    const { port, assetDir } = opts;
    // ── HTTP Server ──
    const server = createServer(async (req, res) => {
        try {
            await handleRequest(req, res, assetDir);
        }
        catch (err) {
            console.error('Request error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    });
    // ── WebSocket Server ──
    const wss = new WebSocketServer({ server });
    const clients = new Set();
    wss.on('connection', (ws) => {
        clients.add(ws);
        ws.on('close', () => clients.delete(ws));
    });
    function broadcast(data) {
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
            if (!filename)
                return;
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
    }
    catch {
        console.warn('\x1b[33mWarning: File watcher not available. Live reload disabled.\x1b[0m');
    }
    // ── Start ──
    server.listen(port, () => {
        console.log();
        console.log(`\x1b[1m\x1b[36m  PixelExplorer\x1b[0m is running`);
        console.log();
        console.log(`  \x1b[2mLocal:\x1b[0m   http://localhost:${port}`);
        console.log(`  \x1b[2mAssets:\x1b[0m  ${assetDir}`);
        console.log();
    });
}
// ── Router ──
async function handleRequest(req, res, assetDir) {
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
        if (!filePath)
            return sendJson(res, 400, { error: 'Missing path parameter' });
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
function sendHtml(res, html) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
}
function sendJs(res, js) {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(js);
}
function sendCss(res, css) {
    res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
    res.end(css);
}
function sendJson(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}
function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks).toString()));
        req.on('error', reject);
    });
}
// ── API: List Assets ──
async function apiListAssets(res, assetDir) {
    const files = await findPixelFiles(assetDir);
    const grouped = {};
    for (const f of files) {
        const relPath = relative(assetDir, f.path).replace(/\\/g, '/');
        if (!grouped[f.fileType])
            grouped[f.fileType] = [];
        grouped[f.fileType].push({ path: f.path, relativePath: relPath });
    }
    sendJson(res, 200, { assets: grouped, total: files.length });
}
// ── API: Get Single Asset ──
async function apiGetAsset(res, assetDir, filePath) {
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
    }
    catch (err) {
        sendJson(res, 404, { error: `Asset not found: ${err.message}` });
    }
}
// ── API: Validate All ──
async function apiValidateAll(res, assetDir) {
    const resources = await loadAllPixelFiles(assetDir);
    // Build registries
    const paletteRegistry = new Map();
    const tilesetRegistry = new Map();
    for (const r of resources) {
        if (r.fileType === 'palette') {
            const p = r.data;
            if (p.name)
                paletteRegistry.set(p.name, p);
        }
        if (r.fileType === 'tileset') {
            const t = r.data;
            if (t.name)
                tilesetRegistry.set(t.name, t);
        }
    }
    const results = [];
    for (const r of resources) {
        const rel = r.relativePath.replace(/\\/g, '/');
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
async function apiListPalettes(res, assetDir) {
    const files = await findPixelFiles(assetDir);
    const palettes = [];
    for (const f of files) {
        if (f.fileType === 'palette') {
            try {
                const content = await readFile(f.path, 'utf-8');
                const data = JSON.parse(content);
                palettes.push({
                    path: relative(assetDir, f.path).replace(/\\/g, '/'),
                    name: data.name ?? '(unnamed)',
                    entryCount: Object.keys(data.entries).length,
                });
            }
            catch {
                // skip
            }
        }
    }
    sendJson(res, 200, { palettes });
}
// ── API: Generate ──
async function apiGenerate(res, assetDir, body) {
    let params;
    try {
        params = JSON.parse(body);
    }
    catch {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    if (!params.prompt) {
        return sendJson(res, 400, { error: 'Missing prompt' });
    }
    // The Agent SDK spawns Claude Code as a subprocess. On Windows, interactive
    // credential prompts fail when running headless from a web server (exit code 11).
    // ANTHROPIC_API_KEY bypasses the credential store and works headless.
    if (!process.env.ANTHROPIC_API_KEY) {
        return sendJson(res, 500, {
            error: 'ANTHROPIC_API_KEY environment variable is required for generation. ' +
                'Set it before starting pixel-explorer: export ANTHROPIC_API_KEY=sk-ant-...',
        });
    }
    // Lazy-import Agent SDK
    let agentSdk;
    try {
        agentSdk = await import('@anthropic-ai/claude-agent-sdk');
    }
    catch {
        return sendJson(res, 500, {
            error: '@anthropic-ai/claude-agent-sdk is not installed. Run: npm install @anthropic-ai/claude-agent-sdk',
        });
    }
    let zod;
    try {
        zod = await import('zod');
    }
    catch {
        return sendJson(res, 500, { error: 'zod is not installed. Run: npm install zod' });
    }
    const z = zod.z;
    const assetType = params.type ?? 'sprite';
    const outputDirs = {
        sprite: 'sprites',
        tileset: 'tilesets',
        tilemap: 'tilemaps',
        scene: 'scenes',
    };
    const outputDir = resolve(assetDir, outputDirs[assetType] ?? 'sprites');
    // Load context files
    const cwd = resolve(assetDir, '..');
    let llmGuide = '';
    let llmdSchema = '';
    let paletteContext = '';
    try {
        llmGuide = await readFile(resolve(cwd, 'pixel_format_llm_guide.md'), 'utf-8');
    }
    catch {
        /* optional */
    }
    try {
        llmdSchema = await readFile(resolve(cwd, 'pixel-schema.llmd'), 'utf-8');
    }
    catch {
        /* optional */
    }
    if (params.palette) {
        try {
            const palData = await readFile(resolve(assetDir, params.palette), 'utf-8');
            paletteContext = `\n\nUse this palette:\n\`\`\`json\n${palData}\n\`\`\``;
        }
        catch {
            /* optional */
        }
    }
    else {
        try {
            const palData = await readFile(resolve(assetDir, 'palettes/fantasy32.palette.pixel.json'), 'utf-8');
            paletteContext = `\n\nUse this palette (fantasy32):\n\`\`\`json\n${palData}\n\`\`\``;
        }
        catch {
            /* optional */
        }
    }
    // Build MCP tools
    const validateTool = agentSdk.tool('validate_pixel', 'Validate a pixel format JSON string against the spec.', {
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
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
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
    const previewTool = agentSdk.tool('preview_pixel', 'Render a pixel sprite JSON to an ANSI terminal string for visual verification.', { json: z.string().describe('The pixel sprite JSON string to preview') }, async (args) => {
        try {
            const sprite = JSON.parse(args.json);
            return { content: [{ type: 'text', text: renderSpriteToTerminalString(sprite) }] };
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
    const listAssetsTool = agentSdk.tool('list_assets', 'List all existing pixel assets in the assets directory.', { dir: z.string().default(assetDir).describe('Directory to scan') }, async (args) => {
        try {
            const files = await findPixelFiles(resolve(args.dir));
            const summary = files
                .map((f) => `[${f.fileType}] ${f.path}`)
                .join('\n');
            return { content: [{ type: 'text', text: summary || 'No pixel assets found.' }] };
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
    if (llmdSchema)
        formatSections.push(`# Pixel Format Schema\n${llmdSchema}`);
    if (llmGuide)
        formatSections.push(`# Pixel Format Generation Guide\n${llmGuide}`);
    const systemPrompt = `You are a pixel art asset generator for the LoreWeave game engine.
You generate .pixel.json assets that conform to the Pixel Format v1 spec.

${formatSections.join('\n\n')}
${paletteContext}

## Instructions
- Generate a ${assetType} asset based on the user's prompt
- The output MUST be valid JSON conforming to the Pixel Format v1 spec
- Use the validate_pixel tool to check your output before writing
- Use the preview_pixel tool to visually verify sprites
- Write the final .pixel.json file to: ${outputDir}
- Use the palette provided — reference keys from the palette entries
- For sprites: each pixel row must be exactly \`width\` characters long
- The file must include the correct \`format\` field (e.g., "pixel-sprite-v1")
- Name the file based on the asset name with the appropriate extension`;
    try {
        let resultText = '';
        for await (const message of agentSdk.query({
            prompt: params.prompt,
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
                cwd,
                permissionMode: 'acceptEdits',
                maxTurns: 20,
            },
        })) {
            if (message.type === 'result' && message.subtype === 'success') {
                resultText = message.result;
            }
        }
        sendJson(res, 200, { success: true, result: resultText });
    }
    catch (err) {
        sendJson(res, 500, {
            error: `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
        });
    }
}
//# sourceMappingURL=server.js.map