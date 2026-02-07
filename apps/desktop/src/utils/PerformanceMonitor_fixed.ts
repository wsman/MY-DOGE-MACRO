// PerformanceMonitor - 前端性能监控系统
// 依据: DS-065前端性能优化技术标准 §4.1 监控指标体系
// 创建: 2026-02-07 (P1阶段优化)
// 修复: 2026-02-07 (修复TypeScript编译错误)

import { useEffect, useRef } from 'react';

/**
 * 性能指标数据结构
 * 依据DS-065 §4.1.1: 运行时监控指标
 */
export interface PerformanceMetrics {
  // 渲染性能
  fps: number;
  componentRenderTime: Record<string, number>;
  
  // 内存使用
  memoryUsedJSHeap: number;
  memoryTotalJSHeap: number;
  
  // 网络性能
  websocketLatency: number;
  messageProcessingTime: number;
  
  // 用户交互
  interactionResponseTime: number;
  animationSmoothness: number;
  
  // 系统指标
  cpuUsage: number;
  timestamp: number;
}

/**
 * 性能阈值配置
 * 依据DS-065 §4.1.2: 关键阈值
 */
export interface PerformanceThresholds {
  fps: {
    warning: number;
    error: number;
  };
  memory: {
    warning: number;
    error: number;
  };
  responseTime: {
    warning: number;
    error: number;
  };
  latency: {
    warning: number;
    error: number;
  };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: {
    warning: 55,
    error: 30,
  },
  memory: {
    warning: 200 * 1024 * 1024, // 200MB
    error: 300 * 1024 * 1024,   // 300MB
  },
  responseTime: {
    warning: 150,
    error: 300,
  },
  latency: {
    warning: 150,
    error: 300,
  },
};

/**
 * 性能监控事件类型
 */
export type PerformanceEvent = {
  type: 'metric' | 'warning' | 'error';
  metric: keyof PerformanceMetrics;
  value: number;
  timestamp: number;
  message?: string;
  component?: string;
};

/**
 * 性能监控配置选项
 */
export interface PerformanceMonitorOptions {
  /** 是否启用监控 */
  enabled?: boolean;
  /** 采样频率 (ms) */
  samplingInterval?: number;
  /** 阈值配置 */
  thresholds?: Partial<PerformanceThresholds>;
  /** 是否上报到控制台 */
  logToConsole?: boolean;
  /** 是否上报到远程服务器 */
  reportToServer?: boolean;
  /** 服务器端点 */
  serverEndpoint?: string;
}

