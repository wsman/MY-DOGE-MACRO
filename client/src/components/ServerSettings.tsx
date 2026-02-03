import React, { useState, useEffect } from 'react';
import { useServerConfig } from '../contexts/ServerConfigContext';

export function ServerSettings() {
  const { config, updateConfig, testConnection, isConnected, lastConnected } = useServerConfig();
  const [inputUrl, setInputUrl] = useState(config.baseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; error?: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    // 先更新URL
    updateConfig({ baseUrl: inputUrl });
    
    // 测试连接
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    updateConfig({ baseUrl: inputUrl });
    setIsOpen(false);
  };

  const formatLastConnected = () => {
    if (!lastConnected) return '从未连接';
    const diff = Date.now() - lastConnected;
    if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    return `${Math.floor(diff / 3600000)}小时前`;
  };

  return (
    <div className="server-settings">
      {/* 状态指示器按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`connection-status-btn ${isConnected ? 'connected' : 'disconnected'}`}
        title={`点击设置服务器地址\n最后连接: ${formatLastConnected()}`}
      >
        <span className="status-dot"></span>
        <span className="status-text">
          {isConnected ? '已连接' : '未连接'}
        </span>
      </button>

      {/* 设置面板 */}
      {isOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>服务器设置</h3>
            <button onClick={() => setIsOpen(false)} className="close-btn">&times;</button>
          </div>

          <div className="settings-body">
            <div className="form-group">
              <label htmlFor="server-url">服务器地址</label>
              <input
                id="server-url"
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="server-url-input"
              />
            </div>

            <div className="button-group">
              <button
                onClick={handleTest}
                disabled={testing}
                className="test-btn"
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
              <button onClick={handleSave} className="save-btn">
                保存
              </button>
            </div>

            {/* 测试结果 */}
            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                <span className="result-icon">{testResult.success ? '✓' : '✗'}</span>
                <span className="result-text">
                  {testResult.success 
                    ? `连接成功 (${testResult.latency}ms)` 
                    : `连接失败: ${testResult.error}`
                  }
                </span>
              </div>
            )}

            {/* 当前配置信息 */}
            <div className="current-config">
              <small>
                当前配置: {config.baseUrl}<br/>
                超时: {config.timeout}ms | 重试: {config.retryCount}次
              </small>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .server-settings {
          position: relative;
          display: inline-block;
        }

        .connection-status-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .connection-status-btn.connected {
          background: rgba(0, 212, 170, 0.2);
          color: #00d4aa;
        }

        .connection-status-btn.disconnected {
          background: rgba(255, 100, 100, 0.2);
          color: #ff6464;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }

        .settings-panel {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: #1a1f26;
          border: 1px solid #2d333b;
          border-radius: 8px;
          min-width: 280px;
          z-index: 1000;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #2d333b;
        }

        .settings-header h3 {
          margin: 0;
          font-size: 14px;
          color: #e7e9ea;
        }

        .close-btn {
          background: none;
          border: none;
          color: #71767b;
          font-size: 20px;
          cursor: pointer;
        }

        .settings-body {
          padding: 16px;
        }

        .form-group {
          margin-bottom: 12px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 12px;
          color: #71767b;
        }

        .server-url-input {
          width: 100%;
          padding: 8px 12px;
          background: #242b33;
          border: 1px solid #2d333b;
          border-radius: 6px;
          color: #e7e9ea;
          font-size: 14px;
        }

        .server-url-input:focus {
          outline: none;
          border-color: #00d4aa;
        }

        .button-group {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
        }

        .test-btn, .save-btn {
          flex: 1;
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .test-btn {
          background: #2d333b;
          color: #e7e9ea;
        }

        .test-btn:hover:not(:disabled) {
          background: #3d444b;
        }

        .test-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-btn {
          background: #00d4aa;
          color: #0f1419;
          font-weight: 500;
        }

        .save-btn:hover {
          background: #00e4b5;
        }

        .test-result {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .test-result.success {
          background: rgba(0, 212, 170, 0.1);
          color: #00d4aa;
        }

        .test-result.error {
          background: rgba(255, 100, 100, 0.1);
          color: #ff6464;
        }

        .current-config {
          color: #71767b;
          padding-top: 8px;
          border-top: 1px solid #2d333b;
        }
      `}</style>
    </div>
  );
}
