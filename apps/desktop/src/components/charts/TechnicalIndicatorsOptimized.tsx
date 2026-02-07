// TechnicalIndicatorsOptimized - 技术指标组件 (Worker优化版)
// 依据: FE-011 Worker挂载与通信实施方案
// 创建: 2026-02-07 (Phase 3: P0核心能力激活)

import React, { useRef, useEffect, memo, useState, useCallback } from 'react';
import { useUIStore } from '../../stores/ui.store';
import ChartWorkerManager, { calculateIndicatorsInMainThread } from '../../services/ChartWorkerManager';
import './TechnicalIndicators.css';

// ============ 类型定义 (从原文件导入) ============
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
  enableWorker?: boolean; // 是否启用Worker计算
}

// ============ 计算函数 (保留作为降级方案) ============

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

// MACD
export function calculateMACD(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  
  const macd: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (emaFast[i] === null || emaSlow[i] === null) {
      macd.push(null);
    } else {
      macd.push((emaFast[i] as number) - (emaSlow[i] as number));
    }
  }
  
  const validMacd = macd.filter(v => v !== null) as number[];
  const signalEma = calculateEMA(validMacd, signalPeriod);
  
  const signal: (number | null)[] = [];
  const histogram: (number | null)[] = [];
  let signalIdx = 0;
  
  for (let i = 0; i < data.length; i++) {
    if (macd[i] === null) {
      signal.push(null);
      histogram.push(null);
    } else {
      const sig = signalEma[signalIdx] ?? null;
      signal.push(sig);
      histogram.push(sig !== null ? (macd[i] as number) - sig : null);
      signalIdx++;
    }
  }
  
  return { macd, signal, histogram };
}

// RSI
export function calculateRSI(data: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }
    
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
    
    if (i < period) {
      result.push(null);
    } else {
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
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

// KDJ
export function calculateKDJ(data: OHLCData[], period = 9): {
  k: (number | null)[];
  d: (number | null)[];
  j: (number | null)[];
} {
  const k: (number | null)[] = [];
  const d: (number | null)[] = [];
  const j: (number | null)[] = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      k.push(null);
      d.push(null);
      j.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...slice.map(d => d.high));
      const lowestLow = Math.min(...slice.map(d => d.low));
      const close = data[i].close;
      
      const rsv = highestHigh === lowestLow ? 50 : ((close - lowestLow) / (highestHigh - lowestLow)) * 100;
      
      const prevK = k[i - 1] ?? 50;
      const prevD = d[i - 1] ?? 50;
      
      const currentK = (2 / 3) * (prevK as number) + (1 / 3) * rsv;
      const currentD = (2 / 3) * (prevD as number) + (1 / 3) * currentK;
      const currentJ = 3 * currentK - 2 * currentD;
      
      k.push(currentK);
      d.push(currentD);
      j.push(currentJ);
    }
  }
  
  return { k, d, j };
}

// ============ 指标计算器 (Worker/主线程智能切换) ============

interface CalculationResult {
  results: Record<string, any>;
  calculationTime: number;
  usingWorker: boolean;
}

async function calculateIndicatorsWithWorker(
  data: OHLCData[],
  indicators: IndicatorConfig[]
): Promise<CalculationResult> {
  const startTime = performance.now();
  
  try {
    // 确保Worker已初始化
    const workerManager = ChartWorkerManager;
    const isWorkerAvailable = await workerManager.initialize();
    
    if (isWorkerAvailable && workerManager.isWorkerAvailable()) {
      const results = await workerManager.calculateIndicators(data, indicators);
      const calculationTime = performance.now() - startTime;
      
      console.log(`[TechnicalIndicatorsOptimized] Worker calculation completed in ${calculationTime.toFixed(2)}ms`);
      return {
        results,
        calculationTime,
        usingWorker: true
      };
    } else {
      console.warn('[TechnicalIndicatorsOptimized] Worker unavailable, falling back to main thread');
      // 降级到主线程计算
      const results = calculateIndicatorsInMainThread(data, indicators);
      const calculationTime = performance.now() - startTime;
      
      console.log(`[TechnicalIndicatorsOptimized] Main thread calculation completed in ${calculationTime.toFixed(2)}ms`);
      return {
        results,
        calculationTime,
        usingWorker: false
      };
    }
  } catch (error) {
    console.error('[TechnicalIndicatorsOptimized] Error calculating indicators:', error);
    
    // 降级到主线程计算
    const results = calculateIndicatorsInMainThread(data, indicators);
    const calculationTime = performance.now() - startTime;
    
    console.log(`[TechnicalIndicatorsOptimized] Fallback calculation completed in ${calculationTime.toFixed(2)}ms`);
    return {
      results,
      calculationTime,
      usingWorker: false
    };
  }
}

// ============ Indicator Canvas Component (优化版) ============
interface IndicatorCanvasOptimizedProps {
  data: OHLCData[];
  indicators: IndicatorConfig[];
  width: number;
  height: number;
  isDark: boolean;
  calculationResult: CalculationResult | null;
}

