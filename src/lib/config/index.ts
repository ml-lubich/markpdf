/**
 * Configuration Index
 * Central export point for configuration types and defaults.
 */

export * from './config';
export * from './constants';

// Re-export for backward compatibility
export { defaultConfig, type Config, type PdfConfig, type HtmlConfig, type MarkedOptions, type MarkedExtension } from './config';
export { MERMAID_CONSTANTS, IMAGE_CONSTANTS, FS_CONSTANTS } from './constants';

