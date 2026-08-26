import React from 'react';
import * as Icons from 'lucide-react';

export const LucideIconRenderer = ({ name, size = 16, className = '', style = {}, strokeWidth = 1.5 }: { name: string; size?: number; className?: string; style?: React.CSSProperties, strokeWidth?: number }) => {
  const Icon = (Icons as any)[name] || Icons.FileText;
  return <Icon size={size} className={className} style={style} strokeWidth={strokeWidth} />;
};
