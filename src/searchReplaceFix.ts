export function executeSearchReplace(editor: import("@tiptap/react").Editor, detail: { find: string; replace: string; matchCase: boolean; wholeWord: boolean; regex: boolean; all: boolean; isDelete?: boolean }) {
  const { find, replace, matchCase, wholeWord, regex, all, isDelete } = detail;
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
      } catch { /* ignore */ }
    }
  });

  if (results.length === 0) return;

  if (!all) {
     const selection = state.selection;
     let nextResult = results.find(r => r.from === selection.from && r.to === selection.to);
     if (!nextResult) nextResult = results.find(r => r.from >= selection.from);
     if (!nextResult) nextResult = results[0]; // wrap around
     
     if (nextResult) {
         let extendFrom = nextResult.from;
         let extendTo = nextResult.to;
         
         if (isDelete) {
             const doc = state.doc;
             let spacesBefore = 0;
             while (extendFrom > 0 && /^\s$/.test(doc.textBetween(extendFrom - 1, extendFrom))) {
                 extendFrom--;
                 spacesBefore++;
             }
             
             let spacesAfter = 0;
             while (extendTo < doc.content.size && /^\s$/.test(doc.textBetween(extendTo, extendTo + 1))) {
                 extendTo++;
                 spacesAfter++;
             }
             
             const totalSpaces = spacesBefore + spacesAfter;
             const charBefore = extendFrom > 0 ? doc.textBetween(extendFrom - 1, extendFrom) : '';
             const charAfter = extendTo < doc.content.size ? doc.textBetween(extendTo, extendTo + 1) : '';
             
             const isPunctAfter = /^[.,;:!?\)]$/.test(charAfter);
             const isPunctBefore = /^[\({\[]$/.test(charBefore);
             
             let replacement = '';
             if (totalSpaces > 0) {
                 if (isPunctAfter || isPunctBefore || !charBefore || !charAfter) {
                     replacement = '';
                 } else {
                     replacement = ' ';
                 }
             }
             editor.chain().focus().setTextSelection({ from: extendFrom, to: extendTo }).insertContent(replacement).run();
         } else {
             editor.chain().focus().setTextSelection({ from: extendFrom, to: extendTo }).insertContent(replace).run();
         }
     }
  } else {
     // Replace all from back to front
     editor.commands.command(({ tr, dispatch }) => {
        for (let i = results.length - 1; i >= 0; i--) {
           const r = results[i];
           let extendFrom = r.from;
           let extendTo = r.to;
           
           if (isDelete) {
               const doc = tr.doc;
             let spacesBefore = 0;
             while (extendFrom > 0 && /^\s$/.test(doc.textBetween(extendFrom - 1, extendFrom))) {
                 extendFrom--;
                 spacesBefore++;
             }
             
             let spacesAfter = 0;
             while (extendTo < doc.content.size && /^\s$/.test(doc.textBetween(extendTo, extendTo + 1))) {
                 extendTo++;
                 spacesAfter++;
             }
             
             const totalSpaces = spacesBefore + spacesAfter;
             const charBefore = extendFrom > 0 ? doc.textBetween(extendFrom - 1, extendFrom) : '';
             const charAfter = extendTo < doc.content.size ? doc.textBetween(extendTo, extendTo + 1) : '';
             
             const isPunctAfter = /^[.,;:!?\)]$/.test(charAfter);
             const isPunctBefore = /^[\({\[]$/.test(charBefore);
             
             let replacement = '';
             if (totalSpaces > 0) {
                 if (isPunctAfter || isPunctBefore || !charBefore || !charAfter) {
                     replacement = '';
                 } else {
                     replacement = ' ';
                 }
             }
             tr.insertText(replacement, extendFrom, extendTo);
           } else {
               tr.insertText(replace, r.from, r.to);
           }
        }
        if (dispatch) dispatch(tr);
        return true;
     });
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
      } catch { /* ignore */ }
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
