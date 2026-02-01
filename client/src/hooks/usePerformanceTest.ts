import { useCallback, useRef } from 'react';

export const usePerformanceTest = () => {
  const renderTimeRef = useRef<number>(0);
  const sortTimeRef = useRef<number>(0);
  
  // 测量渲染性能
  const measureRenderPerformance = useCallback(() => {
    const start = performance.now();
    // 模拟渲染完成后触发测量
    requestAnimationFrame(() => {
      const end = performance.now();
      renderTimeRef.current = end - start;
      console.log(`📊 虚拟滚动渲染时间: ${renderTimeRef.current.toFixed(2)}ms`);
    });
  }, []);
  
  // 测量排序性能
  const measureSortPerformance = useCallback((dataCount: number, sortTime: number) => {
    sortTimeRef.current = sortTime;
    console.log(`📊 排序${dataCount}行数据时间: ${sortTime.toFixed(2)}ms`);
    return sortTime;
  }, []);
  
  // 计算FPS
  const measureFPS = useCallback((duration: number = 1000) => {
    let frameCount = 0;
    let fps = 0;
    
    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - startTime < duration) {
        requestAnimationFrame(measure);
      } else {
        fps = Math.round((frameCount * 1000) / (now - startTime));
        console.log(`📊 平均FPS: ${fps}`);
      }
    };
    
    const startTime = performance.now();
    requestAnimationFrame(measure);
    
    return fps;
  }, []);
  
  // 内存使用估计
  const estimateMemoryUsage = useCallback((dataCount: number) => {
    // 每行数据的内存占用估算（字节）
    const bytesPerRow = 100; // 保守估计
    const totalBytes = dataCount * bytesPerRow;
    const totalMB = totalBytes / (1024 * 1024);
    
    console.log(`💾 估计内存占用: ${totalMB.toFixed(2)}MB (${dataCount}行)`);
    return totalMB;
  }, []);
  
  // 综合性能报告
  const generatePerformanceReport = useCallback((dataCount: number) => {
    return {
      timestamp: new Date().toISOString(),
      dataCount,
      renderTime: renderTimeRef.current,
      sortTime: sortTimeRef.current,
      estimatedMemoryMB: estimateMemoryUsage(dataCount),
      recommendations: renderTimeRef.current > 100 ? 
        '⚠️ 渲染时间偏长，建议优化虚拟滚动配置' : 
        '✅ 渲染性能优秀'
    };
  }, [estimateMemoryUsage]);
  
  return {
    measureRenderPerformance,
    measureSortPerformance,
    measureFPS,
    estimateMemoryUsage,
    generatePerformanceReport,
    getRenderTime: () => renderTimeRef.current,
    getSortTime: () => sortTimeRef.current
  };
};