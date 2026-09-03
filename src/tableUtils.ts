import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';

export interface TableInfo {
  tablePos: number;
  tableAttrs: Record<string, unknown>;
  rowCount: number;
  colCount: number;
  currentRow: number;
  currentCol: number;
  isHeaderRow: boolean;
  alignment: 'left' | 'center' | 'full';
  styleType: 'minimal' | 'grid' | 'striped';
  cellPadding: 'compact' | 'normal' | 'relaxed';
  caption: string;
  showCaption: boolean;
  sourceNote: string;
  showSourceNote: boolean;
  canMerge: boolean;
  canSplit: boolean;
}

export function getActiveTableInfo(editor: Editor | null): TableInfo | null {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) {
    return null;
  }
  try {
    const { state } = editor;
    const { selection } = state;

    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return null;

    let rowCount = 0;
    let colCount = 0;
    let currentRow = 1;
    let currentCol = 1;
    let isHeaderRow = false;

    let currentPos = tablePos + 1;
    let rowIdx = 0;

    (tableNode as any).forEach((rowNode: ProseMirrorNode) => {
      if (rowNode.type.name === 'tableRow') {
        rowIdx++;
        let colIdx = 0;
        let allCellsHeader = true;

        (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
          if (cellNode.type.name === 'tableCell' || cellNode.type.name === 'tableHeader') {
            colIdx++;
            if (cellNode.type.name !== 'tableHeader') {
              allCellsHeader = false;
            }
            const cellStart = currentPos;
            const cellEnd = currentPos + cellNode.nodeSize;

            if (selection.from >= cellStart && selection.from <= cellEnd) {
              currentRow = rowIdx;
              currentCol = colIdx;
            }
          }
          currentPos += cellNode.nodeSize;
        });

        if (rowIdx === 1) {
          colCount = colIdx;
          if (allCellsHeader && colIdx > 0) {
            isHeaderRow = true;
          }
        }
        currentPos += 2;
      }
    });

    rowCount = rowIdx;

    let canMerge = false;
    let canSplit = false;
    try {
      canMerge = !!editor.can().mergeCells();
      canSplit = !!editor.can().splitCell();
    } catch {
      // ignore
    }

    const attrs = (tableNode.attrs as Record<string, unknown>) || {};

    return {
      tablePos,
      tableAttrs: attrs,
      rowCount: Math.max(1, rowCount),
      colCount: Math.max(1, colCount),
      currentRow: Math.max(1, currentRow),
      currentCol: Math.max(1, currentCol),
      isHeaderRow,
      alignment: (attrs.alignment as 'left' | 'center' | 'full') || 'full',
      styleType: (attrs.styleType as 'minimal' | 'grid' | 'striped') || 'grid',
      cellPadding: (attrs.cellPadding as 'compact' | 'normal' | 'relaxed') || 'normal',
      caption: (attrs.caption as string) || '',
      showCaption: !!attrs.showCaption,
      sourceNote: (attrs.sourceNote as string) || '',
      showSourceNote: !!attrs.showSourceNote,
      canMerge,
      canSplit,
    };
  } catch {
    return null;
  }
}

export function setTableAttribute(editor: Editor, attr: string, value: unknown) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  try {
    const { state, view } = editor;
    const { selection } = state;
    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos !== null && tableNode) {
      const tr = state.tr.setNodeMarkup(tablePos, undefined, {
        ...tableNode.attrs,
        [attr]: value,
      });
      view.dispatch(tr);
    }
  } catch (e) {
    console.warn('Failed to set table attribute', e);
  }
}

export function setTableCellColor(editor: Editor, color: string) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  try {
    const { state, view } = editor;
    const { selection } = state;

    let cellPos: number | null = null;
    let cellNode: ProseMirrorNode | null = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          cellPos = pos;
          cellNode = node;
          return false;
        }
      }
      return true;
    });

    if (cellPos !== null && cellNode) {
      const tr = state.tr.setNodeMarkup(cellPos, undefined, {
        ...((cellNode as any).attrs),
        backgroundColor: color || null,
        style: color ? `background-color: ${color};` : null,
      });
      view.dispatch(tr);
    }
  } catch (e) {
    console.warn('Failed to set cell color', e);
  }
}

