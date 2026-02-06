// PriceDisplay Component - 价格显示组件 (增强动画版)
// Created: 2026-02-07
// 特性: 300ms闪烁动画 + 可选数字滚动动画

import React, { useEffect, useRef, useState } from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  value: number;
  previousValue?: number;
  currency?: string;
  decimals?: number;
  showChange?: boolean;
  showFlash?: boolean;
  /** 是否启用数字滚动动画 (平滑过渡) */
  enableNumberScroll?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  value,
  previousValue,
  currency = '',
  decimals = 2,
  showChange = true,
  showFlash = true,
  enableNumberScroll = false, // 默认关闭，需要时开启
}) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const prevRef = useRef(value);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // 计算变化百分比
  const changePercent = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  const colorClass = changePercent >= 0 ? 'price--up' : 'price--down';
  const flashClass = flash ? `price--flash-${flash}` : '';
  
  // 数字滚动动画
  const animateNumber = (start: number, end: number, duration: number = 500) => {
    if (!enableNumberScroll || start === end) {
      setDisplayValue(end);
      return;
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    startTimeRef.current = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数：easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (end - start) * easedProgress;
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(end); // 确保最终值准确
        animationRef.current = null;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // 处理值变化
  useEffect(() => {
    if (showFlash && value !== prevRef.current) {
      const direction = value > prevRef.current ? 'up' : 'down';
      setFlash(direction);
      
      // 启动数字滚动动画
      if (enableNumberScroll) {
        animateNumber(prevRef.current, value, 500);
      } else {
        setDisplayValue(value);
      }
      
      // 300ms 后移除闪烁
      const timer = setTimeout(() => setFlash(null), 300);
      
      prevRef.current = value;
      
      return () => {
        clearTimeout(timer);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
      };
    } else if (!showFlash) {
      setDisplayValue(value);
      prevRef.current = value;
    }
  }, [value, showFlash, enableNumberScroll]);
  
  // 清理动画
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // 格式化数字
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };
  
  // 渲染数字部分
  const renderNumber = () => {
    const formattedValue = formatNumber(displayValue);
    const fullValue = `${currency}${formattedValue}`;
    
    // 如果正在动画中，添加动画类
    const isAnimating = animationRef.current !== null;
    const numberClass = isAnimating ? 'price-number price-number--animated' : 'price-number';
    
    return (
      <span className={`${numberClass} ${flashClass}`}>
        {fullValue}
      </span>
    );
  };
  
  return (
    <span className={`price-display ${colorClass} ${flashClass}`}>
      {renderNumber()}
      {showChange && previousValue && (
        <span className="price-change">
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )}
    </span>
  );
};

// 简化导出 - 暂时不导出增强版组件，避免类型错误
export default PriceDisplay;
