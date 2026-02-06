// CorrelationHeatmap - 相关性热力图组件 (T-05b)
// Created: 2026-02-06
// 功能：展示资产间相关性矩阵的热力图

import React, { useRef, useEffect, useState, memo } from 'react';
import { useUIStore } from '../../stores/ui.store';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { LoadingStatus } from '../atoms/StatusDot/StatusDot';
import { correlationApi } from '../../services/api';
import './CorrelationHeatmap.css';

// 热力图数据项接口
export interface HeatmapDataItem {
  x: string;  // 资产1代码
  y: string;  // 资产2代码
  value: number;  // 相关性值 (-1 到 1)
  color?: string; // 颜色值
  p_value?: number; // 显著性p值
  spearman?: number; // Spearman相关系数
  samples?: number; // 样本数量
}

// 相关性矩阵接口
export interface CorrelationMatrix {
  tickers: string[];
  matrix: number[][]; // n x n 相关性矩阵
  heatmap?: HeatmapDataItem[];
  period_days?: number;
  calculated_at?: string;
}

// 市场状态分析接口
export interface MarketRegime {
  regime: string;
  description: string;
  avg_correlation: number;
  regime_score: number;
  assessment: {
    risk: string;
    diversification: string;
    recommendation: string;
    color: string;
  };
  timestamp: string;
}

// 热力图组件Props
export interface CorrelationHeatmapProps {
  /** 标题 */
  title?: string;
  /** 初始资产列表 */
  tickers?: string[];
  /** 计算周期（天） */
  period?: number;
  /** 自定义数据（如果有则不调用API） */
  data?: CorrelationMatrix;
  /** 是否显示市场状态分析 */
  showMarketRegime?: boolean;
  /** 是否显示控制面板 */
  showControls?: boolean;
  /** 是否自动刷新 */
  autoRefresh?: boolean;
  /** 刷新间隔（秒） */
  refreshInterval?: number;
  /** 点击单元格回调 */
  onCellClick?: (item: HeatmapDataItem) => void;
}

// ============ 纯Canvas热力图组件 ============
interface HeatmapCanvasProps {
  matrix: number[][];
  tickers: string[];
  width: number;
  height: number;
  isDark: boolean;
  onCellClick?: (x: number, y: number, value: number, tickerX: string, tickerY: string) => void;
  hoveredCell?: { x: number; y: number } | null;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
}

