#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const projectRoot = process.cwd();
const reportPath = path.join(projectRoot, 'shell-check.json');
const data = {
  cwd: process.cwd(),
  platform: process.platform,
  env: {
    LOCALAPPDATA: process.env.LOCALAPPDATA || null,
    ANDROID_HOME: process.env.ANDROID_HOME || null,
    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || null,
    JAVA_HOME: process.env.JAVA_HOME || null,
    PATH: process.env.PATH || null,
  },
  files: {},
  commands: {},
};
const checkFiles = [
  path.join(projectRoot, 'sdk-setup.log'),
  path.join(projectRoot, 'android', 'local.properties'),
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk'),
  path.join(projectRoot, 'run_test2.txt'),
];
for (const file of checkFiles) {
  try {
    data.files[file] = {
      exists: fs.existsSync(file),
      isDirectory: fs.existsSync(file) ? fs.statSync(file).isDirectory() : null,
    };
  } catch (err) {
    data.files[file] = { error: err.message };
  }
}
function runCmd(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', shell: true, timeout: 10000 });
    return { success: true, output: out };
  } catch (err) {
    return { success: false, output: err.stdout ? err.stdout.toString() : '', error: err.message };
  }
}
for (const cmd of ['node -v', 'npm -v', 'where java', 'where adb', 'where sdkmanager', 'dir /b']) {
  data.commands[cmd] = runCmd(cmd);
}
fs.writeFileSync(reportPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Wrote', reportPath);
