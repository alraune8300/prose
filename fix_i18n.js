const fs = require('fs');
let code = fs.readFileSync('src/i18n.ts', 'utf8');

// I will just use sed or string replace to clean up duplicate keys.
// But wait, it might be easier to just remove duplicates with a quick JS script.
const lines = code.split('\n');
const newLines = [];
const seenKeysInCurrentObj = new Set();
let inObj = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.match(/^\s*[a-zA-Z0-9_]+:\s*\{/)) {
    inObj = true;
    seenKeysInCurrentObj.clear();
    newLines.push(line);
    continue;
  }
  if (inObj && line.match(/^\s*\},/)) {
    inObj = false;
    newLines.push(line);
    continue;
  }
  if (inObj) {
    const match = line.match(/^\s*([a-zA-Z0-9_]+)\s*:/);
    if (match) {
      const key = match[1];
      if (seenKeysInCurrentObj.has(key)) {
        // Skip duplicate
        continue;
      }
      seenKeysInCurrentObj.add(key);
    }
  }
  newLines.push(line);
}

fs.writeFileSync('src/i18n.ts', newLines.join('\n'));
