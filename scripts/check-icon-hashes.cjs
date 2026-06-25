const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashFile(p){
  const data = fs.readFileSync(p);
  return crypto.createHash('sha256').update(data).digest('hex');
}

const root = process.cwd();
const source = path.join(root, 'public', 'icons', 'icon-512.png');
if(!fs.existsSync(source)){
  console.error('SOURCE_MISSING', source);
  process.exit(2);
}
const sourceHash = hashFile(source);

const resDir = path.join(root, 'android', 'app', 'src', 'main', 'res');
if(!fs.existsSync(resDir)){
  console.error('RES_DIR_MISSING', resDir);
  process.exit(2);
}

const entries = fs.readdirSync(resDir, { withFileTypes: true });
const mipmapDirs = entries.filter(e=>e.isDirectory() && e.name.startsWith('mipmap')).map(e=>e.name);

const filesToCheck = ['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png'];

const results = { source: { path: source, sha256: sourceHash }, targets: [] };

for(const d of mipmapDirs){
  const dirPath = path.join(resDir, d);
  for(const f of filesToCheck){
    const p = path.join(dirPath, f);
    if(fs.existsSync(p)){
      try{
        const h = hashFile(p);
        results.targets.push({ path: path.relative(root, p), sha256: h, matchesSource: h === sourceHash });
      }catch(err){
        results.targets.push({ path: path.relative(root, p), error: String(err) });
      }
    } else {
      results.targets.push({ path: path.relative(root, p), missing: true });
    }
  }
}

console.log(JSON.stringify(results, null, 2));
process.exit(0);