export function setTableRowColor(editor: Editor, color: string) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  try {
    const { state, view } = editor;
    const { selection } = state;

    let rowPos: number | null = null;
    let rowNode: ProseMirrorNode | null = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'tableRow') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          rowPos = pos;
          rowNode = node;
          return false;
        }
      }
      return true;
    });

    if (rowPos !== null && rowNode) {
      const tr = state.tr;
      let cur = rowPos + 1;
      (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
        tr.setNodeMarkup(cur, undefined, {
          ...((cellNode as any).attrs),
          backgroundColor: color || null,
          style: color ? `background-color: ${color};` : null,
        });
        cur += cellNode.nodeSize;
      });
      view.dispatch(tr);
    }
  } catch (e) {
    console.warn('Failed to set row color', e);
  }
}

export function setTableColumnColor(editor: Editor, color: string) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  const info = getActiveTableInfo(editor);
  if (!info) return;

  try {
    const { state, view } = editor;
    const { selection } = state;
    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return;

    const targetCol = info.currentCol;
    const tr = state.tr;
    let cur = tablePos + 1;

    (tableNode as any).forEach((rowNode) => {
      let colIdx = 0;
      (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
        colIdx++;
        if (colIdx === targetCol) {
          tr.setNodeMarkup(cur, undefined, {
            ...((cellNode as any).attrs),
            backgroundColor: color || null,
            style: color ? `background-color: ${color};` : null,
          });
        }
        cur += cellNode.nodeSize;
      });
      cur += 2;
    });

    view.dispatch(tr);
  } catch (e) {
    console.warn('Failed to set column color', e);
  }
}

export function clearTableContents(editor: Editor) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  try {
    const { state, view } = editor;
    const { selection } = state;
    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return;

    const defaultParagraph = state.schema.nodes.paragraph.create();
    const tr = state.tr;

    const newRows: ProseMirrorNode[] = [];
    (tableNode as any).forEach((rowNode: ProseMirrorNode) => {
      const newCells: ProseMirrorNode[] = [];
      (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
        newCells.push(cellNode.type.create(cellNode.attrs, defaultParagraph));
      });
      newRows.push(rowNode.type.create(rowNode.attrs, newCells));
    });

    const newTable = tableNode.type.create(tableNode.attrs, newRows);
    tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
    view.dispatch(tr);
  } catch (e) {
    console.warn('Failed to clear table contents', e);
  }
}

export function distributeColumnsEvenly(editor: Editor) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  try {
    const { state, view } = editor;
    const { selection } = state;
    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return;

    const tr = state.tr;
    let currentPos = tablePos + 1;
    (tableNode as any).forEach((rowNode: ProseMirrorNode) => {
      (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
        if (cellNode.attrs?.colwidth) {
          tr.setNodeMarkup(currentPos, undefined, {
            ...((cellNode as any).attrs),
            colwidth: null,
          });
        }
        currentPos += cellNode.nodeSize;
      });
      currentPos += 2;
    });

    view.dispatch(tr);
  } catch (e) {
    console.warn('Failed to distribute columns', e);
  }
}

export function adjustRowCount(editor: Editor, targetRows: number) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  const info = getActiveTableInfo(editor);
  if (!info) return;

  const diff = targetRows - info.rowCount;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      editor.chain().focus().addRowAfter().run();
    }
  } else if (diff < 0) {
    const deleteCount = Math.abs(diff);
    for (let i = 0; i < deleteCount; i++) {
      editor.chain().focus().deleteRow().run();
    }
  }
}

export function adjustColumnCount(editor: Editor, targetCols: number) {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return;
  const info = getActiveTableInfo(editor);
  if (!info) return;

  const diff = targetCols - info.colCount;
  if (diff > 0) {
    for (let i = 0; i < diff; i++) {
      editor.chain().focus().addColumnAfter().run();
    }
  } else if (diff < 0) {
    const deleteCount = Math.abs(diff);
    for (let i = 0; i < deleteCount; i++) {
      editor.chain().focus().deleteColumn().run();
    }
  }
}

