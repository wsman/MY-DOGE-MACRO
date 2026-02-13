/**
 * Nordic Theme Context - 主题状态管理
 * ============================================================
 * 来源: Negentropy-Lab 项目
 * 提供 React Context 用于管理北欧主题状态
 * 
 * 宪法依据: §103 单一真理源 (主题状态集中管理)
 * 版本: 1.0.0
 * ============================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  getInitialMode,
  createSystemPreferenceListener,
  resolveTheme,
  getThemeClass,
  applyThemeToDocument,
  initializeThemeTransitions,
  saveThemeMode,
  getNextThemeMode,
  type NordicThemeMode
} from './NordicThemeUtils';

// 主题类型定义 - 从 NordicThemeUtils 导入，此处重新导出
export { type NordicThemeMode };

// 主题上下文接口
interface NordicThemeContextType {
  // 当前主题模式
  mode: NordicThemeMode;
  
  // 实际应用的主题 (解析 auto 后的结果)
  resolvedTheme: 'light' | 'dark';
  
  // 切换主题
  setMode: (mode: NordicThemeMode) => void;
  
  // 快捷切换
  toggleTheme: () => void;
  
  // 主题类名 (用于添加到根元素)
  themeClass: string;
}

// 创建上下文
const NordicThemeContext = createContext<NordicThemeContextType | undefined>(undefined);

// 存储键名
const THEME_STORAGE_KEY = 'nordic-theme-mode';

// Provider Props
interface NordicThemeProviderProps {
  children: ReactNode;
  defaultMode?: NordicThemeMode;
  storageKey?: string;
}

/**
 * NordicThemeProvider - 北欧主题提供者
 * 包裹应用根组件以启用主题切换功能
 */
export const NordicThemeProvider: React.FC<NordicThemeProviderProps> = ({
  children,
  defaultMode = 'light',
  storageKey = THEME_STORAGE_KEY,
}) => {
  // 从本地存储读取初始值
  const initialMode = getInitialMode(defaultMode, storageKey);
  const [mode, setModeState] = useState<NordicThemeMode>(initialMode);
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light');

  // 监听系统偏好变化
  useEffect(() => {
    const cleanup = createSystemPreferenceListener((preference) => {
      setSystemPreference(preference);
    });
    return cleanup;
  }, []);

  // 解析实际主题
  const resolvedTheme: 'light' | 'dark' = resolveTheme(mode, systemPreference);

  // 计算主题类名
  const themeClass = getThemeClass(resolvedTheme);

  // 设置主题模式
  const setMode = useCallback((newMode: NordicThemeMode) => {
    setModeState(newMode);
    saveThemeMode(newMode, storageKey);
  }, [storageKey]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    const nextMode = getNextThemeMode(resolvedTheme);
    setMode(nextMode);
  }, [resolvedTheme, setMode]);

  // 应用主题到 document
  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  // 首次加载时禁用过渡动画
  useEffect(() => {
    const cleanup = initializeThemeTransitions();
    return cleanup;
  }, []);

  const value: NordicThemeContextType = {
    mode,
    resolvedTheme,
    setMode,
    toggleTheme,
    themeClass,
  };

  return (
    <NordicThemeContext.Provider value={value}>
      {children}
    </NordicThemeContext.Provider>
  );
};

/**
 * useNordicTheme - 获取北欧主题上下文
 * 必须在 NordicThemeProvider 内部使用
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useNordicTheme = (): NordicThemeContextType => {
  const context = useContext(NordicThemeContext);
  
  if (context === undefined) {
    throw new Error('useNordicTheme must be used within a NordicThemeProvider');
  }
  
  return context;
};

export default NordicThemeProvider;