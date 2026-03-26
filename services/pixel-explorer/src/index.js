#!/usr/bin/env node
/**
 * @loreweave/pixel-explorer — Web-based pixel asset generator and explorer
 *
 * Usage:
 *   pixel-explorer start [--port 3000] [--dir ./assets]
 */
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { startServer } from './server.js';
const ASSET_DIRS = ['sprites', 'tilesets', 'tilemaps', 'scenes', 'palettes', 'emitters'];
async function scaffoldDirectories(baseDir) {
    for (const dir of ASSET_DIRS) {
        await mkdir(resolve(baseDir, dir), { recursive: true });
    }
}
function printHelp() {
    console.log(`
\x1b[1mpixel-explorer\x1b[0m — Pixel Format v1 Asset Generator & Explorer

\x1b[1mUSAGE\x1b[0m
  pixel-explorer start [options]

\x1b[1mOPTIONS\x1b[0m
  --port <number>    Port to listen on (default: 3000)
  --dir <path>       Asset directory to serve (default: ./assets)

\x1b[1mEXAMPLES\x1b[0m
  pixel-explorer start
  pixel-explorer start --port 8080
  pixel-explorer start --dir ./my-assets
`);
}
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        printHelp();
        return;
    }
    if (command !== 'start') {
        console.log(`\x1b[31mUnknown command: ${command}\x1b[0m`);
        printHelp();
        process.exitCode = 1;
        return;
    }
    // Parse flags
    let port = 3000;
    let assetDir = './assets';
    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--port' && args[i + 1]) {
            port = Number.parseInt(args[i + 1], 10);
            i++;
        }
        else if (args[i] === '--dir' && args[i + 1]) {
            assetDir = args[i + 1];
            i++;
        }
    }
    const resolvedDir = resolve(assetDir);
    // Scaffold asset directories
    console.log(`\x1b[2mScaffolding asset directories in ${resolvedDir}...\x1b[0m`);
    await scaffoldDirectories(resolvedDir);
    // Start the server
    await startServer({ port, assetDir: resolvedDir });
}
main().catch((err) => {
    console.error(`\x1b[31mError: ${err.message}\x1b[0m`);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map