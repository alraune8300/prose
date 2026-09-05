const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert updateTargetPage right below updateActivePage
const updateActivePageRegex = /const updateActivePage = useCallback\(\(patch: Partial<Page>\) => {[\s\S]*?\}, \[activeProjectId, activePageId, scheduleSaveProject\]\);/g;

let match = updateActivePageRegex.exec(code);
if (match) {
  const updateTargetPageStr = `
  const updateTargetPage = useCallback((targetId: string, patch: Partial<Page>) => {
    if (!activeProjectId) return;
    setProjects((prevProjects) => {
      return prevProjects.map((proj) => {
        if (proj.id !== activeProjectId) return proj;

        const now = new Date().toISOString();
        let pageFound = false;

        const updatedPages = (proj.pages || []).map((p) => {
          if (p.id === targetId) { pageFound = true; return { ...p, ...patch, lastModified: now }; }
          return p;
        });

        const updatedDrafts = (proj.drafts || []).map((p) => {
          if (p.id === targetId) { pageFound = true; return { ...p, ...patch, lastModified: now }; }
          return p;
        });

        const updatedScratchpad = (proj.scratchpad || []).map((p) => {
          if (p.id === targetId) { pageFound = true; return { ...p, ...patch, lastModified: now }; }
          return p;
        });

        if (!pageFound) {
          return proj;
        }

        const updatedProj = {
          ...proj,
          pages: updatedPages,
          drafts: updatedDrafts,
          scratchpad: updatedScratchpad,
          lastModified: now,
        };
        scheduleSaveProject(updatedProj);
        return updatedProj;
      });
    });
  }, [activeProjectId, scheduleSaveProject]);
`;

  code = code.replace(match[0], match[0] + '\n' + updateTargetPageStr);
}

// Update handleTargetContentChange
const handleContentChangeRegex = /const handleContentChange = useCallback\(\(html: string\) => {[\s\S]*?\}, \[updateActivePage\]\);/;
const handleTargetContentChangeStr = `
  const handleTargetContentChange = useCallback((targetId: string, html: string) => {
    updateTargetPage(targetId, { content: html });
  }, [updateTargetPage]);
`;

code = code.replace(handleContentChangeRegex, match => match + '\n' + handleTargetContentChangeStr);

// Update SplitRevisionStudio props
code = code.replace(/onUpdateContent=\{\(newContent\) => \{[\s\S]*?\}\}/g, 
  `onUpdateContent={(targetId, newContent) => {
          if (targetId) {
            handleTargetContentChange(targetId, newContent);
          }
        }}`);

fs.writeFileSync('src/App.tsx', code);
