// SyncPanel - 数据同步面板 Organism
// Created: 2026-02-06 (v1.9.0)

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle, CardContent } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { StatusDot } from '../atoms/StatusDot';
import { apiClient } from '../../services/api';
import './SyncPanel.css';

interface SyncStatus {
  enabled: boolean;
  repository: string | null;
  branch: string;
  last_sync: {
    timestamp: string;
    status: string;
    files_pulled: number;
    files_pushed: number;
  } | null;
  permissions: {
    role: string;
    can_push: boolean;
    can_configure: boolean;
  };
  auto_sync: {
    enabled: boolean;
    interval_minutes: number;
  } | null;
}

interface SyncPanelProps {
  onSyncComplete?: () => void;
}

export const SyncPanel: React.FC<SyncPanelProps> = ({ onSyncComplete }) => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState(false);
  
  // 配置表单状态
  const [configForm, setConfigForm] = useState({
    repository: '',
    branch: 'main',
    enabled: false
  });

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const data = await apiClient.get<SyncStatus>('/api/v1/sync/status');
      setStatus(data);
      setConfigForm({
        repository: data.repository || '',
        branch: data.branch || 'main',
        enabled: data.enabled
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sync status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const triggerSync = async (direction: 'pull' | 'push' | 'both') => {
    if (!status?.enabled) {
      setError('Remote sync not enabled. Configure repository first.');
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      await apiClient.post('/api/v1/sync/trigger', { direction });
      
      // 轮询等待完成
      setTimeout(async () => {
        await fetchStatus();
        setSyncing(false);
        onSyncComplete?.();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Sync failed');
      setSyncing(false);
    }
  };

  const saveConfig = async () => {
    try {
      setError(null);
      await apiClient.post('/api/v1/sync/config', {
        repository: configForm.repository,
        branch: configForm.branch,
        enabled: configForm.enabled
      });
      setConfiguring(false);
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || 'Failed to save config');
    }
  };

  const rebuildIndex = async () => {
    try {
      setError(null);
      await apiClient.post('/api/v1/sync/rebuild-index');
      setTimeout(fetchStatus, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to rebuild index');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return (
      <Card className="sync-panel">
        <CardContent>
          <div className="sync-panel__loading">
            <StatusDot status="loading" />
            <span>加载同步状态...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sync-panel">
      <CardTitle className="sync-panel__header">
        <div className="sync-panel__title">
          <span>📡 数据同步</span>
          <Badge 
            variant={status?.enabled ? 'success' : 'secondary'} 
            size="sm"
          >
            {status?.enabled ? '已启用' : '未启用'}
          </Badge>
        </div>
        <div className="sync-panel__actions-header">
          {status?.permissions.can_configure && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setConfiguring(!configuring)}
            >
              ⚙️ 配置
            </Button>
          )}
        </div>
      </CardTitle>

      <CardContent className="sync-panel__content">
        {error && (
          <div className="sync-panel__error">
            <span>❌ {error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>✕</Button>
          </div>
        )}

        {/* 配置表单 */}
        {configuring && status?.permissions.can_configure && (
          <div className="sync-panel__config">
            <h4>同步配置</h4>
            <div className="sync-panel__config-form">
              <label>
                <span>GitHub 仓库</span>
                <input
                  type="text"
                  placeholder="owner/repo"
                  value={configForm.repository}
                  onChange={(e) => setConfigForm({ ...configForm, repository: e.target.value })}
                />
              </label>
              <label>
                <span>分支</span>
                <input
                  type="text"
                  placeholder="main"
                  value={configForm.branch}
                  onChange={(e) => setConfigForm({ ...configForm, branch: e.target.value })}
                />
              </label>
              <label className="sync-panel__checkbox">
                <input
                  type="checkbox"
                  checked={configForm.enabled}
                  onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                />
                <span>启用远程同步</span>
              </label>
              <div className="sync-panel__config-actions">
                <Button variant="primary" size="sm" onClick={saveConfig}>
                  保存配置
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfiguring(false)}>
                  取消
                </Button>
              </div>
            </div>
            <p className="sync-panel__config-hint">
              提示: 需要在环境变量中设置 <code>GITHUB_PAT</code> (Personal Access Token)
            </p>
          </div>
        )}

        {/* 状态信息 */}
        <div className="sync-panel__info">
          <div className="sync-panel__info-row">
            <span className="sync-panel__label">仓库:</span>
            <span className="sync-panel__value">
              {status?.repository || <em>未配置</em>}
            </span>
          </div>
          <div className="sync-panel__info-row">
            <span className="sync-panel__label">分支:</span>
            <span className="sync-panel__value">{status?.branch || 'main'}</span>
          </div>
          <div className="sync-panel__info-row">
            <span className="sync-panel__label">角色:</span>
            <Badge variant={status?.permissions.role === 'admin' ? 'primary' : 'secondary'} size="sm">
              {status?.permissions.role || 'user'}
            </Badge>
          </div>
          
          {status?.last_sync && (
            <>
              <div className="sync-panel__divider" />
              <div className="sync-panel__info-row">
                <span className="sync-panel__label">上次同步:</span>
                <span className="sync-panel__value">
                  {formatDate(status.last_sync.timestamp)}
                </span>
              </div>
              <div className="sync-panel__info-row">
                <span className="sync-panel__label">状态:</span>
                <Badge 
                  variant={status.last_sync.status === 'success' ? 'success' : 'warning'} 
                  size="sm"
                >
                  {status.last_sync.status}
                </Badge>
              </div>
              <div className="sync-panel__info-row">
                <span className="sync-panel__label">文件:</span>
                <span className="sync-panel__value">
                  ↓ {status.last_sync.files_pulled} / ↑ {status.last_sync.files_pushed}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="sync-panel__actions">
          <Button
            variant="secondary"
            size="md"
            onClick={() => triggerSync('pull')}
            disabled={syncing || !status?.enabled}
          >
            {syncing ? '同步中...' : '↓ 拉取'}
          </Button>
          
          {status?.permissions.can_push && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => triggerSync('push')}
              disabled={syncing || !status?.enabled}
            >
              {syncing ? '同步中...' : '↑ 推送'}
            </Button>
          )}
          
          <Button
            variant="primary"
            size="md"
            onClick={() => triggerSync('both')}
            disabled={syncing || !status?.enabled || !status?.permissions.can_push}
          >
            {syncing ? '同步中...' : '⇅ 双向同步'}
          </Button>
        </div>

        {/* 高级操作 */}
        <div className="sync-panel__advanced">
          <Button variant="ghost" size="sm" onClick={rebuildIndex}>
            🔄 重建索引
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchStatus}>
            刷新状态
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncPanel;
