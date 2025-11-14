/**
 * Path Utilities
 * Pure utility functions for path manipulation and directory operations.
 */

import { parse, resolve } from 'node:path';

/**
 * Get the directory that a file is in.
 *
 * Extracts the directory path from a file path, resolving it to an absolute path.
 *
 * @param filePath - The file path to extract directory from
 * @returns Absolute path to the directory containing the file
 */
export const getDir = (filePath: string): string => resolve(parse(filePath).dir);
