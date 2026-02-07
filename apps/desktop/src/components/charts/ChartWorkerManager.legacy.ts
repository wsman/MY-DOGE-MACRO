// ChartWorkerManager - Web Worker集成管理器
// 依据: FE-011 Worker挂载与通信实施标准
// 创建: 2026-02-07 (Phase 3 P0阶段)

import { useState, useEffect } from 'react';

export interface WorkerConfig {
  workerUrl: string;
  workerName: string;
  maxWorkers: number;
  debug?: boolean;
}

export interface WorkerTask<T = any> {
  id: string;
  type: string;
  data: any;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export interface WorkerHealth {
  status: 'healthy' | 'busy' | 'error';
  workerName: string;
  tasksProcessed: number;
  tasksPending: number;
  memory?: number;
  uptime: number;
}

/**
 * Web Worker管理器
 * 负责管理多个Worker实例，实现负载均衡和故障恢复
 */
export class ChartWorkerManager {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private workerStatus: WorkerHealth[] = [];
  private config: WorkerConfig;
  private isInitialized = false;

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = {
      workerUrl: '/src/workers/chart.worker.ts',
      workerName: 'chart_calculator',
      maxWorkers: navigator.hardwareConcurrency || 4,
      debug: import.meta.env?.MODE === 'development',
      ...config,
    };

    this.initialize();
  }

  /**
   * 初始化Worker管理器
   */
  private initialize(): void {
    if (this.isInitialized) return;

    try {
      // 创建Worker实例
      for (let i = 0; i < Math.min(2, this.config.maxWorkers); i++) {
        this.createWorker(i);
      }

      this.isInitialized = true;
      this.log('Worker管理器初始化完成', this.workers.length, '个Worker');
    } catch (error) {
      console.error('Failed to initialize ChartWorkerManager:', error);
    }
  }

  /**
   * 创建新的Worker实例
   */
  private createWorker(index: number): void {
    try {
      // 注意: 在生产环境中，Worker应该从打包后的URL加载
      const workerUrl = this.config.workerUrl;
      const worker = new Worker(workerUrl, { type: 'module' });
      
      worker.onmessage = (event) => {
        this.handleWorkerMessage(event, index);
      };

      worker.onerror = (errorEvent) => {
        console.error(`Worker ${index} error:`, errorEvent);
        this.handleWorkerError(index, errorEvent);
      };

      this.workers.push(worker);
      this.workerStatus[index] = {
        status: 'healthy',
        workerName: `${this.config.workerName}_${index}`,
        tasksProcessed: 0,
        tasksPending: 0,
        uptime: Date.now(),
      };

      // 发送健康检查
      this.sendHealthCheck(worker, index);
      
    } catch (error) {
      console.error(`Failed to create worker ${index}:`, error);
      throw error;
    }
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(event: MessageEvent, workerIndex: number): void {
    const response = event.data;
    const _status = this.workerStatus[workerIndex]; // unused

    if (this.config.debug) {
      this.log(`Worker ${workerIndex} message:`, response);
    }

    switch (response.type) {
      case 'initialized':
        this.log(`Worker ${workerIndex} 初始化完成:`, response);
        break;

      case 'indicator_result':
      case 'batch_result':
        this.handleTaskResult(response, workerIndex);
        break;

      case 'health_response':
        this.updateWorkerHealth(workerIndex, response.result);
        break;

      case 'error':
        console.error(`Worker ${workerIndex} 返回错误:`, response.error);
        this.handleTaskError(response.id, new Error(response.error));
        break;

      default:
        this.log(`Worker ${workerIndex} 未知消息类型:`, response.type);
    }
  }

  /**
   * 处理Worker错误
   */
  private handleWorkerError(workerIndex: number, errorEvent: ErrorEvent): void {
    this.workerStatus[workerIndex].status = 'error';
    
    // 尝试重启Worker
    setTimeout(() => {
      this.log(`尝试重启Worker ${workerIndex}`);
      this.restartWorker(workerIndex);
    }, 5000);
  }

  /**
   * 重启Worker
   */
  private restartWorker(workerIndex: number): void {
    if (this.workers[workerIndex]) {
      this.workers[workerIndex].terminate();
      this.workers.splice(workerIndex, 1);
    }

    try {
      this.createWorker(workerIndex);
    } catch (error) {
      console.error(`Failed to restart worker ${workerIndex}:`, error);
    }
  }

  /**
   * 处理任务结果
   */
  private handleTaskResult(response: any, workerIndex: number): void {
    const task = this.activeTasks.get(response.id);
    if (!task) {
      console.warn(`Received response for unknown task: ${response.id}`);
      return;
    }

    this.activeTasks.delete(response.id);
    const status = this.workerStatus[workerIndex];
    status.tasksProcessed++;
    status.tasksPending--;

    task.resolve(response.result);
  }

  /**
   * 处理任务错误
   */
  private handleTaskError(taskId: string, error: Error): void {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    this.activeTasks.delete(taskId);
    task.reject(error);

    // 减少相关Worker的任务计数
    this.workerStatus.forEach(status => {
      if (status.tasksPending > 0) status.tasksPending--;
    });
  }

  /**
   * 更新Worker健康状态
   */
  private updateWorkerHealth(workerIndex: number, healthData: any): void {
    const status = this.workerStatus[workerIndex];
    if (status) {
      status.status = healthData.status || 'healthy';
      status.memory = healthData.memory;
      status.uptime = healthData.timestamp ? healthData.timestamp : status.uptime;
    }
  }

  /**
   * 发送健康检查
   */
  private sendHealthCheck(worker: Worker, workerIndex: number): void {
    const healthCheck = {
      id: `health_${workerIndex}_${Date.now()}`,
      type: 'health_check',
    };

    worker.postMessage(healthCheck);
  }

  /**
   * 获取可用Worker索引（负载均衡）
   */
  private getAvailableWorkerIndex(): number {
    // 简单的负载均衡：选择待处理任务最少的Worker
    let minPending = Infinity;
    let bestWorkerIndex = 0;

    for (let i = 0; i < this.workers.length; i++) {
      const status = this.workerStatus[i];
      if (status && status.status === 'healthy') {
        if (status.tasksPending < minPending) {
          minPending = status.tasksPending;
          bestWorkerIndex = i;
        }
      }
    }

    return bestWorkerIndex;
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0 || this.workers.length === 0) return;

    const availableWorkerIndex = this.getAvailableWorkerIndex();
    const worker = this.workers[availableWorkerIndex];
    const status = this.workerStatus[availableWorkerIndex];

    // 从队列中获取任务
    const task = this.taskQueue.shift();
    if (!task || !worker) return;

    status.tasksPending++;
    this.activeTasks.set(task.id, task);

    // 发送任务到Worker
    worker.postMessage({
      id: task.id,
      type: task.type,
      data: task.data,
    });

    this.log(`Task ${task.id} assigned to worker ${availableWorkerIndex}`);

    // 如果有更多任务，继续处理
    if (this.taskQueue.length > 0) {
      requestAnimationFrame(() => this.processQueue());
    }
  }

