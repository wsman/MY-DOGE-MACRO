// PerformanceMonitor - Frontend Performance Monitoring System
// Based on DS-065 Frontend Performance Optimization Standard
// Created: 2026-02-07
// Fixed: 2026-02-07 (TypeScript compilation errors)

import React from 'react';
import { useEffect, useRef } from 'react';

export interface PerformanceMetrics {
  fps: number;
  componentRenderTime: Record<string, number>;
  memoryUsedJSHeap: number;
  memoryTotalJSHeap: number;
  websocketLatency: number;
  messageProcessingTime: number;
  interactionResponseTime: number;
  animationSmoothness: number;
  cpuUsage: number;
  timestamp: number;
}

export interface PerformanceThresholds {
  fps: { warning: number; error: number };
  memory: { warning: number; error: number };
  responseTime: { warning: number; error: number };
  latency: { warning: number; error: number };
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fps: { warning: 55, error: 30 },
  memory: { warning: 200 * 1024 * 1024, error: 300 * 1024 * 1024 },
  responseTime: { warning: 150, error: 300 },
  latency: { warning: 150, error: 300 },
};

export type PerformanceEvent = {
  type: 'metric' | 'warning' | 'error';
  metric: keyof PerformanceMetrics;
  value: number;
  timestamp: number;
  message?: string;
  component?: string;
};

export interface PerformanceMonitorOptions {
  enabled?: boolean;
  samplingInterval?: number;
  thresholds?: Partial<PerformanceThresholds>;
  logToConsole?: boolean;
  reportToServer?: boolean;
  serverEndpoint?: string;
}

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

    // Check if we're in development mode
    try {
      // Try Vite's import.meta.env first
      const viteEnv = (globalThis as any).import?.meta?.env;
      if (viteEnv && viteEnv.MODE === 'development') {
        this.options.logToConsole = true;
      }
      // Fallback to Node.js process.env
      else if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        this.options.logToConsole = true;
      }
    } catch {
      // Ignore errors in environment detection
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

  private initialize(): void {
    if (!this.options.enabled) return;
    this.startFPSMonitoring();
    this.startSampling();
    this.startMemoryMonitoring();
    this.setupVisibilityChangeHandler();
  }

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

  private startSampling(): void {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
    }

    this.samplingTimer = setInterval(() => {
      this.sampleMetrics();
    }, this.options.samplingInterval) as unknown as number;
  }

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

  private setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  private sampleMetrics(): void {
    this.estimateCPUUsage();
    this.updateAnimationSmoothness();
    this.checkThresholds();
    this.reportMetrics();
  }

  private estimateCPUUsage(): void {
    const targetFPS = 60;
    const currentFPS = this.metrics.fps;
    const cpuEstimate = Math.max(0, Math.min(1, (targetFPS - currentFPS) / targetFPS));
    this.updateMetric('cpuUsage', cpuEstimate * 100);
  }

  private updateAnimationSmoothness(): void {
    const targetFPS = 60;
    const currentFPS = this.metrics.fps;
    const smoothness = Math.min(1, currentFPS / targetFPS);
    this.updateMetric('animationSmoothness', smoothness);
  }

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

  reportWebSocketLatency(latency: number): void {
    this.updateMetric('websocketLatency', latency);
  }

  reportMessageProcessingTime(processingTime: number): void {
    this.updateMetric('messageProcessingTime', processingTime);
  }

  reportInteractionResponseTime(responseTime: number): void {
    this.updateMetric('interactionResponseTime', responseTime);
  }

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

  private checkThresholds(): void {
    for (const [metric, threshold] of Object.entries(this.thresholds)) {
      const value = this.metrics[metric as keyof PerformanceMetrics] as number;
      if (value !== undefined) {
        this.checkMetricThreshold(metric as keyof PerformanceMetrics, value, value);
      }
    }
  }

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

  private emitEvent(event: PerformanceEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  addEventListener(listener: (event: PerformanceEvent) => void): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: (event: PerformanceEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    status: 'healthy' | 'warning' | 'error';
    issues: PerformanceEvent[];
  } {
    const issues: PerformanceEvent[] = [];
    let status: 'healthy' | 'warning' | 'error' = 'healthy';

    for (const [metric, threshold] of Object.entries(this.thresholds)) {
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
    }

    return {
      metrics: { ...this.metrics },
      status,
      issues,
    };
  }

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

  resume(): void {
    if (this.isEnabled) return;
    
    this.startFPSMonitoring();
    this.startSampling();
    this.isEnabled = true;
  }

  destroy(): void {
    this.pause();
    this.listeners = [];
  }
}

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

export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string = 'Component'
): React.ComponentType<P> {
  const displayName = `WithPerformanceMonitoring(${Component.displayName || componentName})`;
  
  const WrappedComponent: React.ComponentType<P> = (props: P) => {
    const startTime = useRef(performance.now());
    
    useEffect(() => {
      const renderTime = performance.now() - startTime.current;
      
      const globalMonitor = (globalThis as any).__performanceMonitor as PerformanceMonitor;
      if (globalMonitor) {
        globalMonitor.reportComponentRenderTime(componentName, renderTime);
      }
      
      startTime.current = performance.now();
    });
    
    return React.createElement(Component, props);
  };
  
  WrappedComponent.displayName = displayName;
  return WrappedComponent;
}

let globalMonitor: PerformanceMonitor | null = null;

export function initGlobalPerformanceMonitor(options: PerformanceMonitorOptions = {}): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(options);
    (globalThis as any).__performanceMonitor = globalMonitor;
  }
  return globalMonitor;
}

export function getGlobalPerformanceMonitor(): PerformanceMonitor | null {
  return globalMonitor || (globalThis as any).__performanceMonitor || null;
}

export default PerformanceMonitor;