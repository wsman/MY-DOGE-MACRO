/**
 * Nordic Theme Utilities - 北欧主题工具函数
 * ============================================================
 * 来源: Negentropy-Lab 项目
 * 提供与北欧主题相关的纯工具函数，避免React Fast Refresh警告
 * 
 * 宪法依据: §103 单一真理源 (工具函数与组件逻辑分离)
 * 版本: 1.0.0
 * ============================================================
 */

export type NordicThemeMode = 'light' | 'dark' | 'auto';

/**
 * 从本地存储读取初始主题模式
 * 
 * @param defaultMode 默认主题模式
 * @param storageKey 存储键名
 * @returns 初始化的主题模式
 */
export const getInitialMode = (
  defaultMode: NordicThemeMode = 'light',
  storageKey: string = 'nordic-theme-mode'
): NordicThemeMode => {
  if (typeof window === 'undefined') return defaultMode;
  
  const stored = localStorage.getItem(storageKey);
  if (stored && ['light', 'dark', 'auto'].includes(stored)) {
    return stored as NordicThemeMode;
  }
  return defaultMode;
};

/**
 * 获取当前系统主题偏好
 * 
 * @returns 'light' | 'dark'
 */
export const getSystemPreference = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

/**
 * 创建系统偏好变化监听器
 * 
 * @param callback 当系统偏好变化时的回调函数
 * @returns 清理函数，用于移除监听器
 */
export const createSystemPreferenceListener = (
  callback: (preference: 'light' | 'dark') => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
    callback(e.matches ? 'dark' : 'light');
  };

  // 初始化
  handleChange(mediaQuery);

  // 监听变化
  mediaQuery.addEventListener('change', handleChange);
  
  return () => mediaQuery.removeEventListener('change', handleChange);
};

/**
 * 根据模式解析实际主题
 * 
 * @param mode 主题模式
 * @param systemPreference 系统偏好
 * @returns 实际应用的主题
 */
export const resolveTheme = (
  mode: NordicThemeMode,
  systemPreference: 'light' | 'dark'
): 'light' | 'dark' => {
  return mode === 'auto' ? systemPreference : mode;
};

/**
 * 计算主题类名
 * 
 * @param theme 实际主题
 * @returns 主题类名字符串
 */
export const getThemeClass = (theme: 'light' | 'dark'): string => {
  return `nordic-theme theme-nordic-${theme}`;
};

/**
 * 应用主题到document元素
 * 
 * @param theme 要应用的主题
 */
export const applyThemeToDocument = (theme: 'light' | 'dark'): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  
  // 移除旧主题类
  root.classList.remove('theme-nordic-light', 'theme-nordic-dark');
  
  // 添加新主题类
  root.classList.add('nordic-theme', `theme-nordic-${theme}`);
  
  // 设置data属性 (用于CSS选择器)
  root.setAttribute('data-theme', theme);
  
  // 更新meta theme-color (移动端浏览器地址栏颜色)
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#1A1D20' : '#FAFBFC'
    );
  }
};

/**
 * 初始化主题过渡动画
 * 首次加载时禁用过渡动画，短暂延迟后启用
 */
export const initializeThemeTransitions = (): (() => void) => {
  if (typeof document === 'undefined') return () => {};

  const root = document.documentElement;
  root.classList.add('nordic-theme-no-transition');
  
  // 短暂延迟后启用过渡
  const timer = setTimeout(() => {
    root.classList.remove('nordic-theme-no-transition');
  }, 100);

  return () => clearTimeout(timer);
};

/**
 * 保存主题模式到本地存储
 * 
 * @param mode 主题模式
 * @param storageKey 存储键名
 */
export const saveThemeMode = (
  mode: NordicThemeMode,
  storageKey: string = 'nordic-theme-mode'
): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey, mode);
};

/**
 * 根据当前主题计算切换后的主题
 * 
 * @param currentTheme 当前实际主题
 * @returns 切换后的主题模式
 */
export const getNextThemeMode = (
  currentTheme: 'light' | 'dark'
): NordicThemeMode => {
  return currentTheme === 'light' ? 'dark' : 'light';
};