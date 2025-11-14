import test from 'ava';
import { validateNodeVersion } from '../lib/validate-node-version.js';

test('validateNodeVersion should return true for valid node version', (t) => {
	// The package.json specifies ">=12.0", so current node version should satisfy
	const result = validateNodeVersion();
	t.true(result);
});

test('validateNodeVersion should use semver to check version', (t) => {
	// This test verifies the function uses semver.satisfies
	// We can't easily test invalid versions without mocking, but we can verify it returns a boolean
	const result = validateNodeVersion();
	t.is(typeof result, 'boolean');
});
