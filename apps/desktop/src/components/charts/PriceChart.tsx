// PriceChart - Migrated to Design System (T-C5.20)
// Uses: Card, Button atoms
// Last Updated: 2026-02-03

import React, { useRef, useEffect, useState, memo } from 'react';
import { useUIStore } from '../../stores/ui.store';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import './PriceChart.css';

interface PriceChartProps {
  ticker: string;
  data: { date: Date; open: number; high: number; low: number; close: number; volume: number }[];
  width?: number;
  height?: number;
  showVolume?: boolean;
  title?: string;
}

// ============ Pure Canvas Component ============
interface ChartCanvasProps {
  data: PriceChartProps['data'];
  width: number;
  height: number;
  showVolume: boolean;
  isDark: boolean;
  ticker: string;
}

const ChartCanvas: React.FC<ChartCanvasProps> = memo(
  ({ data, width, height, showVolume, isDark, ticker }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data.length) {
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      const chartHeight = showVolume ? height * 0.7 : height;
      const volumeHeight = showVolume ? height * 0.2 : 0;
      const volumePadding = showVolume ? height * 0.05 : 0;

      // Clear canvas
      ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Calculate price range
      const prices = data.map((d) => d.close);
      const minPrice = Math.min(...prices) * 0.98;
      const maxPrice = Math.max(...prices) * 1.02;
      const priceRange = maxPrice - minPrice;

      // Calculate volume range
      const volumes = data.map((d) => d.volume);
      const maxVolume = Math.max(...volumes);

      // Draw candlestick data
      const candleWidth = Math.max(2, (width - 40) / data.length - 2);
      const leftPadding = 30;
      const topPadding = 10;

      const upColor = isDark ? '#4caf50' : '#4caf50';
      const downColor = isDark ? '#ff5252' : '#ff5252';

      data.forEach((d, i) => {
        const x = leftPadding + i * (candleWidth + 2);

        // Price conversion
        const openY = topPadding + chartHeight - ((d.open - minPrice) / priceRange) * chartHeight;
        const closeY = topPadding + chartHeight - ((d.close - minPrice) / priceRange) * chartHeight;
        const highY = topPadding + chartHeight - ((d.high - minPrice) / priceRange) * chartHeight;
        const lowY = topPadding + chartHeight - ((d.low - minPrice) / priceRange) * chartHeight;

        // Draw wick
        ctx.strokeStyle = d.close >= d.open ? upColor : downColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Draw body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(1, Math.abs(closeY - openY));
        ctx.fillStyle = d.close >= d.open ? upColor : downColor;
        ctx.fillRect(x, bodyTop, candleWidth, bodyHeight);

        // Draw volume
        if (showVolume && volumeHeight > 0) {
          const volY = height - volumePadding;
          const volHeight = (d.volume / maxVolume) * volumeHeight;
          ctx.fillStyle = d.close >= d.open ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 82, 82, 0.5)';
          ctx.fillRect(x, volY - volHeight, candleWidth, volHeight);
        }
      });

      // Draw price labels
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

      // X-axis dates
      ctx.textAlign = 'center';
      const dateSteps = Math.min(6, data.length);
      const dateInterval = Math.ceil(data.length / dateSteps);
      data.forEach((d, i) => {
        if (i % dateInterval === 0 || i === data.length - 1) {
          const x = leftPadding + i * (candleWidth + 2) + candleWidth / 2;
          const dateStr = new Date(d.date).toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
          });
          ctx.fillText(dateStr, x, height - 5);
        }
      });

      // Title
      ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ticker, leftPadding, 20);
    }, [data, width, height, showVolume, isDark, ticker]);

    return <canvas ref={canvasRef} width={width} height={height} className="price-chart-canvas" />;
  },
  (prev, next) => {
    // Custom comparison - only redraw when these change
    return (
      prev.data === next.data &&
      prev.width === next.width &&
      prev.height === next.height &&
      prev.showVolume === next.showVolume &&
      prev.isDark === next.isDark &&
      prev.ticker === next.ticker
    );
  }
);

// ============ Main Component ============
export const PriceChart: React.FC<PriceChartProps> = memo(
  ({ ticker, data, width = 600, height = 300, showVolume = true, title }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width, height });
    const { theme } = useUIStore();
    const isDark = theme === 'dark';

    // Responsive adjustment
    useEffect(() => {
      const updateDimensions = () => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setDimensions({
            width: rect.width || width,
            height: height,
          });
        }
      };

      updateDimensions();
      const resizeObserver = new ResizeObserver(updateDimensions);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => resizeObserver.disconnect();
    }, [width, height]);

    return (
      <Card elevation="low" padding="none" className="price-chart-card" ref={containerRef}>
        {(title || ticker) && (
          <CardTitle className="price-chart-title">{title || ticker}</CardTitle>
        )}
        <CardContent padding="none" className="price-chart-content">
          <ChartCanvas
            data={data}
            width={dimensions.width}
            height={dimensions.height}
            showVolume={showVolume}
            isDark={isDark}
            ticker={ticker}
          />
        </CardContent>
      </Card>
    );
  },
  (prev, next) => {
    return prev.ticker === next.ticker && prev.data === next.data;
  }
);

export default PriceChart;
