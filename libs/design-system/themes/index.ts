/**
 * Nordic Theme - 统一导出
 * ============================================================
 * MY-DOGE-MACRO 北欧主题系统
 * 
 * 宪法依据: §152 单一真理源
 * 版本: 1.0.0
 * ============================================================
 */

// CSS 主题文件 (需要在应用入口导入)
import './nordic-minimal.css';

// 工具函数
export {
  type NordicThemeMode,
  getInitialMode,
  getSystemPreference,
  createSystemPreferenceListener,
  resolveTheme,
  getThemeClass,
  applyThemeToDocument,
  initializeThemeTransitions,
  saveThemeMode,
  getNextThemeMode,
} from './NordicThemeUtils';

// React Context 和 Hook
export {
  NordicThemeProvider,
  useNordicTheme,
} from './NordicThemeContext';

// 类型重导出
export type { default as NordicThemeProviderType } from './NordicThemeContext';