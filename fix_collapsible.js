const fs = require('fs');
let code = fs.readFileSync('src/CollapsibleHeadingsExtension.ts', 'utf8');

code = code.replace(
  /window\.dispatchEvent\(new CustomEvent\('kgv-toggle-heading-fold'/g,
  "chevronWidget.dispatchEvent(new CustomEvent('kgv-toggle-heading-fold', { bubbles: true, detail: { pos: current.pos, text: current.node.textContent } })) //"
);

code = code.replace(
  /badgeWidget\.addEventListener\('click', \(e\) => \{[\s\S]*?window\.dispatchEvent\(new CustomEvent\('kgv-toggle-heading-fold'[\s\S]*?\}\);/g,
  `badgeWidget.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    badgeWidget.dispatchEvent(new CustomEvent('kgv-toggle-heading-fold', { bubbles: true, detail: { pos: current.pos, text: current.node.textContent } }));
  });`
);
fs.writeFileSync('src/CollapsibleHeadingsExtension.ts', code);

let editorCode = fs.readFileSync('src/Editor.tsx', 'utf8');
editorCode = editorCode.replace(
  /window\.addEventListener\('kgv-toggle-heading-fold', handleToggleHeadingFold as EventListener\);/g,
  `if (editor.view && editor.view.dom) editor.view.dom.addEventListener('kgv-toggle-heading-fold', handleToggleHeadingFold as EventListener);`
);
editorCode = editorCode.replace(
  /window\.removeEventListener\('kgv-toggle-heading-fold', handleToggleHeadingFold as EventListener\);/g,
  `if (editor.view && editor.view.dom) editor.view.dom.removeEventListener('kgv-toggle-heading-fold', handleToggleHeadingFold as EventListener);`
);
fs.writeFileSync('src/Editor.tsx', editorCode);
