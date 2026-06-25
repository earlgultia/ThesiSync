#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const https = require('https');
const { pipeline } = require('stream/promises');

const projectRoot = process.cwd();
const sdkRoot = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Android', 'Sdk');
const zipPath = path.join(os.tmpdir(), 'cmdline-tools-win-latest.zip');
const localPropertiesPath = path.join(projectRoot, 'android', 'local.properties');
const reportPath = path.join(projectRoot, 'sdk-setup-report.json');
const debugRunPath = path.join(projectRoot, 'scripts', 'setup-android-sdk.run-debug.json');
try {
  fs.writeFileSync(debugRunPath, JSON.stringify({ runAt: new Date().toISOString(), cwd: projectRoot }), 'utf8');
} catch (err) {
  // ignore
}

function findJavaHome() {
  if (process.env.JAVA_HOME) {
    return process.env.JAVA_HOME;
  }
  if (process.env.JDK_HOME) {
    return process.env.JDK_HOME;
  }

  const javaHomeFromPath = run('where', ['java']);
  if (javaHomeFromPath.status === 0 && javaHomeFromPath.stdout) {
    const javaPaths = javaHomeFromPath.stdout.trim().split(/\r?\n/);
    if (javaPaths[0]) {
      return path.dirname(path.dirname(javaPaths[0]));
    }
  }

  return null;
}

function formatSpawnError(result) {
  if (result.stderr && result.stderr.trim()) {
    return result.stderr.trim();
  }
  if (result.stdout && result.stdout.trim()) {
    return result.stdout.trim();
  }
  if (result.error && result.error.message) {
    return result.error.message;
  }
  return 'unknown error';
}

function writeReport(report) {
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write report:', err.message);
  }
}

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', shell: false, ...options });
  if (res.error) {
    return { status: null, stdout: res.stdout || '', stderr: res.stderr || '', error: res.error.message };
  }
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function logJavaProbe(report) {
  const javaHome = process.env.JAVA_HOME || process.env.JDK_HOME || null;
  const javaVersion = run('java', ['-version']);
  const whereJava = run('where', ['java']);
  const winget = run('winget', ['--version']);
  report.steps.push({ step: 'javaProbe', javaHome, javaVersion, whereJava, winget });
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Node.js Android SDK Installer', Accept: 'application/vnd.github+json', ...headers } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Failed to fetch ${url}: ${res.statusCode} ${res.statusMessage || ''} ${body}`));
        }
      });
    });
    req.on('error', reject);
  });
}

async function getOpenJdkDownloadCandidates(report) {
  const apiUrl = 'https://api.github.com/repos/adoptium/temurin17-binaries/releases/latest';
  let release;
  try {
    release = await fetchJson(apiUrl);
  } catch (err) {
    report.steps.push({ step: 'jdkApiFetchFailed', error: err.message });
  }

  const preferredName = 'OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10.zip';
  const genericName = 'OpenJDK17U-jdk_x64_windows_hotspot.zip';
  const knownReleaseTag = 'jdk-17.0.19+10';
  const encodedKnownTag = encodeURIComponent(knownReleaseTag);
  const directStableUrl = `https://github.com/adoptium/temurin17-binaries/releases/download/${encodedKnownTag}/${preferredName}`;
  const directStableGenericUrl = `https://github.com/adoptium/temurin17-binaries/releases/download/${encodedKnownTag}/${genericName}`;
  const latestUrl = `https://github.com/adoptium/temurin17-binaries/releases/latest/download/${preferredName}`;
  const genericLatestUrl = `https://github.com/adoptium/temurin17-binaries/releases/latest/download/${genericName}`;
  const candidates = [directStableUrl, directStableGenericUrl, latestUrl, genericLatestUrl];

  report.steps.push({ step: 'jdkDownloadCandidateDefaults', urls: candidates, knownReleaseTag });

  if (release && Array.isArray(release.assets)) {
    report.steps.push({ step: 'jdkApiAssetsCount', count: release.assets.length, tag: release.tag_name || null });
    const asset = release.assets.find((item) => {
      return item.name && item.name.startsWith('OpenJDK17U-jdk_x64_windows_hotspot') && item.name.endsWith('.zip');
    });

    if (asset && asset.browser_download_url) {
      report.steps.push({ step: 'resolvedJdkAsset', name: asset.name, url: asset.browser_download_url });
      candidates.unshift(asset.browser_download_url);
    }

    if (release.tag_name) {
      const encodedTag = encodeURIComponent(release.tag_name);
      const versionedUrl = `https://github.com/adoptium/temurin17-binaries/releases/download/${encodedTag}/${preferredName}`;
      const versionedGenericUrl = `https://github.com/adoptium/temurin17-binaries/releases/download/${encodedTag}/${genericName}`;
      report.steps.push({ step: 'resolvedJdkAssetByTag', tagName: release.tag_name, urls: [versionedUrl, versionedGenericUrl] });
      candidates.unshift(versionedGenericUrl, versionedUrl);
    }
  } else {
    report.steps.push({ step: 'jdkApiNoAssets', release });
  }

  report.steps.push({ step: 'resolvedJdkAssetFallback', urls: candidates });
  return candidates;
}

