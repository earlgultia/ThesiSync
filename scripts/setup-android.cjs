#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd, args, opts = {}) {
  console.log('> ' + cmd + ' ' + args.join(' '));
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true, ...opts });
  if (res.status !== 0) {
    console.error(`⚠️  Command returned non-zero status: ${cmd} ${args.join(' ')}`);
    // Don't exit immediately - some commands may fail but we can continue
    return false;
  }
  return true;
}

console.log('Installing Capacitor dependencies...');
run('npm', ['install', '@capacitor/cli', '@capacitor/core', '--save']);

console.log('\nBuilding web assets...');
run('npm', ['run', 'build']);

const androidDir = path.join(process.cwd(), 'android');

// Skip init/add if android already exists
if (fs.existsSync(androidDir)) {
  console.log('Android folder already exists; skipping cap init/add');
} else {
  console.log('\nInitializing Capacitor (cap init)...');
  if (!run('npx', ['cap', 'init', 'ThesiSync', 'com.example.thesisync', '--web-dir=dist'])) {
    console.error('cap init failed - check environment');
  }

  console.log('\nAdding Android platform (cap add)...');
  if (!run('npx', ['cap', 'add', 'android'])) {
    console.error('cap add android failed - check Java/Android SDK installation');
  }
}

if (fs.existsSync(androidDir)) {
  console.log('\nCopying web assets to Android project...');
  run('npx', ['cap', 'copy', 'android']);
  console.log('\n✅ Android setup complete!');
} else {
  console.error('\n❌ Android folder still not created. Troubleshoot:');
  console.error('   1. Check if Java is installed: java -version');
  console.error('   2. Check if Android SDK is installed and ANDROID_HOME is set');
  console.error('   3. Try: npm cache clean --force');
  process.exit(1);
}

