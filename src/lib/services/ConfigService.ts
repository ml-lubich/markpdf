/**
 * ConfigService - Manages configuration merging and validation.
 * Handles default config, front-matter, CLI args, and config files.
 */

import { IConfigService } from '../interfaces';
import { Config, defaultConfig } from '../config';
import { getMarginObject } from '../utils/pdf';

export class ConfigService implements IConfigService {
	/**
	 * Get default configuration.
	 *
	 * @returns Default config object
	 */
	public getDefaultConfig(): Config {
		return { ...defaultConfig };
	}

	/**
	 * Merge multiple configuration objects.
	 * Later configs override earlier ones.
	 *
	 * @param configs - Configuration objects to merge
	 * @returns Merged configuration
	 */
	public mergeConfigs(...configs: Partial<Config>[]): Config {
		let merged: Config = { ...defaultConfig };

		for (const config of configs) {
			merged = {
				...merged,
				...config,
				pdf_options: {
					...merged.pdf_options,
					...(config.pdf_options ?? {}),
				},
			};
		}

		// Sanitize array options
		const arrayOptions = ['body_class', 'script', 'stylesheet'] as const;
		for (const option of arrayOptions) {
			if (!Array.isArray(merged[option])) {
				(merged as any)[option] = [merged[option]].filter(Boolean);
			}
		}

		// Sanitize margin
		if (typeof merged.pdf_options.margin === 'string') {
			merged.pdf_options.margin = getMarginObject(merged.pdf_options.margin);
		}

		// Handle header/footer display
		const { headerTemplate, footerTemplate, displayHeaderFooter } = merged.pdf_options;
		if ((headerTemplate || footerTemplate) && displayHeaderFooter === undefined) {
			merged.pdf_options.displayHeaderFooter = true;
		} else if (!headerTemplate && !footerTemplate && displayHeaderFooter === undefined) {
			merged.pdf_options.displayHeaderFooter = false;
		}

		return merged;
	}

	/**
	 * Validate configuration.
	 * Throws error if configuration is invalid.
	 *
	 * @param config - Configuration to validate
	 */
	public validateConfig(config: Config): void {
		if (!config.basedir) {
			throw new Error('basedir is required');
		}

		if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
			throw new Error('port must be between 1 and 65535');
		}

		if (!Array.isArray(config.stylesheet)) {
			throw new Error('stylesheet must be an array');
		}

		if (!Array.isArray(config.body_class)) {
			throw new Error('body_class must be an array');
		}
	}

	/**
	 * Merge CLI arguments into config.
	 *
	 * @param config - Base configuration
	 * @param args - CLI arguments object
	 * @returns Merged configuration
	 */
	public mergeCliArgs(config: Config, args: Record<string, string | string[] | boolean>): Config {
		const jsonArgs = new Set(['--marked-options', '--pdf-options', '--launch-options']);
		const merged = { ...config };

		for (const [argKey, argValue] of Object.entries(args)) {
			if (!argKey.startsWith('--')) {
				continue;
			}

			const key = argKey.slice(2).replace(/-/g, '_');

			if (jsonArgs.has(argKey) && typeof argValue === 'string') {
				try {
					(merged as any)[key] = JSON.parse(argValue);
				} catch {
					// Ignore invalid JSON
				}
			} else if (argValue !== undefined && argValue !== null) {
				(merged as any)[key] = argValue;
			}
		}

		return merged;
	}
}

