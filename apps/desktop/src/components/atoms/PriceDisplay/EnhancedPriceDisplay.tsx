// EnhancedPriceDisplay Component - 数字滚动动画增强版 (升级版)
// Created: 2026-02-07
// Updated: 2026-02-07 - 集成RollingNumber组件
// Purpose: 在原有PriceDisplay基础上使用专业的RollingNumber组件

import React from 'react';
import RollingNumber, { MemoizedRollingNumber } from '../../../utils/RollingNumber';
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
  /** 使用性能优化版本 */
  useMemoized?: boolean;
  /** 动画类型 */
  animationType?: 'slide' | 'fade' | 'scale';
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
    useMemoized = true,
    animationType = 'slide',
  } = props;
  
  // 计算变化百分比
  const changePercent = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  const colorClass = changePercent >= 0 ? 'price--up' : 'price--down';
  
  // 格式化函数
  const formatNumber = (num: number): string => {
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...formatOptions,
    };
    
    const formatted = new Intl.NumberFormat('zh-CN', options).format(num);
    return `${currency}${formatted}`;
  };
  
  // 选择 RollingNumber 组件版本
  const RollingNumberComponent = useMemoized ? MemoizedRollingNumber : RollingNumber;
  
  // 渲染数字部分
  const renderNumber = () => {
    if (!enableNumberScroll) {
      return <span className="price-number">{formatNumber(value)}</span>;
    }
    
    return (
      <RollingNumberComponent
        value={value}
        format={formatNumber}
        duration={scrollDuration}
        showDirection={showFlash}
        showSign={showChange && changePercent !== 0}
        prefix={currency}
        decimalPlaces={decimals}
        useSeparator={true}
        animationType={animationType}
        springConfig={{
          stiffness: 350,
          damping: 35,
          mass: 1,
        }}
        className="price-number"
      />
    );
  };
  
  // 渲染变化百分比
  const renderChange = () => {
    if (!showChange || !previousValue) return null;
    
    const changeClass = changePercent >= 0 ? 'price-change--up' : 'price-change--down';
    const sign = changePercent >= 0 ? '+' : '';
    
    return (
      <span className={`price-change ${changeClass}`}>
        {sign}{changePercent.toFixed(2)}%
      </span>
    );
  };
  
  return (
    <span className={`enhanced-price-display ${colorClass}`}>
      {renderNumber()}
      {renderChange()}
    </span>
  );
};

// 简化版：仅显示价格（无百分比）
export const SimplePriceDisplay: React.FC<{
  value: number;
  currency?: string;
  decimals?: number;
}> = ({ value, currency = '', decimals = 2 }) => {
  return (
    <RollingNumber
      value={value}
      prefix={currency}
      decimalPlaces={decimals}
      useSeparator={true}
      animationType="fade"
      duration={300}
      showDirection={false}
    />
  );
};

// 百分比显示组件
export const PercentChangeDisplay: React.FC<{
  value: number;
  showDirection?: boolean;
  showSign?: boolean;
}> = ({ value, showDirection = true, showSign = true }) => {
  return (
    <RollingNumber
      value={value}
      suffix="%"
      decimalPlaces={2}
      showDirection={showDirection}
      showSign={showSign}
      animationType="scale"
      duration={400}
      className={value >= 0 ? 'text-[var(--status-success)]' : 'text-[var(--status-error)]'}
    />
  );
};

// 高性能版本：使用memo包装
export const EnhancedPriceDisplayMemo = React.memo(EnhancedPriceDisplay);

export default EnhancedPriceDisplay;