// Chart.worker.ts - 图表技术指标计算Web Worker
// 依据: FE-203图表Web Workers实施方案
// 创建: 2026-02-07 (P2阶段优化)

// ============ 类型定义 ============

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

export interface WorkerRequest {
  id: string;
  type: 'calculate_indicators' | 'batch_calculate' | 'health_check';
  data?: OHLCData[];
  indicators?: IndicatorConfig[];
  batchSize?: number;
}

export interface WorkerResponse {
  id: string;
  type: 'indicator_result' | 'batch_result' | 'health_response' | 'error';
  result?: any;
  error?: string;
}

// ============ 计算函数 ============

// 简单移动平均
function calculateMA(data: number[], period: number): (number | null)[] {
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

// 指数移动平均
function calculateEMA(data: number[], period: number): (number | null)[] {
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

// MACD计算
function calculateMACD(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): {
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

// RSI计算
function calculateRSI(data: number[], period = 14): (number | null)[] {
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

// 布林带计算
function calculateBollinger(data: number[], period = 20, stdDev = 2): {
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

// KDJ计算
function calculateKDJ(data: OHLCData[], period = 9): {
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

// ============ 批处理计算 ============

function processBatchRequest(
  data: OHLCData[],
  indicators: IndicatorConfig[],
  batchSize: number = 50
): Record<string, any> {
  const results: Record<string, any> = {};
  const closes = data.map(d => d.close);
  
  indicators.forEach(indicator => {
    if (indicator.visible === false) return;
    
    switch (indicator.type) {
      case 'ma':
        results[`ma_${indicator.period || 20}`] = calculateMA(closes, indicator.period || 20);
        break;
        
      case 'ema':
        results[`ema_${indicator.period || 20}`] = calculateEMA(closes, indicator.period || 20);
        break;
        
      case 'macd':
        results.macd = calculateMACD(closes);
        break;
        
      case 'rsi':
        results.rsi = calculateRSI(closes, indicator.period || 14);
        break;
        
      case 'bollinger':
        results.bollinger = calculateBollinger(closes, indicator.period || 20);
        break;
        
      case 'kdj':
        results.kdj = calculateKDJ(data, indicator.period || 9);
        break;
    }
  });
  
  return results;
}

// ============ Worker消息处理 ============

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const request = e.data;
  
  try {
    switch (request.type) {
      case 'calculate_indicators': {
        if (!request.data || !request.indicators) {
          throw new Error('缺少data或indicators参数');
        }
        
        const result = processBatchRequest(request.data, request.indicators, request.batchSize);
        
        const response: WorkerResponse = {
          id: request.id,
          type: 'indicator_result',
          result
        };
        
        self.postMessage(response);
        break;
      }
      
      case 'batch_calculate': {
        // 批量计算多个指标组合
        if (!request.data || !request.indicators) {
          throw new Error('缺少data或indicators参数');
        }
        
        const batchResults = processBatchRequest(request.data, request.indicators, request.batchSize);
        
        const response: WorkerResponse = {
          id: request.id,
          type: 'batch_result',
          result: batchResults
        };
        
        self.postMessage(response);
        break;
      }
      
      case 'health_check': {
        const response: WorkerResponse = {
          id: request.id,
          type: 'health_response',
          result: {
            status: 'healthy',
            workerType: 'chart_calculation',
            memory: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 'unknown',
            timestamp: Date.now()
          }
        };
        
        self.postMessage(response);
        break;
      }
      
      default:
        throw new Error(`未知的请求类型: ${request.type}`);
    }
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      type: 'error',
      error: error instanceof Error ? error.message : '未知错误'
    };
    
    self.postMessage(response);
  }
};

// ============ Worker生命周期管理 ============

let isRunning = true;

// 优雅关闭
self.addEventListener('message', (e) => {
  if (e.data === 'terminate') {
    isRunning = false;
    self.postMessage({ type: 'terminated', timestamp: Date.now() });
    self.close();
  }
});

// 定期清理内存
setInterval(() => {
  if (typeof (globalThis as any).gc === 'function') {
    (globalThis as any).gc();
  }
}, 60000); // 每分钟清理一次

// Worker初始化完成
self.postMessage({ 
  type: 'initialized', 
  timestamp: Date.now(),
  version: '1.0.0',
  capabilities: ['ma', 'ema', 'macd', 'rsi', 'bollinger', 'kdj']
});