const HeatmapCanvas: React.FC<HeatmapCanvasProps> = memo(
  ({ matrix, tickers, width, height, isDark, onCellClick, hoveredCell, setHoveredCell }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !matrix.length || !tickers.length) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      // 清除画布
      ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const n = matrix.length;
      if (n === 0) return;

      // 计算单元格尺寸
      const cellSize = Math.min(
        (width - 100) / (n + 1), // 留出标签空间
        (height - 60) / (n + 1)  // 留出标签空间
      );
      
      const totalWidth = cellSize * (n + 1);
      const totalHeight = cellSize * (n + 1);
      const offsetX = (width - totalWidth) / 2;
      const offsetY = (height - totalHeight) / 2;

      // 绘制资产标签（Y轴）
      ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      tickers.forEach((ticker, i) => {
        const y = offsetY + cellSize * (i + 1.5);
        ctx.fillText(ticker, offsetX - 5, y);
      });

      // 绘制资产标签（X轴）
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      tickers.forEach((ticker, i) => {
        const x = offsetX + cellSize * (i + 1.5);
        ctx.save();
        ctx.translate(x, offsetY + cellSize * (n + 1) + 5);
        ctx.rotate(-Math.PI / 4); // 旋转45度
        ctx.fillText(ticker, 0, 0);
        ctx.restore();
      });

      // 绘制热力图单元格
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const value = matrix[i][j];
          
          // 对角线（值为1）特殊处理
          const isDiagonal = i === j;
          
          // 计算单元格位置
          const x = offsetX + cellSize * (j + 1);
          const y = offsetY + cellSize * (i + 1);
          
          // 计算颜色
          let color: string;
          if (isDiagonal) {
            color = isDark ? '#444' : '#eee';
          } else if (value >= 0.7) {
            color = isDark ? '#ef4444' : '#dc2626'; // 强正相关
          } else if (value >= 0.3) {
            color = isDark ? '#f97316' : '#ea580c'; // 中等正相关
          } else if (value >= 0) {
            color = isDark ? '#fbbf24' : '#d97706'; // 弱正相关
          } else if (value >= -0.3) {
            color = isDark ? '#22c55e' : '#16a34a'; // 弱负相关
          } else if (value >= -0.7) {
            color = isDark ? '#3b82f6' : '#2563eb'; // 中等负相关
          } else {
            color = isDark ? '#8b5cf6' : '#7c3aed'; // 强负相关
          }

          // 绘制单元格
          ctx.fillStyle = color;
          ctx.fillRect(x, y, cellSize, cellSize);

          // 绘制边框
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
          ctx.strokeRect(x, y, cellSize, cellSize);

          // 绘制单元格数值
          if (!isDiagonal && cellSize > 20) {
            ctx.fillStyle = isDark ? '#fff' : '#000';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = value.toFixed(2);
            ctx.fillText(text, x + cellSize / 2, y + cellSize / 2);
          }

          // 高亮悬停的单元格
          if (hoveredCell && hoveredCell.x === j && hoveredCell.y === i) {
            ctx.strokeStyle = '#ff0';
            ctx.lineWidth = 2;
            ctx.strokeRect(x - 1, y - 1, cellSize + 2, cellSize + 2);
          }
        }
      }

      // 绘制图例
      const legendWidth = 200;
      const legendHeight = 20;
      const legendX = offsetX;
      const legendY = offsetY + cellSize * (n + 1) + 30;

      // 绘制渐变图例
      const gradient = ctx.createLinearGradient(legendX, legendY, legendX + legendWidth, legendY);
      gradient.addColorStop(0, isDark ? '#8b5cf6' : '#7c3aed'); // 强负相关
      gradient.addColorStop(0.25, isDark ? '#3b82f6' : '#2563eb'); // 中等负相关
      gradient.addColorStop(0.5, isDark ? '#22c55e' : '#16a34a'); // 弱负相关
      gradient.addColorStop(0.5, isDark ? '#fbbf24' : '#d97706'); // 弱正相关
      gradient.addColorStop(0.75, isDark ? '#f97316' : '#ea580c'); // 中等正相关
      gradient.addColorStop(1, isDark ? '#ef4444' : '#dc2626'); // 强正相关

      ctx.fillStyle = gradient;
      ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

      // 绘制图例边框
      ctx.strokeStyle = isDark ? '#666' : '#ccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

      // 绘制图例标签
      ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('-1.0', legendX, legendY + legendHeight + 5);
      ctx.fillText('0', legendX + legendWidth / 2, legendY + legendHeight + 5);
      ctx.fillText('1.0', legendX + legendWidth, legendY + legendHeight + 5);

    }, [matrix, tickers, width, height, isDark, hoveredCell]);

    // 处理鼠标事件
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !matrix.length) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 计算单元格尺寸
      const n = matrix.length;
      const cellSize = Math.min(
        (width - 100) / (n + 1),
        (height - 60) / (n + 1)
      );
      const totalWidth = cellSize * (n + 1);
      const totalHeight = cellSize * (n + 1);
      const offsetX = (width - totalWidth) / 2;
      const offsetY = (height - totalHeight) / 2;

      // 计算鼠标所在的单元格
      const cellX = Math.floor((x - offsetX) / cellSize) - 1;
      const cellY = Math.floor((y - offsetY) / cellSize) - 1;

      if (
        cellX >= 0 && cellX < n &&
        cellY >= 0 && cellY < n &&
        (cellX !== cellY) // 不对角线
      ) {
        setHoveredCell({ x: cellX, y: cellY });
      } else {
        setHoveredCell(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredCell(null);
    };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!hoveredCell || !onCellClick) return;

      const { x, y } = hoveredCell;
      const value = matrix[y][x];
      const tickerX = tickers[x];
      const tickerY = tickers[y];

      onCellClick(x, y, value, tickerX, tickerY);
    };

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="correlation-heatmap-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    );
  },
  (prev, next) => {
    return (
      prev.matrix === next.matrix &&
      prev.tickers === next.tickers &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.isDark === next.isDark &&
      prev.hoveredCell?.x === next.hoveredCell?.x &&
      prev.hoveredCell?.y === next.hoveredCell?.y
    );
  }
);

