// RollingNumber Component - 数字滚动动画组件
// 依据: FE-013 数字滚动动画组件实施方案
// 创建: 2026-02-07 (Phase 3: P1视觉与体验增强)

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';

export interface RollingNumberProps {
  /** 当前数字值 */
  value: number;
  /** 格式化选项 */
  formatOptions?: Intl.NumberFormatOptions;
  /** 小数位数 */
  decimals?: number;
  /** 前缀 (如货币符号) */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 是否启用滚动动画 */
  animate?: boolean;
  /** 动画持续时间 (毫秒) */
  duration?: number;
  /** 缓动函数 */
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';
  /** 是否显示变化方向指示器 */
  showDirectionIndicator?: boolean;
  /** 变化指示器大小 */
  indicatorSize?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
  /** 数字变化时的回调 */
  onChange?: (newValue: number, oldValue: number) => void;
}

/**
 * RollingNumber - 专业金融级数字滚动动画组件
 * 提供平滑的数字滚动效果，适用于价格显示、计数器等场景
 */
export const RollingNumber: React.FC<RollingNumberProps> = ({
  value,
  formatOptions = {},
  decimals = 2,
  prefix = '',
  suffix = '',
  animate = true,
  duration = 500,
  ease = 'easeOut',
  showDirectionIndicator = true,
  indicatorSize = 'sm',
  className = '',
  onChange,
}) => {
  const [previousValue, setPreviousValue] = useState(value);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [formattedValue, setFormattedValue] = useState('');
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // 动画配置
  const springConfig = useMemo(() => {
    switch (ease) {
      case 'spring':
        return { type: 'spring', stiffness: 100, damping: 15 };
      case 'easeIn':
        return { ease: [0.4, 0, 1, 1] };
      case 'easeOut':
        return { ease: [0, 0, 0.2, 1] };
      case 'easeInOut':
        return { ease: [0.4, 0, 0.2, 1] };
      default:
        return { ease: 'linear' };
    }
  }, [ease]);

  // 使用Framer Motion弹簧动画
  const springValue = useSpring(previousValue, {
    ...springConfig,
    duration: duration / 1000,
  });

  // 格式化数字
  const formatNumber = (num: number): string => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...formatOptions,
    };
    
    return new Intl.NumberFormat('zh-CN', options).format(num);
  };

  // 数字变化动画
  useEffect(() => {
    if (value === previousValue) return;

    const oldValue = previousValue;
    const newValue = value;
    const increasing = newValue > oldValue;
    
    setIsIncreasing(increasing);
    
    // 回调通知
    if (onChange) {
      onChange(newValue, oldValue);
    }

    if (animate) {
      // 使用requestAnimationFrame进行动画
      let startTime: number | null = null;
      
      const animateValue = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        let easedProgress = progress;
        if (ease === 'easeIn') {
          easedProgress = progress * progress * progress;
        } else if (ease === 'easeOut') {
          easedProgress = 1 - Math.pow(1 - progress, 3);
        } else if (ease === 'easeInOut') {
          easedProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
        
        const currentValue = oldValue + (newValue - oldValue) * easedProgress;
        springValue.set(currentValue);
        
        // 更新格式化的显示值
        const formatted = `${prefix}${formatNumber(currentValue)}${suffix}`;
        setFormattedValue(formatted);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animateValue);
        } else {
          // 动画完成，确保最终值准确
          springValue.set(newValue);
          const finalFormatted = `${prefix}${formatNumber(newValue)}${suffix}`;
          setFormattedValue(finalFormatted);
          setPreviousValue(newValue);
        }
      };
      
      // 取消任何现有的动画
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // 开始新动画
      animationRef.current = requestAnimationFrame(animateValue);
    } else {
      // 不使用动画，直接更新值
      springValue.set(newValue);
      const finalFormatted = `${prefix}${formatNumber(newValue)}${suffix}`;
      setFormattedValue(finalFormatted);
      setPreviousValue(newValue);
    }
    
    // 清理函数
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, animate, duration, ease, prefix, suffix, formatNumber, springValue, onChange, previousValue]);

  // 初始化格式化值
  useEffect(() => {
    const formatted = `${prefix}${formatNumber(value)}${suffix}`;
    setFormattedValue(formatted);
    setPreviousValue(value);
  }, [value, prefix, suffix, decimals, formatOptions]);

  // 变化指示器
  const DirectionIndicator = () => {
    if (!showDirectionIndicator || value === previousValue) {
      return null;
    }
    
    const indicatorClass = `rolling-number-indicator rolling-number-indicator--${indicatorSize} ${
      isIncreasing ? 'rolling-number-indicator--up' : 'rolling-number-indicator--down'
    }`;
    
    return (
      <motion.div
        className={indicatorClass}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isIncreasing ? '↑' : '↓'}
      </motion.div>
    );
  };

  // 字符动画效果（逐字符变化）
  const renderAnimatedCharacters = () => {
    if (!formattedValue) return null;
    
    return (
      <div className="rolling-number-characters flex items-baseline">
        {formattedValue.split('').map((char, index) => {
          const isDigit = /[0-9]/.test(char);
          const isDecimal = char === '.' || char === ',';
          
          if (isDigit) {
            return (
              <motion.div
                key={`char-${index}`}
                className="rolling-number-digit relative"
                initial={{ y: isIncreasing ? 20 : -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  delay: index * 0.03,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
              >
                {char}
                {/* 数字变化时的上浮/下沉阴影 */}
                {value !== previousValue && (
                  <motion.div
                    className="rolling-number-digit-shadow absolute inset-0"
                    initial={{ y: 0, opacity: 0.3 }}
                    animate={{ y: isIncreasing ? 2 : -2, opacity: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  />
                )}
              </motion.div>
            );
          }
          
          // 非数字字符（分隔符、货币符号等）
          return (
            <span key={`char-${index}`} className="rolling-number-symbol">
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`rolling-number ${className} ${
        value !== previousValue
          ? isIncreasing
            ? 'rolling-number--increasing'
            : 'rolling-number--decreasing'
          : ''
      }`}
    >
      <AnimatePresence mode="wait">
        <div className="rolling-number-content flex items-center gap-2">
          {animate && value !== previousValue ? (
            renderAnimatedCharacters()
          ) : (
            <div className="rolling-number-value">{formattedValue}</div>
          )}
          <DirectionIndicator />
        </div>
      </AnimatePresence>
      
      {/* 背景脉冲效果（数字变化时） */}
      {value !== previousValue && (
        <motion.div
          className="rolling-number-pulse absolute inset-0 rounded-lg"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: isIncreasing ? '#10b981' : '#ef4444',
          }}
        />
      )}
    </div>
  );
};

/**
 * RollingNumberGroup - 多个RollingNumber的组合
 */
interface RollingNumberGroupProps {
  children: React.ReactNode;
  /** 是否同步动画 */
  synchronized?: boolean;
  /** 组间距 */
  spacing?: number;
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right';
}

export const RollingNumberGroup: React.FC<RollingNumberGroupProps> = ({
  children,
  synchronized = false,
  spacing = 16,
  align = 'center',
}) => {
  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align];
  
  return (
    <div className={`rolling-number-group flex ${alignClass} gap-${spacing}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            ...child.props,
            // 添加延迟以实现波浪效果
            style: synchronized
              ? { animationDelay: `${index * 50}ms` }
              : {},
          });
        }
        return child;
      })}
    </div>
  );
};

// 默认样式（应导入对应的CSS文件）
// import './RollingNumber.css';

export default RollingNumber;