import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Accordion({
  title, uiFont, c, children, defaultOpen = false, count
}: {
  title: string, uiFont: string, c: Record<string, unknown>, children: React.ReactNode, defaultOpen?: boolean, count?: string | number
}) {
  const [open, setOpen] = useState(defaultOpen)
  
  return (
    <div style={{
      marginBottom: 0,
      background: 'transparent',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: uiFont, fontSize: '0.86rem', fontWeight: 700, color: c.text as string,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          textAlign: 'left',
          borderBottom: `1px solid ${c.borderFaint as string}`,
          marginBottom: open ? 12 : 0,
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          {count !== undefined && (
            <span style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: 10, background: c.accentLight as string, color: c.accent as string, fontWeight: 700 }}>
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          style={{
            color: c.textMuted as string,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div style={{ padding: '2px 0 8px 0' }}>
          {children}
        </div>
      )}
    </div>
  )
}
