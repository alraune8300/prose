import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { CodexEntity } from './types';

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) return null;

  return (
    <div className="bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 shadow-xl rounded-xl overflow-hidden p-1 min-w-[150px]">
      {props.items.map((item: CodexEntity, index: number) => (
        <button
          className={`flex flex-col w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
            index === selectedIndex ? 'bg-black/5 dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/10'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          <span className="font-semibold">{item.name}</span>
          <span className="text-[10px] opacity-60 uppercase">{item.type}</span>
        </button>
      ))}
    </div>
  );
});
