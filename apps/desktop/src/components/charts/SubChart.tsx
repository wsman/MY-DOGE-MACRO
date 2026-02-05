// SubChart - MACD/RSI/KDJ 独立子图组件
// Created: 2026-02-05 (v1.8.0)

import React, { useRef, useEffect, memo } from 'react';
import { useUIStore } from '../../stores/ui.store';
import { calculateMACD, calculateRSI, calculateKDJ, OHLCData } from './TechnicalIndicators';
import './SubChart.css';

export type SubChartType = 'macd' | 'rsi' | 'kdj' | 'volume';

interface SubChartProps {
  type: SubChartType;
  data: OHLCData[];
  width?: number;
  height?: number;
  title?: string;
}

interface SubChartCanvasProps {
  type: SubChartType;
  data: OHLCData[];
  width: number;
  height: number;
  isDark: boolean;
}

const SubChartCanvas: React.FC<SubChartCanvasProps> = memo(
  ({ type, data, width, height, isDark }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data.length) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const leftPadding = 50;
      const rightPadding = 10;
      const topPadding = 20;
      const bottomPadding = 20;
      const chartWidth = width - leftPadding - rightPadding;
      const chartHeight = height - topPadding - bottomPadding;
      const barWidth = chartWidth / data.length;

      const closes = data.map(d => d.close);

      switch (type) {
        case 'macd': {
          const { macd, signal, histogram } = calculateMACD(closes);
          
          // Find range
          const validValues = [...macd, ...signal, ...histogram].filter(v => v !== null) as number[];
          if (validValues.length === 0) return;
          
          const maxVal = Math.max(...validValues.map(Math.abs)) * 1.1;
          const zeroY = topPadding + chartHeight / 2;

          // Draw zero line
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(leftPadding, zeroY);
          ctx.lineTo(width - rightPadding, zeroY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Draw histogram
          histogram.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth;
            const barHeight = (val / maxVal) * (chartHeight / 2);
            ctx.fillStyle = val >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(255, 82, 82, 0.7)';
            ctx.fillRect(x, zeroY - (val >= 0 ? barHeight : 0), barWidth - 1, Math.abs(barHeight));
          });

          // Draw MACD line
          ctx.strokeStyle = '#2196f3';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let started = false;
          macd.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth + barWidth / 2;
            const y = zeroY - (val / maxVal) * (chartHeight / 2);
            if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
          });
          ctx.stroke();

          // Draw Signal line
          ctx.strokeStyle = '#ff9800';
          ctx.beginPath();
          started = false;
          signal.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth + barWidth / 2;
            const y = zeroY - (val / maxVal) * (chartHeight / 2);
            if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
          });
          ctx.stroke();

          // Legend
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#2196f3';
          ctx.fillRect(leftPadding, 5, 10, 10);
          ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
          ctx.fillText('MACD', leftPadding + 14, 13);
          ctx.fillStyle = '#ff9800';
          ctx.fillRect(leftPadding + 60, 5, 10, 10);
          ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
          ctx.fillText('Signal', leftPadding + 74, 13);
          break;
        }

        case 'rsi': {
          const rsi = calculateRSI(closes);
          
          // RSI range is 0-100
          const minY = 0;
          const maxY = 100;

          // Draw overbought/oversold lines
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
          ctx.setLineDash([5, 5]);
          
          [30, 70].forEach(level => {
            const y = topPadding + chartHeight - (level / 100) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(leftPadding, y);
            ctx.lineTo(width - rightPadding, y);
            ctx.stroke();
            ctx.fillStyle = isDark ? '#888' : '#666';
            ctx.font = '9px sans-serif';
            ctx.fillText(level.toString(), leftPadding - 20, y + 3);
          });
          ctx.setLineDash([]);

          // Draw RSI line
          ctx.strokeStyle = '#ab47bc';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let started = false;
          rsi.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth + barWidth / 2;
            const y = topPadding + chartHeight - (val / 100) * chartHeight;
            if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
          });
          ctx.stroke();

          // Legend
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#ab47bc';
          ctx.fillRect(leftPadding, 5, 10, 10);
          ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
          ctx.fillText('RSI(14)', leftPadding + 14, 13);
          break;
        }

        case 'kdj': {
          const { k, d, j } = calculateKDJ(data);
          
          // KDJ range is typically 0-100 but J can exceed
          const allValues = [...k, ...d, ...j].filter(v => v !== null) as number[];
          const minVal = Math.min(0, ...allValues);
          const maxVal = Math.max(100, ...allValues);
          const range = maxVal - minVal;

          // Draw reference lines
          ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
          ctx.setLineDash([5, 5]);
          [20, 50, 80].forEach(level => {
            const y = topPadding + chartHeight - ((level - minVal) / range) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(leftPadding, y);
            ctx.lineTo(width - rightPadding, y);
            ctx.stroke();
          });
          ctx.setLineDash([]);

          // Draw K line
          ctx.strokeStyle = '#2196f3';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          let started = false;
          k.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth + barWidth / 2;
            const y = topPadding + chartHeight - ((val - minVal) / range) * chartHeight;
            if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
          });
          ctx.stroke();

          // Draw D line
          ctx.strokeStyle = '#ff9800';
          ctx.beginPath();
          started = false;
          d.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth + barWidth / 2;
            const y = topPadding + chartHeight - ((val - minVal) / range) * chartHeight;
            if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
          });
          ctx.stroke();

          // Draw J line
          ctx.strokeStyle = '#e91e63';
          ctx.beginPath();
          started = false;
          j.forEach((val, i) => {
            if (val === null) return;
            const x = leftPadding + i * barWidth + barWidth / 2;
            const y = topPadding + chartHeight - ((val - minVal) / range) * chartHeight;
            if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
          });
          ctx.stroke();

          // Legend
          ctx.font = '10px sans-serif';
          let legendX = leftPadding;
          [{ label: 'K', color: '#2196f3' }, { label: 'D', color: '#ff9800' }, { label: 'J', color: '#e91e63' }].forEach(item => {
            ctx.fillStyle = item.color;
            ctx.fillRect(legendX, 5, 10, 10);
            ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
            ctx.fillText(item.label, legendX + 14, 13);
            legendX += 35;
          });
          break;
        }

        case 'volume': {
          const volumes = data.map(d => d.volume);
          const maxVolume = Math.max(...volumes);

          data.forEach((d, i) => {
            const x = leftPadding + i * barWidth;
            const barHeight = (d.volume / maxVolume) * chartHeight;
            ctx.fillStyle = d.close >= d.open 
              ? 'rgba(76, 175, 80, 0.7)' 
              : 'rgba(255, 82, 82, 0.7)';
            ctx.fillRect(x, topPadding + chartHeight - barHeight, barWidth - 1, barHeight);
          });

          // Legend
          ctx.font = '10px sans-serif';
          ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
          ctx.fillText('Volume', leftPadding, 13);
          break;
        }
      }

      // Y-axis labels
      ctx.fillStyle = isDark ? '#888' : '#666';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'right';

    }, [type, data, width, height, isDark]);

    return <canvas ref={canvasRef} width={width} height={height} className="subchart-canvas" />;
  }
);

export const SubChart: React.FC<SubChartProps> = memo(
  ({ type, data, width = 600, height = 100, title }) => {
    const { theme } = useUIStore();
    const isDark = theme === 'dark';

    const defaultTitles: Record<SubChartType, string> = {
      macd: 'MACD',
      rsi: 'RSI',
      kdj: 'KDJ',
      volume: 'Volume',
    };

    return (
      <div className="subchart">
        <div className="subchart__header">
          <span className="subchart__title">{title || defaultTitles[type]}</span>
        </div>
        <SubChartCanvas
          type={type}
          data={data}
          width={width}
          height={height}
          isDark={isDark}
        />
      </div>
    );
  }
);

export default SubChart;
