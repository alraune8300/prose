export function executeSearchReplace(editor: any, detail: any) {
  const { find, replace, matchCase, wholeWord, regex, all } = detail;
  if (!find || !editor || editor.isDestroyed) return;

  const state = editor.state;
  const results: {from: number, to: number}[] = [];
  
  state.doc.descendants((node: any, pos: number) => {
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
      } catch(e) {}
    }
  });

  if (results.length === 0) return;

  if (!all) {
     // For a single replace, we could replace the first one after the current selection
     const selection = state.selection;
     let nextResult = results.find(r => r.from >= selection.to);
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
