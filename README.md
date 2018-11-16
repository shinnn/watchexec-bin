# watchexec-bin

[![npm version](https://img.shields.io/npm/v/watchexec-bin.svg)](https://www.npmjs.com/package/watchexec-bin)
[![Build Status](https://travis-ci.com/shinnn/watchexec-bin.svg?branch=master)](https://travis-ci.com/shinnn/watchexec-bin)
[![Coverage Status](https://img.shields.io/coveralls/shinnn/watchexec-bin.svg)](https://coveralls.io/github/shinnn/watchexec-bin?branch=master)

An [npm package](https://docs.npmjs.com/about-packages-and-modules#about-packages) to install a [watchexec](https://github.com/watchexec/watchexec) prebuilt binary

## Installation

[Use](https://docs.npmjs.com/cli/install) [npm](https://docs.npmjs.com/getting-started/what-is-npm).

```
npm install watchexec-bin
```

As this package makes use of `install` [npm script](https://docs.npmjs.com/misc/scripts) in order to download a binary for the current platform, [`ignore-scripts` npm-config](https://docs.npmjs.com/misc/config#ignore-scripts) cannot be enabled while executing the command above.

## API

### `require('watchexec-bin')`

Type: `string`

An absolute path to the installed watchexec binary, which can be used with [`child_process`](https://nodejs.org/api/child_process.html) functions.

```javascript
const {spawn} = require('child_process');
const watchexec = require('watchexec');

spawn(watchexec, ['--', 'ls', '-la']);
```

## CLI

Once this package is installed to the project directory, users can execute `watchexec` command inside [npm scripts](https://docs.npmjs.com/misc/scripts#description) of the project.

```json
"watch-js": "watchexec --ext js eslint ."
```

```console
$ npm run-script watch-js
```

## License

[ISC License](./LICENSE.md) © 2018 Shinnosuke Watanabe

### watchexec

[Apache License 2.0](./LICENSE.md#watchexec) © 2016 Matt Green
