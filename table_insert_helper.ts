export const insertSimpleTable = (editor: any, rows: number, cols: number) => {
  editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
};
