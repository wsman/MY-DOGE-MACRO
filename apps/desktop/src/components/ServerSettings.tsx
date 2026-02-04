// ServerSettings - Migrated to Atomic Design (T-C5.16)
// Uses: FormGroup, Input, Button, Card
// Last Updated: 2026-02-03

import { useState } from 'react';
import { useServerConfig } from '../contexts/ServerConfigContext';
import { FormGroup } from './molecules/FormGroup';
import { Input } from './atoms/Input';
import { Button } from './atoms/Button';
import { Card, CardContent } from './atoms/Card';
import './ServerSettings.css';

export function ServerSettings() {
  const { config, updateConfig, testConnection, isConnected, lastConnected } = useServerConfig();
  const [inputUrl, setInputUrl] = useState(config.baseUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latency: number;
    error?: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    updateConfig({ baseUrl: inputUrl });
    const result = await testConnection();
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    updateConfig({ baseUrl: inputUrl });
    setIsOpen(false);
  };

  const formatLastConnected = () => {
    if (!lastConnected) {
      return '从未连接';
    }
    const diff = Date.now() - lastConnected;
    if (diff < 60000) {
      return `${Math.floor(diff / 1000)}秒前`;
    }
    if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    }
    return `${Math.floor(diff / 3600000)}小时前`;
  };
  const statusLabel = isConnected ? '已连接' : '未连接';

  return (
    <div className="server-settings">
      {/* Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`connection-status-btn connection-status-${isConnected ? 'connected' : 'disconnected'}`}
        title={`点击设置服务器地址\n最后连接: ${formatLastConnected()}`}
      >
        <span className="status--dot"></span>
        <span className="status--text">{statusLabel}</span>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <Card elevation="high" padding="md" className="settings-panel">
          <div className="settings-header">
            <h3>服务器设置</h3>
            <button onClick={() => setIsOpen(false)} className="close-btn">
              &times;
            </button>
          </div>

          <CardContent>
            <FormGroup label="服务器地址" required>
              <Input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:8000"
                fullWidth
              />
            </FormGroup>

            <div className="button-group">
              <Button
                variant="secondary"
                size="md"
                onClick={handleTest}
                disabled={testing}
                fullWidth
              >
                {testing ? '测试中...' : '测试连接'}
              </Button>
              <Button variant="primary" size="md" onClick={handleSave} fullWidth>
                保存
              </Button>
            </div>

            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                <span className="test-result-icon">{testResult.success ? '✓' : '✗'}</span>
                <span>
                  {testResult.success
                    ? `连接成功 (${testResult.latency}ms)`
                    : testResult.error || '连接失败'}
                </span>
              </div>
            )}

            <div className="current-config">
              <small>
                当前配置: {config.baseUrl}
                <br />
                超时: {config.timeout}ms | 重试: {config.retryCount}次
              </small>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ServerSettings;
