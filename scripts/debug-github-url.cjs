#!/usr/bin/env node
const https = require('https');
const url = 'https://api.github.com/repos/adoptium/temurin17-binaries/releases/latest';
https.get(url, { headers: { 'User-Agent': 'Node.js', Accept: 'application/vnd.github.v3+json' } }, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('status', res.statusCode);
    try {
      const json = JSON.parse(body);
      const assets = json.assets || [];
      console.log('assets count', assets.length);
      assets.filter(a => a.name.includes('OpenJDK17U')).forEach(a => {
        console.log(a.name, a.browser_download_url);
      });
    } catch (err) {
      console.error('parse failed', err.message);
      console.error(body);
    }
  });
}).on('error', err => console.error('request error', err.message));
