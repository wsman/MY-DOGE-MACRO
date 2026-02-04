import React, { useState } from 'react';
import { useUIStore } from '../../stores/ui.store';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const { theme, setTheme, sidebarOpen, toggleSidebar, statusBarVisible, toggleStatusBar } =
    useUIStore();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // 保存API key到localStorage
    if (apiKey) {
      localStorage.setItem('deepseek_api_key', apiKey);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`settings-panel ${isDark ? 'dark' : 'light'}`}>
      <div className="settings-header">
        <h2>⚙️ 设置</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div className="settings-content">
        {/* 外观设置 */}
        <section className="settings-section">
          <h3>🎨 外观</h3>
          <div className="setting-item">
            <label>主题模式</label>
            <div className="theme-options">
              <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
                🌙 深色
              </button>
              <button
                className={theme === 'light' ? 'active' : ''}
                onClick={() => setTheme('light')}
              >
                ☀️ 浅色
              </button>
              <button
                className={theme === 'system' ? 'active' : ''}
                onClick={() => setTheme('system')}
              >
                💻 系统
              </button>
            </div>
          </div>

          <div className="setting-item">
            <label>侧边栏</label>
            <button className={sidebarOpen ? 'active' : ''} onClick={toggleSidebar}>
              {sidebarOpen ? '显示' : '隐藏'}
            </button>
          </div>

          <div className="setting-item">
            <label>状态栏</label>
            <button className={statusBarVisible ? 'active' : ''} onClick={toggleStatusBar}>
              {statusBarVisible ? '显示' : '隐藏'}
            </button>
          </div>
        </section>

        {/* API设置 */}
        <section className="settings-section">
          <h3>🔑 API 配置</h3>
          <div className="setting-item">
            <label>DeepSeek API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <small>用于AI策略报告生成</small>
          </div>

          <button className="save-btn" onClick={handleSave}>
            {saved ? '✅ 已保存' : '💾 保存设置'}
          </button>
        </section>

        {/* 数据设置 */}
        <section className="settings-section">
          <h3>📊 数据设置</h3>
          <div className="setting-item">
            <label>默认市场</label>
            <select defaultValue="us">
              <option value="us">美股</option>
              <option value="cn">A股</option>
              <option value="crypto">加密货币</option>
            </select>
          </div>

          <div className="setting-item">
            <label>数据刷新间隔</label>
            <select defaultValue="60">
              <option value="30">30秒</option>
              <option value="60">1分钟</option>
              <option value="300">5分钟</option>
              <option value="900">15分钟</option>
            </select>
          </div>
        </section>

        {/* 关于 */}
        <section className="settings-section">
          <h3>ℹ️ 关于</h3>
          <div className="about-info">
            <p>
              <strong>MY-DOGE-MICRO</strong>
            </p>
            <p>版本: v1.0.0</p>
            <p>CDD Framework: v1.5.0</p>
            <p>基于宪法驱动开发</p>
          </div>
        </section>
      </div>

      <style>{`
        .settings-panel {
          width: 320px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .settings-panel.dark {
          background: #1a1a2e;
          color: #e0e0e0;
        }
        
        .settings-panel.light {
          background: #f5f5f5;
          color: #333;
        }
        
        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid rgba(128,128,128,0.2);
        }
        
        .settings-header h2 {
          margin: 0;
          font-size: 1.1rem;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          opacity: 0.7;
        }
        
        .close-btn:hover {
          opacity: 1;
        }
        
        .settings-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .settings-section {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(128,128,128,0.1);
        }
        
        .settings-section h3 {
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }
        
        .setting-item {
          margin-bottom: 12px;
        }
        
        .setting-item label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.85rem;
        }
        
        .theme-options, .setting-item button {
          display: flex;
          gap: 8px;
        }
        
        .theme-options button, .setting-item button {
          flex: 1;
          padding: 8px;
          border: 1px solid rgba(128,128,128,0.3);
          border-radius: 4px;
          background: transparent;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .theme-options button.active, .setting-item button.active {
          background: #2196f3;
          border-color: #2196f3;
          color: white;
        }
        
        .setting-item input, .setting-item select {
          width: 100%;
          padding: 8px;
          border: 1px solid rgba(128,128,128,0.3);
          border-radius: 4px;
          background: transparent;
          color: inherit;
        }
        
        .setting-item small {
          display: block;
          margin-top: 4px;
          font-size: 0.75rem;
          opacity: 0.6;
        }
        
        .save-btn {
          width: 100%;
          padding: 10px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .save-btn:hover {
          background: #1976d2;
        }
        
        .about-info {
          font-size: 0.85rem;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};

export default SettingsPanel;
