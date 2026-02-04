// MainLayout Template - Migrated to Atomic Design (T-C5.22)
// Uses: Button, Card, Input atoms
// Last Updated: 2026-02-03

import { useState } from 'react';
import { useLayoutStore } from '../../stores/layout.store';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { Card, CardTitle } from '../atoms/Card';
import { Icon } from '../atoms/Icon';
import './MainLayout.css';

interface MainLayoutProps {
  children?: React.ReactNode;
}

interface SidebarItemProps {
  icon?: string;
  label: string;
  active?: boolean;
  dot?: 'success' | 'danger';
  onClick?: () => void;
}

interface IndicatorCardProps {
  label: string;
  value: string;
  trend?: 'up' | 'down';
}

// Sidebar Item Component
const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, dot, onClick }) => {
  return (
    <div
      className={['sidebar--item', active ? 'sidebar--item-active' : ''].join(' ')}
      onClick={onClick}
    >
      {icon && <span className="sidebar--item-icon">{icon}</span>}
      {dot && <span className={`sidebar-item-dot sidebar-item-dot-${dot}`}></span>}
      <span className="sidebar--item-label">{label}</span>
    </div>
  );
};

// Indicator Card Component
const IndicatorCard: React.FC<IndicatorCardProps> = ({ label, value, trend }) => {
  const trendColor = trend === 'up' ? '#4caf50' : trend === 'down' ? '#f44336' : undefined;

  return (
    <Card padding="sm" elevation="none" className="indicator--card">
      <span className="indicator--label">{label}</span>
      <div className="indicator--value">
        {value}
        {trend && (
          <span className="indicator--trend" style={{ color: trendColor }}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </Card>
  );
};

// Main Layout Template
const MainLayoutTemplate: React.FC<MainLayoutProps> = ({ children }) => {
  const { activePanelId, setActivePanel } = useLayoutStore();
  const [searchText, setSearchText] = useState('');

  const navItems = ['market', 'indicators', 'reports', 'settings'];

  return (
    <div className="main--layout">
      {/* Header */}
      <header className="main--header">
        <div className="main--header-brand">
          <span className="brand-icon">🦞</span>
          <span className="brand-text">MY-DOGE-MICRO</span>
        </div>

        <nav className="main--header-nav">
          {navItems.map((item) => (
            <button
              key={item}
              className={['nav-item', activePanelId === item ? 'nav-item-active' : ''].join(' ')}
              onClick={() => setActivePanel(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>

        <div className="main--header-actions">
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索股票 (Ctrl+K)"
            size="sm"
            leftIcon={<Icon name="search" size="xs" />}
          />
          <div className="header--badges">
            <Badge variant="success" size="sm">
              DS
            </Badge>
            <Badge variant="info" size="sm">
              YF
            </Badge>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <div className="main--content">
        {/* Left Sidebar */}
        <aside className="main--sidebar">
          <div className="sidebar--section">
            <h3 className="sidebar--title">导航</h3>
            <div className="sidebar--list">
              <SidebarItem icon="📊" label="市场扫描" active />
              <SidebarItem icon="⭐" label="自选股" />
              <SidebarItem icon="📈" label="深度分析" />
              <SidebarItem icon="📁" label="历史记录" />
            </div>
          </div>

          <div className="sidebar--section">
            <h3 className="sidebar--title">数据源</h3>
            <div className="sidebar--list">
              <SidebarItem dot="success" label="A股 (3,842)" />
              <SidebarItem dot="success" label="美股 (1,256)" />
            </div>
          </div>

          <div className="sidebar--footer">
            <Button variant="primary" size="md" fullWidth>
              🚀 开始扫描
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main--area">{children}</main>

        {/* Right Panel */}
        <aside className="main--right-panel">
          <Card elevation="low" padding="md">
            <CardTitle>600000 浦发银行</CardTitle>
            <p className="panel--subtitle">上海证券交易所 · 银行</p>

            {/* Chart Placeholder */}
            <div className="chart--placeholder">
              <Icon name="chart" size="xl" />
              <span>K线图表区域</span>
            </div>

            {/* Indicators Grid */}
            <div className="indicators-grid">
              <IndicatorCard label="RSRS 强度" value="0.85" trend="up" />
              <IndicatorCard label="波动率偏度" value="1.2" />
              <IndicatorCard label="中期趋势" value="0.72" trend="up" />
              <IndicatorCard label="市场热度" value="72" />
            </div>

            <Button variant="secondary" size="md" fullWidth>
              📊 生成AI策略报告
            </Button>
          </Card>
        </aside>
      </div>

      {/* Footer */}
      <footer className="main--footer">
        <div className="footer--status">
          <span className="status--item">
            <span className="status--dot status-dot-success"></span>
            DeepSeek: 23ms
          </span>
          <span className="status--item">
            <span className="status--dot status-dot-success"></span>
            TDX: Connected
          </span>
        </div>

        <div className="footer--info">
          <span>内存: 256MB</span>
          <span>CPU: 12%</span>
          <span className="footer--shortcut">
            <kbd>Ctrl+K</kbd> 搜索
          </span>
        </div>
      </footer>
    </div>
  );
};

export default MainLayoutTemplate;
