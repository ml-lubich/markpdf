/**
 * Hash Utilities
 *
 * Provides content-based hashing functions for generating unique identifiers
 * from Mermaid chart content. This ensures uniqueness across parallel processes.
 */

import { createHash } from 'node:crypto';

/**
 * Generate a content-based hash for Mermaid chart code.
 *
 * Creates a deterministic hash from the Mermaid code content. Same content
 * will always produce the same hash, ensuring uniqueness and allowing
 * parallel processes to share the same images for identical charts.
 *
 * @param content - The Mermaid chart code content
 * @param length - Length of hash to return (default: 16, max: 64)
 * @returns Hexadecimal hash string
 *
 * @example
 * ```typescript
 * const hash = generateContentHash('graph TD\n    A --> B');
 * // Returns: 'a1b2c3d4e5f6g7h8'
 * ```
 */
export function generateContentHash(content: string, length = 16): string {
	// Normalize content: trim whitespace and normalize line endings
	const normalized = content.trim().replaceAll('\r\n', '\n').replaceAll('\r', '\n');

	// Generate SHA-256 hash
	const hash = createHash('sha256').update(normalized, 'utf8').digest('hex');

	// Return truncated hash (first N characters)
	// SHA-256 produces 64 hex characters, we'll use first 16 by default
	// This provides 16^16 = ~1.8e19 possible values, very low collision probability
	return hash.slice(0, Math.max(0, Math.min(length, 64)));
}

/**
 * Generate a unique filename for a Mermaid chart image.
 *
 * Creates a filename using content hash and optional index for ordering.
 * Format: mermaid-{hash}-{index}.png
 *
 * @param mermaidCode - The Mermaid chart code
 * @param index - Optional index for ordering (default: 0)
 * @returns Filename string
 *
 * @example
 * ```typescript
 * const filename = generateMermaidFilename('graph TD\n    A --> B', 0);
 * // Returns: 'mermaid-a1b2c3d4e5f6g7h8-0.png'
 * ```
 */
export function generateMermaidFilename(mermaidCode: string, index = 0): string {
	const hash = generateContentHash(mermaidCode);
	return `mermaid-${hash}-${index}.png`;
}
