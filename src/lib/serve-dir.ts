/**
 * Server Directory - Compatibility Export
 *
 * @deprecated Import from './services/ServerService' instead
 * This file exists for backward compatibility with existing tests.
 */

import type { Server } from 'node:http';
import { ServerService } from './services/ServerService.js';
import type { Config } from './config.js';

// Map of mock servers to their ServerService instances
const serverMap = new WeakMap<Server, ServerService>();

/**
 * @deprecated Use ServerService.start() instead
 */
export async function serveDirectory(config: Config): Promise<Server> {
	// Create a new ServerService instance for this call
	const serverService = new ServerService();
	await serverService.start(config);

	// Create a mock Server object that tracks listening state
	const mockServer: any = {};
	mockServer.listening = true;
	mockServer.close = (callback?: (error?: Error) => void) => {
		const service = serverMap.get(mockServer as Server);
		if (service) {
			service
				.stop()
				.then(() => {
					mockServer.listening = false;
					serverMap.delete(mockServer as Server);
					callback?.();
				})
				.catch((error) => {
					callback?.(error);
				});
		} else {
			callback?.();
		}
	};

	// Map the mock server to its ServerService instance
	serverMap.set(mockServer, serverService);
	return mockServer;
}

/**
 * @deprecated Use ServerService.stop() instead
 */
export async function closeServer(server: Server): Promise<void> {
	// If this is a mock server from serveDirectory, use its close method
	if (serverMap.has(server)) {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	} else {
		// For other servers (like test mocks), just call close directly
		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}
}
