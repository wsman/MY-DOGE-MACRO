// WebSocketBatchProcessor - WebSocket消息批处理工具类
// 依据: DS-065前端性能优化技术标准 §3.2 WebSocket消息批处理规范
// 创建: 2026-02-07 (P1阶段优化)

import { useRef } from 'react';

export interface WebSocketMessage {
  type: string;
  ticker?: string;
  data?: any;
  timestamp?: string;
}

export interface BatchProcessorOptions {
  /** 批处理最大消息数 (默认50) */
  batchSize?: number;
  /** 批处理超时时间 (ms) (默认100ms) */
  batchTimeout?: number;
  /** 是否启用调试日志 */
  debug?: boolean;
}

export interface ProcessMessageCallback {
  (message: WebSocketMessage): void;
}

/**
 * WebSocket消息批处理器
 * 依据DS-065 §3.2.2标准实现，使用requestAnimationFrame进行批处理
 */
export class WebSocketBatchProcessor {
  private buffer: WebSocketMessage[] = [];
  private batchTimer: number | null = null;
  private readonly batchSize: number;
  private readonly batchTimeout: number;
  private readonly debug: boolean;
  private processCallback: ProcessMessageCallback;
  private stats = {
    messagesProcessed: 0,
    batchesFlushed: 0,
    maxBatchSize: 0,
    totalProcessingTime: 0,
  };

  constructor(callback: ProcessMessageCallback, options: BatchProcessorOptions = {}) {
    this.processCallback = callback;
    this.batchSize = options.batchSize || 50;
    this.batchTimeout = options.batchTimeout || 100; // ms
    this.debug = options.debug || false;
  }

  /**
   * 添加消息到批处理缓冲区
   */
  addMessage(message: WebSocketMessage): void {
    this.buffer.push(message);

    // 依据DS-065 §3.2.2: 达到批处理大小时立即刷新
    if (this.buffer.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      // 使用requestAnimationFrame进行批处理调度
      this.batchTimer = requestAnimationFrame(() => this.flushBatch());
    }

    this.log(`消息添加到缓冲区，当前大小: ${this.buffer.length}`);
  }

  /**
   * 立即刷新缓冲区中的所有消息
   */
  flushBatch(): void {
    if (this.buffer.length === 0) {
      if (this.batchTimer) {
        cancelAnimationFrame(this.batchTimer);
        this.batchTimer = null;
      }
      return;
    }

    const batch = [...this.buffer];
    this.buffer = [];
    this.batchTimer = null;

    // 更新统计信息
    this.stats.batchesFlushed++;
    this.stats.maxBatchSize = Math.max(this.stats.maxBatchSize, batch.length);

    // 依据DS-065 §3.2.2: 在下一帧处理批处理消息
    requestAnimationFrame(() => {
      const startTime = performance.now();
      
      batch.forEach((message, index) => {
        try {
          this.processCallback(message);
          this.stats.messagesProcessed++;
        } catch (error) {
          console.error(`处理WebSocket消息失败 [${message.type}]:`, error);
        }
      });

      const processingTime = performance.now() - startTime;
      this.stats.totalProcessingTime += processingTime;

      this.log(`批处理完成: ${batch.length}条消息, 耗时: ${processingTime.toFixed(2)}ms`);

      // 性能警告：处理时间过长
      if (processingTime > 16.67) { // 60fps的一帧时间
        console.warn(`[Perf] WebSocket批处理耗时 ${processingTime.toFixed(2)}ms > 16.67ms (可能影响动画流畅度)`);
      }
    });
  }

  /**
   * 强制清理缓冲区（用于组件卸载等场景）
   */
  forceFlush(): void {
    if (this.buffer.length > 0) {
      this.log(`强制清理缓冲区: ${this.buffer.length}条消息`);
      this.flushBatch();
    }
  }

