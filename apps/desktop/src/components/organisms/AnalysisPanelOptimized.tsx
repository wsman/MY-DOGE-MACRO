// AnalysisPanelOptimized - 性能优化版资产分析面板
// 依据: DS-065前端性能优化技术标准 §3.3 React.memo优化规范
// 创建: 2026-02-07 (P1阶段优化)

import React, { useState, memo, useCallback } from 'react';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { ChartPanel, OHLCData } from '../charts';
import { EnhancedPriceDisplay } from '../atoms/PriceDisplay/EnhancedPriceDisplay';
import './AnalysisPanel.css';

interface AnalysisPanelProps {
  ticker: string;
  name?: string;
  data: OHLCData[];
  rsrsValue?: number;
  rsrsSignal?: 'long' | 'short' | 'neutral';
  volatilityValue?: number;
  volatilitySignal?: 'low' | 'medium' | 'high';
  onRefresh?: () => void;
  isLoading?: boolean;
}

// 依据DS-065 §3.3.1: AnalysisPanel属于复杂容器组件，需要使用memo优化
export const AnalysisPanelOptimized: React.FC<AnalysisPanelProps> = memo(({
  ticker,
  name,
  data,
  rsrsValue,
  rsrsSignal = 'neutral',
  volatilityValue,
  volatilitySignal = 'medium',
  onRefresh,
  isLoading = false,
}) => {
  const [showMACD, setShowMACD] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showKDJ, setShowKDJ] = useState(false);

  // 使用useCallback优化事件处理函数
  const handleToggleMACD = useCallback(() => {
    setShowMACD(prev => !prev);
  }, []);

  const handleToggleRSI = useCallback(() => {
    setShowRSI(prev => !prev);
  }, []);

  const handleToggleKDJ = useCallback(() => {
    setShowKDJ(prev => !prev);
  }, []);

  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const getSignalVariant = useCallback((signal: string) => {
    if (signal === 'long' || signal === 'low') return 'success' as const;
    if (signal === 'short' || signal === 'high') return 'danger' as const;
    return 'warning' as const;
  }, []);

  // 使用useMemo计算派生数据
  const { latestPrice, previousPrice, priceChange, priceChangePercent } = React.useMemo(() => {
    const latestPrice = data.length > 0 ? data[data.length - 1].close : 0;
    const previousPrice = data.length > 1 ? data[data.length - 2].close : latestPrice;
    const priceChange = latestPrice - previousPrice;
    const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;
    
    return { latestPrice, previousPrice, priceChange, priceChangePercent };
  }, [data]);

  return (
    <Card className="analysis-panel">
      <CardTitle className="analysis-panel__header">
        <div className="analysis-panel__title-group">
          <span className="analysis-panel__ticker">{ticker}</span>
          {name && <span className="analysis-panel__name">{name}</span>}
        </div>
        <div className="analysis-panel__actions">
          <Button
            variant={showMACD ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggleMACD}
          >
            MACD
          </Button>
          <Button
            variant={showRSI ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggleRSI}
          >
            RSI
          </Button>
          <Button
            variant={showKDJ ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleToggleKDJ}
          >
            KDJ
          </Button>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新'}
            </Button>
          )}
        </div>
      </CardTitle>

      <CardContent className="analysis-panel__content">
        {/* Price Summary */}
        <div className="analysis-panel__summary">
          <div className="analysis-panel__price">
            <EnhancedPriceDisplay
              value={latestPrice}
              previousValue={previousPrice}
              currency="$"
              decimals={2}
              showChange={true}
              showFlash={true}
              enableNumberScroll={true}
              scrollDuration={500}
            />
          </div>

          <div className="analysis-panel__indicators">
            {rsrsValue !== undefined && (
              <div className="analysis-panel__indicator">
                <span className="analysis-panel__indicator-label">RSRS</span>
                <span className="analysis-panel__indicator-value">{rsrsValue.toFixed(4)}</span>
                <Badge variant={getSignalVariant(rsrsSignal)} size="sm">
                  {rsrsSignal.toUpperCase()}
                </Badge>
              </div>
            )}
            {volatilityValue !== undefined && (
              <div className="analysis-panel__indicator">
                <span className="analysis-panel__indicator-label">波动率</span>
                <span className="analysis-panel__indicator-value">{(volatilityValue * 100).toFixed(2)}%</span>
                <Badge variant={getSignalVariant(volatilitySignal)} size="sm">
                  {volatilitySignal.toUpperCase()}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        {data.length > 0 ? (
          <ChartPanel
            ticker={ticker}
            data={data}
            showVolume={true}
            showMACD={showMACD}
            showRSI={showRSI}
            showKDJ={showKDJ}
            height={500}
          />
        ) : (
          <div className="analysis-panel__empty">
            暂无数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}, (prev, next) => {
  // 依据DS-065 §3.3.1: 深度比较，仅比较关键字段
  
  // 1. 比较基本props
  if (
    prev.ticker !== next.ticker ||
    prev.name !== next.name ||
    prev.isLoading !== next.isLoading
  ) {
    return false;
  }
  
  // 2. 比较数据长度（深度比较太昂贵，检查长度和最新价格）
  if (prev.data.length !== next.data.length) {
    return false;
  }
  
  // 只比较最新数据点（假设数据是时间序列，最新点最重要）
  if (prev.data.length > 0 && next.data.length > 0) {
    const prevLatest = prev.data[prev.data.length - 1];
    const nextLatest = next.data[next.data.length - 1];
    
    if (
      prevLatest.close !== nextLatest.close ||
      prevLatest.open !== nextLatest.open ||
      prevLatest.high !== nextLatest.high ||
      prevLatest.low !== nextLatest.low
    ) {
      return false;
    }
  }
  
  // 3. 比较指标数据
  if (
    prev.rsrsValue !== next.rsrsValue ||
    prev.rsrsSignal !== next.rsrsSignal ||
    prev.volatilityValue !== next.volatilityValue ||
    prev.volatilitySignal !== next.volatilitySignal
  ) {
    return false;
  }
  
  return true;
});

AnalysisPanelOptimized.displayName = 'AnalysisPanelOptimized';

// 性能监控装饰器
export const withAnalysisPanelPerformanceMonitor = <P extends object>(
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
      if (renderTime > 100) {
        console.warn(`[Perf Warning] ${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`);
      }
      
      // 重置时间
      startTime.current = performance.now();
    });
    
    return <Component {...props} />;
  });
};

// 默认导出增强版组件
export default withAnalysisPanelPerformanceMonitor(AnalysisPanelOptimized, 'AnalysisPanelOptimized');
