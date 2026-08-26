import React from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { LayoutGrid, List, Table2 } from 'lucide-react';

export function NotionDatabaseView(props: NodeViewProps) {
  const { node, updateAttributes } = props;
  const viewType = node.attrs.viewType || 'table';

  return (
    <NodeViewWrapper className="notion-database-node my-4 border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-2 p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <button onClick={() => updateAttributes({ viewType: 'table' })} className={`p-1 rounded ${viewType === 'table' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><Table2 size={16} /></button>
        <button onClick={() => updateAttributes({ viewType: 'board' })} className={`p-1 rounded ${viewType === 'board' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><LayoutGrid size={16} /></button>
        <button onClick={() => updateAttributes({ viewType: 'gallery' })} className={`p-1 rounded ${viewType === 'gallery' ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}><List size={16} /></button>
        <span className="text-xs font-medium text-gray-500 ml-2">Database View</span>
      </div>
      <div className="p-4 text-sm text-gray-500">
        {viewType === 'table' && <div>Table View (Work in Progress)</div>}
        {viewType === 'board' && <div>Board View (Work in Progress)</div>}
        {viewType === 'gallery' && <div>Gallery View (Work in Progress)</div>}
      </div>
    </NodeViewWrapper>
  );
}