  /**
   * 获取处理器统计信息
   */
  getStats() {
    const avgBatchSize = this.stats.batchesFlushed > 0 
      ? this.stats.messagesProcessed / this.stats.batchesFlushed 
      : 0;
    const avgProcessingTime = this.stats.batchesFlushed > 0
      ? this.stats.totalProcessingTime / this.stats.batchesFlushed
      : 0;

    return {
      ...this.stats,
      avgBatchSize,
      avgProcessingTime,
      bufferSize: this.buffer.length,
      hasPendingBatch: this.batchTimer !== null,
    };
  }

  /**
   * 重置处理器状态
   */
  reset(): void {
    this.buffer = [];
    if (this.batchTimer) {
      cancelAnimationFrame(this.batchTimer);
      this.batchTimer = null;
    }
    this.stats = {
      messagesProcessed: 0,
      batchesFlushed: 0,
      maxBatchSize: 0,
      totalProcessingTime: 0,
    };
    this.log('处理器状态已重置');
  }

  /**
   * 调试日志
   */
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[WebSocketBatchProcessor]', ...args);
    }
  }
}

/**
 * React Hook: 使用WebSocket消息批处理
 * 依据DS-065 §3.2标准，集成到现有的useWebSocket hook中
 */
export function useWebSocketBatchProcessor(
  processCallback: ProcessMessageCallback,
  options: BatchProcessorOptions = {}
) {
  const processorRef = useRef<WebSocketBatchProcessor | null>(null);

  if (!processorRef.current) {
    processorRef.current = new WebSocketBatchProcessor(processCallback, {
      batchSize: 50,
      batchTimeout: 100,
      debug: import.meta.env?.MODE === 'development',
      ...options,
    });
  }

  const processor = processorRef.current;

  // 返回处理器方法
  return {
    /**
     * 添加消息到批处理器
     */
    addMessage: (message: WebSocketMessage) => {
      processor.addMessage(message);
    },

    /**
     * 强制刷新批处理器
     */
    flush: () => {
      processor.forceFlush();
    },

    /**
     * 获取统计信息
     */
    getStats: () => processor.getStats(),

    /**
     * 重置处理器
     */
    reset: () => processor.reset(),

    /**
     * 清理函数（用于useEffect清理）
     */
    cleanup: () => {
      processor.forceFlush();
    },
  };
}

/**
 * 性能监控装饰器：为WebSocket消息处理添加性能监控
 */
export function withPerformanceMonitor<
  T extends { addMessage: (msg: WebSocketMessage) => void }
>(processor: T, componentName: string = 'WebSocketProcessor'): T {
  const performanceStats = {
    totalMessages: 0,
    totalProcessingTime: 0,
    maxProcessingTime: 0,
    startTime: 0,
  };

  const monitoredProcessor = {
    ...processor,
    addMessage: (message: WebSocketMessage) => {
      performanceStats.startTime = performance.now();
      
      // 调用原始处理器
      processor.addMessage(message);
      performanceStats.totalMessages++;

      // 记录处理时间
      const processingTime = performance.now() - performanceStats.startTime;
      performanceStats.totalProcessingTime += processingTime;
      performanceStats.maxProcessingTime = Math.max(
        performanceStats.maxProcessingTime,
        processingTime
      );

      // 性能警告
      if (processingTime > 10) { // 超过10ms警告
        console.warn(
          `[Perf] ${componentName} 消息处理时间过长: ${processingTime.toFixed(2)}ms`,
          message
        );
      }

      // 定期报告统计信息
      if (performanceStats.totalMessages % 100 === 0) {
        const avgTime = performanceStats.totalProcessingTime / performanceStats.totalMessages;
        console.log(
          `[Perf] ${componentName} 统计: ${performanceStats.totalMessages}条消息, ` +
          `平均处理时间: ${avgTime.toFixed(2)}ms, ` +
          `最大处理时间: ${performanceStats.maxProcessingTime.toFixed(2)}ms`
        );
      }
    },
  };

  return monitoredProcessor as T;
}