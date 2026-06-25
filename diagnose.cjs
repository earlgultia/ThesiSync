#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\n🔍 DIAGNOSING THESISYNC BUILD ENVIRONMENT\n');
console.log('=' .repeat(60));

const checks = [
  {
    name: 'Node.js',
    cmd: 'node --version',
  },
  {
    name: 'npm',
    cmd: 'npm --version',
  },
  {
    name: 'Java JDK',
    cmd: 'java -version',
  },
  {
    name: 'Gradle',
    cmd: 'gradle --version',
  },
  {
    name: 'Android SDK',
    cmd: process.platform === 'win32' 
      ? 'dir %ANDROID_HOME% 2>&1 | findstr /c:"platforms"'
      : 'ls $ANDROID_HOME/platforms 2>/dev/null || echo "Not found"',
  },
];

let allGood = true;

for (const check of checks) {
  try {
    const result = execSync(check.cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    console.log(`✅ ${check.name.padEnd(20)} | ${result.split('\n')[0]}`);
  } catch (err) {
    console.log(`❌ ${check.name.padEnd(20)} | NOT FOUND or ERROR`);
    allGood = false;
  }
}

console.log('=' .repeat(60));

console.log('\n📁 PROJECT STATUS:\n');
const projectRoot = process.cwd();
const checks2 = [
  ['node_modules/', path.join(projectRoot, 'node_modules')],
  ['dist/', path.join(projectRoot, 'dist')],
  ['android/', path.join(projectRoot, 'android')],
  ['public/icons/', path.join(projectRoot, 'public', 'icons')],
  ['public/android-mipmap/', path.join(projectRoot, 'public', 'android-mipmap')],
];

for (const [name, fullPath] of checks2) {
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${name.padEnd(30)} ${exists ? '(exists)' : '(missing)'}`);
}

console.log('\n' + '=' .repeat(60));
console.log('\n💡 RECOMMENDATIONS:\n');

if (!allGood) {
  console.log('❌ MISSING DEPENDENCIES - Install these first:');
  console.log('   1. Node.js 18+: https://nodejs.org/');
  console.log('   2. Java JDK 11+: https://www.oracle.com/java/technologies/downloads/');
  console.log('   3. Android SDK: https://developer.android.com/studio (or command-line tools)');
  console.log('   4. Set ANDROID_HOME environment variable\n');
  process.exit(1);
}

console.log('✅ All prerequisites found!\n');

// Try to get more details on the build failure
console.log('Attempting to identify build error...\n');
console.log('Running: npm run setup:android\n');
console.log('-' .repeat(60));

try {
  const output = execSync('npm run setup:android 2>&1', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  console.log(output);
  console.log('-' .repeat(60));
  console.log('\n✅ setup:android completed successfully!');
} catch (err) {
  console.log(err.stdout?.toString() || '');
  console.log(err.stderr?.toString() || '');
  console.log('-' .repeat(60));
  console.log(`\n❌ setup:android FAILED with code ${err.status}\n`);
  console.log('See error details above. Common issues:');
  console.log('   - Missing Android SDK or emulator images');
  console.log('   - Gradle daemon issues: try `gradle --stop`');
  console.log('   - npm cache issues: try `npm cache clean --force`');
  console.log('   - Stale node_modules: try `rm -r node_modules && npm install`\n');
}
