import React, { useRef, useEffect, useState, memo, useCallback } from 'react';
import { useUIStore } from '../../stores/ui.store';

interface PriceChartProps {
  ticker: string;
  data: { date: Date; open: number; high: number; low: number; close: number; volume: number }[];
  width?: number;
  height?: number;
  showVolume?: boolean;
}

// ============ 纯展示的 Canvas 组件 ============
interface ChartCanvasProps {
  data: PriceChartProps['data'];
  width: number;
  height: number;
  showVolume: boolean;
  isDark: boolean;
  ticker: string;
}

const ChartCanvas: React.FC<ChartCanvasProps> = memo(({
  data,
  width,
  height,
  showVolume,
  isDark,
  ticker
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const chartHeight = showVolume ? height * 0.7 : height;
    const volumeHeight = showVolume ? height * 0.2 : 0;
    const volumePadding = showVolume ? height * 0.05 : 0;
    
    // 清除画布
    ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // 计算价格范围
    const prices = data.map(d => d.close);
    const minPrice = Math.min(...prices) * 0.98;
    const maxPrice = Math.max(...prices) * 1.02;
    const priceRange = maxPrice - minPrice;
    
    // 计算成交量范围
    const volumes = data.map(d => d.volume);
    const maxVolume = Math.max(...volumes);
    
    // 绘制K线数据
    const candleWidth = Math.max(2, (width - 40) / data.length - 2);
    const leftPadding = 30;
    const topPadding = 10;
    
    data.forEach((d, i) => {
      const x = leftPadding + i * (candleWidth + 2);
      
      // 价格转换
      const openY = topPadding + chartHeight - ((d.open - minPrice) / priceRange) * chartHeight;
      const closeY = topPadding + chartHeight - ((d.close - minPrice) / priceRange) * chartHeight;
      const highY = topPadding + chartHeight - ((d.high - minPrice) / priceRange) * chartHeight;
      const lowY = topPadding + chartHeight - ((d.low - minPrice) / priceRange) * chartHeight;
      
      // 绘制影线
      ctx.strokeStyle = d.close >= d.open ? '#4caf50' : '#ff5252';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, highY);
      ctx.lineTo(x + candleWidth / 2, lowY);
      ctx.stroke();
      
      // 绘制实体
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(closeY - openY));
      ctx.fillStyle = d.close >= d.open ? '#4caf50' : '#ff5252';
      ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);
      
      // 绘制成交量
      if (showVolume && volumeHeight > 0) {
        const volY = height - volumePadding;
        const volHeight = (d.volume / maxVolume) * volumeHeight;
        ctx.fillStyle = d.close >= d.open ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 82, 82, 0.5)';
        ctx.fillRect(x, volY - volHeight, candleWidth, volHeight);
      }
    });
    
    // 绘制价格标签
    ctx.fillStyle = isDark ? '#888' : '#666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    
    const priceSteps = 5;
    for (let i = 0; i <= priceSteps; i++) {
      const price = minPrice + (priceRange * i) / priceSteps;
      const y = topPadding + chartHeight - (chartHeight * i) / priceSteps;
      ctx.fillText(price.toFixed(2), leftPadding - 5, y + 3);
      
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.beginPath();
      ctx.moveTo(leftPadding, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }
    
    // X轴日期
    ctx.textAlign = 'center';
    const dateSteps = Math.min(6, data.length);
    const dateInterval = Math.ceil(data.length / dateSteps);
    data.forEach((d, i) => {
      if (i % dateInterval === 0 || i === data.length - 1) {
        const x = leftPadding + i * (candleWidth + 2) + candleWidth / 2;
        const dateStr = new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        ctx.fillText(dateStr, x, height - 5);
      }
    });
    
    // 标题
    ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(ticker, leftPadding, 20);
    
  }, [data, width, height, showVolume, isDark, ticker]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height }}
    />
  );
}, (prev, next) => {
  // 自定义比较函数 - 只有这些变化时才重绘
  return (
    prev.data === next.data &&
    prev.width === next.width &&
    prev.height === next.height &&
    prev.showVolume === next.showVolume &&
    prev.isDark === next.isDark &&
    prev.ticker === next.ticker
  );
});

// ============ 主组件 ============
export const PriceChart: React.FC<PriceChartProps> = memo(({
  ticker,
  data,
  width = 600,
  height = 300,
  showVolume = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  
  // 响应式调整
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width || width,
          height: height
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [width, height]);
  
  return (
    <div ref={containerRef} className="price-chart">
      <ChartCanvas
        data={data}
        width={dimensions.width}
        height={dimensions.height}
        showVolume={showVolume}
        isDark={isDark}
        ticker={ticker}
      />
      <style>{`
        .price-chart {
          background: ${isDark ? '#1a1a2e' : '#ffffff'};
          border-radius: 8px;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}, (prev, next) => {
  // 比较 ticker 和 data 引用
  return prev.ticker === next.ticker && prev.data === next.data;
});

// ============ 指标图表组件 ============
interface IndicatorChartProps {
  data: { date: Date; value: number }[];
  title: string;
  threshold?: { high: number; low: number };
  height?: number;
}

const IndicatorChartCanvas: React.FC<{
  data: IndicatorChartProps['data'];
  width: number;
  height: number;
  isDark: boolean;
  title: string;
  threshold?: IndicatorChartProps['threshold'];
}> = memo(({
  data,
  width,
  height,
  isDark,
  title,
  threshold
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const padding = 30;
    
    ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const values = data.map(d => d.value);
    let minVal = Math.min(...values);
    let maxVal = Math.max(...values);
    
    if (threshold) {
      minVal = Math.min(minVal, threshold.low);
      maxVal = Math.max(maxVal, threshold.high);
    }
    
    const range = maxVal - minVal || 1;
    const step = (width - padding * 2) / (data.length - 1 || 1);
    
    // 绘制阈值区域
    if (threshold) {
      const highY = padding + ((maxVal - threshold.high) / range) * (height - padding * 2);
      const lowY = padding + ((maxVal - threshold.low) / range) * (height - padding * 2);
      
      ctx.fillStyle = 'rgba(255, 82, 82, 0.1)';
      ctx.fillRect(padding, highY, width - padding * 2, lowY - highY);
      
      ctx.strokeStyle = 'rgba(255, 82, 82, 0.5)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, highY);
      ctx.lineTo(width - padding, highY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(padding, lowY);
      ctx.lineTo(width - padding, lowY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // 绘制数据线
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((d, i) => {
      const x = padding + i * step;
      const y = padding + ((maxVal - d.value) / range) * (height - padding * 2);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // 区域填充
    ctx.lineTo(padding + (data.length - 1) * step, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(33, 150, 243, 0.3)');
    gradient.addColorStop(1, 'rgba(33, 150, 243, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 标题
    ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, padding, 15);
    
    // 标签
    ctx.fillStyle = isDark ? '#888' : '#666';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(maxVal.toFixed(2), width - 5, padding + 10);
    ctx.fillText(minVal.toFixed(2), width - 5, height - padding + 3);
    
  }, [data, width, height, isDark, title, threshold]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: '100%', height }}
    />
  );
});

export const IndicatorChart: React.FC<IndicatorChartProps> = ({
  data,
  title,
  threshold,
  height = 150
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || 600, height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);
  
  return (
    <div ref={containerRef} className="indicator-chart">
      <IndicatorChartCanvas
        data={data}
        width={dimensions.width}
        height={dimensions.height}
        isDark={isDark}
        title={title}
        threshold={threshold}
      />
    </div>
  );
};

export default PriceChart;
