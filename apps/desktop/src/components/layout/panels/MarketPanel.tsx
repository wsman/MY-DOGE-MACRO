import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { Play, RefreshCw, Settings } from 'lucide-react';
import { useMarketScanner, StockData } from '../../../hooks/useMarketScanner';
import { MarketTable } from './MarketTable';

export const MarketPanel: React.FC<IDockviewPanelProps> = () => {
  const { stocks, isLoading, startScan, isScanning, refetch } = useMarketScanner();

  // 计算涨跌分布 (简单统计，展示数学美感)
  const stats = React.useMemo(() => {
    const up = stocks.filter((s: StockData) => s.change > 0).length;
    const down = stocks.filter((s: StockData) => s.change < 0).length;
    return { up, down, total: stocks.length };
  }, [stocks]);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-[#252526]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold tracking-wide text-gray-400">SCANNER</span>
          {/* 实时统计 Badge */}
          <div className="flex gap-1 text-[10px] font-mono">
            <span className="text-red-400">↑{stats.up}</span>
            <span className="text-gray-600">/</span>
            <span className="text-green-400">↓{stats.down}</span>
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => startScan({ mode: 'CN', path: 'C:/new_tdx' })}
            disabled={isScanning}
            className={`p-1.5 rounded transition-colors ${isScanning ? 'text-gray-600' : 'text-green-400 hover:bg-gray-700'}`}
            title="Start Full Scan"
          >
            <Play size={14} className={isScanning ? 'animate-pulse' : ''} />
          </button>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* 核心表格区 */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading && stocks.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Loading market data...
          </div>
        ) : (
          <MarketTable data={stocks} />
        )}
      </div>
    </div>
  );
};
