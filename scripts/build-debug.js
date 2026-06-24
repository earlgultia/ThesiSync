#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const logFile = path.join(projectRoot, 'build-debug.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n', 'utf8');
}

function runStep(label, cmd) {
  log(`\n========== ${label} ==========`);
  log(`Running: ${cmd}`);
  try {
    const output = execSync(cmd, { cwd: projectRoot, encoding: 'utf8' });
    log(`Output:\n${output}`);
    return true;
  } catch (err) {
    log(`ERROR: ${err.message}`);
    log(`Exit code: ${err.status}`);
    log(`Stderr: ${err.stderr?.toString() || 'none'}`);
    return false;
  }
}

// Clear old log
fs.writeFileSync(logFile, `Build started at ${new Date().toISOString()}\n\n`, 'utf8');

log('Step 1: Checking environment');
try {
  const nodeV = execSync('node --version', { encoding: 'utf8' });
  log(`Node: ${nodeV.trim()}`);
} catch { log('Node not found!'); }

try {
  const npmV = execSync('npm --version', { encoding: 'utf8' });
  log(`npm: ${npmV.trim()}`);
} catch { log('npm not found!'); }

log(`\nProject root: ${projectRoot}`);
log(`android folder exists: ${fs.existsSync(path.join(projectRoot, 'android'))}`);
log(`dist folder exists: ${fs.existsSync(path.join(projectRoot, 'dist'))}`);

// Run steps
runStep('Generate Icons', 'npm run generate:icons');
log(`\npublic/icons contents: ${JSON.stringify(fs.readdirSync(path.join(projectRoot, 'public', 'icons')), null, 2)}`);
log(`public/android-mipmap exists: ${fs.existsSync(path.join(projectRoot, 'public', 'android-mipmap'))}`);

runStep('Setup Android', 'npm run setup:android');
log(`\nandroid folder exists after setup: ${fs.existsSync(path.join(projectRoot, 'android'))}`);
if (fs.existsSync(path.join(projectRoot, 'android'))) {
  log(`android contents: ${JSON.stringify(fs.readdirSync(path.join(projectRoot, 'android')), null, 2)}`);
}

runStep('Prepare Android', 'npm run prepare:android');
runStep('Patch Native', 'npm run android:patch-native');
runStep('Build APK', 'npm run android:assemble-debug');

const apkPath = path.join(projectRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const apkExists = fs.existsSync(apkPath);
log(`\n========== RESULT ==========`);
log(`APK exists at ${apkPath}: ${apkExists}`);
if (apkExists) {
  const stats = fs.statSync(apkPath);
  log(`APK size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  log(`APK path: ${apkPath}`);
} else {
  log('APK build FAILED - file not created');
}

log(`\nFull log written to: ${logFile}`);
