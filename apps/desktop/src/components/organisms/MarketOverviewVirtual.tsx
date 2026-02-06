// MarketOverviewVirtual - 虚拟滚动优化版市场概览
// 依据: DS-065前端性能优化技术标准 §3.1虚拟滚动规范
// 创建: 2026-02-07 (P1阶段优化)

import React, { memo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { StatusDot } from '../atoms/StatusDot';
import './MarketOverview.css';

export interface MarketItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
}

interface MarketOverviewProps {
  markets: MarketItem[];
  title?: string;
  onSelectTicker?: (ticker: string) => void;
  /** 虚拟滚动高度 (px) */
  virtualHeight?: number;
  /** 预加载项目数 */
  overscan?: number;
}

// ============ MarketItem组件 (memo优化) ============
interface MarketItemProps {
  market: MarketItem;
  onSelect?: (ticker: string) => void;
}

export const MarketItem: React.FC<MarketItemProps> = memo(({ market, onSelect }) => {
  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const handleClick = () => {
    onSelect?.(market.ticker);
  };

  // 映射StatusDot状态
  const getStatusDotStatus = () => {
    if (market.changePercent > 0) return 'connected' as const;
    if (market.changePercent < 0) return 'error' as const;
    return 'warning' as const; // idle -> warning
  };

  return (
    <div className="market-overview__item" onClick={handleClick}>
      <div className="market-overview__item-header">
        <span className="market-overview__ticker">{market.ticker}</span>
        <StatusDot 
          status={getStatusDotStatus()}
          size="sm"
        />
      </div>
      <div className="market-overview__item-name">{market.name}</div>
      <div className="market-overview__item-price">
        ${formatNumber(market.price)}
      </div>
      <div className={`market-overview__item-change ${market.changePercent >= 0 ? 'positive' : 'negative'}`}>
        {market.changePercent >= 0 ? '+' : ''}{market.changePercent.toFixed(2)}%
      </div>
      <div className="market-overview__item-volume">
        Vol: {formatNumber(market.volume, 0)}
      </div>
    </div>
  );
}, (prev, next) => {
  // 依据DS-065 §3.3.1: 简单比较，仅比较关键字段
  return (
    prev.market.price === next.market.price &&
    prev.market.changePercent === next.market.changePercent &&
    prev.market.volume === next.market.volume
  );
});

MarketItem.displayName = 'MarketItem';

// ============ 虚拟滚动容器组件 ============
interface MarketGridContainerProps {
  children?: React.ReactNode;
}

const MarketGridContainer: React.FC<MarketGridContainerProps> = ({ children }) => {
  return (
    <div className="market-overview__grid" style={{ display: 'grid' }}>
      {children}
    </div>
  );
};

interface MarketItemWrapperProps {
  children?: React.ReactNode;
}

const MarketItemWrapper: React.FC<MarketItemWrapperProps> = ({ children }) => {
  return <div style={{ padding: '4px' }}>{children}</div>;
};

// ============ 主组件: MarketOverviewVirtual ============
export const MarketOverviewVirtual: React.FC<MarketOverviewProps> = ({
  markets,
  title = '市场概览 (虚拟滚动)',
  onSelectTicker,
  virtualHeight = 600,
  overscan = 20,
}) => {
  const summary = React.useMemo(() => {
    const risers = markets.filter(m => m.changePercent > 0).length;
    const fallers = markets.filter(m => m.changePercent < 0).length;
    const unchanged = markets.length - risers - fallers;
    const avgChange = markets.reduce((sum, m) => sum + m.changePercent, 0) / (markets.length || 1);
    
    return { risers, fallers, unchanged, avgChange };
  }, [markets]);

  // 依据DS-065 §3.1.2: 虚拟滚动标准实现
  return (
    <Card className="market-overview">
      <CardTitle className="market-overview__title">
        <span>{title}</span>
        <div className="market-overview__summary">
          <Badge variant="success" size="sm">↑ {summary.risers}</Badge>
          <Badge variant="danger" size="sm">↓ {summary.fallers}</Badge>
          <Badge variant="secondary" size="sm">— {summary.unchanged}</Badge>
          <Badge variant="info" size="sm">
            🚀 虚拟滚动
          </Badge>
        </div>
      </CardTitle>
      
      <CardContent className="market-overview__content" padding="none">
        <VirtuosoGrid
          totalCount={markets.length}
          itemContent={(index) => (
            <MarketItem 
              market={markets[index]} 
              onSelect={onSelectTicker}
            />
          )}
          overscan={overscan}
          components={{
            List: MarketGridContainer,
            Item: MarketItemWrapper,
          }}
          computeItemKey={(index) => markets[index].ticker}
          style={{ 
            height: `${virtualHeight}px`,
            width: '100%',
          }}
          // 响应式网格配置
          listClassName="market-overview__grid"
          itemClassName="market-overview__item-wrapper"
        />
      </CardContent>
    </Card>
  );
};

// 性能监控装饰器
export const withPerformanceMonitor = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return memo((props: P) => {
    const startTime = React.useRef(performance.now());
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      console.log(`[Perf] ${componentName} render: ${renderTime.toFixed(2)}ms`);
      
      // 依据DS-065 §4.1.1: 性能监控上报
      if (renderTime > 100) {
        console.warn(`[Perf Warning] ${componentName} render time >100ms: ${renderTime.toFixed(2)}ms`);
      }
    }, []);
    
    return <Component {...props} />;
  });
};

// 默认导出增强版组件
export default withPerformanceMonitor(MarketOverviewVirtual, 'MarketOverviewVirtual');