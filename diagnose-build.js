#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(process.cwd(), 'build-error.log');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `Build error diagnostics - ${new Date().toISOString()}\n\n`, 'utf8');

log('=== Environment Check ===\n');

try {
  log('Node: ' + execSync('node --version', { encoding: 'utf8' }).trim());
} catch { log('Node: NOT FOUND'); }

try {
  log('npm: ' + execSync('npm --version', { encoding: 'utf8' }).trim());
} catch { log('npm: NOT FOUND'); }

try {
  log('Java: ' + execSync('java -version 2>&1', { encoding: 'utf8' }).split('\n')[0]);
} catch { log('Java: NOT FOUND'); }

log('\n=== Running full-setup.js ===\n');

try {
  const output = execSync('node full-setup.js 2>&1', { 
    encoding: 'utf8', 
    maxBuffer: 50 * 1024 * 1024,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  log(output);
} catch (err) {
  log('STDOUT:\n' + (err.stdout?.toString() || 'none'));
  log('\nSTDERR:\n' + (err.stderr?.toString() || 'none'));
  log('\nExit Code: ' + err.status);
  log('Error: ' + err.message);
}

log('\n=== Build Error Log Complete ===\n');
log(`Check error details above. Log saved to: ${logFile}`);

console.log('\n✅ Diagnostics saved to build-error.log');