/**
 * 高性能前端性能监控器
 * 依据DS-065 §4.1标准实现
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private thresholds: PerformanceThresholds;
  private options: Required<PerformanceMonitorOptions>;
  private listeners: Array<(event: PerformanceEvent) => void> = [];
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private fpsTimer: number | null = null;
  private samplingTimer: number | null = null;
  private isEnabled: boolean = true;

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      enabled: true,
      samplingInterval: 1000,
      thresholds: {},
      logToConsole: import.meta.env?.MODE === 'development',
      reportToServer: false,
      serverEndpoint: '/api/metrics',
      ...options,
    };

    this.thresholds = { ...DEFAULT_THRESHOLDS, ...this.options.thresholds };

    this.metrics = {
      fps: 60,
      componentRenderTime: {},
      memoryUsedJSHeap: 0,
      memoryTotalJSHeap: 0,
      websocketLatency: 0,
      messageProcessingTime: 0,
      interactionResponseTime: 0,
      animationSmoothness: 1,
      cpuUsage: 0,
      timestamp: Date.now(),
    };

    this.initialize();
  }

  /**
   * 初始化性能监控
   */
  private initialize(): void {
    if (!this.options.enabled) return;

    // 启动FPS监控
    this.startFPSMonitoring();
    
    // 启动定期采样
    this.startSampling();
    
    // 监听内存变化
    this.startMemoryMonitoring();
    
    // 监听页面可见性变化
    this.setupVisibilityChangeHandler();
  }

  /**
   * 启动FPS监控
   */
  private startFPSMonitoring(): void {
    this.lastFrameTime = performance.now();
    
    const measureFPS = () => {
      this.frameCount++;
      const currentTime = performance.now();
      const elapsedTime = currentTime - this.lastFrameTime;

      if (elapsedTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / elapsedTime);
        this.updateMetric('fps', fps);
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      this.fpsTimer = requestAnimationFrame(measureFPS);
    };

    this.fpsTimer = requestAnimationFrame(measureFPS);
  }

  /**
   * 启动定期采样
   */
  private startSampling(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
    }

    this.samplingTimer = setInterval(() => {
      this.sampleMetrics();
    }, this.options.samplingInterval) as unknown as number;
  }

  /**
   * 启动内存监控
   */
  private startMemoryMonitoring(): void {
    if ('memory' in performance) {
      const memoryPerformance = performance as any;
      
      const sampleMemory = () => {
        if (memoryPerformance.memory) {
          const memory = memoryPerformance.memory;
          this.updateMetric('memoryUsedJSHeap', memory.usedJSHeapSize);
          this.updateMetric('memoryTotalJSHeap', memory.totalJSHeapSize);
        }
      };

      // 每10秒采样一次内存
      setInterval(sampleMemory, 10000);
      sampleMemory(); // 立即采样一次
    }
  }

  /**
   * 设置页面可见性变化处理器
   */
  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  /**
   * 采样所有指标
   */
  private sampleMetrics(): void {
    // 更新CPU使用率估计
    this.estimateCPUUsage();
    
    // 更新动画平滑度
    this.updateAnimationSmoothness();
    
    // 检查阈值并触发事件
    this.checkThresholds();
    
    // 上报指标
    this.reportMetrics();
  }

  /**
   * 估算CPU使用率
   */
  private estimateCPUUsage(): void {
    // 简单估算：通过计算帧率下降来估计CPU压力
    const targetFPS = 60;
    const currentFPS = this.metrics.fps;
    const cpuEstimate = Math.max(0, Math.min(1, (targetFPS - currentFPS) / targetFPS));
    
    this.updateMetric('cpuUsage', cpuEstimate * 100);
  }

  /**
   * 更新动画平滑度指标
   */
  private updateAnimationSmoothness(): void {
    // 简单估算：基于帧率稳定性
    const targetFPS = 60;
    const currentFPS = this.metrics.fps;
    const smoothness = Math.min(1, currentFPS / targetFPS);
    
    this.updateMetric('animationSmoothness', smoothness);
  }

  /**
   * 更新指标
   */
  updateMetric<K extends keyof PerformanceMetrics>(metric: K, value: PerformanceMetrics[K]): void {
    const oldValue = this.metrics[metric];
    this.metrics[metric] = value;
    this.metrics.timestamp = Date.now();

    // 触发指标更新事件
    this.emitEvent({
      type: 'metric',
      metric,
      value: value as number,
      timestamp: Date.now(),
    });

    // 检查阈值
    this.checkMetricThreshold(metric, value as number, oldValue as number);
  }

  /**
   * 更新组件渲染时间
   */
  reportComponentRenderTime(componentName: string, renderTime: number): void {
    this.metrics.componentRenderTime[componentName] = renderTime;
    
    this.emitEvent({
      type: 'metric',
      metric: 'componentRenderTime',
      value: renderTime,
      timestamp: Date.now(),
      component: componentName,
    });

    // 性能警告：渲染时间过长
    if (renderTime > 100) {
      this.emitEvent({
        type: 'warning',
        metric: 'componentRenderTime',
        value: renderTime,
        timestamp: Date.now(),
        message: `${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`,
        component: componentName,
      });
    }
  }

  /**
   * 报告WebSocket延迟
   */
  reportWebSocketLatency(latency: number): void {
    this.updateMetric('websocketLatency', latency);
  }

  /**
   * 报告消息处理时间
   */
  reportMessageProcessingTime(processingTime: number): void {
    this.updateMetric('messageProcessingTime', processingTime);
  }

  /**
   * 报告交互响应时间
   */
  reportInteractionResponseTime(responseTime: number): void {
    this.updateMetric('interactionResponseTime', responseTime);
  }

  /**
   * 检查指标阈值
   */
  private checkMetricThreshold(metric: keyof PerformanceMetrics, value: number, oldValue: number): void {
    const thresholds = this.thresholds[metric as keyof PerformanceThresholds];
    
    if (!thresholds) return;

    if (value <= thresholds.error) {
      this.emitEvent({
        type: 'error',
        metric,
        value,
        timestamp: Date.now(),
        message: `${metric} 低于错误阈值: ${value} <= ${thresholds.error}`,
      });
    } else if (value <= thresholds.warning) {
      this.emitEvent({
        type: 'warning',
        metric,
        value,
        timestamp: Date.now(),
        message: `${metric} 低于警告阈值: ${value} <= ${thresholds.warning}`,
      });
    }
  }

  /**
   * 检查所有阈值
   */
  private checkThresholds(): void {
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const value = this.metrics[metric as keyof PerformanceMetrics] as number;
      
      if (value !== undefined) {
        this.checkMetricThreshold(
          metric as keyof PerformanceMetrics,
          value,
          value
        );
      }
    });
  }

  /**
   * 上报指标
   */
  private reportMetrics(): void {
    if (this.options.logToConsole) {
      console.log('[Perf Metrics]', {
        fps: this.metrics.fps,
        memory: `${Math.round(this.metrics.memoryUsedJSHeap / 1024 / 1024)}MB`,
        latency: `${this.metrics.websocketLatency}ms`,
        timestamp: new Date(this.metrics.timestamp).toISOString(),
      });
    }

    if (this.options.reportToServer && this.options.serverEndpoint) {
      // 在实际项目中，这里应该发送到服务器
      fetch(this.options.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.metrics),
      }).catch(error => {
        console.error('性能指标上报失败:', error);
      });
    }
  }

  /**
   * 发送事件
   */
  private emitEvent(event: PerformanceEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: (event: PerformanceEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: (event: PerformanceEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 获取当前指标
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    status: 'healthy' | 'warning' | 'error';
    issues: PerformanceEvent[];
  } {
    const issues: PerformanceEvent[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    // 检查每个指标
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const value = this.metrics[metric as keyof PerformanceMetrics] as number;
      
      if (value !== undefined) {
        if (value <= threshold.error) {
          status = 'error';
          issues.push({
            type: 'error',
            metric: metric as keyof PerformanceMetrics,
            value,
            timestamp: Date.now(),
            message: `${metric} 低于错误阈值`,
          });
        } else if (value <= threshold.warning && status !== 'error') {
          status = 'warning';
          issues.push({
            type: 'warning',
            metric: metric as keyof PerformanceMetrics,
            value,
            timestamp: Date.now(),
            message: `${metric} 低于警告阈值`,
          });
        }
      }
    });

    return {
      metrics: { ...this.metrics },
      status,
      issues,
    };
  }

  /**
   * 暂停监控
   */
  pause(): void {
    if (this.fpsTimer) {
      cancelAnimationFrame(this.fpsTimer);
      this.fpsTimer = null;
    }
    
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
    }
    
    this.isEnabled = false;
  }

  /**
   * 恢复监控
   */
  resume(): void {
    if (this.isEnabled) return;
    
    this.startFPSMonitoring();
    this.startSampling();
    this.isEnabled = true;
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    this.pause();
    this.listeners = [];
  }
}

