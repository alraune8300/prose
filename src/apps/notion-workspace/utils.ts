export function extractTextFromJSON(content: string): string {
  try {
    if (content.startsWith('{') || content.startsWith('[')) {
      const data = JSON.parse(content);
      let text = '';
      const traverse = (node: any) => {
        if (node.type === 'text') text += node.text;
        else if (node.type === 'paragraph' || node.type === 'heading') {
          if (node.content) node.content.forEach(traverse);
          text += '\n';
        }
        else if (node.content) node.content.forEach(traverse);
      };
      traverse(data);
      return text.trim();
    }
  } catch {
    // ignore parse error and fallback to regex HTML stripping
  }
  return content.replace(/<[^>]*>/g, '');
}
