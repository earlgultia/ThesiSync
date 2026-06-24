const fs = require('fs');
const path = require('path');

const testFile = path.join(__dirname, '..', 'TEST_FILE.txt');
const content = 'Test file written at ' + new Date().toISOString() + '\n';

try {
  fs.writeFileSync(testFile, content, 'utf8');
  console.log('SUCCESS: File written to ' + testFile);
} catch (err) {
  console.error('ERROR:', err.message);
}
