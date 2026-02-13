import React from 'react';
import { useWebSocketContext } from '../../../contexts/WebSocketContext';
import { StatusDot } from '../../atoms/StatusDot';
import { Badge } from '../../atoms/Badge';

export const ConnectionIndicator: React.FC = () => {
  const { status, error, stats, subscriptions } = useWebSocketContext();
  
  const statusConfig = {
    connected: { variant: 'success' as const, label: '已连接', dot: 'connected' as const },
    connecting: { variant: 'warning' as const, label: '连接中', dot: 'loading' as const },
    reconnecting: { variant: 'warning' as const, label: '重连中', dot: 'loading' as const },
    disconnected: { variant: 'neutral' as const, label: '未连接', dot: 'disconnected' as const },
    error: { variant: 'danger' as const, label: '连接错误', dot: 'error' as const },
  };
  
  const config = statusConfig[status];
  
  return (
    <div className="connection-indicator flex items-center gap-2">
      <StatusDot status={config.dot} size="sm" />
      <Badge variant={config.variant} size="sm">
        WS: {config.label}
      </Badge>
      {stats.reconnectAttempts > 0 && status === 'reconnecting' && (
        <span className="text-xs text-[var(--status-warning)]">
          ({stats.reconnectAttempts}/10)
        </span>
      )}
      {status === 'connected' && subscriptions.length > 0 && (
        <span className="text-xs text-[var(--text-secondary)]">
          {subscriptions.length}个订阅
        </span>
      )}
      {error && (
        <span className="text-xs text-[var(--status-error)] truncate max-w-[120px]" title={error}>
          {error}
        </span>
      )}
    </div>
  );
};

export default ConnectionIndicator;