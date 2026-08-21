const fs = require('fs');
let code = fs.readFileSync('src/SmartFormattingExtension.ts', 'utf8');

code = code.replace(/handler: \(\{ state, range, match \}\) => \{/g, "handler: ({ chain, range, match }) => {");
code = code.replace(/handler: \(\{ state, range \}\) => \{/g, "handler: ({ chain, range }) => {");

code = code.replace(/const \{ tr \} = state;/g, "");
code = code.replace(/tr\.insertText\('“', range\.from \+ match\[0\]\.length - 1, range\.to\);/g, "chain().insertContentAt({ from: range.from + match[0].length - 1, to: range.to }, '“').run();");
code = code.replace(/state\.tr\.insertText\('”', range\.from, range\.to\);/g, "chain().insertContentAt({ from: range.from, to: range.to }, '”').run();");
code = code.replace(/tr\.insertText\('‘', range\.from \+ match\[0\]\.length - 1, range\.to\);/g, "chain().insertContentAt({ from: range.from + match[0].length - 1, to: range.to }, '‘').run();");
code = code.replace(/state\.tr\.insertText\('’', range\.from, range\.to\);/g, "chain().insertContentAt({ from: range.from, to: range.to }, '’').run();");
code = code.replace(/state\.tr\.insertText\('…', range\.from, range\.to\);/g, "chain().insertContentAt({ from: range.from, to: range.to }, '…').run();");
code = code.replace(/state\.tr\.insertText\('—', range\.from, range\.to\);/g, "chain().insertContentAt({ from: range.from, to: range.to }, '—').run();");
code = code.replace(/state\.tr\.insertText\('–', range\.from, range\.to\);/g, "chain().insertContentAt({ from: range.from, to: range.to }, '–').run();");

fs.writeFileSync('src/SmartFormattingExtension.ts', code);
