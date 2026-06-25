const fs = require('fs');
const path = require('path');

// Write a test file to verify this script runs
const testFile = path.join(__dirname, '..', 'build-test.txt');
fs.writeFileSync(testFile, 'Build test executed at ' + new Date().toISOString(), 'utf8');
console.log('Test file written to', testFile);
