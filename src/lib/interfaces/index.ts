/**
 * Core interfaces for the mdpdf system.
 * These define contracts that all implementations must follow.
 */

import { Browser } from 'puppeteer';
import { Config } from '../config';

/**
 * Input source for markdown conversion.
 */
export interface MarkdownInput {
	readonly path?: string;
	readonly content?: string;
}

/**
 * Output result from conversion.
 */
export type ConversionOutput = PdfConversionOutput | HtmlConversionOutput;

export interface PdfConversionOutput {
	readonly filename: string | undefined;
	readonly content: Buffer;
}

export interface HtmlConversionOutput {
	readonly filename: string | undefined;
	readonly content: string;
}

/**
 * Mermaid processing result.
 */
export interface MermaidProcessResult {
	readonly processedMarkdown: string;
	readonly imageFiles: string[];
	readonly warnings: string[];
}

/**
 * Service interface for markdown parsing.
 */
export interface IMarkdownParser {
	parse(markdown: string): string;
}

/**
 * Service interface for Mermaid diagram processing.
 */
export interface IMermaidProcessor {
	processCharts(
		markdown: string,
		browser: Browser,
		baseDir: string,
		markdownDir?: string,
		serverPort?: number,
	): Promise<MermaidProcessResult>;
	cleanup(imageFiles: string[]): Promise<void>;
}

/**
 * Service interface for PDF/HTML generation.
 */
export interface IOutputGenerator {
	generate(
		html: string,
		relativePath: string,
		config: Config,
		browser?: Browser,
	): Promise<ConversionOutput | undefined>;
	closeBrowser(): Promise<void>;
}

/**
 * Service interface for file operations.
 */
export interface IFileService {
	readFile(path: string, encoding?: string): Promise<string>;
	writeFile(path: string, content: Buffer | string): Promise<void>;
	ensureDirectory(path: string): Promise<void>;
}

/**
 * Service interface for HTTP server management.
 */
export interface IServerService {
	start(config: Config): Promise<void>;
	stop(): Promise<void>;
	getPort(): number | undefined;
}

/**
 * Service interface for configuration management.
 */
export interface IConfigService {
	getDefaultConfig(): Config;
	mergeConfigs(...configs: Partial<Config>[]): Config;
	validateConfig(config: Config): void;
	mergeCliArgs(config: Config, args: Record<string, string | string[] | boolean>): Config;
}

/**
 * Logger interface for dependency inversion.
 * Services should depend on this interface, not on console directly.
 * 
 * This follows Clean Architecture principles by inverting the dependency
 * on concrete implementations (console) in favor of abstractions.
 * 
 * Re-exported from domain layer.
 */
export type { ILogger } from '../domain/Logger';
export { ConsoleLogger, SilentLogger, defaultLogger, LogLevel } from '../domain/Logger';

