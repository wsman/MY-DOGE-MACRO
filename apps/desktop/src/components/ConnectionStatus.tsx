// ConnectionStatus - Migrated to Atomic Design (T-C5.15)
// Uses: StatusDot atom
// Last Updated: 2026-02-03

import React from 'react';
import { StatusDot } from './atoms/StatusDot';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  /** Connection state */
  isConnected: boolean;
  /** Last connected timestamp */
  lastConnected?: Date | null;
  /** Server URL */
  serverUrl?: string;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Show timestamp */
  showTimestamp?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastConnected,
  serverUrl,
  size = 'md',
  showTimestamp = true,
}) => {
  const formatTime = () => {
    if (!lastConnected) {
      return 'N/A';
    }
    const date = new Date(lastConnected);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const label = isConnected ? '已连接' : '未连接';
  const displayUrl = serverUrl?.replace('http://', '').replace('https://', '');

  return (
    <div className={`connection-status connection-status-${size}`}>
      <StatusDot
        status={isConnected ? 'connected' : 'disconnected'}
        size={size === 'sm' ? 'sm' : 'md'}
        pulse={isConnected}
      />

      <div className="connection-status-info">
        <span className="connection-status-label">{label}</span>
        {displayUrl && (
          <span className="connection-status-url" title={serverUrl}>
            {displayUrl}
          </span>
        )}
      </div>

      {showTimestamp && <div className="connection-status-timestamp">{formatTime()}</div>}
    </div>
  );
};

// Legacy wrapper for backward compatibility
export function ConnectionStatusLegacy() {
  const { isConnected, lastConnected, config } =
    require('../contexts/ServerConfigContext').useServerConfig();

  return (
    <ConnectionStatus
      isConnected={isConnected}
      lastConnected={lastConnected}
      serverUrl={config.baseUrl}
    />
  );
}

export default ConnectionStatus;