// ==========================================
// FEATURE 1: SMART PASTE TABLE DATA
// ==========================================
export function parseClipboardTable(text: string, html?: string): string[][] | null {
  if (html && (html.includes('<table') || html.includes('<tr'))) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tr'));
        const matrix: string[][] = [];
        rows.forEach(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th'));
          if (cells.length > 0) {
            matrix.push(cells.map(c => c.textContent?.trim() || ''));
          }
        });
        if (matrix.length > 0 && matrix.some(r => r.length > 1 || matrix.length > 1)) {
          return matrix;
        }
      }
    } catch {
      // fallback to plain text parsing
    }
  }

  if (text) {
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n').filter(l => l.trim().length > 0);
    
    // Check if it is tab-separated or csv-separated
    const hasTabs = lines.some(l => l.includes('\t'));
    if (hasTabs) {
      const matrix = lines.map(line => line.split('\t').map(c => c.trim()));
      if (matrix.length > 0 && matrix.some(r => r.length > 1)) {
        return matrix;
      }
    }

    // Markdown table check (| col 1 | col 2 |)
    const isMarkdownTable = lines.length >= 2 && lines.every(l => l.includes('|'));
    if (isMarkdownTable) {
      const filteredLines = lines.filter(l => !l.replace(/[\s|:-]/g, '').length === false);
      const matrix = filteredLines.map(l => {
        const cells = l.split('|').map(c => c.trim());
        if (cells[0] === '') cells.shift();
        if (cells[cells.length - 1] === '') cells.pop();
        return cells;
      });
      if (matrix.length > 0) return matrix;
    }
  }

  return null;
}

export function insertParsedTable(editor: Editor, matrix: string[][]): boolean {
  if (!matrix || matrix.length === 0 || !editor || editor.isDestroyed) return false;
  try {
    const { schema } = editor.state;
    const maxCols = Math.max(...matrix.map(r => r.length));

    // If currently inside table, matrix-fill into existing table
    if (editor.isActive('table')) {
      const info = getActiveTableInfo(editor);
      if (info) {
        // Fill table cells starting at current row & col
        const { state, view } = editor;
        let tablePos: number | null = null;
        let tableNode: any = null;

        state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
          if (node.type.name === 'table') {
            if (pos <= state.selection.from && pos + node.nodeSize >= state.selection.to) {
              tablePos = pos;
              tableNode = node;
              return false;
            }
          }
          return true;
        });

        if (tablePos !== null && tableNode) {
          const startR = info.currentRow - 1;
          const startC = info.currentCol - 1;

          const newRows: ProseMirrorNode[] = [];
          let rIdx = 0;
          (tableNode as any).forEach((rowNode: ProseMirrorNode) => {
            const newCells: ProseMirrorNode[] = [];
            let cIdx = 0;
            (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
              const pasteR = rIdx - startR;
              const pasteC = cIdx - startC;
              if (pasteR >= 0 && pasteR < matrix.length && pasteC >= 0 && pasteC < matrix[pasteR].length) {
                const textVal = matrix[pasteR][pasteC];
                const textNode = textVal ? schema.text(textVal) : null;
                const p = schema.nodes.paragraph.create(null, textNode || undefined);
                newCells.push(cellNode.type.create(cellNode.attrs, p));
              } else {
                newCells.push((cellNode));
              }
              cIdx++;
            });
            newRows.push(rowNode.type.create(rowNode.attrs, newCells));
            rIdx++;
          });

          const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, tableNode.type.create(tableNode.attrs, newRows));
          view.dispatch(tr);
          return true;
        }
      }
    }

    // Outside table: construct new table node
    const rowNodes: ProseMirrorNode[] = [];
    matrix.forEach((row, rIdx) => {
      const cellNodes: ProseMirrorNode[] = [];
      for (let c = 0; c < maxCols; c++) {
        const textVal = row[c] || '';
        const p = schema.nodes.paragraph.create(null, textVal ? schema.text(textVal) : undefined);
        const cellType = (rIdx === 0) ? (schema.nodes.tableHeader || schema.nodes.tableCell) : schema.nodes.tableCell;
        cellNodes.push(cellType.create(null, p));
      }
      rowNodes.push(schema.nodes.tableRow.create(null, cellNodes));
    });

    const tableNode = schema.nodes.table.create(
      {
        alignment: 'full',
        styleType: 'grid',
        cellPadding: 'normal',
      },
      rowNodes
    );

    const tr = editor.state.tr.replaceSelectionWith(tableNode);
    editor.view.dispatch(tr);
    return true;
  } catch (e) {
    console.warn('Smart table paste failed:', e);
    return false;
  }
}

