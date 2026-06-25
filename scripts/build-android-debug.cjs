#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');
const gradlew = path.join(androidDir, 'gradlew');

function getJavaHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  if (process.env.JDK_HOME) return process.env.JDK_HOME;

  const javaResult = spawnSync('where', ['java'], { encoding: 'utf8', shell: false });
  if (javaResult.status === 0 && javaResult.stdout) {
    const candidate = javaResult.stdout.trim().split(/\r?\n/)[0];
    if (candidate) {
      return path.dirname(path.dirname(candidate));
    }
  }

  const localOpenJdk = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'OpenJDK', 'jdk-17');
  if (fs.existsSync(path.join(localOpenJdk, 'bin', 'java.exe'))) return localOpenJdk;
  return null;
}

if (!fs.existsSync(androidDir)) {
  console.error('Android project not found. Run `npm run setup:android` first.');
  process.exit(1);
}

if (!fs.existsSync(gradlew)) {
  console.error('gradlew wrapper not found in android/. Did Capacitor create the android project?');
  process.exit(1);
}

console.log('Running Gradle assembleDebug... (this can take a few minutes)');
const isWin = process.platform === 'win32';
if (!isWin) {
  spawnSync('chmod', ['+x', gradlew], { stdio: 'inherit' });
}
const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';
const javaHome = getJavaHome();
const env = javaHome
  ? {
      ...process.env,
      JAVA_HOME: javaHome,
      JDK_HOME: javaHome,
      PATH: `${path.join(javaHome, 'bin')};${process.env.PATH}`,
    }
  : process.env;

const cleanResult = spawnSync(gradlewCmd, ['clean'], {
  cwd: androidDir,
  encoding: 'utf8',
  stdio: 'pipe',
  shell: true,
  timeout: 300000,
  env,
});
if (cleanResult.status !== 0) {
  console.error('Gradle clean failed:', cleanResult.stderr || cleanResult.stdout);
  process.exit(cleanResult.status || 1);
}

const res = spawnSync(gradlewCmd, ['assembleDebug', '-x', 'lint'], {
  cwd: androidDir,
  encoding: 'utf8',
  stdio: 'pipe',
  shell: true,
  timeout: 600000,
  env,
});

const stdout = res.stdout || '';
const stderr = res.stderr || '';
const buildLogPath = path.join(projectRoot, 'build-debug-output.txt');
fs.writeFileSync(buildLogPath, `Command: ${gradlewCmd} assembleDebug -x lint\nStatus: ${res.status}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}\n`, 'utf8');
if (stdout) {
  process.stdout.write(stdout);
}
if (stderr) {
  process.stderr.write(stderr);
}

if (res.status !== 0) {
  console.error('Gradle assembleDebug failed with exit code', res.status);
  process.exit(res.status || 1);
}

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (fs.existsSync(apkPath)) {
  console.log('\nSuccess! Debug APK located at: ' + apkPath);
} else {
  console.log('\nBuild finished but APK not found at expected path:', apkPath);
}
