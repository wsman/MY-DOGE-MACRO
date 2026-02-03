import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ServerConfig {
  baseUrl: string;
  timeout: number;
  retryCount: number;
}

interface ServerConfigContextType {
  config: ServerConfig;
  updateConfig: (updates: Partial<ServerConfig>) => void;
  testConnection: () => Promise<{ success: boolean; latency: number; error?: string }>;
  isConnected: boolean;
  lastConnected: number | null;
}

const defaultConfig: ServerConfig = {
  baseUrl: 'http://localhost:8000',
  timeout: 5000,
  retryCount: 3,
};

const ServerConfigContext = createContext<ServerConfigContextType | undefined>(undefined);

export function ServerConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ServerConfig>(() => {
    // 从 localStorage 加载配置
    const saved = localStorage.getItem('server_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultConfig;
      }
    }
    return defaultConfig;
  });

  const [isConnected, setIsConnected] = useState(false);
  const [lastConnected, setLastConnected] = useState<number | null>(null);

  // 保存配置到 localStorage
  useEffect(() => {
    localStorage.setItem('server_config', JSON.stringify(config));
  }, [config]);

  // 测试连接
  const testConnection = useCallback(async () => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);

      const response = await fetch(`${config.baseUrl}/health_check`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const latency = Date.now() - startTime;
        setIsConnected(true);
        setLastConnected(Date.now());
        return { success: true, latency };
      } else {
        setIsConnected(false);
        return { 
          success: false, 
          latency: Date.now() - startTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      setIsConnected(false);
      return { 
        success: false, 
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }, [config.baseUrl, config.timeout]);

  // 初始化时测试连接
  useEffect(() => {
    testConnection();
  }, []); // 仅在组件挂载时运行一次

  const updateConfig = useCallback((updates: Partial<ServerConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      // 配置更改后重置连接状态
      setIsConnected(false);
      return newConfig;
    });
  }, []);

  return (
    <ServerConfigContext.Provider
      value={{
        config,
        updateConfig,
        testConnection,
        isConnected,
        lastConnected,
      }}
    >
      {children}
    </ServerConfigContext.Provider>
  );
}

export function useServerConfig() {
  const context = useContext(ServerConfigContext);
  if (context === undefined) {
    throw new Error('useServerConfig must be used within a ServerConfigProvider');
  }
  return context;
}
