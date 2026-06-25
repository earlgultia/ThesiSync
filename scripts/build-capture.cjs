#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = process.cwd();
const logFile = path.join(projectRoot, 'build.log');

// Clear old log
fs.writeFileSync(logFile, '', 'utf8');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

function runCmd(cmd, args) {
  return new Promise((resolve) => {
    log(`\n>>> ${cmd} ${args.join(' ')}`);
    const proc = spawn(cmd, args, {
      cwd: projectRoot,
      shell: true,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      log(data.toString());
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      log(`[ERR] ${data.toString()}`);
    });

    proc.on('close', (code) => {
      log(`[EXIT] ${code}`);
      resolve({ code, stdout, stderr });
    });
  });
}

async function build() {
  log('=== ThesiSync APK Build ===\n');
  log(`Project root: ${projectRoot}`);
  log(`Time: ${new Date().toISOString()}\n`);

  // Step 1: Icons
  log('\n--- STEP 1: Generate Icons ---');
  let result = await runCmd('npm', ['run', 'generate:icons']);
  if (result.code !== 0) {
    log('Icon generation failed!');
  }

  // Check if icons were created
  const iconsDir = path.join(projectRoot, 'public', 'icons');
  if (fs.existsSync(iconsDir)) {
    const files = fs.readdirSync(iconsDir);
    log(`Icons created: ${files.length} files - ${JSON.stringify(files)}`);
  }

  // Step 2: Setup Android
  log('\n--- STEP 2: Setup Android ---');
  result = await runCmd('npm', ['run', 'setup:android']);
  if (result.code !== 0) {
    log('Setup Android failed!');
  }

  // Check if android folder exists
  const androidDir = path.join(projectRoot, 'android');
  log(`\nAndroid folder exists: ${fs.existsSync(androidDir)}`);
  if (fs.existsSync(androidDir)) {
    const files = fs.readdirSync(androidDir);
    log(`Android contents: ${JSON.stringify(files)}`);
  } else {
    log('ERROR: Android folder was not created!');
    log('This usually means Capacitor initialization failed.');
  }

  log('\n=== Build Complete ===');
  log(`Log saved to: ${logFile}`);
}

build().catch((err) => {
  log(`Fatal error: ${err.message}`);
  log(err.stack);
});
