// DataCardOptimized - 性能优化版数据卡片
// 依据: DS-065前端性能优化技术标准 §3.3 React.memo优化规范
// 创建: 2026-02-07 (P1阶段优化)

import React, { memo } from 'react';
import { Card } from '../../atoms/Card';
import './DataCard.css';

export interface DataCardProps {
  /** 标题 */
  title: string;
  /** 值 (字符串或数字) */
  value: string | number;
  /** 趋势方向 */
  trend?: 'up' | 'down' | 'neutral';
  /** 趋势值 */
  trendValue?: string;
  /** 趋势标签 */
  trendLabel?: string;
  /** 图标 */
  icon?: React.ReactNode;
  /** 副标题 */
  subtitle?: string;
  /** 点击处理函数 */
  onClick?: () => void;
  /** 高亮显示 */
  highlighted?: boolean;
}

const trendIcons = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const trendColors = {
  up: '#4caf50',
  down: '#f44336',
  neutral: '#9e9e9e',
};

// 依据DS-065 §3.3.1: DataCard属于价格显示组件，必须使用memo优化
export const DataCardOptimized: React.FC<DataCardProps> = memo(({
  title,
  value,
  trend = 'neutral',
  trendValue,
  trendLabel,
  icon,
  subtitle,
  onClick,
  highlighted = false,
}) => {
  return (
    <Card onClick={onClick} hoverable={!!onClick} elevation={highlighted ? 'medium' : 'low'}>
      <div className={['data--card', highlighted ? 'data--card-highlighted' : ''].join(' ')}>
        <div className="data--card-header">
          <span className="data--card-title">{title}</span>
          {icon && <span className="data--card-icon">{icon}</span>}
        </div>

        <div className="data--card-value">{value}</div>

        {(trendValue || subtitle) && (
          <div className="data--card-footer">
            {trendValue && (
              <span className="data--card-trend" style={{ color: trendColors[trend] }}>
                {trendIcons[trend]} {trendValue}
              </span>
            )}
            {trendLabel && <span className="data--card-trend-label">{trendLabel}</span>}
            {subtitle && <span className="data--card-subtitle">{subtitle}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}, (prev, next) => {
  // 依据DS-065 §3.3.1: 简单比较，仅比较关键字段
  return (
    prev.title === next.title &&
    prev.value === next.value &&
    prev.trend === next.trend &&
    prev.trendValue === next.trendValue &&
    prev.highlighted === next.highlighted
  );
});

DataCardOptimized.displayName = 'DataCardOptimized';

// 优化版DataCardGrid组件
export interface DataCardGridOptimizedProps {
  items: Array<Omit<DataCardProps, 'children'>>;
  columns?: 2 | 3 | 4;
}

export const DataCardGridOptimized: React.FC<DataCardGridOptimizedProps> = memo(({
  items,
  columns = 4,
}) => {
  return (
    <div className={`data-card-grid data-card-grid-${columns}`}>
      {items.map((item, index) => (
        <DataCardOptimized key={`${item.title}-${index}`} {...item} />
      ))}
    </div>
  );
}, (prev, next) => {
  // 依据DS-065 §3.3.1: 中等复杂度比较，比较items数组
  if (prev.items.length !== next.items.length) {
    return false;
  }
  
  // 比较每个item的关键字段
  for (let i = 0; i < prev.items.length; i++) {
    const prevItem = prev.items[i];
    const nextItem = next.items[i];
    
    if (
      prevItem.title !== nextItem.title ||
      prevItem.value !== nextItem.value ||
      prevItem.trend !== nextItem.trend
    ) {
      return false;
    }
  }
  
  return prev.columns === next.columns;
});

DataCardGridOptimized.displayName = 'DataCardGridOptimized';

// 性能监控装饰器
export const withDataCardPerformanceMonitor = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return memo((props: P) => {
    const renderCount = React.useRef(0);
    const startTime = React.useRef(performance.now());
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      renderCount.current++;
      
      console.log(`[Perf] ${componentName} 渲染 #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
      
      // 依据DS-065 §4.1.1: 性能监控上报
      if (renderTime > 50) {
        console.warn(`[Perf Warning] ${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`);
      }
      
      // 重置时间
      startTime.current = performance.now();
    });
    
    return <Component {...props} />;
  });
};

// 默认导出增强版组件
export default withDataCardPerformanceMonitor(DataCardOptimized, 'DataCardOptimized');