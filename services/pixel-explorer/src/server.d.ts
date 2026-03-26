/**
 * Pixel Explorer web server.
 *
 * HTTP server with REST API, WebSocket for live reload, and file watcher.
 */
export interface ServerOptions {
    port: number;
    assetDir: string;
}
export declare function startServer(opts: ServerOptions): Promise<void>;
//# sourceMappingURL=server.d.ts.map