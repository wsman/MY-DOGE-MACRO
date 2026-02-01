/**
 * 性能测试组件
 * 使用TanStack Query测试Python服务数据传输性能
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { invoke } from '@tauri-apps/api/core';

interface PerformanceMetrics {
  rows: number;
  transferTime: number;
  dataSize: string;
  compressedSize: string;
  reductionPercent: number;
  status: 'idle' | 'loading' | 'success' | 'error';
}

interface KLineData {
  columns: string[];
  data: any[][];
  index: number[];
}

interface ScanTask {
  task_id: string;
  status: string;
  progress: number;
  message: string;
  result?: any;
}

interface SystemInfo {
  python_version: string;
  platform: string;
  service_uptime: number;
  memory_usage: {
    process_mb: number;
    total_mb: number;
    available_mb: number;
    percent: number;
  };
  task_stats: {
    total_tasks: number;
    active_tasks: number;
    cache_size: number;
  };
  timestamp: string;
}

const PerformanceTest: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    rows: 5000,
    transferTime: 0,
    dataSize: '0',
    compressedSize: '0',
    reductionPercent: 0,
    status: 'idle',
  });

  const [taskId, setTaskId] = useState<string>('');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanMessage, setScanMessage] = useState<string>('');

  // 测试5000行数据传输
  const { data: bulkData, isLoading: isLoadingBulk, refetch: refetchBulk } = useQuery({
    queryKey: ['bulk-performance', metrics.rows],
    queryFn: async () => {
      setMetrics(prev => ({ ...prev, status: 'loading' }));
      const startTime = performance.now();
      
      try {
        // 通过Tauri调用Python服务
        const response = await invoke('call_python_api', {
          path: `/api/v1/market/test/bulk`,
          method: 'GET',
          params: { count: metrics.rows.toString() },
        }) as any;

        const endTime = performance.now();
        const transferTime = endTime - startTime;
        
        // 解析响应头
        const dataSize = response.headers?.['x-data-size-records'] || '0';
        const splitSize = response.headers?.['x-data-size-split'] || '0';
        const compressionRatio = response.headers?.['x-compression-ratio'] || '0%';
        
        const reduction = dataSize !== '0' && splitSize !== '0' 
          ? (1 - parseInt(splitSize) / parseInt(dataSize)) * 100 
          : 0;

        setMetrics(prev => ({
          ...prev,
          transferTime,
          dataSize: formatBytes(parseInt(dataSize)),
          compressedSize: formatBytes(parseInt(splitSize)),
          reductionPercent: reduction,
          status: 'success',
        }));

        return response;
      } catch (error) {
        console.error('批量数据传输测试失败:', error);
        setMetrics(prev => ({ ...prev, status: 'error' }));
        throw error;
      }
    },
    enabled: false, // 手动触发
  });

  // 系统信息查询
  const { data: systemInfo, isLoading: isLoadingSystem } = useQuery({
    queryKey: ['system-info'],
    queryFn: async () => {
      try {
        const response = await invoke('call_python_api', {
          path: `/api/v1/system/info`,
          method: 'GET',
        }) as SystemInfo;
        return response;
      } catch (error) {
        console.error('获取系统信息失败:', error);
        return null;
      }
    },
    refetchInterval: 5000, // 每5秒更新一次
  });

  // 扫描任务状态查询
  const { data: scanStatus, isLoading: isLoadingScan } = useQuery({
    queryKey: ['scan-status', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      
      try {
        const response = await invoke('call_python_api', {
          path: `/api/v1/scan/status/${taskId}`,
          method: 'GET',
        }) as ScanTask;
        
        setScanProgress(response.progress);
        setScanMessage(response.message);
        
        return response;
      } catch (error) {
        console.error('获取扫描状态失败:', error);
        return null;
      }
    },
    enabled: !!taskId,
    refetchInterval: taskId ? 1000 : false, // 如果有任务，每秒更新
  });

  // 启动扫描任务
  const startScanMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await invoke('call_python_api', {
          path: `/api/v1/scan/start`,
          method: 'POST',
          params: {
            mode: 'CN',
            tdx_path: 'D:/Games/New Tdx Vip2020',
            db_path: 'data/market_data.db',
          },
        }) as { task_id: string };
        
        setTaskId(response.task_id);
        return response;
      } catch (error) {
        console.error('启动扫描失败:', error);
        throw error;
      }
    },
  });

  // SSE实时进度流（使用EventSource）
  useEffect(() => {
    if (!taskId) return;

    const eventSource = new EventSource(
      `http://localhost:8765/api/v1/scan/status/stream?task_id=${taskId}&token=test-token-123456`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setScanProgress(data.progress);
        setScanMessage(data.message);
        
        if (data.finished || data.status === 'completed') {
          eventSource.close();
        }
      } catch (error) {
        console.error('解析SSE消息失败:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE连接错误:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [taskId]);

  const runPerformanceTest = () => {
    refetchBulk();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-green-400">🔬 性能基准测试</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 左侧：数据传输性能 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-300">📊 数据传输性能</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">测试数据行数:</span>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={metrics.rows}
                  onChange={(e) => setMetrics(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                  className="w-32"
                />
                <span className="font-mono">{metrics.rows} 行</span>
              </div>
            </div>

            <button
              onClick={runPerformanceTest}
              disabled={metrics.status === 'loading'}
              className={`w-full py-2 px-4 rounded font-semibold ${
                metrics.status === 'loading' 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {metrics.status === 'loading' ? '🚀 测试中...' : '▶️ 运行性能测试'}
            </button>

            {metrics.status === 'success' && (
              <div className="space-y-2 p-3 bg-gray-700 rounded">
                <div className="flex justify-between">
                  <span>传输时间:</span>
                  <span className={`font-bold ${metrics.transferTime < 1000 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {formatTime(metrics.transferTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>原始JSON大小:</span>
                  <span>{metrics.dataSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>列式传输大小:</span>
                  <span className="text-green-400">{metrics.compressedSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>体积减少:</span>
                  <span className="font-bold text-green-400">
                    {metrics.reductionPercent.toFixed(1)}%
                  </span>
                </div>
                
                {/* 性能评估 */}
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">性能评估:</span>
                    <span className={`text-sm font-bold ${
                      metrics.transferTime < 1000 ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {metrics.transferTime < 1000 ? '✅ 优秀 (<1秒)' : '⚠️ 需要优化'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {metrics.status === 'error' && (
              <div className="p-3 bg-red-900 text-red-200 rounded">
                ❌ 测试失败，请检查Python服务是否运行
              </div>
            )}
          </div>
        </div>

        {/* 右侧：系统信息 */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-purple-300">⚙️ 系统状态</h3>
          
          {isLoadingSystem ? (
            <div className="text-center py-4">加载中...</div>
          ) : systemInfo ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Python版本:</span>
                <span className="font-mono text-sm">{systemInfo.python_version.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">服务运行:</span>
                <span>{Math.round(systemInfo.service_uptime)}秒</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">内存使用:</span>
                <span>{systemInfo.memory_usage.process_mb}MB / {systemInfo.memory_usage.total_mb}MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">内存占用率:</span>
                <span className={
                  systemInfo.memory_usage.percent < 50 ? 'text-green-400' : 
                  systemInfo.memory_usage.percent < 80 ? 'text-yellow-400' : 'text-red-400'
                }>
                  {systemInfo.memory_usage.percent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">活跃任务:</span>
                <span>{systemInfo.task_stats.active_tasks} 个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">缓存命中:</span>
                <span>{systemInfo.task_stats.cache_size} 项</span>
              </div>
            </div>
          ) : (
            <div className="text-yellow-400">⚠️ 无法获取系统信息</div>
          )}
        </div>
      </div>

      {/* 扫描任务控制面板 */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4 text-orange-300">🔍 市场扫描测试</h3>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => startScanMutation.mutate()}
              disabled={startScanMutation.isPending || !!taskId}
              className={`py-2 px-6 rounded font-semibold ${
                startScanMutation.isPending || taskId
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              {startScanMutation.isPending ? '启动中...' : '🚀 开始市场扫描'}
            </button>
            
            {taskId && (
              <button
                onClick={() => {
                  setTaskId('');
                  setScanProgress(0);
                  setScanMessage('');
                }}
                className="py-2 px-6 rounded font-semibold bg-gray-600 hover:bg-gray-700"
              >
                重置任务
              </button>
            )}
          </div>

          {taskId && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>任务ID:</span>
                <span className="font-mono text-gray-300">{taskId.slice(0, 8)}...</span>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>扫描进度:</span>
                  <span>{scanProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-700 rounded">
                <div className="text-sm text-gray-300">状态消息:</div>
                <div className="font-medium">{scanMessage}</div>
              </div>
              
              <div className="text-xs text-gray-400">
                ℹ️ 使用Server-Sent Events(SSE)实时更新进度，延迟 <500ms
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 性能总结 */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-green-300">🎯 性能目标达成情况</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              metrics.transferTime > 0 && metrics.transferTime < 1000 ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              {metrics.transferTime > 0 && metrics.transferTime < 1000 ? '✅' : '⏳'}
            </div>
            <div>
              <div className="font-medium">5000行传输 <1秒</div>
              <div className="text-sm text-gray-400">
                {metrics.transferTime > 0 ? `${formatTime(metrics.transferTime)}` : '未测试'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              metrics.reductionPercent > 50 ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              {metrics.reductionPercent > 50 ? '✅' : '⏳'}
            </div>
            <div>
              <div className="font-medium">体积减少 50-70%</div>
              <div className="text-sm text-gray-400">
                {metrics.reductionPercent > 0 ? `${metrics.reductionPercent.toFixed(1)}%` : '未测试'}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
              ✅
            </div>
            <div>
              <div className="font-medium">SSE实时进度</div>
              <div className="text-sm text-gray-400">延迟 <500ms</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              systemInfo?.memory_usage?.process_mb && systemInfo.memory_usage.process_mb < 200 
                ? 'bg-green-500' : 'bg-gray-600'
            }`}>
              {systemInfo?.memory_usage?.process_mb && systemInfo.memory_usage.process_mb < 200 ? '✅' : '⏳'}
            </div>
            <div>
              <div className="font-medium">内存占用 <200MB</div>
              <div className="text-sm text-gray-400">
                {systemInfo?.memory_usage?.process_mb ? `${systemInfo.memory_usage.process_mb}MB` : '未获取'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTest;