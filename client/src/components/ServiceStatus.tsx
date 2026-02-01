/**
 * 服务状态监控组件 - 优化版本
 * 使用 React.memo 防止不必要的重渲染
 * T-C2.3: Frontend Chart Memoization
 */

import React, { useEffect, useState, memo, useCallback } from 'react';
import { api } from '../services/api';

interface ServiceStatusData {
  status: 'online' | 'offline' | 'loading' | 'error';
  latency: number;
  lastChecked: Date | null;
  config: {
    port: number;
    api_url: string;
    token_preview: string;
  } | null;
  errorMessage: string | null;
}

// ============ StatusIndicator - 独立的纯展示组件 ============
interface StatusIndicatorProps {
  data: ServiceStatusData;
  onRefresh: () => void;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = memo(({
  data,
  onRefresh,
  isAutoRefresh,
  onToggleAutoRefresh
}) => {
  // 状态指示器颜色
  const getStatusColor = () => {
    switch (data.status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'error': return 'bg-yellow-500';
      case 'loading': return 'bg-blue-500 animate-pulse';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'online': return `CORE CONNECTED (${data.latency}ms)`;
      case 'offline': return 'CORE DISCONNECTED';
      case 'error': return 'CONNECTION ERROR';
      case 'loading': return 'CHECKING...';
      default: return 'UNKNOWN STATUS';
    }
  };

  const getStatusDetail = () => {
    if (data.errorMessage) return data.errorMessage;
    switch (data.status) {
      case 'online': return `Python服务运行正常，延迟${data.latency}ms`;
      case 'offline': return '无法连接到Python服务，请检查服务是否运行';
      case 'error': return '服务连接异常，请检查网络和配置';
      case 'loading': return '正在检测服务状态...';
      default: return '未知状态';
    }
  };

  const formatTime = (date: Date | null) => {
    if (!date) return '从未检查';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    // 只在状态变化时更新轮询计数
    setPollingCount(prev => prev + 1);
  }, [data.status, data.latency]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <h3 className="text-lg font-semibold text-white">Python服务状态</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            轮询: {pollingCount}次
          </span>
          <button
            onClick={onToggleAutoRefresh}
            className={`px-2 py-1 text-xs rounded ${isAutoRefresh ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isAutoRefresh ? '自动刷新: 开' : '自动刷新: 关'}
          </button>
          <button
            onClick={onRefresh}
            disabled={data.status === 'loading'}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded"
          >
            {data.status === 'loading' ? '检查中...' : '立即刷新'}
          </button>
        </div>
      </div>

      {/* 主状态指示器 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className={`text-sm font-medium ${data.status === 'online' ? 'text-green-400' : data.status === 'error' ? 'text-yellow-400' : 'text-red-400'}`}>
              {getStatusText()}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            最后检查: {formatTime(data.lastChecked)}
          </span>
        </div>
        <div className="text-sm text-gray-300 pl-7">
          {getStatusDetail()}
        </div>
      </div>

      {/* 配置信息 */}
      {data.config && (
        <ConfigInfo config={data.config} />
      )}

      {/* 性能指标 */}
      <PerformanceMetrics data={data} />
    </div>
  );
}, (prev, next) => {
  // 自定义比较函数 - 只有这些字段变化时才重渲染
  const prevData = prev.data;
  const nextData = next.data;
  
  return (
    prevData.status === nextData.status &&
    prevData.latency === nextData.latency &&
    prevData.errorMessage === nextData.errorMessage &&
    prev.isAutoRefresh === next.isAutoRefresh
  );
});

// ============ ConfigInfo - 纯展示组件 ============
interface ConfigInfoProps {
  config: ServiceStatusData['config'];
}

const ConfigInfo: React.FC<ConfigInfoProps> = memo(({ config }) => {
  if (!config) return null;

  return (
    <div className="bg-gray-900 rounded p-3 mb-4">
      <div className="text-sm font-medium text-gray-400 mb-2">服务配置</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500">API端口</div>
          <div className="text-blue-300 font-mono">{config.port}</div>
        </div>
        <div>
          <div className="text-gray-500">API地址</div>
          <div className="text-blue-300 font-mono truncate">{config.api_url}</div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-500">认证令牌</div>
          <div className="text-gray-400 font-mono text-xs truncate">{config.token_preview}</div>
        </div>
      </div>
    </div>
  );
});

// ============ PerformanceMetrics - 纯展示组件 ============
interface PerformanceMetricsProps {
  data: ServiceStatusData;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = memo(({ data }) => {
  return (
    <div className="bg-gray-900 rounded p-3">
      <div className="text-sm font-medium text-gray-400 mb-2">性能指标</div>
      <div className="flex items-center justify-between text-sm">
        <div>
          <div className="text-gray-500">响应延迟</div>
          <div className={`font-mono ${data.latency < 100 ? 'text-green-400' : data.latency < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
            {data.latency}ms
          </div>
        </div>
        <div>
          <div className="text-gray-500">连接状态</div>
          <div className={data.status === 'online' ? 'text-green-400' : 'text-red-400'}>
            {data.status.toUpperCase()}
          </div>
        </div>
        <div>
          <div className="text-gray-500">轮询频率</div>
          <div className="text-gray-300">30秒</div>
        </div>
      </div>
      
      {/* 延迟进度条 */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>延迟评估</span>
          <span>
            {data.latency < 100 ? '优秀' : 
             data.latency < 300 ? '良好' : 
             data.latency < 500 ? '一般' : '较差'}
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className={`h-full rounded-full ${
              data.latency < 100 ? 'bg-green-500' : 
              data.latency < 300 ? 'bg-yellow-500' : 
              'bg-red-500'
            }`}
            style={{ width: `${Math.min(100, data.latency / 10)}%` }}
          />
        </div>
      </div>
    </div>
  );
});

// ============ 主组件 - 使用 useCallback 优化 ============
const ServiceStatus: React.FC = () => {
  const [statusData, setStatusData] = useState<ServiceStatusData>({
    status: 'loading',
    latency: 0,
    lastChecked: null,
    config: null,
    errorMessage: null,
  });

  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // 初始化获取配置 (只执行一次)
  useEffect(() => {
    const initConfig = async () => {
      try {
        const config = api.getConfig();
        if (config) {
          setStatusData(prev => ({
            ...prev,
            config: {
              port: config.port,
              api_url: `http://localhost:${config.port}`,
              token_preview: config.token.substring(0, 12) + '...',
            },
          }));
        }
      } catch (error) {
        console.error('初始化配置失败:', error);
      }
    };

    initConfig();
  }, []);

  // 健康检查函数 (使用 useCallback 保持引用稳定)
  const performHealthCheck = useCallback(async () => {
    try {
      setStatusData(prev => ({ ...prev, status: 'loading' }));
      
      const startTime = Date.now();
      const result = await api.testConnection();
      const latency = result.latency;
      
      if (result.success) {
        setStatusData({
          status: 'online',
          latency,
          lastChecked: new Date(),
          config: statusData.config,
          errorMessage: null,
        });
      } else {
        setStatusData({
          status: 'error',
          latency,
          lastChecked: new Date(),
          config: statusData.config,
          errorMessage: result.message,
        });
      }
    } catch (error) {
      console.error('健康检查失败:', error);
      setStatusData({
        status: 'offline',
        latency: 0,
        lastChecked: new Date(),
        config: statusData.config,
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });
    }
  }, [statusData.config]);

  // 轮询健康检查 (只依赖 isAutoRefresh)
  useEffect(() => {
    if (!isAutoRefresh) return;

    performHealthCheck();
    const interval = setInterval(performHealthCheck, 30000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, performHealthCheck]);

  // 手动刷新
  const handleManualRefresh = useCallback(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  // 切换自动刷新
  const handleToggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh(prev => !prev);
  }, []);

  // 状态建议 (纯展示)
  const renderStatusSuggestion = () => {
    if (statusData.status === 'online') return null;

    return (
      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded">
        <div className="text-sm font-medium text-yellow-300 mb-1">⚠️ 故障排查建议</div>
        <ul className="text-xs text-yellow-200 space-y-1 list-disc list-inside">
          <li>检查Python服务是否已启动</li>
          <li>验证网络连接和防火墙设置</li>
          <li>确认端口{statusData.config?.port}未被其他程序占用</li>
          <li>查看控制台日志获取详细错误信息</li>
          <li>尝试重启应用程序</li>
        </ul>
      </div>
    );
  };

  return (
    <>
      <StatusIndicator
        data={statusData}
        onRefresh={handleManualRefresh}
        isAutoRefresh={isAutoRefresh}
        onToggleAutoRefresh={handleToggleAutoRefresh}
      />
      {renderStatusSuggestion()}
    </>
  );
};

// 使用 memo 包装整个组件
const MemoizedServiceStatus = memo(ServiceStatus);

export default MemoizedServiceStatus;
export { MemoizedServiceStatus as ServiceStatus };
