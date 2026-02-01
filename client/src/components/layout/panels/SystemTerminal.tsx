import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Terminal } from 'lucide-react';

export const SystemTerminal: React.FC<IDockviewPanelProps> = () => {
  return (
    <div className="flex flex-col h-full bg-black text-green-500 font-mono text-xs">
      <div className="flex items-center gap-2 px-3 py-1 bg-[#333] text-gray-300 border-b border-gray-700">
        <Terminal size={12} />
        <span>OUTPUT</span>
      </div>
      <div className="flex-1 p-2 overflow-auto scrollbar-thin">
        <div>[SYSTEM] Core connected successfully.</div>
        <div>[PYTHON] Scanner initialized (PID: 1234)</div>
        <div>[INFO] Market data stream ready...</div>
        <div className="animate-pulse">_</div>
      </div>
    </div>
  );
};