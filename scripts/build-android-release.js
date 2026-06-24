#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');
const gradlew = path.join(androidDir, 'gradlew');

if (!fs.existsSync(androidDir)) {
  console.error('Android project not found. Run `npm run setup:android` first.');
  process.exit(1);
}

if (!fs.existsSync(gradlew)) {
  console.error('gradlew wrapper not found in android/. Did Capacitor create the android project?');
  process.exit(1);
}

console.log('Running Gradle assembleRelease... (this can take several minutes)');
const isWin = process.platform === 'win32';
if (!isWin) {
  spawnSync('chmod', ['+x', gradlew], { stdio: 'inherit' });
}
const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';
const res = spawnSync(gradlewCmd, ['assembleRelease', '-x', 'lint'], { cwd: androidDir, stdio: 'inherit', shell: true });
if (res.status !== 0) process.exit(res.status);

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (fs.existsSync(apkPath)) {
  console.log('\nSuccess! Release APK located at: ' + apkPath);
} else {
  console.log('\nBuild finished but APK not found at expected path:', apkPath);
  console.log('If signing is required, ensure `android/gradle.properties` contains signing properties or build via CI with keystore secrets.');
}
