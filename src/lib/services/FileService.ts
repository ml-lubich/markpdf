/**
 * FileService - Handles file system operations.
 * Provides a clean interface for reading and writing files.
 */

import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import iconv from 'iconv-lite';
import { type IFileService } from '../interfaces/index.js';

export class FileService implements IFileService {
	/**
	 * Read file content with encoding support.
	 *
	 * @param path - File path to read
	 * @param encoding - File encoding (default: 'utf-8')
	 * @returns Promise resolving to file content as string
	 */
	public async readFile(path: string, encoding = 'utf-8'): Promise<string> {
		const buffer = await fs.readFile(path);

		if (encoding === 'utf-8') {
			return buffer.toString('utf-8');
		}

		return iconv.decode(buffer, encoding);
	}

	/**
	 * Write content to file.
	 *
	 * @param path - File path to write
	 * @param content - Content to write (Buffer or string)
	 */
	public async writeFile(path: string, content: Buffer | string): Promise<void> {
		await (Buffer.isBuffer(content) ? fs.writeFile(path, content as any) : fs.writeFile(path, content, 'utf-8'));
	}

	/**
	 * Ensure directory exists.
	 *
	 * @param path - Directory path
	 */
	public async ensureDirectory(path: string): Promise<void> {
		await fs.mkdir(path, { recursive: true });
	}

	/**
	 * Get directory from file path.
	 *
	 * @param path - File path
	 * @returns Directory path
	 */
	public getDirectory(path: string): string {
		return dirname(path);
	}
}
