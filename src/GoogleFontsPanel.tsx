import React, { useState } from 'react';
export default function GoogleFontsPanel({ onClose, onSelect, onApplyToSelection }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[400px]">
        <h2 className="text-lg font-bold mb-4">Select Font</h2>
        <div className="flex gap-2">
           <button onClick={() => { onApplyToSelection?.('Inter'); onSelect?.('Inter'); }} className="p-2 border rounded">Inter</button>
           <button onClick={onClose} className="p-2 bg-red-500 text-white rounded">Close</button>
        </div>
      </div>
    </div>
  )
}
