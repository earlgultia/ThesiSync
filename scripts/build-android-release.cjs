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

console.log('Running Gradle assembleRelease... (this can take several minutes)');
const isWin = process.platform === 'win32';
if (!isWin) {
  spawnSync('chmod', ['+x', gradlew], { stdio: 'inherit' });
}
const javaHome = getJavaHome();
const env = javaHome
  ? {
      ...process.env,
      JAVA_HOME: javaHome,
      JDK_HOME: javaHome,
      PATH: `${path.join(javaHome, 'bin')};${process.env.PATH}`,
    }
  : process.env;

const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';
const res = spawnSync(gradlewCmd, ['assembleRelease', '-x', 'lint'], { cwd: androidDir, stdio: 'inherit', shell: true, env });
if (res.status !== 0) process.exit(res.status);

const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
if (fs.existsSync(apkPath)) {
  console.log('\nSuccess! Release APK located at: ' + apkPath);
} else {
  console.log('\nBuild finished but APK not found at expected path:', apkPath);
  console.log('If signing is required, ensure `android/gradle.properties` contains signing properties or build via CI with keystore secrets.');
}
