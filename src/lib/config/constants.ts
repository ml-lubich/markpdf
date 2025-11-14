/**
 * Constants used throughout the mdpdf application.
 * Centralizes magic numbers, strings, and configuration values.
 */

/**
 * Mermaid diagram processing constants.
 */
export const MERMAID_CONSTANTS = {
	/**
	 * Regex pattern for matching Mermaid code blocks in markdown.
	 */
	BLOCK_REGEX: /```mermaid\s*\n([\s\S]*?)```/g,

	/**
	 * CDN URL for Mermaid.js library.
	 */
	CDN_URL: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',

	/**
	 * Timeout for Mermaid rendering in milliseconds.
	 * Increased for complex diagrams that take longer to render.
	 */
	RENDER_TIMEOUT_MS: 30_000,

	/**
	 * Padding around Mermaid charts in pixels.
	 */
	CHART_PADDING_PX: 40,

	/**
	 * Temporary directory name for Mermaid images.
	 */
	TEMP_DIR_NAME: 'mdpdf-mermaid-images',

	/**
	 * URL path prefix for serving temporary Mermaid images.
	 */
	TEMP_URL_PATH: '__mdpdf_temp__',

	/**
	 * CSS class name for Mermaid chart containers.
	 */
	CONTAINER_CLASS: 'mermaid-chart-container',
} as const;

/**
 * Image generation constants.
 */
export const IMAGE_CONSTANTS = {
	/**
	 * Default image file extension.
	 */
	EXTENSION: '.png',

	/**
	 * Image MIME type.
	 */
	MIME_TYPE: 'image/png',
} as const;

/**
 * File system constants.
 */
export const FS_CONSTANTS = {
	/**
	 * Default file encoding.
	 */
	DEFAULT_ENCODING: 'utf-8',
} as const;
