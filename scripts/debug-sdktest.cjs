#!/usr/bin/env node
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const sdkRoot = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Android', 'Sdk');
const sdkmanager = path.join(sdkRoot, 'cmdline-tools', 'latest', 'bin', 'sdkmanager.bat');
console.log('sdkmanager path:', sdkmanager);
const res = spawnSync(sdkmanager, ['--sdk_root=' + sdkRoot, '--version'], { encoding: 'utf8', stdio: 'pipe', shell: false, timeout: 20000 });
console.log('status:', res.status);
console.log('stdout:', res.stdout);
console.log('stderr:', res.stderr);
if (res.error) console.log('error:', res.error.message);
