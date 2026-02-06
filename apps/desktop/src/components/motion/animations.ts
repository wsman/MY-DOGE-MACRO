// Framer Motion Animation Presets
// 依据: FE-201 Framer Motion集成实施方案
// 创建: 2026-02-07 (P2阶段优化)

import { Variants } from 'framer-motion';

// ============ 基础动画预设 ============

/**
 * 通用入场动画 (从下向上滑入)
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * 通用淡入动画
 */
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.25,
      ease: 'easeInOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * 缩放入场动画
 */
export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1], // 自定义弹跳效果
    },
  },
};

/**
 * 卡片悬停效果
 */
export const cardHoverVariants: Variants = {
  initial: {
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

/**
 * 按钮点击涟漪效果
 */
export const buttonRippleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 1,
  },
  animate: {
    scale: 2,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

// ============ 交易相关动画 ============

/**
 * 价格变动动画 (上涨)
 */
export const priceUpVariants: Variants = {
  initial: {
    color: '#ffffff',
    scale: 1,
  },
  animate: {
    color: '#4caf50', // 绿色
    scale: [1, 1.1, 1],
    transition: {
      color: {
        duration: 0.5,
      },
      scale: {
        duration: 0.5,
        times: [0, 0.5, 1],
      },
    },
  },
  exit: {
    color: '#ffffff',
    scale: 1,
  },
};

/**
 * 价格变动动画 (下跌)
 */
export const priceDownVariants: Variants = {
  initial: {
    color: '#ffffff',
    scale: 1,
  },
  animate: {
    color: '#f44336', // 红色
    scale: [1, 0.9, 1],
    transition: {
      color: {
        duration: 0.5,
      },
      scale: {
        duration: 0.5,
        times: [0, 0.5, 1],
      },
    },
  },
  exit: {
    color: '#ffffff',
    scale: 1,
  },
};

/**
 * 图表加载动画
 */
export const chartLoadingVariants: Variants = {
  initial: {
    opacity: 0,
    x: -10,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
      delayChildren: 0.1,
      staggerChildren: 0.05,
    },
  },
};

// ============ 列表和网格动画 ============

/**
 * 列表项交错入场动画
 */
export const staggerListVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/**
 * 列表项动画
 */
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * 网格项动画
 */
export const gridItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// ============ 页面过渡动画 ============

/**
 * 页面切换动画 (前进)
 */
export const pageForwardVariants: Variants = {
  initial: {
    opacity: 0,
    x: 30,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: -30,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

/**
 * 页面切换动画 (后退)
 */
export const pageBackwardVariants: Variants = {
  initial: {
    opacity: 0,
    x: -30,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

// ============ 高级交互效果 ============

/**
 * 滑动抽屉动画
 */
export const drawerVariants: Variants = {
  hidden: {
    x: '100%',
  },
  visible: {
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: '100%',
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

/**
 * 模态框动画
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1], // 轻微弹跳
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

/**
 * 工具提示动画
 */
export const tooltipVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 5,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: 5,
    transition: {
      duration: 0.1,
      ease: 'easeIn',
    },
  },
};

// ============ 数据可视化动画 ============

/**
 * 进度条动画 (标准版本)
 */
export const progressBarVariants: Variants = {
  initial: {
    width: '0%',
  },
  animate: (width: string) => ({
    width,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  }),
};

/**
 * 数字滚动动画 (标准版本)
 */
export const numberCountVariants: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// ============ 动画工具函数 ============

/**
 * 创建弹簧动画配置
 */
export function createSpringAnimation(
  stiffness = 300,
  damping = 30,
  mass = 1
) {
  return {
    type: 'spring',
    stiffness,
    damping,
    mass,
  } as const;
}

/**
 * 创建自定义缓动函数
 */
export function createEaseAnimation(
  duration = 0.3,
  ease: string | number[] = 'easeOut'
) {
  return {
    duration,
    ease,
  } as const;
}

/**
 * 创建交错动画配置
 */
export function createStaggerAnimation(
  staggerChildren = 0.05,
  delayChildren = 0.1
) {
  return {
    staggerChildren,
    delayChildren,
  } as const;
}

// ============ 动画配置导出 ============

export const animationPresets = {
  // 基础动画
  slideUp: slideUpVariants,
  fadeIn: fadeInVariants,
  scaleIn: scaleInVariants,
  
  // 交互效果
  cardHover: cardHoverVariants,
  buttonRipple: buttonRippleVariants,
  
  // 交易相关
  priceUp: priceUpVariants,
  priceDown: priceDownVariants,
  chartLoading: chartLoadingVariants,
  
  // 列表和网格
  staggerList: staggerListVariants,
  listItem: listItemVariants,
  gridItem: gridItemVariants,
  
  // 页面过渡
  pageForward: pageForwardVariants,
  pageBackward: pageBackwardVariants,
  
  // 高级交互
  drawer: drawerVariants,
  modal: modalVariants,
  tooltip: tooltipVariants,
  
  // 数据可视化
  progressBar: progressBarVariants,
  numberCount: numberCountVariants,
};

export type AnimationPreset = keyof typeof animationPresets;

/**
 * 根据预设名称获取动画配置
 */
export function getAnimationPreset(preset: AnimationPreset): Variants {
  return animationPresets[preset];
}

/**
 * 检查是否为有效预设
 */
export function isValidAnimationPreset(preset: string): preset is AnimationPreset {
  return preset in animationPresets;
}

/**
 * 获取所有可用的动画预设名称
 */
export function getAllAnimationPresets(): AnimationPreset[] {
  return Object.keys(animationPresets) as AnimationPreset[];
}

export default animationPresets;