// ============ 主组件 ============
export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({
  title = '资产相关性热力图',
  tickers: initialTickers = ['QQQ', 'GLD', 'BTC-USD', '000300.SS'],
  period = 30,
  data: initialData,
  showMarketRegime = true,
  showControls = true,
  autoRefresh = false,
  refreshInterval = 60,
  onCellClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
  const { theme } = useUIStore();
  const isDark = theme === 'dark';

  // 状态管理
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CorrelationMatrix | null>(initialData || null);
  const [marketRegime, setMarketRegime] = useState<MarketRegime | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState(period);
  const [currentTickers, setCurrentTickers] = useState(initialTickers);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // 响应式调整
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || 600,
          height: 500, // 固定高度
        });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // 加载数据
  const loadData = async () => {
    if (initialData) {
      setData(initialData);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 获取相关性数据
      const correlationResult = await correlationApi.getCorrelationMatrix(currentPeriod, currentTickers);
      
      if (correlationResult?.correlation) {
        setData(correlationResult.correlation);
        
        // 获取市场状态分析
        if (showMarketRegime && correlationResult.regime_analysis) {
          setMarketRegime(correlationResult.regime_analysis);
        }
        
        setLastUpdated(new Date().toISOString());
      } else {
        throw new Error('无法获取相关性数据');
      }
    } catch (err: any) {
      console.error('加载相关性数据失败:', err);
      setError(err.message || '加载相关性数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和刷新
  useEffect(() => {
    loadData();
  }, [currentPeriod, JSON.stringify(currentTickers)]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, currentPeriod, JSON.stringify(currentTickers)]);

  // 处理单元格点击
  const handleCellClick = (x: number, y: number, value: number, tickerX: string, tickerY: string) => {
    if (onCellClick) {
      onCellClick({
        x: tickerX,
        y: tickerY,
        value,
        p_value: data?.matrix?.[y]?.[x],
      });
    }
  };

  // 获取相关性强度统计
  const getCorrelationStats = () => {
    if (!data?.matrix) return null;

    const matrix = data.matrix;
    const n = matrix.length;
    let strongPos = 0, strongNeg = 0, moderatePos = 0, moderateNeg = 0, weak = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const value = matrix[i][j];
          if (value >= 0.7) strongPos++;
          else if (value <= -0.7) strongNeg++;
          else if (value >= 0.3) moderatePos++;
          else if (value <= -0.3) moderateNeg++;
          else weak++;
        }
      }
    }

    const totalPairs = n * n - n; // 排除对角线
    return {
      strongPos, strongNeg, moderatePos, moderateNeg, weak, totalPairs,
      avgCorrelation: data.matrix.flat().filter((_, idx) => idx % (n + 1) !== 0).reduce((a, b) => a + b, 0) / totalPairs,
    };
  };

  const stats = getCorrelationStats();

  // 渲染市场状态分析
  const renderMarketRegime = () => {
    if (!marketRegime) return null;

    const { regime, description, avg_correlation, regime_score, assessment } = marketRegime;

    return (
      <div className="correlation-heatmap-regime">
        <h4 className="correlation-heatmap-regime-title">市场状态分析</h4>
        <div className="correlation-heatmap-regime-content">
          <div className="correlation-heatmap-regime-row">
            <span className="correlation-heatmap-regime-label">状态:</span>
            <Badge variant={assessment.color as any}>{regime}</Badge>
          </div>
          <div className="correlation-heatmap-regime-row">
            <span className="correlation-heatmap-regime-label">描述:</span>
            <span className="correlation-heatmap-regime-value">{description}</span>
          </div>
          <div className="correlation-heatmap-regime-row">
            <span className="correlation-heatmap-regime-label">平均相关性:</span>
            <span className="correlation-heatmap-regime-value">{avg_correlation.toFixed(3)}</span>
          </div>
          <div className="correlation-heatmap-regime-row">
            <span className="correlation-heatmap-regime-label">风险评估:</span>
            <Badge variant={assessment.risk === 'high' ? 'danger' : assessment.risk === 'medium' ? 'warning' : 'success'}>
              {assessment.risk}
            </Badge>
          </div>
          <div className="correlation-heatmap-regime-row">
            <span className="correlation-heatmap-regime-label">建议:</span>
            <span className="correlation-heatmap-regime-value">{assessment.recommendation}</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染相关性统计
  const renderCorrelationStats = () => {
    if (!stats) return null;

    return (
      <div className="correlation-heatmap-stats">
        <h4 className="correlation-heatmap-stats-title">相关性统计</h4>
        <div className="correlation-heatmap-stats-grid">
          <div className="correlation-heatmap-stat">
            <span className="correlation-heatmap-stat-label">强正相关:</span>
            <Badge variant="danger">{stats.strongPos}</Badge>
          </div>
          <div className="correlation-heatmap-stat">
            <span className="correlation-heatmap-stat-label">强负相关:</span>
            <Badge variant="info">{stats.strongNeg}</Badge>
          </div>
          <div className="correlation-heatmap-stat">
            <span className="correlation-heatmap-stat-label">中等正相关:</span>
            <Badge variant="warning">{stats.moderatePos}</Badge>
          </div>
          <div className="correlation-heatmap-stat">
            <span className="correlation-heatmap-stat-label">中等负相关:</span>
            <Badge variant="secondary">{stats.moderateNeg}</Badge>
          </div>
          <div className="correlation-heatmap-stat">
            <span className="correlation-heatmap-stat-label">弱相关:</span>
            <Badge variant="success">{stats.weak}</Badge>
          </div>
          <div className="correlation-heatmap-stat">
            <span className="correlation-heatmap-stat-label">平均相关性:</span>
            <span className="correlation-heatmap-stat-value">{stats.avgCorrelation.toFixed(3)}</span>
          </div>
        </div>
      </div>
    );
  };

  // 渲染悬停信息
  const renderHoverInfo = () => {
    if (!hoveredCell || !data) return null;

    const { x, y } = hoveredCell;
    const tickerX = data.tickers[x];
    const tickerY = data.tickers[y];
    const value = data.matrix[y][x];

    return (
      <div className="correlation-heatmap-hover-info">
        <div className="correlation-heatmap-hover-title">相关性详情</div>
        <div className="correlation-heatmap-hover-row">
          <span className="correlation-heatmap-hover-label">资产对:</span>
          <span className="correlation-heatmap-hover-value">{tickerX} ↔ {tickerY}</span>
        </div>
        <div className="correlation-heatmap-hover-row">
          <span className="correlation-heatmap-hover-label">相关性:</span>
          <span className={`correlation-heatmap-hover-value ${
            value >= 0.7 ? 'correlation-strong-positive' :
            value >= 0.3 ? 'correlation-moderate-positive' :
            value >= 0 ? 'correlation-weak-positive' :
            value >= -0.3 ? 'correlation-weak-negative' :
            value >= -0.7 ? 'correlation-moderate-negative' :
            'correlation-strong-negative'
          }`}>
            {value.toFixed(3)}
          </span>
        </div>
        <div className="correlation-heatmap-hover-row">
          <span className="correlation-heatmap-hover-label">强度:</span>
          <span className="correlation-heatmap-hover-value">
            {Math.abs(value) >= 0.7 ? '强' : Math.abs(value) >= 0.3 ? '中等' : '弱'}
            {value >= 0 ? '正相关' : '负相关'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card elevation="low" padding="none" className="correlation-heatmap-card" ref={containerRef}>
      <CardTitle className="correlation-heatmap-title">
        <span>{title}</span>
        <div className="correlation-heatmap-subtitle">
          <span>周期: {currentPeriod}天</span>
          <span>资产: {currentTickers.length}个</span>
          {lastUpdated && (
            <span className="correlation-heatmap-updated">
              更新: {new Date(lastUpdated).toLocaleTimeString('zh-CN')}
            </span>
          )}
        </div>
      </CardTitle>

      <CardContent className="correlation-heatmap-content">
        {loading ? (
          <div className="correlation-heatmap-loading">
            <LoadingStatus label="正在加载相关性数据..." />
          </div>
        ) : error ? (
          <div className="correlation-heatmap-error">
            <p className="correlation-heatmap-error-message">{error}</p>
            <Button variant="primary" size="sm" onClick={loadData}>
              重试
            </Button>
          </div>
        ) : !data ? (
          <div className="correlation-heatmap-empty">
            <p>暂无相关性数据</p>
            <Button variant="primary" size="sm" onClick={loadData}>
              加载数据
            </Button>
          </div>
        ) : (
          <>
            <div className="correlation-heatmap-main">
              <div className="correlation-heatmap-canvas-container">
                <HeatmapCanvas
                  matrix={data.matrix}
                  tickers={data.tickers}
                  width={dimensions.width}
                  height={dimensions.height}
                  isDark={isDark}
                  onCellClick={handleCellClick}
                  hoveredCell={hoveredCell}
                  setHoveredCell={setHoveredCell}
                />
                {renderHoverInfo()}
              </div>

              <div className="correlation-heatmap-sidebar">
                {showMarketRegime && renderMarketRegime()}
                {renderCorrelationStats()}
                
                {showControls && (
                  <div className="correlation-heatmap-controls">
                    <h4 className="correlation-heatmap-controls-title">控制面板</h4>
                    <div className="correlation-heatmap-controls-group">
                      <label className="correlation-heatmap-controls-label">计算周期:</label>
                      <div className="correlation-heatmap-controls-buttons">
                        {[7, 30, 90, 180].map((days) => (
                          <Button
                            key={days}
                            variant={currentPeriod === days ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setCurrentPeriod(days)}
                          >
                            {days}天
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="correlation-heatmap-controls-group">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadData}
                      >
                        刷新数据
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHoveredCell(null)}
                      >
                        清除高亮
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="correlation-heatmap-footer">
              <div className="correlation-heatmap-footer-info">
                <span className="correlation-heatmap-footer-text">
                  对角线: 资产自身的相关性 (固定为1.0)
                </span>
                <span className="correlation-heatmap-footer-text">
                  点击单元格可查看详细相关性信息
                </span>
                {data.calculated_at && (
                  <span className="correlation-heatmap-footer-text">
                    计算时间: {new Date(data.calculated_at).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CorrelationHeatmap;