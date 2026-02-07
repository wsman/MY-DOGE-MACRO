// PerformanceMonitor - Frontend Performance Monitoring System
// Based on: DS-065 Frontend Performance Optimization Standard §4.1
// Created: 2026-02-07 (P1 Phase Optimization)
// Fixed: 2026-02-07 (Fixed TypeScript compilation errors)

import React from 'react';
import { useEffect, useRef } from 'react';

/**
 * Performance metrics data structure
 */
export interface PerformanceMetrics {
  // Rendering performance
  fps: number;
  componentRenderTime: Record<string, number>;
  
  // Memory usage
  memoryUsedJSHeap: number;
  memoryTotalJSHeap: number;
  
  // Network performance
  websocketLatency: number;
  messageProcessingTime: number;
  
  // User interaction
  interactionResponseTime: number;
  animationSmoothness: number;
  
  // System metrics
  cpuUsage: number;
  timestamp: number;
}

/**
 * Performance threshold configuration
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
 * Performance monitoring event type
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
 * Performance monitor configuration options
 */
export interface PerformanceMonitorOptions {
  enabled?: boolean;
  samplingInterval?: number;
  thresholds?: Partial<PerformanceThresholds>;
  logToConsole?: boolean;
  reportToServer?: boolean;
  serverEndpoint?: string;
}

/**
 * High-performance frontend performance monitor
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
      logToConsole: false,
      reportToServer: false,
      serverEndpoint: '/api/metrics',
      ...options,
    };

    // Determine if in development mode - avoid using process to prevent TypeScript errors
    if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development') {
      this.options.logToConsole = true;
    }

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
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (!this.options.enabled) return;

    this.startFPSMonitoring();
    this.startSampling();
    this.startMemoryMonitoring();
    this.setupVisibilityChangeHandler();
  }

  /**
   * Start FPS monitoring
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
   * Start periodic sampling
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
   * Start memory monitoring
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

      setInterval(sampleMemory, 10000);
      sampleMemory();
    }
  }

  /**
   * Setup page visibility change handler
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
   * Sample all metrics
   */
  private sampleMetrics(): void {
    this.estimateCPUUsage();
    this.updateAnimationSmoothness();
    this.checkThresholds();
    this.reportMetrics();
  }

  /**
   * Estimate CPU usage
   */
  private estimateCPUUsage(): void {
    const targetFPS = 60;
    const currentFPS = this.metrics.fps;
    const cpuEstimate = Math.max(0, Math.min(1, (targetFPS - currentFPS) / targetFPS));
    this.updateMetric('cpuUsage', cpuEstimate * 100);
  }

  /**
   * Update animation smoothness metric
   */
  private updateAnimationSmoothness(): void {
    const targetFPS = 60;
    const currentFPS = this.metrics.fps;
    const smoothness = Math.min(1, currentFPS / targetFPS);
    this.updateMetric('animationSmoothness', smoothness);
  }

  /**
   * Update a metric
   */
  updateMetric<K extends keyof PerformanceMetrics>(metric: K, value: PerformanceMetrics[K]): void {
    const oldValue = this.metrics[metric];
    this.metrics[metric] = value;
    this.metrics.timestamp = Date.now();

    this.emitEvent({
      type: 'metric',
      metric,
      value: value as number,
      timestamp: Date.now(),
    });

    this.checkMetricThreshold(metric, value as number, oldValue as number);
  }

  /**
   * Report component render time
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

    if (renderTime > 100) {
      this.emitEvent({
        type: 'warning',
        metric: 'componentRenderTime',
        value: renderTime,
        timestamp: Date.now(),
        message: `${componentName} render time too long: ${renderTime.toFixed(2)}ms`,
        component: componentName,
      });
    }
  }

  /**
   * Report WebSocket latency
   */
  reportWebSocketLatency(latency: number): void {
    this.updateMetric('websocketLatency', latency);
  }

  /**
   * Report message processing time
   */
  reportMessageProcessingTime(processingTime: number): void {
    this.updateMetric('messageProcessingTime', processingTime);
  }

  /**
   * Report interaction response time
   */
  reportInteractionResponseTime(responseTime: number): void {
    this.updateMetric('interactionResponseTime', responseTime);
  }

  /**
   * Check metric threshold
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
        message: `${metric} below error threshold: ${value} <= ${thresholds.error}`,
      });
    } else if (value <= thresholds.warning) {
      this.emitEvent({
        type: 'warning',
        metric,
        value,
        timestamp: Date.now(),
        message: `${metric} below warning threshold: ${value} <= ${thresholds.warning}`,
      });
    }
  }

  /**
   * Check all thresholds
   */
  private checkThresholds(): void {
    Object.entries(this.thresholds).forEach(([metric, threshold]) => {
      const value = this.metrics[metric as keyof PerformanceMetrics] as number;
      if (value !== undefined) {
        this.checkMetricThreshold(metric as keyof PerformanceMetrics, value, value);
      }
    });
  }

  /**
   * Report metrics
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
      fetch(this.options.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.metrics),
      }).catch(error => {
        console.error('Performance metrics reporting failed:', error);
      });
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(event: PerformanceEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  /**
   * Add event listener
   */
  addEventListener(listener: (event: PerformanceEvent) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: PerformanceEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    status: 'healthy' | 'warning' | 'error';
    issues: PerformanceEvent[];
  } {
    const issues: PerformanceEvent[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

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
            message: `${metric} below error threshold`,
          });
        } else if (value <= threshold.warning && status !== 'error') {
          status = 'warning';
          issues.push({
            type: 'warning',
            metric: metric as keyof PerformanceMetrics,
            value,
            timestamp: Date.now(),
            message: `${metric} below warning threshold`,
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
   * Pause monitoring
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
   * Resume monitoring
   */
  resume(): void {
    if (this.isEnabled) return;
    
    this.startFPSMonitoring();
    this.startSampling();
    this.isEnabled = true;
  }

  /**
   * Destroy monitor
   */
  destroy(): void {
    this.pause();
    this.listeners = [];
  }
}

/**
 * React Hook: Use performance monitor
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
    return () => {
      monitor.destroy();
    };
  }, []);

  return monitorRef.current;
}

/**
 * Performance monitoring decorator - Fixed to avoid TypeScript JSX generic parsing issues
 */
export function withPerformanceMonitoring<P extends Record<string, any>>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string = 'Component'
): React.ComponentType<P> {
  const displayName = `WithPerformanceMonitoring(${WrappedComponent.displayName || componentName})`;
  
  const MonitoredComponent: React.ComponentType<P> = (props: P) => {
    const startTime = useRef(performance.now());
    
    useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      
      const globalMonitor = (window as any).__performanceMonitor as PerformanceMonitor;
      if (globalMonitor) {
        globalMonitor.reportComponentRenderTime(componentName, renderTime);
      }
      
      startTime.current = performance.now();
    });
    
    // Use React.createElement to avoid JSX generic parsing issues
    return React.createElement(WrappedComponent, props);
  };
  
  MonitoredComponent.displayName = displayName;
  return MonitoredComponent;
}

// Global performance monitor instance
let globalMonitor: PerformanceMonitor | null = null;

/**
 * Initialize global performance monitor
 */
export function initGlobalPerformanceMonitor(options: PerformanceMonitorOptions = {}): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(options);
    (window as any).__performanceMonitor = globalMonitor;
  }
  return globalMonitor;
}

/**
 * Get global performance monitor
 */
export function getGlobalPerformanceMonitor(): PerformanceMonitor | null {
  return globalMonitor || (window as any).__performanceMonitor || null;
}

export default PerformanceMonitor;