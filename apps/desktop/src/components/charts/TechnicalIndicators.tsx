// TechnicalIndicators - 技术指标组件
// Supports: MA, MACD, RSI, Bollinger Bands, KDJ
// Created: 2026-02-05 (v1.8.0)

import React, { useRef, useEffect, memo, useState } from 'react';
import { useUIStore } from '../../stores/ui.store';
import ChartWorkerManager from '../../services/ChartWorkerManager';
import './TechnicalIndicators.css';

// ============ Types ============
export interface OHLCData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  type: 'ma' | 'ema' | 'macd' | 'rsi' | 'bollinger' | 'kdj';
  period?: number;
  color?: string;
  visible?: boolean;
}

interface TechnicalIndicatorsProps {
  data: OHLCData[];
  indicators: IndicatorConfig[];
  width?: number;
  height?: number;
}

// ============ Calculation Functions (Fallbacks) ============

// Simple Moving Average
export function calculateMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

// Exponential Moving Average
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      const sum = data.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    } else {
      const prev = result[i - 1] as number;
      result.push((data[i] - prev) * multiplier + prev);
    }
  }
  return result;
}

// Bollinger Bands
export function calculateBollinger(data: number[], period = 20, stdDev = 2): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i] as number;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }
  
  return { upper, middle, lower };
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  const macd: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macd.push(null);
    } else {
      macd.push((fastEMA[i] as number) - (slowEMA[i] as number));
    }
  }
  
  // Calculate signal line (EMA of MACD)
  const validMacd = macd.filter(v => v !== null) as number[];
  const signalEMA = calculateEMA(validMacd, signalPeriod);
  
  // Align signal with macd array
  const signal: (number | null)[] = [];
  let validIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (macd[i] === null) {
      signal.push(null);
    } else {
      signal.push(signalEMA[validIndex] || null);
      validIndex++;
    }
  }
  
  // Calculate histogram
  const histogram: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (macd[i] === null || signal[i] === null) {
      histogram.push(null);
    } else {
      histogram.push((macd[i] as number) - (signal[i] as number));
    }
  }
  
  return { macd, signal, histogram };
}

// RSI (Relative Strength Index)
export function calculateRSI(data: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  let gains = 0;
  let losses = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period) {
      result.push(null);
      if (i > 0) {
        const change = data[i] - data[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
      }
    } else {
      const change = data[i] - data[i - 1];
      if (i === period) {
        // First RSI value
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          result.push(100 - (100 / (1 + rs)));
        }
      } else {
        // Smoothed RSI
        const prevGain = (result[i - 1] !== null ? (gains / period) : 0);
        const prevLoss = (result[i - 1] !== null ? (losses / period) : 0);
        
        if (change > 0) {
          gains = (prevGain * (period - 1) + change) / period;
          losses = (prevLoss * (period - 1)) / period;
        } else {
          gains = (prevGain * (period - 1)) / period;
          losses = (prevLoss * (period - 1) - change) / period;
        }
        
        if (losses === 0) {
          result.push(100);
        } else {
          const rs = gains / losses;
          result.push(100 - (100 / (1 + rs)));
        }
      }
    }
  }
  
  return result;
}

// KDJ Indicator
export function calculateKDJ(highs: number[], lows: number[], closes: number[], period = 9, kPeriod = 3, dPeriod = 3): {
  k: (number | null)[];
  d: (number | null)[];
  j: (number | null)[];
} {
  const rsv: (number | null)[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      rsv.push(null);
    } else {
      const highMax = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowMin = Math.min(...lows.slice(i - period + 1, i + 1));
      const range = highMax - lowMin;
      if (range === 0) {
        rsv.push(50);
      } else {
        rsv.push(((closes[i] - lowMin) / range) * 100);
      }
    }
  }
  
  // Calculate K (smoothed RSV)
  const k: (number | null)[] = [];
  let prevK = 50;
  for (let i = 0; i < rsv.length; i++) {
    if (rsv[i] === null) {
      k.push(null);
    } else {
      prevK = (prevK * (kPeriod - 1) + (rsv[i] as number)) / kPeriod;
      k.push(prevK);
    }
  }
  
  // Calculate D (smoothed K)
  const d: (number | null)[] = [];
  let prevD = 50;
  for (let i = 0; i < k.length; i++) {
    if (k[i] === null) {
      d.push(null);
    } else {
      prevD = (prevD * (dPeriod - 1) + (k[i] as number)) / dPeriod;
      d.push(prevD);
    }
  }
  
  // Calculate J
  const j: (number | null)[] = [];
  for (let i = 0; i < k.length; i++) {
    if (k[i] === null || d[i] === null) {
      j.push(null);
    } else {
      j.push(3 * (k[i] as number) - 2 * (d[i] as number));
    }
  }
  
  return { k, d, j };
}

// ============ Indicator Canvas Component ============
interface IndicatorCanvasProps {
  data: OHLCData[];
  indicators: IndicatorConfig[];
  width: number;
  height: number;
  isDark: boolean;
  calculatedResults?: Record<string, any>;
}

