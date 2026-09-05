const fs = require('fs');
let code = fs.readFileSync('src/Editor.tsx', 'utf8');
code = code.replace(
  /isFocusMode\?: boolean;/,
  `isFocusMode?: boolean;\n  isSplitMode?: boolean;`
);
code = code.replace(
  /const isPaginated = !isPreviewMode && !isFocusMode;/,
  `const isPaginated = !isPreviewMode && !isFocusMode && !isSplitMode;`
);
fs.writeFileSync('src/Editor.tsx', code);