// ==========================================
// FEATURE 3: CONVERT TABLE <-> BULLET LIST
// ==========================================
export function convertTableToList(editor: Editor): boolean {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return false;
  try {
    const { state, view } = editor;
    const { schema, selection } = state;

    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return false;

    const listItems: ProseMirrorNode[] = [];
    let headers: string[] = [];

    (tableNode as any).forEach((rowNode: ProseMirrorNode, _offset, rIdx) => {
      const cellTexts: string[] = [];
      (rowNode as any).forEach((cellNode: ProseMirrorNode) => {
        cellTexts.push(cellNode.textContent?.trim() || '');
      });

      if (rIdx === 0 && cellTexts.some(c => c.length > 0)) {
        headers = cellTexts;
        // Optionally create header bullet or bold intro
        const strongMark = schema.marks.bold ? [schema.marks.bold.create()] : [];
        const labelNode = schema.text(`[${cellTexts.join(' | ')}]`, strongMark);
        const p = schema.nodes.paragraph.create(null, labelNode);
        listItems.push(schema.nodes.listItem.create(null, p));
      } else if (cellTexts.some(c => c.length > 0)) {
        // Construct clean list item text
        const nodes: ProseMirrorNode[] = [];
        if (cellTexts[0]) {
          const strongMark = schema.marks.bold ? [schema.marks.bold.create()] : [];
          nodes.push(schema.text(cellTexts[0], strongMark));
        }

        const remaining = cellTexts.slice(1).map((val, idx) => {
          const h = headers[idx + 1] ? `${headers[idx + 1]}: ` : '';
          return `${h}${val}`;
        }).filter(s => s.trim().length > 0).join(' • ');

        if (remaining) {
          nodes.push(schema.text(`: ${remaining}`));
        }

        const p = schema.nodes.paragraph.create(null, nodes.length > 0 ? nodes : undefined);
        listItems.push(schema.nodes.listItem.create(null, p));
      }
    });

    if (listItems.length === 0) return false;

    const bulletList = schema.nodes.bulletList.create(null, listItems);
    const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, bulletList);
    view.dispatch(tr);
    return true;
  } catch (e) {
    console.warn('Failed to convert table to list', e);
    return false;
  }
}

