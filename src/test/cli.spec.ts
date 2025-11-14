import test from 'ava';
import { execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

test.before(() => {
	const filesToDelete = [
		resolve(__dirname, 'basic', 'test.pdf'),
		resolve(__dirname, 'basic', 'test-stdio.pdf'),
		resolve(__dirname, 'nested', 'root.pdf'),
		resolve(__dirname, 'nested', 'level-one', 'one.pdf'),
		resolve(__dirname, 'nested', 'level-one', 'level-two', 'two.pdf'),
	];

	for (const file of filesToDelete) {
		try {
			unlinkSync(file);
		} catch (error) {
			if ((error as { code: string }).code !== 'ENOENT') {
				throw error;
			}
		}
	}
});

test('compile the basic example to pdf using --basedir', (t) => {
	const tsNodePath = resolve(__dirname, '..', '..', 'node_modules', '.bin', 'ts-node');
	const cliPath = resolve(__dirname, '..', 'cli');
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const basedirPath = resolve(__dirname, 'basic');
	const cmd = `"${tsNodePath}" "${cliPath}" "${testMdPath}" --basedir "${basedirPath}"`;

	t.notThrows(() => execSync(cmd, { shell: '/bin/sh' }));

	t.notThrows(() => readFileSync(resolve(__dirname, 'basic', 'test.pdf'), 'utf-8'));
});

test('compile the basic example using stdio', (t) => {
	const testMdPath = resolve(__dirname, 'basic', 'test.md');
	const tsNodePath = resolve(__dirname, '..', '..', 'node_modules', '.bin', 'ts-node');
	const cliPath = resolve(__dirname, '..', 'cli');
	const basedirPath = resolve(__dirname, 'basic');
	const outputPath = resolve(__dirname, 'basic', 'test-stdio.pdf');
	const cmd = `cat "${testMdPath}" | "${tsNodePath}" "${cliPath}" --basedir "${basedirPath}" > "${outputPath}"`;

	t.notThrows(() => execSync(cmd, { shell: '/bin/sh' }));

	t.notThrows(() => readFileSync(resolve(__dirname, 'basic', 'test-stdio.pdf'), 'utf-8'));
});

test('compile the nested example to pdfs', (t) => {
	const tsNodePath = resolve(__dirname, '..', '..', 'node_modules', '.bin', 'ts-node');
	const cliPath = resolve(__dirname, '..', 'cli');
	const cmd = `"${tsNodePath}" "${cliPath}" root.md level-one/one.md level-one/level-two/two.md`;

	t.notThrows(() => execSync(cmd, { shell: '/bin/sh', cwd: resolve(__dirname, 'nested') }));

	t.notThrows(() => readFileSync(resolve(__dirname, 'nested', 'root.pdf'), 'utf-8'));
	t.notThrows(() => readFileSync(resolve(__dirname, 'nested', 'level-one', 'one.pdf'), 'utf-8'));
	t.notThrows(() => readFileSync(resolve(__dirname, 'nested', 'level-one', 'level-two', 'two.pdf'), 'utf-8'));
});
