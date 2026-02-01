/**
 * Main Layout - CSS Grid Based
 * Based on Frontend-Layout.html design specification
 * T-C4.2: Global Layout Refactor
 */

import React, { useState } from 'react';
import { useLayoutStore } from '../../stores/layout.store';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { activePanel, setActivePanel } = useLayoutStore();
  const [searchText, setSearchText] = useState('');

  return (
    <div className="h-screen w-screen grid grid-rows-layout grid-cols-layout bg-app-primary text-text-primary overflow-hidden">
      
      {/* --- Header (Row 1, Span All Cols) --- */}
      <header className="col-span-3 bg-app-secondary border-b border-app-border flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-2 text-accent font-bold text-base">
          <span>🦞</span> MY-DOGE-MICRO
        </div>
        
        <nav className="flex gap-2">
          {['market', 'indicators', 'reports', 'settings'].map((item) => (
            <button
              key={item}
              onClick={() => setActivePanel(item as any)}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                activePanel === item 
                  ? 'bg-app-tertiary text-text-primary text-accent' 
                  : 'text-text-secondary hover:bg-app-tertiary hover:text-text-primary'
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <input 
            type="text" 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="bg-app-tertiary border border-app-border rounded-lg px-3 py-1.5 w-48 text-xs text-text-primary focus:outline-none focus:border-accent transition-colors"
            placeholder="🔍 搜索股票 (Ctrl+K)"
          />
          <div className="flex gap-2 text-[11px] text-text-secondary">
             <span className="flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-app-success"></span> DS
             </span>
             <span className="flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-app-success"></span> YF
             </span>
          </div>
        </div>
      </header>

      {/* --- Left Sidebar (Row 2, Col 1) --- */}
      <aside className="bg-app-secondary border-r border-app-border p-3 overflow-y-auto flex flex-col gap-4">
        <div>
          <h3 className="text-[11px] text-text-secondary uppercase mb-2 px-2">导航</h3>
          <div className="flex flex-col gap-1">
            <SidebarItem icon="📊" label="市场扫描" active={true} />
            <SidebarItem icon="⭐" label="自选股" />
            <SidebarItem icon="📈" label="深度分析" />
            <SidebarItem icon="📁" label="历史记录" />
          </div>
        </div>

        <div>
          <h3 className="text-[11px] text-text-secondary uppercase mb-2 px-2">数据源</h3>
          <div className="flex flex-col gap-1">
            <SidebarItem dot="success" label="A股 (3,842)" />
            <SidebarItem dot="success" label="美股 (1,256)" />
          </div>
        </div>

        <div className="mt-auto">
           <button className="w-full py-2 bg-accent text-app-primary font-semibold rounded-lg text-xs hover:opacity-90">
             🚀 开始扫描
           </button>
        </div>
      </aside>

      {/* --- Main Content (Row 2, Col 2) --- */}
      <main className="bg-app-primary overflow-y-auto relative">
        {children}
      </main>

      {/* --- Right Detail Panel (Row 2, Col 3) --- */}
      <aside className="bg-app-secondary border-l border-app-border p-4 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-base font-bold text-text-primary">600000 浦发银行</h2>
          <p className="text-xs text-text-secondary">上海证券交易所 · 银行</p>
        </div>
        
        {/* Placeholder for Chart */}
        <div className="bg-app-tertiary rounded-lg h-48 flex items-center justify-center text-text-secondary text-xs mb-4 border border-app-border">
          📈 K线图表区域 (Placeholder)
        </div>

        {/* Indicators Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <IndicatorCard label="RSRS 强度" value="0.85" trend="up" />
          <IndicatorCard label="波动率偏度" value="1.2" />
          <IndicatorCard label="中期趋势" value="0.72" trend="up" />
          <IndicatorCard label="市场热度" value="72" />
        </div>

        <button className="w-full py-2 bg-app-tertiary border border-app-border rounded-lg text-xs text-text-primary hover:bg-app-border transition-colors mb-2">
          📊 生成AI策略报告
        </button>
      </aside>

      {/* --- Status Bar (Row 3, Span All Cols) --- */}
      <footer className="col-span-3 bg-app-secondary border-t border-app-border flex items-center justify-between px-3 text-[11px] text-text-secondary select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-app-success"></span>
            DeepSeek: 23ms
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-app-success"></span>
            TDX: Connected
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span>内存: 256MB</span>
          <span>CPU: 12%</span>
          <span className="flex items-center gap-2">
            <span className="bg-app-tertiary border border-app-border px-1.5 rounded">Ctrl+K</span> 搜索
          </span>
        </div>
      </footer>

    </div>
  );
};

// Helper Components
const SidebarItem = ({ icon, label, active, dot }: { icon?: string, label: string, active?: boolean, dot?: 'success'|'danger' }) => (
  <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-xs ${
    active ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-app-tertiary hover:text-text-primary'
  }`}>
    {icon && <span>{icon}</span>}
    {dot && <span className={`w-2 h-2 rounded-full ${dot === 'success' ? 'bg-app-success' : 'bg-app-danger'}`}></span>}
    <span>{label}</span>
  </div>
);

const IndicatorCard = ({ label, value, trend }: { label: string, value: string, trend?: 'up'|'down' }) => (
  <div className="bg-app-tertiary p-3 rounded-lg border border-app-border/50">
    <div className="text-[10px] text-text-secondary mb-1">{label}</div>
    <div className="text-base font-bold text-text-primary">{value}</div>
    {trend && (
      <div className={`text-[10px] mt-1 ${trend === 'up' ? 'text-app-success' : 'text-app-danger'}`}>
        {trend === 'up' ? '↑ 上升趋势' : '↓ 下降趋势'}
      </div>
    )}
  </div>
);

export default MainLayout;
