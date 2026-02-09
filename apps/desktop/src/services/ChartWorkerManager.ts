// ChartWorkerManager - Web Worker管理服务
// 依据: FE-011 Worker挂载与通信实施方案
// 创建: 2026-02-07 (Phase 3: P0核心能力激活)

import { OHLCData, IndicatorConfig } from '../components/charts/TechnicalIndicators';

// ============ Worker消息类型定义 ============

export interface WorkerRequest {
  id: string;
  type: 'calculate_indicators' | 'batch_calculate' | 'health_check' | 'terminate';
  data?: OHLCData[];
  indicators?: IndicatorConfig[];
  batchSize?: number;
}

export interface WorkerResponse {
  id: string;
  type: 'indicator_result' | 'batch_result' | 'health_response' | 'error' | 'initialized' | 'terminated';
  result?: any;
  error?: string;
}

export interface WorkerHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  workerType: 'chart_calculation';
  memory: number | string;
  latency: number | null; // 计算延迟(ms)
  timestamp: number;
}

export interface WorkerMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  lastHealthCheck: WorkerHealth | null;
  workerReady: boolean;
}

// ============ Worker管理器类 ============

export class ChartWorkerManager {
  private static instance: ChartWorkerManager;
  private worker: Worker | null = null;
  private requestQueue: Map<string, {
    request: WorkerRequest;
    resolve: (value: WorkerResponse) => void;
    reject: (reason: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
  }> = new Map();
  private metrics: WorkerMetrics;
  private isInitialized = false;
  private workerReady = false;
  private fallbackToMainThread = false;

  // 单例模式
  private constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      lastHealthCheck: null,
      workerReady: false
    };
  }

  public static getInstance(): ChartWorkerManager {
    if (!ChartWorkerManager.instance) {
      ChartWorkerManager.instance = new ChartWorkerManager();
    }
    return ChartWorkerManager.instance;
  }

  // 初始化Worker
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.workerReady;
    }

    try {
      // 创建Web Worker
      this.worker = new Worker(new URL('../workers/indicator.worker.ts', import.meta.url), {
        type: 'module'
      });

      // 设置消息处理器
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      // 等待Worker初始化完成
      const initSuccess = await this.waitForWorkerInitialization(5000);
      
      if (initSuccess) {
        this.workerReady = true;
        this.isInitialized = true;
        console.log('[ChartWorkerManager] Worker initialized successfully');
        
        // 初始健康检查
        this.checkHealth().then(health => {
          this.metrics.lastHealthCheck = health;
          console.log('[ChartWorkerManager] Initial health check:', health);
        });
        
        return true;
      } else {
        console.warn('[ChartWorkerManager] Worker initialization timeout, falling back to main thread');
        this.fallbackToMainThread = true;
        this.cleanup();
        return false;
      }
    } catch (error) {
      console.error('[ChartWorkerManager] Failed to initialize worker:', error);
      this.fallbackToMainThread = true;
      return false;
    }
  }

  // 等待Worker初始化
  private waitForWorkerInitialization(timeoutMs: number): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(false);
        }
      }, timeoutMs);

      const messageHandler = (event: MessageEvent) => {
        const message = event.data as WorkerResponse;
        if (message.type === 'initialized') {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(true);
          }
        }
      };

      if (this.worker) {
        this.worker.addEventListener('message', messageHandler);
        
        // 设置临时处理器，完成后移除
        setTimeout(() => {
          if (this.worker) {
            this.worker.removeEventListener('message', messageHandler);
          }
        }, timeoutMs + 100);
      } else {
        resolve(false);
      }
    });
  }

  // 处理Worker消息
  private handleWorkerMessage(event: MessageEvent): void {
    const response = event.data as WorkerResponse;
    
    // 处理初始化消息
    if (response.type === 'initialized') {
      console.log('[ChartWorkerManager] Worker initialization confirmed:', response);
      return;
    }
    
    // 处理终止消息
    if (response.type === 'terminated') {
      console.log('[ChartWorkerManager] Worker terminated:', response);
      this.workerReady = false;
      return;
    }
    
    // 查找对应的请求
    const requestItem = this.requestQueue.get(response.id);
    if (!requestItem) {
      console.warn('[ChartWorkerManager] Received response for unknown request:', response.id);
      return;
    }

    // 清理超时定时器
    clearTimeout(requestItem.timeoutId);
    this.requestQueue.delete(response.id);

    // 更新指标
    this.metrics.totalRequests++;
    
    if (response.type === 'error') {
      this.metrics.failedRequests++;
      console.error('[ChartWorkerManager] Worker error:', response.error);
      requestItem.reject(new Error(response.error || 'Unknown worker error'));
    } else {
      this.metrics.successfulRequests++;
      requestItem.resolve(response);
    }
  }

  // 处理Worker错误
  private handleWorkerError(error: ErrorEvent): void {
    console.error('[ChartWorkerManager] Worker error:', error);
    
    // 标记降级到主线程
    this.fallbackToMainThread = true;
    this.workerReady = false;
    
    // 拒绝所有等待中的请求
    this.requestQueue.forEach((item) => {
      item.reject(new Error('Worker error: ' + error.message));
    });
    this.requestQueue.clear();
  }

  // 发送请求到Worker
  public async sendRequest(request: WorkerRequest, timeoutMs: number = 10000): Promise<WorkerResponse> {
    // 如果降级到主线程或Worker未就绪，抛出错误
    if (this.fallbackToMainThread || !this.workerReady) {
      throw new Error('Worker is unavailable, falling back to main thread calculation');
    }

    // 生成唯一请求ID
    const requestId = `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestWithId = { ...request, id: requestId };

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.requestQueue.delete(requestId);
        this.metrics.failedRequests++;
        reject(new Error(`Worker request timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // 添加到队列
      this.requestQueue.set(requestId, {
        request: requestWithId,
        resolve,
        reject,
        timeoutId
      });

      // 发送到Worker
      try {
        if (this.worker) {
          this.worker.postMessage(requestWithId);
        } else {
          clearTimeout(timeoutId);
          this.requestQueue.delete(requestId);
          reject(new Error('Worker not available'));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        this.requestQueue.delete(requestId);
        reject(error);
      }
    });
  }

  // 计算技术指标（主入口）
  public async calculateIndicators(
    data: OHLCData[],
    indicators: IndicatorConfig[],
    batchSize: number = 50
  ): Promise<Record<string, any>> {
    const startTime = performance.now();
    
    try {
      const response = await this.sendRequest({
        id: 'temp',
        type: 'calculate_indicators',
        data,
        indicators,
        batchSize
      });

      if (response.type === 'indicator_result' || response.type === 'batch_result') {
        const latency = performance.now() - startTime;
        this.updateLatencyMetrics(latency);
        return response.result || {};
      } else {
        throw new Error(`Unexpected response type: ${response.type}`);
      }
    } catch (error) {
      console.error('[ChartWorkerManager] Failed to calculate indicators via worker:', error);
      throw error;
    }
  }

  // 健康检查
  public async checkHealth(): Promise<WorkerHealth> {
    try {
      const response = await this.sendRequest({
        id: 'health_check',
        type: 'health_check'
      }, 5000);

      if (response.type === 'health_response' && response.result) {
        const health: WorkerHealth = {
          status: 'healthy',
          workerType: 'chart_calculation',
          memory: response.result.memory || 'unknown',
          latency: this.metrics.avgLatency,
          timestamp: response.result.timestamp || Date.now()
        };
        
        this.metrics.lastHealthCheck = health;
        return health;
      } else {
        throw new Error('Invalid health response');
      }
    } catch (error) {
      console.error('[ChartWorkerManager] Health check failed:', error);
      
      const health: WorkerHealth = {
        status: 'unhealthy',
        workerType: 'chart_calculation',
        memory: 'unknown',
        latency: null,
        timestamp: Date.now()
      };
      
      this.metrics.lastHealthCheck = health;
      return health;
    }
  }

  // 更新延迟指标
  private updateLatencyMetrics(latency: number): void {
    if (this.metrics.avgLatency === 0) {
      this.metrics.avgLatency = latency;
    } else {
      // 简单移动平均
      this.metrics.avgLatency = (this.metrics.avgLatency * 0.7 + latency * 0.3);
    }
  }

  // 获取指标
  public getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  // 检查Worker状态
  public isWorkerAvailable(): boolean {
    return this.workerReady && !this.fallbackToMainThread;
  }

  // 优雅终止Worker
  public async terminate(): Promise<void> {
    try {
      if (this.worker) {
        // 发送终止消息
        this.worker.postMessage({ type: 'terminate' });
        
        // 等待确认或超时
        await new Promise<void>((resolve) => {
          const timeoutId = setTimeout(() => {
            resolve();
          }, 1000);

          const messageHandler = (event: MessageEvent) => {
            const message = event.data as WorkerResponse;
            if (message.type === 'terminated') {
              clearTimeout(timeoutId);
              resolve();
            }
          };

          if (this.worker) {
            this.worker.addEventListener('message', messageHandler);
            setTimeout(() => {
              if (this.worker) {
                this.worker.removeEventListener('message', messageHandler);
              }
            }, 1500);
          } else {
            resolve();
          }
        });

        // 关闭Worker
        this.worker.terminate();
      }
    } catch (error) {
      console.error('[ChartWorkerManager] Error terminating worker:', error);
    } finally {
      this.worker = null;
      this.workerReady = false;
      this.isInitialized = false;
      this.requestQueue.clear();
      
      console.log('[ChartWorkerManager] Worker terminated');
    }
  }

  // 清理所有资源
  public cleanup(): void {
    this.terminate();
    this.requestQueue.clear();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgLatency: 0,
      lastHealthCheck: null,
      workerReady: false
    };
  }
}

// ============ 主线程降级计算函数 ============
// 当Worker不可用时，使用这些函数作为降级方案

import {
  calculateMA,
  calculateEMA,
  calculateMACD,
  calculateRSI,
  calculateBollinger,
  calculateKDJ
} from '../components/charts/TechnicalIndicators';

export function calculateIndicatorsInMainThread(
  data: OHLCData[],
  indicators: IndicatorConfig[]
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

// ============ 默认导出单例 ============

export default ChartWorkerManager.getInstance();