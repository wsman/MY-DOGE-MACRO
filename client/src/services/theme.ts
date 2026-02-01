// 主题服务 - 提供主题切换和CSS变量管理
import { useUIStore } from '../stores/ui.store';

// 主题配置
export const themes = {
  dark: {
    name: 'dark',
    colors: {
      background: '#0d0d1a',
      surface: '#1a1a2e',
      surfaceHover: '#252540',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      text: '#e0e0e0',
      textSecondary: '#9ca3af',
      border: 'rgba(255,255,255,0.1)',
      divider: 'rgba(255,255,255,0.05)',
      shadow: 'rgba(0,0,0,0.3)'
    }
  },
  light: {
    name: 'light',
    colors: {
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceHover: '#f1f5f9',
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: 'rgba(0,0,0,0.1)',
      divider: 'rgba(0,0,0,0.05)',
      shadow: 'rgba(0,0,0,0.1)'
    }
  }
};

// 应用主题到DOM
export const applyTheme = (themeName: 'dark' | 'light' | 'system'): void => {
  const theme = themeName === 'system' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? themes.dark : themes.light)
    : themes[themeName];
  
  const root = document.documentElement;
  
  // 设置CSS变量
  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
  });
  
  // 设置data属性用于CSS选择
  root.setAttribute('data-theme', theme.name);
  
  // 保存到localStorage
  localStorage.setItem('my-doge-theme', themeName);
};

// 初始化主题
export const initTheme = (): void => {
  const savedTheme = (localStorage.getItem('my-doge-theme') as 'dark' | 'light' | 'system') || 'dark';
  applyTheme(savedTheme);
  
  // 监听系统主题变化
  if (savedTheme === 'system') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      applyTheme('system');
    });
  }
};

// 主题切换函数
export const toggleTheme = (): void => {
  const store = useUIStore.getState();
  const currentTheme = store.theme;
  const newTheme = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'dark' : 'dark';
  useUIStore.getState().setTheme(newTheme);
  applyTheme(newTheme);
};

// 获取当前主题颜色
export const getThemeColors = (): typeof themes.dark => {
  const store = useUIStore.getState();
  const themeName = store.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : store.theme;
  return themes[themeName as keyof typeof themes];
};

// CSS类名生成器
export const getThemeClass = (baseClass: string): string => {
  const store = useUIStore.getState();
  const suffix = store.theme === 'dark' ? 'dark' : store.theme === 'light' ? 'light' : '';
  return suffix ? `${baseClass}-${suffix}` : baseClass;
};

// 响应式检测
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = (): boolean => {
  return window.innerWidth >= 1024;
};

// 监听响应式变化
export const onResponsiveChange = (callback: (size: 'mobile' | 'tablet' | 'desktop') => void): (() => void) => {
  const handleResize = () => {
    if (isMobile()) callback('mobile');
    else if (isTablet()) callback('tablet');
    else callback('desktop');
  };
  
  handleResize();
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
};
