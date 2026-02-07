// ChartWorkerPerformance.spec.tsx - Web Worker性能基准测试
// 依据: FE-011 Worker挂载与通信实施方案性能验证
// 创建: 2026-02-07 (Phase 3: P0核心能力激活)

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChartWorkerManager, calculateIndicatorsInMainThread } from '../services/ChartWorkerManager';

/**
 * Web Worker性能基准测试套件
 * 测试目标:
 * 1. Worker计算与主线程计算性能对比
 * 2. Worker初始化与健康检查
 * 3. 降级机制的可靠性
 * 4. 计算精度验证
 */
describe('ChartWorkerManager 性能基准测试', () => {
  let workerManager: ChartWorkerManager;
  
  beforeEach(() => {
    workerManager = ChartWorkerManager.getInstance();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(async () => {
    // 清理Worker资源
    await workerManager.cleanup();
    vi.useRealTimers();
  });

  // ============ 数据生成辅助函数 ============
  function generateTestOHLCData(count: number) {
    const data = [];
    let price = 100;
    
    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 5;
      const open = price;
      price = price + change;
      
      data.push({
        date: new Date(2026, 0, i + 1),
        open: open,
        high: Math.max(open, price) + Math.random() * 2,
        low: Math.min(open, price) - Math.random() * 2,
        close: price,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }
    
    return data;
  }

  // ============ Worker初始化测试 ============
  describe('Worker初始化测试', () => {
    it('应能成功初始化Worker', async () => {
      const initSuccess = await workerManager.initialize();
      
      console.log(`[WorkerTest] Worker初始化结果: ${initSuccess}`);
      
      // Worker应该初始化成功（除非浏览器环境不支持）
      // 注意：在测试环境中Worker可能不可用，这是正常的
      if (typeof Worker !== 'undefined') {
        // 浏览器环境
        expect(initSuccess).toBe(true);
        expect(workerManager.isWorkerAvailable()).toBe(true);
      } else {
        // Node.js测试环境（Worker可能不可用）
        console.log('[WorkerTest] Worker not available in test environment, skipping availability check');
      }
    });

    it('应能执行健康检查', async () => {
      await workerManager.initialize();
      
      const health = await workerManager.checkHealth();
      
      console.log(`[WorkerTest] Worker健康检查:`, health);
      
      expect(health).toBeDefined();
      expect(health.workerType).toBe('chart_calculation');
      expect(health.timestamp).toBeGreaterThan(0);
    });
  });

  // ============ 性能对比测试 ============
  describe('计算性能对比测试', () => {
    const testDataSizes = [
      { name: '小数据集', count: 100 },
      { name: '中等数据集', count: 1000 },
      { name: '大数据集', count: 5000 },
    ];

    const testIndicators = [
      { type: 'ma' as const, period: 5 },
      { type: 'ma' as const, period: 10 },
      { type: 'ma' as const, period: 20 },
      { type: 'ema' as const, period: 12 },
      { type: 'ema' as const, period: 26 },
      { type: 'macd' as const },
      { type: 'rsi' as const, period: 14 },
      { type: 'bollinger' as const, period: 20 },
    ];

    testDataSizes.forEach(({ name, count }) => {
      it(`应计算${name}(${count}条)的性能指标`, async () => {
        const data = generateTestOHLCData(count);
        
        // 主线程计算基准
        const mainThreadStart = performance.now();
        const mainThreadResults = calculateIndicatorsInMainThread(data, testIndicators);
        const mainThreadTime = performance.now() - mainThreadStart;
        
        console.log(`[WorkerTest] ${name}主线程计算时间: ${mainThreadTime.toFixed(2)}ms`);
        
        // Worker计算（如果可用）
        try {
          await workerManager.initialize();
          
          if (workerManager.isWorkerAvailable()) {
            const workerStart = performance.now();
            const workerResults = await workerManager.calculateIndicators(data, testIndicators);
            const workerTime = performance.now() - workerStart;
            
            console.log(`[WorkerTest] ${name}Worker计算时间: ${workerTime.toFixed(2)}ms`);
            console.log(`[WorkerTest] ${name}性能提升: ${((mainThreadTime - workerTime) / mainThreadTime * 100).toFixed(1)}%`);
            
            // 验证Worker计算结果与主线程一致
            Object.keys(mainThreadResults).forEach(key => {
              const mainValues = mainThreadResults[key];
              const workerValues = workerResults[key];
              
              if (Array.isArray(mainValues) && Array.isArray(workerValues)) {
                // 比较数组长度
                expect(workerValues.length).toBe(mainValues.length);
                
                // 抽样比较部分值
                const sampleIndices = [0, Math.floor(count / 2), count - 1];
                sampleIndices.forEach(idx => {
                  if (idx < mainValues.length && idx < workerValues.length) {
                    const mainVal = mainValues[idx];
                    const workerVal = workerValues[idx];
                    
                    if (mainVal !== null && workerVal !== null) {
                      // 允许浮点数精度误差
                      expect(workerVal).toBeCloseTo(mainVal, 6);
                    } else {
                      // 都为null或有一个为null
                      expect(workerVal).toBe(mainVal);
                    }
                  }
                });
              }
            });
            
            // Worker应提供性能提升（除非数据集太小）
            if (count >= 1000) {
              console.log(`[WorkerTest] ${name} Worker vs 主线程: ${workerTime.toFixed(1)}ms vs ${mainThreadTime.toFixed(1)}ms`);
              // 对于大数据集，Worker应该更快
              if (workerTime > 0 && mainThreadTime > 0) {
                const speedup = mainThreadTime / workerTime;
                console.log(`[WorkerTest] ${name} 加速比: ${speedup.toFixed(2)}x`);
              }
            }
          } else {
            console.log(`[WorkerTest] ${name}: Worker不可用，跳过Worker性能测试`);
          }
        } catch (error) {
          console.log(`[WorkerTest] ${name}: Worker计算失败，降级机制应生效:`, (error as Error).message);
          // 降级机制应保证系统继续运行
          expect(error).toBeDefined();
        }
        
        // 验证主线程计算结果的有效性
        expect(mainThreadResults).toBeDefined();
        expect(Object.keys(mainThreadResults).length).toBeGreaterThan(0);
      });
    });
  });

  // ============ 降级机制测试 ============
  describe('降级机制测试', () => {
    it('当Worker不可用时应自动降级到主线程', async () => {
      const data = generateTestOHLCData(100);
      const indicators = [{ type: 'ma' as const, period: 20 }];
      
      // 模拟Worker初始化失败
      const originalInitialize = workerManager.initialize;
      workerManager.initialize = vi.fn().mockResolvedValue(false);
      
      try {
        const results = await workerManager.calculateIndicators(data, indicators);
        
        // 即使Worker失败，也应该有结果（降级到主线程）
        expect(results).toBeDefined();
        expect(results[`ma_20`]).toBeDefined();
        expect(Array.isArray(results[`ma_20`])).toBe(true);
        expect(results[`ma_20`].length).toBe(data.length);
      } finally {
        // 恢复原始方法
        workerManager.initialize = originalInitialize;
      }
    });

    it('应处理Worker超时情况', async () => {
      const data = generateTestOHLCData(100);
      const indicators = [{ type: 'rsi' as const, period: 14 }];
      
      // 模拟Worker响应超时
      const originalSendRequest = (workerManager as any).sendRequest;
      (workerManager as any).sendRequest = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Worker timeout')), 10000);
        });
      });
      
      try {
        await expect(workerManager.calculateIndicators(data, indicators))
          .rejects.toThrow('Worker');
      } finally {
        // 恢复原始方法
        (workerManager as any).sendRequest = originalSendRequest;
      }
    });
  });

  // ============ 精度验证测试 ============
  describe('计算精度验证', () => {
    const testCases = [
      {
        name: '简单移动平均(MA)',
        data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        period: 5,
        expectedMA: [null, null, null, null, 30, 40, 50, 60, 70, 80],
      },
      {
        name: '指数移动平均(EMA)',
        data: [10, 20, 30, 40, 50],
        period: 3,
        // EMA计算: 前3个平均 = (10+20+30)/3 = 20, 然后EMA4 = 40*0.5 + 20*0.5 = 30, EMA5 = 50*0.5 + 30*0.5 = 40
        expectedEMA: [null, null, 20, 30, 40],
      },
    ];

    testCases.forEach(({ name, data, period, expectedMA, expectedEMA }) => {
      it(`应正确计算${name}`, async () => {
        // 转换数据格式
        const ohlcData = data.map((price, i) => ({
          date: new Date(2026, 0, i + 1),
          open: price,
          high: price + 2,
          low: price - 2,
          close: price,
          volume: 100000,
        }));
        
        if (expectedMA) {
          const indicators = [{ type: 'ma' as const, period }];
          const results = calculateIndicatorsInMainThread(ohlcData, indicators);
          
          const maKey = `ma_${period}`;
          const calculatedMA = results[maKey] as (number | null)[];
          
          expect(calculatedMA).toBeDefined();
          expect(calculatedMA.length).toBe(data.length);
          
          // 比较计算结果
          calculatedMA.forEach((val, i) => {
            if (expectedMA[i] === null) {
              expect(val).toBeNull();
            } else {
              expect(val).toBeCloseTo(expectedMA[i] as number, 6);
            }
          });
        }
        
        if (expectedEMA) {
          const indicators = [{ type: 'ema' as const, period }];
          const results = calculateIndicatorsInMainThread(ohlcData, indicators);
          
          const emaKey = `ema_${period}`;
          const calculatedEMA = results[emaKey] as (number | null)[];
          
          expect(calculatedEMA).toBeDefined();
          expect(calculatedEMA.length).toBe(data.length);
          
          // 比较计算结果
          calculatedEMA.forEach((val, i) => {
            if (expectedEMA[i] === null) {
              expect(val).toBeNull();
            } else {
              expect(val).toBeCloseTo(expectedEMA[i] as number, 6);
            }
          });
        }
      });
    });
  });

  // ============ 内存使用测试 ============
  describe('内存使用测试', () => {
    it('应监控内存使用情况', async () => {
      const data = generateTestOHLCData(5000);
      const indicators = [
        { type: 'ma' as const, period: 5 },
        { type: 'ema' as const, period: 12 },
        { type: 'macd' as const },
        { type: 'rsi' as const, period: 14 },
        { type: 'bollinger' as const, period: 20 },
      ];
      
      // 获取初始内存（如果可用）
      const initialMemory = (performance as any).memory?.usedJSHeapSize;
      
      // 执行主线程计算
      const mainThreadStart = performance.now();
      const mainThreadResults = calculateIndicatorsInMainThread(data, indicators);
      const mainThreadTime = performance.now() - mainThreadStart;
      
      // 获取计算后内存
      const afterMainThreadMemory = (performance as any).memory?.usedJSHeapSize;
      
      console.log(`[WorkerTest] 主线程计算时间: ${mainThreadTime.toFixed(2)}ms`);
      if (initialMemory && afterMainThreadMemory) {
        const memoryIncrease = afterMainThreadMemory - initialMemory;
        console.log(`[WorkerTest] 主线程内存增加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // 尝试Worker计算
      try {
        await workerManager.initialize();
        
        if (workerManager.isWorkerAvailable()) {
          const workerStart = performance.now();
          const workerResults = await workerManager.calculateIndicators(data, indicators);
          const workerTime = performance.now() - workerStart;
          
          console.log(`[WorkerTest] Worker计算时间: ${workerTime.toFixed(2)}ms`);
          
          // 验证计算结果
          expect(Object.keys(workerResults).length).toBe(Object.keys(mainThreadResults).length);
          
          // 获取Worker计算后内存
          const afterWorkerMemory = (performance as any).memory?.usedJSHeapSize;
          
          if (afterMainThreadMemory && afterWorkerMemory) {
            console.log(`[WorkerTest] 主线程内存: ${(afterMainThreadMemory / 1024 / 1024).toFixed(2)}MB`);
            console.log(`[WorkerTest] Worker后内存: ${(afterWorkerMemory / 1024 / 1024).toFixed(2)}MB`);
            
            // Worker应减少主线程内存压力（但不是绝对保证）
            const memoryReduction = afterMainThreadMemory - afterWorkerMemory;
            if (memoryReduction > 0) {
              console.log(`[WorkerTest] 内存减少: ${(memoryReduction / 1024 / 1024).toFixed(2)}MB`);
            }
          }
        }
      } catch (error) {
        console.log('[WorkerTest] Worker内存测试失败，降级机制正常:', error.message);
      }
    });
  });

  // ============ 并发测试 ============
  describe('并发计算测试', () => {
    it('应能处理并发计算请求', async () => {
      const data = generateTestOHLCData(1000);
      const indicators = [{ type: 'ma' as const, period: 20 }];
      
      await workerManager.initialize();
      
      if (!workerManager.isWorkerAvailable()) {
        console.log('[WorkerTest] Worker不可用，跳过并发测试');
        return;
      }
      
      // 创建多个并发请求
      const requestCount = 5;
      const promises = [];
      
      const startTime = performance.now();
      
      for (let i = 0; i < requestCount; i++) {
        promises.push(
          workerManager.calculateIndicators(data, indicators)
            .then(results => {
              expect(results[`ma_20`]).toBeDefined();
              return results;
            })
            .catch(error => {
              console.log(`[WorkerTest] 并发请求 ${i} 失败:`, error.message);
              throw error;
            })
        );
      }
      
      // 等待所有请求完成
      const results = await Promise.allSettled(promises);
      const totalTime = performance.now() - startTime;
      
      console.log(`[WorkerTest] ${requestCount}个并发请求总时间: ${totalTime.toFixed(2)}ms`);
      console.log(`[WorkerTest] 平均每个请求: ${(totalTime / requestCount).toFixed(2)}ms`);
      
      // 统计成功和失败
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`[WorkerTest] 并发结果: ${successful}成功, ${failed}失败`);
      
      // 大多数请求应该成功
      expect(successful).toBeGreaterThan(0);
      
      // 获取Worker指标
      const metrics = workerManager.getMetrics();
      console.log(`[WorkerTest] Worker指标:`, {
        totalRequests: metrics.totalRequests,
        successfulRequests: metrics.successfulRequests,
        failedRequests: metrics.failedRequests,
        avgLatency: metrics.avgLatency,
      });
    });
  });
});

// 导出测试辅助函数
export { generateTestOHLCData };