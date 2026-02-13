// RollingNumber.tsx - 数字滚动动画组件
// 依据: FE-013数字滚动动画实施标准
// 创建: 2026-02-07 (Phase 3 P1阶段)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RollingNumberProps {
  /** 要显示的值 */
  value: number;
  /** 格式化函数 (默认保留2位小数) */
  format?: (value: number) => string;
  /** 动画持续时间 (ms) */
  duration?: number;
  /** 是否启用方向指示 (true时根据正负显示↑/↓) */
  showDirection?: boolean;
  /** 是否显示正负号 */
  showSign?: boolean;
  /** CSS类名 */
  className?: string;
  /** 前缀文本 */
  prefix?: string;
  /** 后缀文本 */
  suffix?: string;
  /** 小数位数 */
  decimalPlaces?: number;
  /** 是否启用分隔符 (千位分隔符) */
  useSeparator?: boolean;
  /** 分隔符字符 (默认',') */
  separator?: string;
  /** 动画类型: 'slide' | 'fade' | 'scale' */
  animationType?: 'slide' | 'fade' | 'scale';
  /** 动画弹簧配置 */
  springConfig?: {
    stiffness?: number;
    damping?: number;
    mass?: number;
  };
}

/**
 * 数字滚动动画组件
 * 用于显示价格变动、百分比变化等需要平滑过渡的数值
 * 
 * 功能特点:
 * 1. 平滑的数字滚动动画
 * 2. 支持多种动画类型 (滑动、淡入淡出、缩放)
 * 3. 自动方向指示 (上涨/下跌)
 * 4. 格式化选项 (千位分隔符、小数位数)
 * 5. 性能优化: 使用memo避免不必要的重新渲染
 * 6. 与Framer Motion深度集成，提供物理弹簧动画
 */
export const RollingNumber: React.FC<RollingNumberProps> = React.memo(({
  value,
  format,
  duration = 500,
  showDirection = true,
  showSign = false,
  className = '',
  prefix = '',
  suffix = '',
  decimalPlaces = 2,
  useSeparator = true,
  separator = ',',
  animationType = 'slide',
  springConfig = { stiffness: 300, damping: 30, mass: 1 },
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [directionSymbol, setDirectionSymbol] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 格式化数字
  const formatNumber = (num: number): string => {
    if (format) {
      return format(num);
    }

    let formatted = num.toFixed(decimalPlaces);
    
    // 添加千位分隔符
    if (useSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      formatted = parts.join('.');
    }
    
    // 添加正负号
    if (showSign && num > 0) {
      formatted = `+${formatted}`;
    }
    
    return formatted;
  };

  // 更新方向指示
  const updateDirection = (current: number, previous: number) => {
    const increasing = current > previous;
    setIsIncreasing(increasing);
    
    if (showDirection) {
      const symbol = increasing ? '↑' : '↓';
      setDirectionSymbol(symbol);
    }
  };

  // 动画配置
  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };

    switch (animationType) {
      case 'slide':
        return {
          initial: { y: isIncreasing ? -20 : 20, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: isIncreasing ? 20 : -20, opacity: 0 },
        };
      
      case 'fade':
        return baseVariants;
      
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.2, opacity: 0 },
        };
      
      default:
        return baseVariants;
    }
  };

  // 动画样式类
  const getAnimationClass = (): string => {
    const baseClass = 'transition-all duration-300 ease-out';
    
    switch (animationType) {
      case 'slide':
        return `${baseClass} transform`;
      case 'fade':
        return `${baseClass}`;
      case 'scale':
        return `${baseClass} transform`;
      default:
        return baseClass;
    }
  };

  // 颜色类
  const getColorClass = (): string => {
    if (value > 0) return 'text-[var(--status-success)]';
    if (value < 0) return 'text-[var(--status-error)]';
    return 'text-[var(--text-primary)]';
  };

  // 值变化时更新动画
  useEffect(() => {
    if (value !== previousValue) {
      updateDirection(value, previousValue);
      setDisplayValue(value);
      setPreviousValue(value);
    }
  }, [value, previousValue]);

  // 格式化显示值
  const formattedValue = formatNumber(displayValue);
  const variants = getAnimationVariants();
  const animationClass = getAnimationClass();
  const colorClass = getColorClass();

  return (
    <div 
      ref={containerRef}
      className={`inline-flex items-center ${colorClass} ${className}`}
      style={{ 
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        willChange: 'transform, opacity'
      }}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      
      <AnimatePresence mode="wait">
        <motion.span
          key={`${value}-${animationType}`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={variants}
          transition={{
            duration: duration / 1000,
            ease: "easeInOut",
            ...springConfig,
          }}
          className={`inline-block ${animationClass}`}
        >
          {formattedValue}
        </motion.span>
      </AnimatePresence>
      
      {showDirection && directionSymbol && (
        <motion.span
          key={`${directionSymbol}-${Date.now()}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`ml-1 ${isIncreasing ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'}`}
        >
          {directionSymbol}
        </motion.span>
      )}
      
      {suffix && <span className="ml-1">{suffix}</span>}
    </div>
  );
});

RollingNumber.displayName = 'RollingNumber';

// 默认导出
export default RollingNumber;

/**
 * Hook: 使用数字滚动动画
 */
export function useRollingNumber(initialValue: number = 0) {
  const [value, setValue] = useState(initialValue);
  const [formatted, setFormatted] = useState('');

  const formatNumber = useCallback((num: number): string => {
    return num.toFixed(2);
  }, []);

  useEffect(() => {
    setFormatted(formatNumber(value));
  }, [value, formatNumber]);

  return {
    value,
    setValue,
    formatted,
    formatNumber,
  };
}

/**
 * 高阶组件: 为现有组件添加数字滚动动画
 */
export function withRollingNumber<P extends { value?: number }>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WithRollingNumber: React.FC<P> = (props) => {
    const { value = 0 } = props;
    const [animatedValue, setAnimatedValue] = useState(value);
    
    useEffect(() => {
      setAnimatedValue(value);
    }, [value]);
    
    return (
      <div className="relative">
        <Component {...props} value={animatedValue} />
      </div>
    );
  };
  
  WithRollingNumber.displayName = `WithRollingNumber(${Component.displayName || 'Component'})`;
  return WithRollingNumber;
}

/**
 * 性能优化版本: 使用shouldComponentUpdate逻辑避免不必要的渲染
 */
export const MemoizedRollingNumber = React.memo(RollingNumber, (prevProps, nextProps) => {
  // 只在value或formatting选项变化时重新渲染
  return (
    prevProps.value === nextProps.value &&
    prevProps.decimalPlaces === nextProps.decimalPlaces &&
    prevProps.useSeparator === nextProps.useSeparator &&
    prevProps.showDirection === nextProps.showDirection &&
    prevProps.showSign === nextProps.showSign
  );
});