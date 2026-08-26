import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useState } from 'react';
import { Table as TableIcon, Columns3, Filter, Plus, Trash2, Calendar, Tag, CheckSquare, AlignLeft, Search } from 'lucide-react';

export interface DatabaseRow {
  id: string;
  title: string;
  status: 'Not Started' | 'In Progress' | 'Done';
  tags: string[];
  date?: string;
  createdAt: number;
}

export interface DatabaseBlockData {
  id: string;
  name: string;
  activeView: 'table' | 'board';
  columns: Array<{ key: string; label: string; type: 'text' | 'status' | 'tags' | 'date' }>;
  rows: DatabaseRow[];
}

const DEFAULT_COLUMNS: Array<{ key: string; label: string; type: 'text' | 'status' | 'tags' | 'date' }> = [
  { key: 'title', label: 'Name', type: 'text' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'tags', label: 'Tags', type: 'tags' },
  { key: 'date', label: 'Date', type: 'date' },
];

const DatabaseBlockComponent = ({ node, updateAttributes }: any) => {
  const data = (node?.attrs || {}) as DatabaseBlockData;
  const columns = Array.isArray(data.columns) && data.columns.length > 0 ? data.columns : DEFAULT_COLUMNS;
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const activeView = data.activeView || 'table';
  const name = data.name || 'Untitled Database';

  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showFilter, setShowFilter] = useState(false);

  const updateData = (updates: Partial<DatabaseBlockData>) => {
    updateAttributes(updates);
  };

  const addRow = (status: 'Not Started' | 'In Progress' | 'Done' = 'Not Started') => {
    const newRow: DatabaseRow = {
      id: Date.now().toString(),
      title: '',
      status: status,
      tags: [],
      createdAt: Date.now()
    };
    updateData({ rows: [...rows, newRow] });
  };

  const updateRow = (id: string, updates: Partial<DatabaseRow>) => {
    const newRows = rows.map(r => r.id === id ? { ...r, ...updates } : r);
    updateData({ rows: newRows });
  };

  const deleteRow = (id: string) => {
    updateData({ rows: rows.filter(r => r.id !== id) });
  };

  const handleDragStart = (e: React.DragEvent, rowId: string) => {
    e.dataTransfer.setData('text/plain', rowId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: 'Not Started' | 'In Progress' | 'Done') => {
    e.preventDefault();
    const rowId = e.dataTransfer.getData('text/plain');
    if (rowId) updateRow(rowId, { status: newStatus });
  };

  const visibleRows = filterStatus === 'All' ? rows : rows.filter(r => r.status === filterStatus);

  const renderTable = () => (
    <div className="overflow-x-auto w-full mt-2 rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
            {columns.map(col => (
              <th key={col.key} className="py-2 px-3 font-medium whitespace-nowrap border-r last:border-r-0" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-1.5">
                  {col.type === 'text' && <AlignLeft size={14} />}
                  {col.type === 'status' && <CheckSquare size={14} />}
                  {col.type === 'tags' && <Tag size={14} />}
                  {col.type === 'date' && <Calendar size={14} />}
                  {col.label}
                </div>
              </th>
            ))}
            <th className="py-2 px-3 w-8"></th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(row => (
            <tr key={row.id} className="border-b group last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
              {columns.map(col => (
                <td key={col.key} className="py-1 px-3 border-r last:border-r-0 align-top" style={{ borderColor: 'var(--border-subtle)' }}>
                  {col.key === 'title' && (
                    <input 
                      value={row.title} 
                      onChange={e => updateRow(row.id, { title: e.target.value })}
                      placeholder="Untitled"
                      className="w-full bg-transparent outline-none py-1"
                    />
                  )}
                  {col.key === 'status' && (
                    <div className="relative inline-block w-full mt-0.5">
                      <select 
                        value={row.status}
                        onChange={e => updateRow(row.id, { status: e.target.value as any })}
                        className="bg-transparent outline-none py-1 w-full cursor-pointer appearance-none text-xs rounded border px-2"
                        style={{ 
                          borderColor: row.status === 'Done' ? 'rgba(34,197,94,0.3)' : row.status === 'In Progress' ? 'rgba(59,130,246,0.3)' : 'var(--border-subtle)',
                          color: row.status === 'Done' ? 'rgb(34,197,94)' : row.status === 'In Progress' ? 'rgb(59,130,246)' : 'var(--text-muted)'
                        }}
                      >
                        <option value="Not Started">Chưa Bắt Đầu</option>
                        <option value="In Progress">Đang Thực Hiện</option>
                        <option value="Done">Hoàn Thành</option>
                      </select>
                    </div>
                  )}
                  {col.key === 'tags' && (
                    <div className="py-1">
                      <input 
                        value={row.tags.join(', ')}
                        onChange={e => updateRow(row.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                        placeholder="Add tags..."
                        className="w-full bg-transparent outline-none text-xs"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        {row.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full border text-[10px]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {col.key === 'date' && (
                    <input 
                      type="date"
                      value={row.date || ''}
                      onChange={e => updateRow(row.id, { date: e.target.value })}
                      className="w-full bg-transparent outline-none py-1 text-xs"
                      style={{ colorScheme: 'dark' }}
                    />
                  )}
                </td>
              ))}
              <td className="py-2 px-3 align-top text-right">
                <button onClick={() => deleteRow(row.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button onClick={() => addRow()} className="flex items-center gap-1.5 text-sm px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors" style={{ color: 'var(--text-muted)' }}>
          <Plus size={14} /> Thêm hàng mới
        </button>
      </div>
    </div>
  );

  const renderBoard = () => {
    const cols: Array<'Not Started' | 'In Progress' | 'Done'> = ['Not Started', 'In Progress', 'Done'];
    return (
      <div className="flex gap-4 mt-4 w-full overflow-x-auto pb-4 items-start select-none">
        {cols.map(status => (
          <div 
            key={status} 
            className="flex-1 min-w-[250px] flex flex-col gap-2 rounded-lg p-2"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <div className={`w-2 h-2 rounded-full ${status === 'Done' ? 'bg-green-500' : status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                {status === 'Not Started' ? 'Chưa Bắt Đầu' : status === 'In Progress' ? 'Đang Thực Hiện' : 'Hoàn Thành'} <span className="text-xs font-normal opacity-50">{visibleRows.filter(r => r.status === status).length}</span>
              </span>
              <button onClick={() => addRow(status)} className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer" style={{ color: 'var(--text-muted)' }}>
                <Plus size={14} />
              </button>
            </div>
            
            {visibleRows.filter(r => r.status === status).map(row => (
              <div 
                key={row.id}
                draggable
                onDragStart={(e) => handleDragStart(e, row.id)}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing group relative"
                style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}
              >
                <button onClick={() => deleteRow(row.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-opacity cursor-pointer">
                  <Trash2 size={12} />
                </button>
                <input 
                  value={row.title}
                  onChange={e => updateRow(row.id, { title: e.target.value })}
                  placeholder="Untitled"
                  className="w-full bg-transparent outline-none font-medium text-sm mb-2"
                  style={{ color: 'var(--text-primary)' }}
                />
                
                {(row.tags.length > 0 || row.date) && (
                  <div className="flex flex-col gap-2 mt-2">
                    {row.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {row.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full border text-[10px]" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {row.date && (
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Calendar size={12} /> {row.date}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => addRow(status)}
              className="flex items-center gap-1.5 text-sm px-2 py-1.5 mt-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              <Plus size={14} /> Thêm thẻ
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <NodeViewWrapper className="my-8 w-full group relative" data-drag-handle>
      <div className="flex flex-col gap-2 p-1 rounded-xl">
        <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-4">
            <input 
              value={name}
              onChange={e => updateData({ name: e.target.value })}
              className="font-bold text-lg bg-transparent outline-none"
              style={{ color: 'var(--text-primary)' }}
              placeholder="Untitled Database"
            />
            
            <div className="flex items-center gap-1 border-l pl-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <button 
                onClick={() => updateData({ activeView: 'table' })}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors cursor-pointer ${activeView === 'table' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ color: activeView === 'table' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                <TableIcon size={14} /> Bảng
              </button>
              <button 
                onClick={() => updateData({ activeView: 'board' })}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors cursor-pointer ${activeView === 'board' ? 'bg-black/10 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                style={{ color: activeView === 'board' ? 'var(--text-primary)' : 'var(--text-muted)' }}
              >
                <Columns3 size={14} /> Bảng Kanban
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="relative">
              <button 
                onClick={() => setShowFilter(!showFilter)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors cursor-pointer ${filterStatus !== 'All' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500'}`}
                style={{ color: filterStatus === 'All' ? 'var(--text-muted)' : undefined }}
              >
                <Filter size={14} /> Lọc
              </button>
              {showFilter && (
                <div className="absolute right-0 top-full mt-1 z-10 w-48 rounded-xl shadow-xl border p-1" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                  <div className="px-2 py-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Filter by Status</div>
                  {['All', 'Not Started', 'In Progress', 'Done'].map(s => (
                    <button 
                      key={s}
                      onClick={() => { setFilterStatus(s); setShowFilter(false); }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 text-sm flex items-center justify-between cursor-pointer"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {s} {filterStatus === s && <Search size={12} className="opacity-50" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => addRow()}
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1 rounded text-sm transition-colors ml-2 cursor-pointer"
            >
              <Plus size={14} /> Thêm hàng mới
            </button>
          </div>
        </div>

        {activeView === 'table' ? renderTable() : renderBoard()}
      </div>
    </NodeViewWrapper>
  );
};

export const DatabaseExtension = Node.create({
  name: 'database',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: () => Date.now().toString() },
      name: { default: 'Untitled Database' },
      activeView: { default: 'table' },
      columns: { default: [
        { key: 'title', label: 'Name', type: 'text' },
        { key: 'status', label: 'Status', type: 'status' },
        { key: 'tags', label: 'Tags', type: 'tags' },
        { key: 'date', label: 'Date', type: 'date' },
      ]},
      rows: { default: [
        { id: '1', title: 'Task 1', status: 'Not Started', tags: ['bug'], createdAt: Date.now() },
        { id: '2', title: 'Task 2', status: 'In Progress', tags: ['feature'], createdAt: Date.now() },
        { id: '3', title: 'Task 3', status: 'Done', tags: [], createdAt: Date.now() }
      ]}
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="database"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'database' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseBlockComponent)
  },

  addCommands() {
    return {
      setDatabase: (view?: 'table' | 'board') => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: {
            id: Date.now().toString(),
            name: 'Untitled Database',
            activeView: view || 'table',
            columns: [
              { key: 'title', label: 'Name', type: 'text' },
              { key: 'status', label: 'Status', type: 'status' },
              { key: 'tags', label: 'Tags', type: 'tags' },
              { key: 'date', label: 'Date', type: 'date' },
            ],
            rows: [
              { id: Date.now().toString() + '-1', title: 'Task 1', status: 'Not Started', tags: ['bug'], createdAt: Date.now() },
              { id: Date.now().toString() + '-2', title: 'Task 2', status: 'In Progress', tags: ['feature'], createdAt: Date.now() },
              { id: Date.now().toString() + '-3', title: 'Task 3', status: 'Done', tags: [], createdAt: Date.now() }
            ]
          }
        })
      }
    }
  }
})

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    database: {
      setDatabase: (view?: 'table' | 'board') => ReturnType
    }
  }
}