async function installLocalOpenJdk(report) {
  const installRoot = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'OpenJDK', 'jdk-17');
  const jdkZipPath = path.join(os.tmpdir(), 'OpenJDK17U-jdk_x64_windows_hotspot_17.0.19_10.zip');
  const jdkExtractDir = path.join(os.tmpdir(), 'OpenJDK17U-jdk-extract');

  if (fs.existsSync(path.join(installRoot, 'bin', 'java.exe'))) {
    report.steps.push({ step: 'jdkAlreadyInstalled', path: installRoot });
    return installRoot;
  }

  const wingetProbe = run('winget', ['--version']);
  report.steps.push({ step: 'wingetProbe', result: wingetProbe });
  if (wingetProbe.status === 0) {
    report.steps.push({ step: 'wingetInstallAttempt', command: 'winget install --id Microsoft.OpenJDK.17 -e --silent' });
    const wingetInstall = run('winget', ['install', '--id', 'Microsoft.OpenJDK.17', '-e', '--silent']);
    report.steps.push({ step: 'wingetInstallResult', result: wingetInstall });
    if (wingetInstall.status === 0) {
      const foundJavaHome = findJavaHome();
      if (foundJavaHome) {
        report.steps.push({ step: 'wingetInstalledJavaHome', javaHome: foundJavaHome });
        return foundJavaHome;
      }
    }
  }

  report.steps.push({ step: 'jdkDownloadStart', source: 'github-api' });
  const resolvedUrls = await getOpenJdkDownloadCandidates(report);
  const resolvedUrl = await downloadFromCandidates(resolvedUrls, jdkZipPath);
  report.steps.push({ step: 'jdkDownloadResolved', url: resolvedUrl });
  report.steps.push({ step: 'jdkDownloaded', url: resolvedUrl, zipSize: fs.statSync(jdkZipPath).size });

  if (fs.existsSync(jdkExtractDir)) {
    fs.rmSync(jdkExtractDir, { recursive: true, force: true });
  }
  ensureDir(jdkExtractDir);

  const expandResult = run('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${jdkZipPath}' -DestinationPath '${jdkExtractDir}' -Force`]);
  report.steps.push({ step: 'jdkExpand', result: expandResult });
  if (expandResult.status !== 0) {
    throw new Error(`JDK archive expand failed: ${formatSpawnError(expandResult)}`);
  }

  const extractedNames = fs.readdirSync(jdkExtractDir).filter((name) => fs.statSync(path.join(jdkExtractDir, name)).isDirectory());
  if (extractedNames.length === 0) {
    throw new Error('Unexpected JDK archive layout: no extracted folder found');
  }

  const extractedJdkDir = path.join(jdkExtractDir, extractedNames[0]);
  if (!fs.existsSync(path.join(extractedJdkDir, 'bin', 'java.exe'))) {
    throw new Error('Extracted JDK does not contain bin/java.exe');
  }

  if (fs.existsSync(installRoot)) {
    fs.rmSync(installRoot, { recursive: true, force: true });
  }
  ensureDir(path.dirname(installRoot));
  fs.renameSync(extractedJdkDir, installRoot);
  report.steps.push({ step: 'jdkInstalled', path: installRoot });
  return installRoot;
}

const commandLineToolsUrls = [
  'https://dl.google.com/android/repository/commandlinetools-win-latest.zip',
  'https://dl.google.com/android/repository/commandlinetools-win-9477386_latest.zip',
  'https://dl.google.com/android/repository/commandlinetools-win-8796327_latest.zip'
];

function download(url, destination, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error(`Too many redirects downloading ${url}`));
      return;
    }

    const req = https.get(url, { headers: { 'User-Agent': 'Node.js Android SDK Installer' } }, async (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        req.destroy();
        if (fs.existsSync(destination)) {
          fs.unlinkSync(destination);
        }
        return resolve(download(res.headers.location, destination, redirectCount + 1));
      }

      if (res.statusCode !== 200) {
        req.destroy();
        if (fs.existsSync(destination)) {
          fs.unlinkSync(destination);
        }
        reject(new Error(`Failed to download ${url}: ${res.statusCode} ${res.statusMessage || ''}`));
        return;
      }

      const file = fs.createWriteStream(destination);
      try {
        await pipeline(res, file);
        resolve(destination);
      } catch (err) {
        if (fs.existsSync(destination)) {
          fs.unlinkSync(destination);
        }
        reject(err);
      }
    });

    req.on('error', (err) => {
      if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
      }
      reject(err);
    });
  });
}

async function downloadFromCandidates(urls, destination) {
  const errors = [];
  for (const url of urls) {
    try {
      await download(url, destination);
      return url;
    } catch (err) {
      errors.push({ url, error: err.message });
      if (fs.existsSync(destination)) {
        fs.unlinkSync(destination);
      }
    }
  }
  throw new Error(`Failed to download any JDK zip from candidates. Tried: ${JSON.stringify(errors, null, 2)}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

(async () => {
  const report = {
    sdkRoot,
    zipPath,
    localPropertiesPath,
    steps: [],
    error: null,
  };

  try {
    report.steps.push({ step: 'start', timestamp: new Date().toISOString() });
    ensureDir(sdkRoot);
    report.steps.push({ step: 'sdkRootExists', exists: fs.existsSync(sdkRoot) });

    report.steps.push({ step: 'downloadStart', urls: commandLineToolsUrls });
    const resolvedUrl = await downloadFromCandidates(commandLineToolsUrls, zipPath);
    report.steps.push({ step: 'downloadComplete', url: resolvedUrl, zipSize: fs.statSync(zipPath).size });

    const tmpExtractDir = path.join(sdkRoot, 'cmdline-tools', 'temp-extract');
    if (fs.existsSync(tmpExtractDir)) {
      fs.rmSync(tmpExtractDir, { recursive: true, force: true });
    }
    ensureDir(tmpExtractDir);
    report.steps.push({ step: 'tmpExtractDirCreated', path: tmpExtractDir });

    const expandCommand = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${tmpExtractDir.replace(/'/g, "''")}' -Force`;
    const expandResult = run('powershell.exe', ['-NoProfile', '-Command', expandCommand]);
    report.steps.push({ step: 'expandArchive', result: expandResult });
    if (expandResult.status !== 0) {
      throw new Error(`Expand-Archive failed: ${expandResult.stderr || expandResult.error}`);
    }

    const extractedRoot = path.join(tmpExtractDir, 'cmdline-tools');
    if (!fs.existsSync(extractedRoot)) {
      throw new Error('Unexpected extract layout: expected cmdline-tools folder inside archive');
    }
    report.steps.push({ step: 'extractedRootExists', path: extractedRoot, entries: fs.readdirSync(extractedRoot) });

    const destRoot = path.join(sdkRoot, 'cmdline-tools', 'latest');
    if (fs.existsSync(destRoot)) {
      fs.rmSync(destRoot, { recursive: true, force: true });
    }
    ensureDir(destRoot);
    report.steps.push({ step: 'destRootCreated', path: destRoot });

    const entries = fs.readdirSync(extractedRoot);
    for (const entry of entries) {
      const src = path.join(extractedRoot, entry);
      const dest = path.join(destRoot, entry);
      fs.renameSync(src, dest);
    }
    report.steps.push({ step: 'copiedExtractedFiles', entries });

    const sdkmanager = path.join(destRoot, 'bin', 'sdkmanager.bat');
    report.steps.push({ step: 'sdkmanagerPath', path: sdkmanager, exists: fs.existsSync(sdkmanager) });
    if (!fs.existsSync(sdkmanager)) {
      throw new Error(`sdkmanager.bat not found at ${sdkmanager}`);
    }

    logJavaProbe(report);
    let javaHome = findJavaHome();
    if (!javaHome) {
      report.steps.push({ step: 'javaInstallAttempt', message: 'Java not found; attempting local OpenJDK install' });
      javaHome = await installLocalOpenJdk(report);
      report.steps.push({ step: 'javaInstallCompleted', javaHome });
    }

    if (!javaHome) {
      throw new Error('Java JDK 11+ not found. Install OpenJDK 17 or newer and set JAVA_HOME or put java.exe on your PATH. Example: winget install --id Microsoft.OpenJDK.17');
    }

    const javaBin = path.join(javaHome, 'bin');
    const envWithJava = {
      ...process.env,
      JAVA_HOME: javaHome,
      JDK_HOME: javaHome,
      ANDROID_SDK_ROOT: sdkRoot,
      ANDROID_HOME: sdkRoot,
      PATH: `${javaBin};${process.env.PATH}`,
    };
    const postJavaProbe = run('java', ['-version'], { env: envWithJava });
    report.steps.push({ step: 'postJavaProbe', result: postJavaProbe });
    if (postJavaProbe.status !== 0) {
      throw new Error(`Java install verification failed: ${formatSpawnError(postJavaProbe)}`);
    }

    const installArgs = [
      '/c',
      'call',
      sdkmanager,
      `--sdk_root=${sdkRoot}`,
      'platform-tools',
      'platforms;android-34',
      'build-tools;34.0.0',
      'cmdline-tools;latest',
    ];
    report.steps.push({ step: 'sdkmanagerInstallArgs', args: installArgs });

    const installResult = spawnSync('cmd.exe', installArgs, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      input: 'y\n',
      shell: false,
      timeout: 180000,
      env: envWithJava,
    });
    report.steps.push({ step: 'sdkmanagerInstall', result: installResult });
    if (installResult.status !== 0) {
      throw new Error(`sdkmanager install failed: ${formatSpawnError(installResult)}`);
    }

    ensureDir(path.join(projectRoot, 'android'));
    fs.writeFileSync(localPropertiesPath, `sdk.dir=${sdkRoot.replace(/\\/g, '\\\\')}`);
    report.steps.push({ step: 'wroteLocalProperties', path: localPropertiesPath });

    report.steps.push({ step: 'complete', timestamp: new Date().toISOString() });
    writeReport(report);
    console.log('Android SDK setup complete.');
  } catch (error) {
    report.error = error.message;
    writeReport(report);
    console.error('Android SDK setup failed:', error.message);
    process.exit(1);
  }
})();
