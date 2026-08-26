import React from 'react';
import * as Icons from 'lucide-react';

export const LucideIconRenderer = ({ name, size = 16, className = '', style = {} }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) => {
  const Icon = (Icons as any)[name] || Icons.FileText;
  return <Icon size={size} className={className} style={style} strokeWidth={1.5} />;
};