  /**
   * 提交计算任务
   */
  public submitTask<T = any>(type: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T> = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
      };

      this.taskQueue.push(task);
      this.processQueue();
    });
  }

  /**
   * 批量计算技术指标
   */
  public calculateIndicators(data: any[], indicators: any[]): Promise<any> {
    return this.submitTask('calculate_indicators', {
      data,
      indicators,
      batchSize: 100,
    });
  }

  /**
   * 批量计算多个指标组合
   */
  public batchCalculate(data: any[], indicators: any[], batchSize = 50): Promise<any> {
    return this.submitTask('batch_calculate', {
      data,
      indicators,
      batchSize,
    });
  }

  /**
   * 获取Worker管理器健康状态
   */
  public getHealth(): WorkerHealth[] {
    return [...this.workerStatus];
  }

  /**
   * 获取统计信息
   */
  public getStats() {
    return {
      totalWorkers: this.workers.length,
      activeTasks: this.activeTasks.size,
      queuedTasks: this.taskQueue.length,
      workerStatus: this.getHealth(),
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeTasks.clear();
    this.workerStatus = [];
    this.isInitialized = false;
    
    this.log('Worker管理器已销毁');
  }

  /**
   * 调试日志
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[ChartWorkerManager]', ...args);
    }
  }
}

// 全局单例实例
let globalWorkerManager: ChartWorkerManager | null = null;

/**
 * 获取或创建全局Worker管理器
 */
export function getChartWorkerManager(config?: Partial<WorkerConfig>): ChartWorkerManager {
  if (!globalWorkerManager) {
    globalWorkerManager = new ChartWorkerManager(config);
  }
  return globalWorkerManager;
}

/**
 * React Hook: 使用Worker管理器
 */
export function useChartWorker(config?: Partial<WorkerConfig>) {
  const [workerManager] = useState(() => getChartWorkerManager(config));
  const [health, setHealth] = useState<WorkerHealth[]>([]);

  useEffect(() => {
    // 定期更新健康状态
    const interval = setInterval(() => {
      setHealth(workerManager.getHealth());
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [workerManager]);

  return {
    workerManager,
    health,
    calculateIndicators: (data: any[], indicators: any[]) => 
      workerManager.calculateIndicators(data, indicators),
    batchCalculate: (data: any[], indicators: any[], batchSize?: number) =>
      workerManager.batchCalculate(data, indicators, batchSize),
    getStats: () => workerManager.getStats(),
  };
}