/**
 * Directory Server
 * Serves a directory on a specified port using HTTP server and serve-handler.
 */

import { createServer, Server } from 'http';
import { createReadStream, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import serveHandler from 'serve-handler';
import { Config } from '../config';
import { MERMAID_CONSTANTS, IMAGE_CONSTANTS } from '../config/constants';

/**
 * Serve a directory on a specified port using HTTP server and serve-handler.
 *
 * Creates an HTTP server that serves files from the specified base directory.
 * Also handles serving temporary Mermaid images from the system temp directory
 * via the /__mdpdf_temp__/ URL path.
 *
 * @param config - Configuration object with basedir and port
 * @param config.basedir - Base directory to serve files from
 * @param config.port - Port number to listen on
 * @returns Promise that resolves with the server instance once ready and listening
 *
 * @example
 * ```typescript
 * const server = await serveDirectory({ basedir: '/path/to/files', port: 3000 });
 * ```
 */
export const serveDirectory = async ({ basedir, port }: Config): Promise<Server> =>
	new Promise<Server>((resolve) => {
		const mermaidTempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);

		const server = createServer(async (request, response) => {
			const url = request.url || '/';

			// Handle requests for temporary Mermaid images
			const tempUrlPath = `/${MERMAID_CONSTANTS.TEMP_URL_PATH}/`;
			if (url.startsWith(tempUrlPath)) {
				// Extract the filename from the URL
				const filename = url.replace(tempUrlPath, '');
				const filePath = join(mermaidTempDir, filename);

				try {
					// Check if file exists
					const stats = statSync(filePath);
					
					// Set appropriate headers
					response.writeHead(200, {
						'Content-Type': IMAGE_CONSTANTS.MIME_TYPE,
						'Content-Length': stats.size,
					});

					// Stream the file
					const fileStream = createReadStream(filePath);
					fileStream.pipe(response);
				} catch (error) {
					// File not found or error reading file
					if (!response.headersSent) {
						response.writeHead(404, { 'Content-Type': 'text/plain' });
						response.end('Image not found');
					}
				}
				
				return;
			}

			// Serve from base directory for all other requests
			return serveHandler(request, response, { public: basedir });
		});

		server.listen(port, () => resolve(server));
	});

/**
 * Close the given server instance asynchronously.
 *
 * Gracefully closes the HTTP server. Returns a promise that resolves when
 * the server is closed, or rejects if an error occurs during closure.
 *
 * @param server - Server instance to close
 * @returns Promise that resolves when server is closed, rejects on error
 *
 * @example
 * ```typescript
 * const server = await serveDirectory(config);
 * // ... use server ...
 * await closeServer(server);
 * ```
 */
export const closeServer = async (server: Server): Promise<void> =>
	new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));

