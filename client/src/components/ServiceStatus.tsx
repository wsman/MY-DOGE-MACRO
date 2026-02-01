/**
 * 服务状态监控组件
 * 实时显示Python服务连接状态和性能指标
 */

import { useEffect, useState } from 'react';
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

const ServiceStatus = () => {
  const [statusData, setStatusData] = useState<ServiceStatusData>({
    status: 'loading',
    latency: 0,
    lastChecked: null,
    config: null,
    errorMessage: null,
  });

  const [pollingCount, setPollingCount] = useState(0);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // 初始化获取配置
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

  // 健康检查函数
  const performHealthCheck = async () => {
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
  };

  // 轮询健康检查
  useEffect(() => {
    if (!isAutoRefresh) return;

    // 初始检查
    performHealthCheck();

    // 设置轮询间隔
    const interval = setInterval(() => {
      setPollingCount(prev => prev + 1);
      performHealthCheck();
    }, 30000); // 30秒轮询

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // 手动刷新
  const handleManualRefresh = () => {
    performHealthCheck();
  };

  // 状态指示器颜色
  const getStatusColor = () => {
    switch (statusData.status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      case 'loading':
        return 'bg-blue-500 animate-pulse';
      default:
        return 'bg-gray-500';
    }
  };

  // 状态文字描述
  const getStatusText = () => {
    switch (statusData.status) {
      case 'online':
        return `CORE CONNECTED (${statusData.latency}ms)`;
      case 'offline':
        return 'CORE DISCONNECTED';
      case 'error':
        return 'CONNECTION ERROR';
      case 'loading':
        return 'CHECKING...';
      default:
        return 'UNKNOWN STATUS';
    }
  };

  // 状态详细描述
  const getStatusDetail = () => {
    if (statusData.errorMessage) {
      return statusData.errorMessage;
    }
    
    switch (statusData.status) {
      case 'online':
        return `Python服务运行正常，延迟${statusData.latency}ms`;
      case 'offline':
        return '无法连接到Python服务，请检查服务是否运行';
      case 'error':
        return '服务连接异常，请检查网络和配置';
      case 'loading':
        return '正在检测服务状态...';
      default:
        return '未知状态';
    }
  };

  // 格式化时间
  const formatTime = (date: Date | null) => {
    if (!date) return '从未检查';
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

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
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-2 py-1 text-xs rounded ${isAutoRefresh ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isAutoRefresh ? '自动刷新: 开' : '自动刷新: 关'}
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={statusData.status === 'loading'}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded"
          >
            {statusData.status === 'loading' ? '检查中...' : '立即刷新'}
          </button>
        </div>
      </div>

      {/* 主状态指示器 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className={`text-sm font-medium ${statusData.status === 'online' ? 'text-green-400' : statusData.status === 'error' ? 'text-yellow-400' : 'text-red-400'}`}>
              {getStatusText()}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            最后检查: {formatTime(statusData.lastChecked)}
          </span>
        </div>
        <div className="text-sm text-gray-300 pl-7">
          {getStatusDetail()}
        </div>
      </div>

      {/* 配置信息 */}
      {statusData.config && (
        <div className="bg-gray-900 rounded p-3 mb-4">
          <div className="text-sm font-medium text-gray-400 mb-2">服务配置</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500">API端口</div>
              <div className="text-blue-300 font-mono">{statusData.config.port}</div>
            </div>
            <div>
              <div className="text-gray-500">API地址</div>
              <div className="text-blue-300 font-mono truncate">{statusData.config.api_url}</div>
            </div>
            <div className="col-span-2">
              <div className="text-gray-500">认证令牌</div>
              <div className="text-gray-400 font-mono text-xs truncate">{statusData.config.token_preview}</div>
            </div>
          </div>
        </div>
      )}

      {/* 性能指标 */}
      <div className="bg-gray-900 rounded p-3">
        <div className="text-sm font-medium text-gray-400 mb-2">性能指标</div>
        <div className="flex items-center justify-between text-sm">
          <div>
            <div className="text-gray-500">响应延迟</div>
            <div className={`font-mono ${statusData.latency < 100 ? 'text-green-400' : statusData.latency < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
              {statusData.latency}ms
            </div>
          </div>
          <div>
            <div className="text-gray-500">连接状态</div>
            <div className={statusData.status === 'online' ? 'text-green-400' : 'text-red-400'}>
              {statusData.status.toUpperCase()}
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
              {statusData.latency < 100 ? '优秀' : 
               statusData.latency < 300 ? '良好' : 
               statusData.latency < 500 ? '一般' : '较差'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-full rounded-full ${
                statusData.latency < 100 ? 'bg-green-500' : 
                statusData.latency < 300 ? 'bg-yellow-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(100, statusData.latency / 10)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 状态建议 */}
      {statusData.status !== 'online' && (
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
      )}
    </div>
  );
};

export default ServiceStatus;