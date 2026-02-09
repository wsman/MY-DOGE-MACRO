import React, { useRef, useEffect, useState, memo } from 'react';

/**
 * FinancialChart Component - Standalone Backport
 * Features: Canvas-based Candlestick chart with Volume support.
 */

interface DataPoint {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface FinancialChartProps {
  ticker: string;
  data: DataPoint[];
  width?: number;
  height?: number;
  showVolume?: boolean;
  theme?: 'light' | 'dark';
  title?: string;
}

const FinancialChart: React.FC<FinancialChartProps> = memo(
  ({ ticker, data, width = 600, height = 300, showVolume = true, theme = 'dark', title }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width, height });
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

    // Draw Logic
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data.length) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width: dw, height: dh } = dimensions;
      const chartHeight = showVolume ? dh * 0.7 : dh;
      const volumeHeight = showVolume ? dh * 0.2 : 0;
      const volumePadding = showVolume ? dh * 0.05 : 0;

      // Clear
      ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
      ctx.fillRect(0, 0, dw, dh);

      // Scale
      const prices = data.map((d) => [d.high, d.low]).flat();
      const minPrice = Math.min(...prices) * 0.99;
      const maxPrice = Math.max(...prices) * 1.01;
      const priceRange = maxPrice - minPrice;

      const maxVolume = Math.max(...data.map((d) => d.volume));

      // Draw Candlesticks
      const leftPadding = 50;
      const rightPadding = 10;
      const topPadding = 20;
      const bottomPadding = 20;
      
      const usableWidth = dw - leftPadding - rightPadding;
      const usableHeight = chartHeight - topPadding;
      
      const candleWidth = Math.max(1, (usableWidth / data.length) - 2);
      const upColor = '#4caf50';
      const downColor = '#ff5252';

      data.forEach((d, i) => {
        const x = leftPadding + i * (usableWidth / data.length);

        const getY = (price: number) => 
          topPadding + usableHeight - ((price - minPrice) / priceRange) * usableHeight;

        const openY = getY(d.open);
        const closeY = getY(d.close);
        const highY = getY(d.high);
        const lowY = getY(d.low);

        // Wick
        ctx.strokeStyle = d.close >= d.open ? upColor : downColor;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = d.close >= d.open ? upColor : downColor;
        ctx.fillRect(x, Math.min(openY, closeY), candleWidth, Math.max(1, Math.abs(closeY - openY)));

        // Volume
        if (showVolume) {
          const vY = dh - bottomPadding;
          const vH = (d.volume / maxVolume) * volumeHeight;
          ctx.fillStyle = d.close >= d.open ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 82, 82, 0.3)';
          ctx.fillRect(x, vY - vH, candleWidth, vH);
        }
      });

      // Labels
      ctx.fillStyle = isDark ? '#888' : '#666';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const price = minPrice + (priceRange * i) / 5;
        const y = getY(price);
        ctx.fillText(price.toFixed(2), leftPadding - 5, y + 3);
        
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        ctx.beginPath();
        ctx.moveTo(leftPadding, y);
        ctx.lineTo(dw - rightPadding, y);
        ctx.stroke();
      }

      // Title
      ctx.fillStyle = isDark ? '#eee' : '#333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(title || ticker, leftPadding, 15);

    }, [data, dimensions, isDark, showVolume, ticker, title]);

    return (
      <div 
        ref={containerRef} 
        style={{ 
          width: '100%', 
          height: `${height}px`, 
          background: isDark ? '#1a1a2e' : '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <canvas 
          ref={canvasRef} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      </div>
    );
  }
);

export default FinancialChart;
