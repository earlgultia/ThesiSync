const https = require('https');
const fs = require('fs');
const url = 'https://api.github.com/repos/adoptium/temurin17-binaries/releases/latest';
https.get(url, { headers: { 'User-Agent': 'Node.js', Accept: 'application/vnd.github+json' } }, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      const assets = Array.isArray(json.assets) ? json.assets : [];
      const interesting = assets.filter(a => a && a.name && a.name.includes('OpenJDK17U-jdk_x64_windows_hotspot') && a.name.endsWith('.zip')).map(a => ({ name: a.name, url: a.browser_download_url }));
      fs.writeFileSync('debug-assets.json', JSON.stringify({ status: res.statusCode, tag_name: json.tag_name, assets: interesting, assetNames: assets.map(a => a && a.name).filter(n => typeof n === 'string') }, null, 2), 'utf8');
    } catch (err) {
      fs.writeFileSync('debug-assets.json', JSON.stringify({ error: err.message, body }, null, 2), 'utf8');
    }
  });
}).on('error', (err) => {
  fs.writeFileSync('debug-assets.json', JSON.stringify({ error: err.message }, null, 2), 'utf8');
});
