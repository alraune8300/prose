import fs from 'fs';

let content = fs.readFileSync('src/i18n.ts', 'utf8');

// The keys we want to remove duplicates of
const keysToRemove = [
  'archiveFolder',
  'unarchiveFolder',
  'archiveProject',
  'unarchiveProject',
  'archiveDocument',
  'unarchiveDocument',
  'unarchiveAll',
  'archivedItems',
  'archiveDesc',
  'archiveEmpty',
  'moveItem'
];

let lines = content.split('\n');

// We will keep track of seen keys per language block
let currentLang = null;
let seenKeys = new Set();
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detect language block start, e.g. "  en: {"
  const langMatch = line.match(/^  ([a-z]{2}): \{/);
  if (langMatch) {
    currentLang = langMatch[1];
    seenKeys = new Set();
    newLines.push(line);
    continue;
  }
  
  if (currentLang && line.match(/^  \}/)) {
    currentLang = null;
    newLines.push(line);
    continue;
  }
  
  if (currentLang) {
    // We are inside a language block. Look for key: value
    const keyMatch = line.match(/^    ([a-zA-Z0-9_]+):/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (seenKeys.has(key)) {
        // Skip duplicate!
        console.log(`Removing duplicate key ${key} in ${currentLang} at line ${i + 1}`);
        continue;
      }
      seenKeys.add(key);
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync('src/i18n.ts', newLines.join('\n'), 'utf8');
console.log('Done!');
