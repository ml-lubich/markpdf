/**
 * Configuration Index
 * Central export point for configuration types and defaults.
 */

export * from './config.js';
export * from './constants.js';

// Re-export for backward compatibility
export {
	defaultConfig,
	type Config,
	type PdfConfig,
	type HtmlConfig,
	type MarkedOptions,
	type MarkedExtension,
} from './config.js';
export { MERMAID_CONSTANTS, IMAGE_CONSTANTS, FS_CONSTANTS } from './constants.js';