const IndicatorCanvasOptimized: React.FC<IndicatorCanvasOptimizedProps> = memo(
  ({ data, indicators, width, height, isDark, calculationResult }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !data.length || !calculationResult) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 清空画布
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

      // 默认颜色
      const defaultColors: Record<string, string> = {
        ma: '#ffa726',
        ema: '#42a5f5',
        macd: '#66bb6a',
        rsi: '#ab47bc',
        bollinger: '#26c6da',
        kdj: '#ef5350',
      };

      // 使用计算好的结果
      const { results } = calculationResult;

      indicators.forEach(indicator => {
        if (indicator.visible === false) return;

        const color = indicator.color || defaultColors[indicator.type];
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;

        switch (indicator.type) {
          case 'ma': {
            const maKey = `ma_${indicator.period || 20}`;
            const ma = results[maKey] as (number | null)[];
            if (!ma) break;
            
            const minPrice = Math.min(...closes) * 0.98;
            const maxPrice = Math.max(...closes) * 1.02;
            const priceRange = maxPrice - minPrice;

            ctx.beginPath();
            let started = false;
            ma.forEach((val, i) => {
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
            const emaKey = `ema_${indicator.period || 20}`;
            const ema = results[emaKey] as (number | null)[];
            if (!ema) break;
            
            const minPrice = Math.min(...closes) * 0.98;
            const maxPrice = Math.max(...closes) * 1.02;
            const priceRange = maxPrice - minPrice;

            ctx.beginPath();
            let started = false;
            ema.forEach((val, i) => {
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
            const bb = results.bollinger as { upper: (number | null)[], middle: (number | null)[], lower: (number | null)[] };
            if (!bb) break;
            
            const minPrice = Math.min(...closes) * 0.95;
            const maxPrice = Math.max(...closes) * 1.05;
            const priceRange = maxPrice - minPrice;

            // 上轨
            ctx.strokeStyle = color;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            let started = false;
            bb.upper.forEach((val, i) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.stroke();

            // 下轨
            ctx.beginPath();
            started = false;
            bb.lower.forEach((val, i) => {
              if (val === null) return;
              const x = leftPadding + i * barWidth + barWidth / 2;
              const y = topPadding + chartHeight - ((val - minPrice) / priceRange) * chartHeight;
              if (!started) { ctx.moveTo(x, y); started = true; } else { ctx.lineTo(x, y); }
            });
            ctx.stroke();

            // 中轨
            ctx.setLineDash([]);
            ctx.beginPath();
            started = false;
            bb.middle.forEach((val, i) => {
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

      // 图例
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

      // 显示计算模式 (调试用)
      if (calculationResult) {
        const modeText = calculationResult.usingWorker ? 'Worker' : 'Main Thread';
        const timeText = `${calculationResult.calculationTime.toFixed(1)}ms`;
        
        ctx.fillStyle = isDark ? '#888' : '#666';
        ctx.font = '9px sans-serif';
        ctx.fillText(`${modeText}: ${timeText}`, width - 100, 14);
      }

    }, [data, indicators, width, height, isDark, calculationResult]);

    return <canvas ref={canvasRef} width={width} height={height} className="indicator-canvas" />;
  }
);

// ============ 主组件 (优化版) ============
export const TechnicalIndicatorsOptimized: React.FC<TechnicalIndicatorsProps> = memo(
  ({ data, indicators, width = 600, height = 150, enableWorker = true }) => {
    const { theme } = useUIStore();
    const isDark = theme === 'dark';
    const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [workerStatus, setWorkerStatus] = useState<'idle' | 'initializing' | 'ready' | 'failed'>('idle');

    // 初始化Worker状态
    useEffect(() => {
      if (enableWorker) {
        setWorkerStatus('initializing');
        ChartWorkerManager.initialize().then((success: boolean) => {
          setWorkerStatus(success ? 'ready' : 'failed');
        }).catch(() => {
          setWorkerStatus('failed');
        });
      }
    }, [enableWorker]);

    // 计算指标
    useEffect(() => {
      if (!data.length || !indicators.length) {
        setCalculationResult(null);
        return;
      }

      const calculate = async () => {
        setIsCalculating(true);
        try {
          const result = await calculateIndicatorsWithWorker(data, indicators);
          setCalculationResult(result);
        } catch (error) {
          console.error('[TechnicalIndicatorsOptimized] Calculation error:', error);
          // 降级到主线程计算
          const startTime = performance.now();
          const results = calculateIndicatorsInMainThread(data, indicators);
          const calculationTime = performance.now() - startTime;
          
          setCalculationResult({
            results,
            calculationTime,
            usingWorker: false
          });
        } finally {
          setIsCalculating(false);
        }
      };

      calculate();
    }, [data, indicators]);

    if (!data.length || !indicators.length) {
      return null;
    }

    // 显示加载状态
    if (isCalculating || !calculationResult) {
      return (
        <div className="technical-indicators" style={{ width, height }}>
          <div className="indicator-loading">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              {workerStatus === 'initializing' ? 'Initializing Worker...' : 'Calculating indicators...'}
            </div>
            {workerStatus === 'failed' && (
              <div className="worker-warning">⚠️ Worker failed, using main thread</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="technical-indicators">
        <IndicatorCanvasOptimized
          data={data}
          indicators={indicators}
          width={width}
          height={height}
          isDark={isDark}
          calculationResult={calculationResult}
        />
        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <div className="indicator-debug-info">
            <small>
              Mode: {calculationResult.usingWorker ? 'Worker' : 'Main Thread'} | 
              Time: {calculationResult.calculationTime.toFixed(1)}ms |
              Status: {workerStatus}
            </small>
          </div>
        )}
      </div>
    );
  }
);

// 性能监控装饰器
TechnicalIndicatorsOptimized.displayName = 'TechnicalIndicatorsOptimized';

export default TechnicalIndicatorsOptimized;