const IndicatorCanvas: React.FC<IndicatorCanvasProps> = memo(
  ({ data, indicators, width, height, isDark, calculatedResults }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data.length) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.fillStyle = isDark ? '#1a1a2e' : '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const closes = data.map(d => d.close);
      const leftPadding = 50;
      const rightPadding = 10;
      const topPadding = 10;
      const bottomPadding = 20;
      const chartWidth = width - leftPadding - rightPadding;
      const chartHeight = height - topPadding - bottomPadding;
      const barWidth = chartWidth / data.length;

      // Default colors
      const defaultColors: Record<string, string> = {
        ma: '#ffa726',
        ema: '#42a5f5',
        macd: '#66bb6a',
        rsi: '#ab47bc',
        bollinger: '#26c6da',
        kdj: '#ef5350',
      };

      indicators.forEach(indicator => {
        if (indicator.visible === false) return;

        const color = indicator.color || defaultColors[indicator.type];
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        // Use calculated results if available, otherwise fall back to sync calculation (minimal set)
        const getResult = (type: string, period?: number) => {
          if (calculatedResults) {
            if (type === 'ma' || type === 'ema') return calculatedResults[`${type}_${period || 20}`];
            return calculatedResults[type];
          }
          // Fallback to sync calculation if results not yet ready
          if (type === 'ma') return calculateMA(closes, period || 20);
          if (type === 'ema') return calculateEMA(closes, period || 20);
          if (type === 'bollinger') return calculateBollinger(closes, period || 20);
          return null;
        };

        switch (indicator.type) {
          case 'ma': {
            const ma = getResult('ma', indicator.period);
            if (!ma) return;
            const minPrice = Math.min(...closes) * 0.98;
            const maxPrice = Math.max(...closes) * 1.02;
            const priceRange = maxPrice - minPrice;

            ctx.beginPath();
            let started = false;
            ma.forEach((val: number | null, i: number) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            break;
          }

          case 'ema': {
            const ema = getResult('ema', indicator.period);
            if (!ema) return;
            const minPrice = Math.min(...closes) * 0.98;
            const maxPrice = Math.max(...closes) * 1.02;
            const priceRange = maxPrice - minPrice;

            ctx.beginPath();
            let started = false;
            ema.forEach((val: number | null, i: number) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) {
                ctx.moveTo(x, y);
                started = true;
              } else {
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
            break;
          }

          case 'bollinger': {
            const bb = getResult('bollinger', indicator.period);
            if (!bb) return;
            const minPrice = Math.min(...closes) * 0.95;
            const maxPrice = Math.max(...closes) * 1.05;
            const priceRange = maxPrice - minPrice;

            // Upper band
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            let started = false;
            bb.upper.forEach((val: number | null, i: number) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.stroke();

            // Lower band
            ctx.beginPath();
            started = false;
            bb.lower.forEach((val: number | null, i: number) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.stroke();

            // Middle band
            ctx.setLineDash([]);
            ctx.beginPath();
            started = false;
            bb.middle.forEach((val: number | null, i: number) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.stroke();
            break;
          }

          default:
            break;
        }
      });

      // Legend
      ctx.font = '10px sans-serif';
      let legendX = leftPadding;
      indicators.forEach(indicator => {
        if (indicator.visible === false) return;
        const color = indicator.color || defaultColors[indicator.type];
        const label = `${indicator.type.toUpperCase()}(${indicator.period || 20})`;
        
        ctx.fillStyle = color;
        ctx.fillRect(legendX, 5, 12, 12);
        ctx.fillStyle = isDark ? '#e0e0e0' : '#333';
        ctx.fillText(label, legendX + 16, 14);
        legendX += ctx.measureText(label).width + 30;
      });

    }, [data, indicators, width, height, isDark, calculatedResults]);

    return <canvas ref={canvasRef} width={width} height={height} className="indicator-canvas" />;
  }
);

// ============ Main Component ============
export const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = memo(
  ({ data, indicators, width = 600, height = 150 }) => {
    const { theme } = useUIStore();
    const isDark = theme === 'dark';
    const [results, setResults] = useState<Record<string, any> | undefined>(undefined);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
      if (!data.length || !indicators.length) return;

      const performCalculation = async () => {
        setIsCalculating(true);
        try {
          // Initialize worker
          await ChartWorkerManager.initialize();
          
          if (ChartWorkerManager.isWorkerAvailable()) {
            const calculatedResults = await ChartWorkerManager.calculateIndicators(data, indicators);
            setResults(calculatedResults);
          }
        } catch (error) {
          console.warn('[TechnicalIndicators] Worker calculation failed', error);
        } finally {
          setIsCalculating(false);
        }
      };

      performCalculation();
    }, [data, indicators]);

    if (!data.length || !indicators.length) {
      return null;
    }

    return (
      <div className="technical-indicators">
        <IndicatorCanvas
          data={data}
          indicators={indicators}
          width={width}
          height={height}
          isDark={isDark}
          calculatedResults={results}
        />
        {isCalculating && <div className="indicator-loading-overlay" />}
      </div>
    );
  }
);

export default TechnicalIndicators;
