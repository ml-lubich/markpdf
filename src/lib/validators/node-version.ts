/**
 * Node Version Validator
 * Validates that the current Node.js version meets the requirements.
 */

import semver from 'semver';
import { PackageJson } from '../../index';

const pkg: PackageJson = require('../../../package.json');

/**
 * Validate that the current Node.js version satisfies the engine requirements.
 *
 * @returns `true` if version is valid, `false` otherwise
 */
export const validateNodeVersion = (): boolean => {
	return semver.satisfies(process.versions.node, pkg.engines.node);
};

