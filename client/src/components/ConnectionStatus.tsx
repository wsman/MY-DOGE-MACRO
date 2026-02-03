import React from 'react';
import { useServerConfig } from '../contexts/ServerConfigContext';

export function ConnectionStatus() {
  const { isConnected, lastConnected, config } = useServerConfig();

  const formatTime = () => {
    if (!lastConnected) return 'N/A';
    const date = new Date(lastConnected);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <span className="pulse"></span>
        <span className="dot"></span>
      </div>
      
      <div className="status-info">
        <span className="status-label">
          {isConnected ? '已连接' : '未连接'}
        </span>
        <span className="server-url" title={config.baseUrl}>
          {config.baseUrl.replace('http://', '').replace('https://', '')}
        </span>
      </div>

      <div className="last-check">
        {formatTime()}
      </div>

      <style>{`
        .connection-status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 20px;
          font-size: 12px;
        }

        .connection-status.connected {
          border: 1px solid rgba(0, 212, 170, 0.3);
        }

        .connection-status.disconnected {
          border: 1px solid rgba(255, 100, 100, 0.3);
        }

        .status-indicator {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .connected .dot {
          background: #00d4aa;
        }

        .disconnected .dot {
          background: #ff6464;
        }

        .pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .connected .pulse {
          background: rgba(0, 212, 170, 0.4);
        }

        .disconnected .pulse {
          background: rgba(255, 100, 100, 0.4);
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .status-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .status-label {
          font-weight: 500;
          color: #e7e9ea;
        }

        .server-url {
          color: #71767b;
          font-size: 10px;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .last-check {
          color: #71767b;
          font-size: 10px;
          padding-left: 8px;
          border-left: 1px solid #2d333b;
        }
      `}</style>
    </div>
  );
}
