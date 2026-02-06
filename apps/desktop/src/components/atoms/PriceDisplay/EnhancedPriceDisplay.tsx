// EnhancedPriceDisplay Component - 数字滚动动画增强版
// Created: 2026-02-07
// Purpose: 在原有PriceDisplay基础上增加平滑数字滚动动画

import React, { useEffect, useRef, useState, useCallback } from 'react';
import './EnhancedPriceDisplay.css';

interface EnhancedPriceDisplayProps {
  /** 当前价格 */
  value: number;
  /** 上一个价格 (用于计算变化) */
  previousValue?: number;
  /** 货币符号 */
  currency?: string;
  /** 小数位数 */
  decimals?: number;
  /** 是否显示变化百分比 */
  showChange?: boolean;
  /** 是否显示闪烁动画 */
  showFlash?: boolean;
  /** 是否启用数字滚动动画 */
  enableNumberScroll?: boolean;
  /** 滚动动画持续时间 (毫秒) */
  scrollDuration?: number;
  /** 数字格式化选项 */
  formatOptions?: Intl.NumberFormatOptions;
}

export const EnhancedPriceDisplay: React.FC<EnhancedPriceDisplayProps> = (props) => {
  const {
    value,
    previousValue,
    currency = '',
    decimals = 2,
    showChange = true,
    showFlash = true,
    enableNumberScroll = true,
    scrollDuration = 500,
    formatOptions = {},
  } = props;
  
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);
  const animationFrameRef = useRef<number>();
  const animationStartTimeRef = useRef<number>();
  
  // 计算变化百分比
  const changePercent = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  const colorClass = changePercent >= 0 ? 'price--up' : 'price--down';
  const flashClass = flash ? `price--flash-${flash}` : '';
  
  // 格式化数字
  const formatNumber = useCallback((num: number) => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...formatOptions,
    };
    
    return new Intl.NumberFormat('zh-CN', options).format(num);
  }, [decimals, formatOptions]);
  
  // 数字滚动动画
  const animateNumber = useCallback((start: number, end: number) => {
    if (!enableNumberScroll || start === end) {
      setDisplayValue(end);
      return;
    }
    
    setIsAnimating(true);
    animationStartTimeRef.current = Date.now();
    
    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - animationStartTimeRef.current!;
      const progress = Math.min(elapsed / scrollDuration, 1);
      
      // 使用缓动函数 (easeOutQuad)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (end - start) * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setDisplayValue(end); // 确保最终值是精确的
      }
    };
    
    // 取消任何正在进行的动画
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [enableNumberScroll, scrollDuration]);
  
  // 闪烁动画效果
  useEffect(() => {
    if (showFlash && value !== prevValueRef.current) {
      const direction = value > prevValueRef.current ? 'up' : 'down';
      setFlash(direction);
      prevValueRef.current = value;
      
      // 启动数字滚动动画
      if (enableNumberScroll) {
        animateNumber(displayValue, value);
      } else {
        setDisplayValue(value);
      }
      
      // 300ms 后移除闪烁
      const timer = setTimeout(() => setFlash(null), 300);
      return () => {
        clearTimeout(timer);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else if (!showFlash) {
      setDisplayValue(value);
    }
  }, [value, showFlash, enableNumberScroll, animateNumber, displayValue]);
  
  // 清理动画帧
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // 渲染数字部分（带滚动动画）
  const renderNumber = () => {
    const formattedValue = formatNumber(displayValue);
    const fullValue = `${currency}${formattedValue}`;
    
    if (!enableNumberScroll || !isAnimating) {
      return <span className="price-number">{fullValue}</span>;
    }
    
    // 当数字滚动时，添加动画类
    return (
      <span className={`price-number price-number--rolling ${flashClass}`}>
        {fullValue}
      </span>
    );
  };
  
  return (
    <span className={`enhanced-price-display ${colorClass} ${flashClass}`}>
      {renderNumber()}
      {showChange && previousValue && (
        <span className="price-change">
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )}
    </span>
  );
};

// 分位数字组件（可选，用于高级数字显示）
export const DigitRoller: React.FC<{
  value: string;
  previousValue: string;
}> = ({ value, previousValue }) => {
  const [digitClass, setDigitClass] = useState('');
  
  useEffect(() => {
    if (value !== previousValue) {
      setDigitClass('digit--changing');
      const timer = setTimeout(() => setDigitClass(''), 300);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);
  
  return <span className={`digit-roller ${digitClass}`}>{value}</span>;
};

export default EnhancedPriceDisplay;