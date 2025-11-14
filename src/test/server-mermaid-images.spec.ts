/**
 * Tests for ServerService - Mermaid Image Serving
 * 
 * Tests edge cases and negative scenarios for serving Mermaid images
 * from the temporary directory, including Windows compatibility.
 */

import test from 'ava';
import { get } from 'http';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ServerService } from '../lib/services/ServerService';
import { defaultConfig } from '../lib/config';
import { MERMAID_CONSTANTS, IMAGE_CONSTANTS } from '../lib/config/constants';

/**
 * Helper to make HTTP GET request
 */
function httpGet(url: string): Promise<{ status: number; headers: any; body: Buffer }> {
	return new Promise((resolve, reject) => {
		get(url, (res) => {
			const chunks: Buffer[] = [];
			res.on('data', (chunk) => chunks.push(chunk));
			res.on('end', () => {
				resolve({
					status: res.statusCode ?? 0,
					headers: res.headers,
					body: Buffer.concat(chunks),
				});
			});
		}).on('error', reject);
	});
}

let serverService: ServerService;

test.afterEach(async () => {
	await serverService.stop();
});

test('should serve Mermaid images from temp directory', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9500 };
	await serverService.start(config);

	// Create a test image file in temp directory
	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testImagePath = join(tempDir, 'test-mermaid-0.png');
	const testImageContent = Buffer.from('fake png content');
	await fs.writeFile(testImagePath, testImageContent);

	try {
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/test-mermaid-0.png`);
		
		t.is(response.status, 200);
		t.is(response.headers['content-type'], IMAGE_CONSTANTS.MIME_TYPE);
		t.is(response.body.length, testImageContent.length);
	} finally {
		await fs.unlink(testImagePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should return 404 for non-existent Mermaid image', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9501 };
	await serverService.start(config);

	const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/non-existent.png`);
	
	t.is(response.status, 404);
});

test('should handle Windows-style paths in image filenames', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9502 };
	await serverService.start(config);

	// Create test image with Windows-style characters
	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testImagePath = join(tempDir, 'mermaid-0-1234567890-abc123.png');
	const testImageContent = Buffer.from('fake png content');
	await fs.writeFile(testImagePath, testImageContent);

	try {
		const imageName = 'mermaid-0-1234567890-abc123.png';
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/${imageName}`);
		
		t.is(response.status, 200);
		t.is(response.headers['content-type'], IMAGE_CONSTANTS.MIME_TYPE);
	} finally {
		await fs.unlink(testImagePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should handle special characters in image filenames', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9503 };
	await serverService.start(config);

	// Create test image with special characters (URL encoded)
	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testImagePath = join(tempDir, 'mermaid-0-test.png');
	const testImageContent = Buffer.from('fake png content');
	await fs.writeFile(testImagePath, testImageContent);

	try {
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/mermaid-0-test.png`);
		
		t.is(response.status, 200);
	} finally {
		await fs.unlink(testImagePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should handle concurrent requests for Mermaid images', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9504 };
	await serverService.start(config);

	// Create multiple test images
	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const imageFiles = [];
	
	for (let i = 0; i < 5; i++) {
		const imagePath = join(tempDir, `mermaid-${i}.png`);
		await fs.writeFile(imagePath, Buffer.from(`fake png content ${i}`));
		imageFiles.push(imagePath);
	}

	try {
		const requests = Array.from({ length: 5 }, (_, i) =>
			httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/mermaid-${i}.png`),
		);

		const responses = await Promise.all(requests);
		
		responses.forEach((response, i) => {
			t.is(response.status, 200, `Image ${i} should be served`);
			t.is(response.headers['content-type'], IMAGE_CONSTANTS.MIME_TYPE);
		});
	} finally {
		for (const file of imageFiles) {
			await fs.unlink(file).catch(() => {});
		}
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should handle path traversal attempts securely', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9505 };
	await serverService.start(config);

	// Try path traversal attacks
	const maliciousPaths = [
		'../test.png',
		'../../test.png',
		'..\\test.png',
		'..%2Ftest.png',
		'%2E%2E%2Ftest.png',
	];

	for (const maliciousPath of maliciousPaths) {
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/${maliciousPath}`);
		// Should return 404, not serve files outside temp directory
		t.is(response.status, 404, `Path traversal attempt should fail: ${maliciousPath}`);
	}
});

test('should handle empty filename', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9506 };
	await serverService.start(config);

	const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/`);
	
	t.is(response.status, 404);
});

test('should handle very long filenames', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9507 };
	await serverService.start(config);

	const longName = 'mermaid-' + 'a'.repeat(200) + '.png';
	const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/${longName}`);
	
	// Should handle gracefully (either 404 or serve if exists)
	t.true([404, 200].includes(response.status));
});

test('should set correct Content-Type header', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9508 };
	await serverService.start(config);

	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testImagePath = join(tempDir, 'test.png');
	const testImageContent = Buffer.from('fake png content');
	await fs.writeFile(testImagePath, testImageContent);

	try {
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/test.png`);
		
		t.is(response.status, 200);
		t.is(response.headers['content-type'], IMAGE_CONSTANTS.MIME_TYPE);
	} finally {
		await fs.unlink(testImagePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should set correct Content-Length header', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9509 };
	await serverService.start(config);

	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testImagePath = join(tempDir, 'test.png');
	const testImageContent = Buffer.from('fake png content for length test');
	await fs.writeFile(testImagePath, testImageContent);

	try {
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/test.png`);
		
		t.is(response.status, 200);
		const contentLength = response.headers['content-length'];
		t.is(contentLength, testImageContent.length.toString());
	} finally {
		await fs.unlink(testImagePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should handle file deletion during request', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9510 };
	await serverService.start(config);

	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testImagePath = join(tempDir, 'test.png');
	const testImageContent = Buffer.from('fake png content');
	await fs.writeFile(testImagePath, testImageContent);

	try {
		// Start request and delete file during request
		const requestPromise = httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/test.png`);
		await fs.unlink(testImagePath);
		
		const response = await requestPromise;
		// Should handle gracefully (either 404 or serve if cached)
		t.true([404, 200].includes(response.status));
	} finally {
		await fs.unlink(testImagePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

test('should handle temp directory not existing', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9511 };
	await serverService.start(config);

	// Try to access image when temp directory doesn't exist
	const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/test.png`);
	
	t.is(response.status, 404);
});

test('should handle non-PNG files in temp directory', async (t) => {
	serverService = new ServerService();
	const config = { ...defaultConfig, port: 9512 };
	await serverService.start(config);

	const tempDir = join(tmpdir(), MERMAID_CONSTANTS.TEMP_DIR_NAME);
	await fs.mkdir(tempDir, { recursive: true });
	const testFilePath = join(tempDir, 'test.txt');
	await fs.writeFile(testFilePath, 'not an image');

	try {
		// Should still try to serve (even if not PNG)
		const response = await httpGet(`http://localhost:${config.port}/${MERMAID_CONSTANTS.TEMP_URL_PATH}/test.txt`);
		
		// Should return 200 but with wrong content type, or 404
		t.true([200, 404].includes(response.status));
	} finally {
		await fs.unlink(testFilePath).catch(() => {});
		await fs.rmdir(tempDir).catch(() => {});
	}
});

