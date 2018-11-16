'use strict';

const {dirname, join} = require('path');
const {EOL} = require('os');
const {execFile} = require('child_process');
const {lstat, rename} = require('fs');
const {promisify} = require('util');
const {randomBytes} = require('crypto');

const test = require('tape');
const watchexec = require('..');
const {bin} = require('../package.json');

const promisifiedExecFile = promisify(execFile);
const promisifiedRename = promisify(rename);
const promisifiedRandomBytes = promisify(randomBytes);

const projectDir = dirname(__dirname);
const shell = process.platform === 'win32';

test('`bin` field of package.json', t => {
	t.deepEqual(
		Object.keys(bin),
		['watchexec'],
		'should only include a single path.'
	);

	t.end();
});

test('Node.js API', t => {
	t.equal(
		typeof watchexec,
		'string',
		'should expose a string.'
	);

	t.equal(
		watchexec,
		join(projectDir, bin.watchexec),
		'should be equal to the binary path.'
	);

	t.end();
});

test('`prepublishOnly` npm script', async t => {
	await promisifiedExecFile('npm', ['run', 'prepublishOnly'], {shell});

	const stat = await promisify(lstat)(watchexec);

	t.ok(
		stat.isFile(),
		'should create a placeholder file.'
	);

	t.ok(
		stat.size < 250,
		'should create a sufficiently small file.'
	);

	t.end();
});

test('`install` npm script', async t => {
	await promisifiedExecFile('npm', ['run', 'install'], {shell});
	await Promise.all([
		(async () => {
			try {
				await promisifiedExecFile(watchexec, [
					'--no-vcs-ignore',
					'--debounce',
					'0',
					'--exts',
					'bin',
					'echo',
					'Hi'
				], {timeout: 1000});
				t.fail('Unexpectedly succeeded.');
			} catch ({stdout}) {
				t.equal(
					stdout,
					`Hi${EOL}Hi${EOL}`,
					'should install a watchexec binary.'
				);
			}
		})(),
		(async () => {
			await promisify(setTimeout)(500);
			await promisifiedRename(watchexec, `${watchexec}tmp`);
		})()
	]);
	await promisifiedRename(`${watchexec}tmp`, watchexec);
	await Promise.all([
		(async () => {
			try {
				await promisifiedExecFile('npm', ['run', 'install'], {
					shell,
					env: {
						...process.env,
						npm_config_http_proxy: `https://io45rkkl${await promisifiedRandomBytes(8).toString('hex')}.org`
					}
				});
				t.fail('Unexpectedly succeeded.');
			} catch ({message}) {
				t.ok(
					message.includes('tunneling socket could not be established'),
					'should respect `http-proxy` config.'
				);
			}
		})(),
		(async () => {
			try {
				await promisifiedExecFile('npm', ['run', 'install'], {
					shell,
					env: {
						...process.env,
						npm_config_https_proxy: 'https://io45fgl{await promisifiedRandomBytes(8).toString(\'hex\')}.org'
					}
				});
				t.fail('Unexpectedly succeeded.');
			} catch ({message}) {
				t.ok(
					message.includes('tunneling socket could not be established'),
					'should respect `https-proxy` npm config.'
				);
			}
		})(),
		...!process.env.TRAVIS_OS_NAME || process.env.TRAVIS_OS_NAME === 'linux' ? [
			(async () => {
				try {
					await promisifiedExecFile('docker', [
						'run',
						`--volume=${projectDir}:${projectDir}`,
						`--workdir=${projectDir}`,
						...process.env.CI ? ['--env', 'CI=true'] : [],
						'i386/node:11-alpine',
						'npx',
						'nyc',
						'--no-clean',
						'npm',
						'run',
						'install'
					], {shell});
					t.fail('Unexpectedly succeeded.');
				} catch ({message}) {
					t.ok(
						message.includes('watchexec-bin doesn\'t support 32 bit architecture.'),
						'should fail when the architecture is 32 bit.'
					);
				}
			})()
		] : [],
		(async () => {
			try {
				await promisifiedExecFile(process.argv[0], [require.resolve('./fail.js')]);
				t.fail('Unexpectedly succeeded.');
			} catch ({stderr}) {
				t.ok(
					stderr.match(/Failed to download an archive from https:.*1\.9\.2.*\(451/u),
					'should fail when it cannot download a binary.'
				);
			}
		})(),
		(async () => {
			try {
				await promisifiedExecFile(process.argv[0], [require.resolve('./unsupported.js')], {shell});
				t.fail('Unexpectedly succeeded.');
			} catch ({stderr}) {
				t.equal(
					stderr,
					'Prebuilt watchexec binaries are only provided for Linux, macOS and Windows, not for FreeBSD.\n',
					'should fail when the current platform is not supported.'
				);
			}
		})()
	]);

	t.end();
});
