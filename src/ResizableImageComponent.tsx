import React, { useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

export const ResizableImageComponent = (props: NodeViewProps) => {
  const { node, updateAttributes, selected } = props;
  const { src, alt, title, width, height } = node.attrs;
  const imgRef = useRef<HTMLImageElement>(null);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = imgRef.current?.offsetWidth || 0;
    
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const currentX = e.clientX;
      const newWidth = Math.max(50, startWidth + (currentX - startX));
      updateAttributes({ width: newWidth });
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  return (
    <NodeViewWrapper 
      className={`relative inline-block ${selected ? 'ring-2 ring-blue-500/50 rounded' : ''}`}
      style={{ width: width ? `${width}px` : 'auto', maxWidth: '100%', lineHeight: 0, margin: '0.5rem 0' }}
    >
      <img 
        ref={imgRef} 
        src={src} 
        alt={alt} 
        title={title} 
        style={{ width: '100%', height: height ? `${height}px` : 'auto', display: 'block', borderRadius: '4px' }} 
      />
      {selected && (
        <div 
          className="absolute -right-2 -bottom-2 w-4 h-4 bg-blue-500 rounded-full cursor-nwse-resize shadow border border-white z-10"
          onMouseDown={startResize}
        />
      )}
    </NodeViewWrapper>
  );
};
