const fs = require('fs');

// 1. Update NotionCanvas.tsx
let canvas = fs.readFileSync('src/apps/notion-workspace/components/NotionCanvas.tsx', 'utf8');
canvas = canvas.replace(
  "import { CustomCodeBlock as CodeBlock } from './../extensions/CustomCodeBlock';",
  "import { CustomCodeBlock as CodeBlock } from './../extensions/CustomCodeBlock';\nimport { DatabaseExtension } from '../extensions/DatabaseBlock';"
);
canvas = canvas.replace(
  "CalloutExtension,",
  "CalloutExtension,\n      DatabaseExtension,"
);
fs.writeFileSync('src/apps/notion-workspace/components/NotionCanvas.tsx', canvas);

// 2. Update SlashCommandMenu.tsx
let slash = fs.readFileSync('src/apps/notion-workspace/components/SlashCommandMenu.tsx', 'utf8');
slash = slash.replace(
  "import { Heading1, Heading2, Heading3, CheckSquare, TextQuote, Minus, Info, Code, ListTree } from 'lucide-react';",
  "import { Heading1, Heading2, Heading3, CheckSquare, TextQuote, Minus, Info, Code, ListTree, Table, Columns3 } from 'lucide-react';"
);

const newCommands = `
  { id: 'divider', title: 'Divider', subtitle: 'Visually divide blocks.', icon: Minus, action: (editor: any) => editor.chain().focus().setHorizontalRule().run() },
  { id: 'table', title: 'Database (Table)', subtitle: 'Advanced database table.', icon: Table, action: (editor: any) => editor.chain().focus().setDatabase('table').run() },
  { id: 'board', title: 'Database (Board)', subtitle: 'Advanced database board.', icon: Columns3, action: (editor: any) => editor.chain().focus().setDatabase('board').run() },
`;

slash = slash.replace(
  "{ id: 'divider', title: 'Divider', subtitle: 'Visually divide blocks.', icon: Minus, action: (editor: any) => editor.chain().focus().setHorizontalRule().run() }",
  newCommands
);
fs.writeFileSync('src/apps/notion-workspace/components/SlashCommandMenu.tsx', slash);

// 3. Update NotionWorkspaceRoot.tsx
let root = fs.readFileSync('src/NotionWorkspaceRoot.tsx', 'utf8');
const tableData = "defaultData = { title: 'New Table', icon: 'Table', content: JSON.stringify({ type: 'doc', content: [{ type: 'database', attrs: { activeView: 'table' } }] }) };";
const kanbanData = "defaultData = { title: 'Kanban Board', icon: 'Kanban', content: JSON.stringify({ type: 'doc', content: [{ type: 'database', attrs: { activeView: 'board' } }] }) };";

root = root.replace(
  "if (type === 'table') defaultData = { title: 'New Table', icon: 'Table', properties: { status: 'Not Started' } };",
  `if (type === 'table') ${tableData}`
);
root = root.replace(
  "if (type === 'kanban') defaultData = { title: 'Kanban Board', icon: 'Kanban', properties: { status: 'Not Started' } };",
  `if (type === 'kanban') ${kanbanData}`
);
fs.writeFileSync('src/NotionWorkspaceRoot.tsx', root);

console.log("Patched successfully");