/**
 * React Hook: 使用性能监控
 */
export function usePerformanceMonitor(
  options: PerformanceMonitorOptions = {}
): PerformanceMonitor {
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  if (!monitorRef.current) {
    monitorRef.current = new PerformanceMonitor(options);
  }

  useEffect(() => {
    const monitor = monitorRef.current!;
    
    // 组件卸载时清理
    return () => {
      monitor.destroy();
    };
  }, []);

  return monitorRef.current;
}

/**
 * 性能监控装饰器：为组件添加性能监控
 */
export function withPerformanceMonitoring<P>(
  Component: React.ComponentType<P>,
  componentName: string = 'Component'
): React.ComponentType<P> {
  const displayName = `WithPerformanceMonitoring(${Component.displayName || componentName})`;
  
  const WrappedComponent: React.ComponentType<P> = (props: P) => {
    const startTime = useRef(performance.now());
    
    useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      
      // 全局监控器实例
      const globalMonitor = (window as any).__performanceMonitor as PerformanceMonitor;
      if (globalMonitor) {
        globalMonitor.reportComponentRenderTime(componentName, renderTime);
      }
      
      // 控制台日志
      if (import.meta.env?.MODE === 'development') {
        console.log(`[Perf] ${componentName} 渲染时间: ${renderTime.toFixed(2)}ms`);
        
        if (renderTime > 100) {
          console.warn(`[Perf Warning] ${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`);
        }
      }
      
      // 重置时间
      startTime.current = performance.now();
    });
    
    // 修复TypeScript错误：确保正确返回JSX元素
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = displayName;
  return WrappedComponent;
}

// 全局性能监控器实例
let globalMonitor: PerformanceMonitor | null = null;

/**
 * 初始化全局性能监控器
 */
export function initGlobalPerformanceMonitor(options: PerformanceMonitorOptions = {}): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(options);
    (window as any).__performanceMonitor = globalMonitor;
  }
  return globalMonitor;
}

/**
 * 获取全局性能监控器
 */
export function getGlobalPerformanceMonitor(): PerformanceMonitor | null {
  return globalMonitor || (window as any).__performanceMonitor || null;
}

export default PerformanceMonitor;