export function convertListToTable(editor: Editor): boolean {
  if (!editor || editor.isDestroyed) return false;
  try {
    const { state, view } = editor;
    const { schema, selection } = state;

    let listPos: number | null = null;
    let listNode: ProseMirrorNode | null = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'bulletList' || node.type.name === 'orderedList') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          listPos = pos;
          listNode = node;
          return false;
        }
      }
      return true;
    });

    if (listPos === null || !listNode) return false;

    const matrix: string[][] = [];
    (listNode as any).forEach((itemNode: ProseMirrorNode) => {
      const text = itemNode.textContent?.trim() || '';
      if (text) {
        // Split by delimiter if exists: ":", "-", "–", "\t", "|"
        const delimiterMatch = text.match(/[:–\-|\t]/);
        if (delimiterMatch && delimiterMatch.index !== undefined) {
          const idx = delimiterMatch.index;
          const col1 = text.substring(0, idx).trim();
          const col2 = text.substring(idx + 1).trim();
          matrix.push([col1, col2]);
        } else {
          matrix.push([text, '']);
        }
      }
    });

    if (matrix.length === 0) return false;

    const rowNodes: ProseMirrorNode[] = [];
    // Header row
    const headerRow = schema.nodes.tableRow.create(null, [
      (schema.nodes.tableHeader || schema.nodes.tableCell).create(null, schema.nodes.paragraph.create(null, schema.text('Mục / Tiêu đề'))),
      (schema.nodes.tableHeader || schema.nodes.tableCell).create(null, schema.nodes.paragraph.create(null, schema.text('Nội dung chi tiết'))),
    ]);
    rowNodes.push(headerRow);

    matrix.forEach(r => {
      const c1 = schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, r[0] ? schema.text(r[0]) : undefined));
      const c2 = schema.nodes.tableCell.create(null, schema.nodes.paragraph.create(null, r[1] ? schema.text(r[1]) : undefined));
      rowNodes.push(schema.nodes.tableRow.create(null, [c1, c2]));
    });

    const tableNode = schema.nodes.table.create(
      {
        alignment: 'full',
        styleType: 'grid',
        cellPadding: 'normal',
      },
      rowNodes
    );

    const tr = state.tr.replaceWith(listPos, listPos + listNode.nodeSize, tableNode);
    view.dispatch(tr);
    return true;
  } catch (e) {
    console.warn('Failed to convert list to table', e);
    return false;
  }
}

// ==========================================
// FEATURE 4: ROW & COLUMN REORDERING
// ==========================================
export function moveRow(editor: Editor, fromRowIdx: number, toRowIdx: number): boolean {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return false;
  try {
    const { state, view } = editor;
    const { selection } = state;

    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return false;

    const rows: ProseMirrorNode[] = [];
    (tableNode as any).forEach((r) => rows.push(r));

    const from = fromRowIdx - 1;
    const to = toRowIdx - 1;

    if (from < 0 || from >= rows.length || to < 0 || to >= rows.length || from === to) {
      return false;
    }

    const [movedRow] = rows.splice(from, 1);
    rows.splice(to, 0, movedRow);

    const newTable = tableNode.type.create(tableNode.attrs, rows);
    const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
    view.dispatch(tr);
    return true;
  } catch (e) {
    console.warn('Failed to move row', e);
    return false;
  }
}

export function moveColumn(editor: Editor, fromColIdx: number, toColIdx: number): boolean {
  if (!editor || editor.isDestroyed || !editor.isActive('table')) return false;
  try {
    const { state, view } = editor;
    const { selection } = state;

    let tablePos: number | null = null;
    let tableNode: any = null;

    state.doc.nodesBetween(0, state.doc.content.size, (node, pos) => {
      if (node.type.name === 'table') {
        if (pos <= selection.from && pos + node.nodeSize >= selection.to) {
          tablePos = pos;
          tableNode = node;
          return false;
        }
      }
      return true;
    });

    if (tablePos === null || !tableNode) return false;

    const from = fromColIdx - 1;
    const to = toColIdx - 1;

    const newRows: ProseMirrorNode[] = [];
    let isValid = true;

    (tableNode as any).forEach((rowNode: ProseMirrorNode) => {
      const cells: ProseMirrorNode[] = [];
      (rowNode as any).forEach(c => cells.push(c));

      if (from < 0 || from >= cells.length || to < 0 || to >= cells.length || from === to) {
        isValid = false;
        return;
      }

      const [movedCell] = cells.splice(from, 1);
      cells.splice(to, 0, movedCell);
      newRows.push(rowNode.type.create(rowNode.attrs, cells));
    });

    if (!isValid || newRows.length === 0) return false;

    const newTable = tableNode.type.create(tableNode.attrs, newRows);
    const tr = state.tr.replaceWith(tablePos, tablePos + tableNode.nodeSize, newTable);
    view.dispatch(tr);
    return true;
  } catch (e) {
    console.warn('Failed to move column', e);
    return false;
  }
}
