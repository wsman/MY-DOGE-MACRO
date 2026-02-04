// ServiceStatus - Migrated to Atomic Design (T-C5.17)
// Uses: StatusIndicator molecule, Card, Badge
// Last Updated: 2026-02-03

import React, { useEffect, useState, useCallback, memo } from 'react';
import { api } from '../services/api';
import { SystemStatusPanel } from './molecules/StatusIndicator';
import { Card, CardTitle, CardContent } from './atoms/Card';
import { Badge } from './atoms/Badge';
import { Button } from './atoms/Button';
import './ServiceStatus.css';

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

// StatusBadge wrapper for service status
const ServiceStatusBadge: React.FC<{ status: ServiceStatusData['status'] }> = ({ status }) => {
  const variant =
    status === 'online'
      ? 'success'
      : status === 'offline'
        ? 'danger'
        : status === 'error'
          ? 'warning'
          : 'info';
  const label =
    status === 'online'
      ? '在线'
      : status === 'offline'
        ? '离线'
        : status === 'error'
          ? '错误'
          : '加载中';
  return (
    <Badge variant={variant} size="sm">
      {label}
    </Badge>
  );
};

// Main Service Status Component
const ServiceStatusContent: React.FC<{
  data: ServiceStatusData;
  onRefresh: () => void;
  isAutoRefresh: boolean;
  onToggleAutoRefresh: () => void;
}> = memo(({ data, onRefresh, isAutoRefresh, onToggleAutoRefresh }) => {
  const formatTime = (date: Date | null) => {
    if (!date) {
      return '从未检查';
    }
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const latencyColor = data.latency < 100 ? 'success' : data.latency < 500 ? 'warning' : 'danger';

  const statusItems: Array<{
    id: string;
    label: string;
    status: 'online' | 'offline' | 'error' | 'warning' | 'loading';
    timestamp?: string;
    description?: string;
  }> = [
    {
      id: 'connection',
      label: 'Python服务',
      status: (data.status === 'online'
        ? 'online'
        : data.status === 'offline'
          ? 'offline'
          : data.status === 'error'
            ? 'warning'
            : 'loading') as 'online' | 'offline' | 'error' | 'warning' | 'loading',
      timestamp: formatTime(data.lastChecked),
      description: data.status === 'online' ? `${data.latency}ms` : data.errorMessage || undefined,
    },
  ];

  return (
    <div className="service-status">
      {/* Header */}
      <div className="service-status-header">
        <div className="service-status-title">
          <ServiceStatusBadge status={data.status} />
          <h3>Python服务状态</h3>
        </div>
        <div className="service-status-controls">
          <span className="service-status-poll">{isAutoRefresh ? '自动刷新' : '手动刷新'}</span>
          <Button
            size="sm"
            variant={isAutoRefresh ? 'primary' : 'secondary'}
            onClick={onToggleAutoRefresh}
          >
            {isAutoRefresh ? '开' : '关'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={data.status === 'loading'}
          >
            {data.status === 'loading' ? '检查中...' : '刷新'}
          </Button>
        </div>
      </div>

      {/* Status Panel */}
      <Card padding="md" elevation="low">
        <SystemStatusPanel items={statusItems} />
      </Card>

      {/* Performance Metrics */}
      <Card padding="md" elevation="low" className="service-metrics">
        <CardTitle>性能指标</CardTitle>
        <CardContent>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">响应延迟</span>
              <Badge variant={latencyColor} size="sm">
                {data.latency}ms
              </Badge>
            </div>
            <div className="metric-item">
              <span className="metric-label">连接状态</span>
              <Badge variant={data.status === 'online' ? 'success' : 'danger'} size="sm">
                {data.status.toUpperCase()}
              </Badge>
            </div>
            <div className="metric-item">
              <span className="metric-label">轮询频率</span>
              <span className="metric-value">30秒</span>
            </div>
          </div>

          {/* Latency Bar */}
          <div className="latency-bar">
            <div className="latency-bar-header">
              <span>延迟评估</span>
              <span>
                {data.latency < 100
                  ? '优秀'
                  : data.latency < 300
                    ? '良好'
                    : data.latency < 500
                      ? '一般'
                      : '较差'}
              </span>
            </div>
            <div className="latency-bar-track">
              <div
                className={`latency-bar-fill latency-${latencyColor}`}
                style={{ width: `${Math.min(100, data.latency / 10)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Config Info */}
      {data.config && (
        <Card padding="md" elevation="low" className="service-config">
          <CardTitle>服务配置</CardTitle>
          <CardContent>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">API端口</span>
                <span className="config-value">{data.config.port}</span>
              </div>
              <div className="config-item">
                <span className="config-label">API地址</span>
                <span className="config-value">{data.config.api_url}</span>
              </div>
              <div className="config-item config-full">
                <span className="config-label">认证令牌</span>
                <span className="config-value">{data.config.token_preview}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Suggestion */}
      {data.status !== 'online' && (
        <Card padding="md" elevation="low" className="service-suggestion">
          <CardTitle>故障排查建议</CardTitle>
          <CardContent>
            <ul className="suggestion-list">
              <li>检查Python服务是否已启动</li>
              <li>验证网络连接和防火墙设置</li>
              <li>确认端口{data.config?.port}未被其他程序占用</li>
              <li>查看控制台日志获取详细错误信息</li>
              <li>尝试重启应用程序</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// Main Component
const ServiceStatus: React.FC = () => {
  const [statusData, setStatusData] = useState<ServiceStatusData>({
    status: 'loading',
    latency: 0,
    lastChecked: null,
    config: null,
    errorMessage: null,
  });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Initialize config
  useEffect(() => {
    const initConfig = async () => {
      try {
        const config = api.getConfig();
        if (config) {
          setStatusData((prev) => ({
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

  // Health check
  const performHealthCheck = useCallback(async () => {
    try {
      setStatusData((prev) => ({ ...prev, status: 'loading' }));
      const startTime = Date.now();
      const result = await api.testConnection();
      const latency = Date.now() - startTime;

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
      setStatusData({
        status: 'offline',
        latency: 0,
        lastChecked: new Date(),
        config: statusData.config,
        errorMessage: error instanceof Error ? error.message : '未知错误',
      });
    }
  }, [statusData.config]);

  // Polling
  useEffect(() => {
    if (!isAutoRefresh) {
      return;
    }
    performHealthCheck();
    const interval = setInterval(performHealthCheck, 30000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, performHealthCheck]);

  const handleManualRefresh = useCallback(() => {
    performHealthCheck();
  }, [performHealthCheck]);

  const handleToggleAutoRefresh = useCallback(() => {
    setIsAutoRefresh((prev) => !prev);
  }, []);

  return (
    <ServiceStatusContent
      data={statusData}
      onRefresh={handleManualRefresh}
      isAutoRefresh={isAutoRefresh}
      onToggleAutoRefresh={handleToggleAutoRefresh}
    />
  );
};

export default ServiceStatus;
export { ServiceStatus };
