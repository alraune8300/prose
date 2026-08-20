export function executeSearchReplace(editor: import("@tiptap/react").Editor, detail: { find: string; replace: string; matchCase: boolean; wholeWord: boolean; regex: boolean; all: boolean }) {
  const { find, replace, matchCase, wholeWord, regex, all } = detail;
  if (!find || !editor || editor.isDestroyed) return;

  const state = editor.state;
  const results: {from: number, to: number}[] = [];
  
  state.doc.descendants((node: import("prosemirror-model").Node, pos: number) => {
    if (node.isText && node.text) {
      const text = node.text;
      try {
         const flags = matchCase ? 'g' : 'gi';
         let reStr = regex ? find : find.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
         if (wholeWord) {
             reStr = `\\b${reStr}\\b`;
         }
         const re = new RegExp(reStr, flags);
         let match;
         while ((match = re.exec(text)) !== null) {
           results.push({
             from: pos + match.index,
             to: pos + match.index + match[0].length
           });
           if (!all) break;
         }
      } catch(_e) { /* ignore */ }
    }
  });

  if (results.length === 0) return;

  if (!all) {
     const selection = state.selection;
     let nextResult = results.find(r => r.from === selection.from && r.to === selection.to);
     if (!nextResult) nextResult = results.find(r => r.from >= selection.from);
     if (!nextResult) nextResult = results[0]; // wrap around
     
     if (nextResult) {
         editor.chain().focus().setTextSelection({ from: nextResult.from, to: nextResult.to }).insertContent(replace).run();
     }
  } else {
     // Replace all from back to front
     const tr = state.tr;
     for (let i = results.length - 1; i >= 0; i--) {
        const r = results[i];
        tr.insertText(replace, r.from, r.to);
     }
     editor.view.dispatch(tr);
  }
}

export function executeSearchNav(editor: import("@tiptap/react").Editor, detail: { direction: 'prev' | 'next', find: string, matchCase: boolean, wholeWord: boolean, regex: boolean }) {
  const { direction, find, matchCase, wholeWord, regex } = detail;
  if (!find || !editor || editor.isDestroyed) return;

  const state = editor.state;
  const results: {from: number, to: number}[] = [];
  
  state.doc.descendants((node: import("prosemirror-model").Node, pos: number) => {
    if (node.isText && node.text) {
      const text = node.text;
      try { 
         const flags = matchCase ? 'g' : 'gi';
         let reStr = regex ? find : find.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
         if (wholeWord) {
             reStr = `\\b${reStr}\\b`;
         }
         const re = new RegExp(reStr, flags);
         let match;
         while ((match = re.exec(text)) !== null) {
           results.push({
             from: pos + match.index,
             to: pos + match.index + match[0].length
           });
         }
      } catch(_e) { /* ignore */ }
    }
  });

  if (results.length === 0) return;

  const selection = state.selection;
  let target;

  if (direction === 'next') {
    target = results.find(r => r.from > selection.from);
    if (!target) target = results[0]; // wrap around
  } else {
    // prev
    const reversed = [...results].reverse();
    target = reversed.find(r => r.from < selection.from);
    if (!target) target = reversed[0]; // wrap around
  }

  if (target) {
    editor.chain().focus().setTextSelection({ from: target.from, to: target.to }).run();
    // Scroll into view
    const view = editor.view;
    const dom = view.nodeDOM(target.from);
    if (dom && (dom as HTMLElement).scrollIntoView) {
       (dom as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
