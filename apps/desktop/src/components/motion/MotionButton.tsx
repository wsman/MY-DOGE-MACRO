// MotionButton - 基于Framer Motion的增强按钮组件
// 依据: FE-201 Framer Motion集成实施方案
// 创建: 2026-02-07 (P2阶段优化)

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonRippleVariants } from './animations';

interface MotionButtonProps {
  /** 按钮文本 */
  children: React.ReactNode;
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 是否显示点击涟漪效果 */
  showRipple?: boolean;
  /** 是否显示悬停效果 */
  showHover?: boolean;
  /** 是否显示点击动画 */
  showTap?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否占满宽度 */
  fullWidth?: boolean;
}

/**
 * MotionButton - 增强版按钮组件
 * 提供Framer Motion驱动的流畅动画效果
 */
export const MotionButton: React.FC<MotionButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  showRipple = true,
  showHover = true,
  showTap = true,
  className = '',
  fullWidth = false,
}) => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  
  // 基础样式类名
  const baseClass = 'btn inline-flex items-center justify-center gap-2 font-medium border rounded-md cursor-pointer relative overflow-hidden';
  
  // 变体样式
  const variantClasses = {
    primary: 'bg-accent text-text-primary border-accent hover:bg-accent-hover hover:border-accent-hover',
    secondary: 'bg-secondary text-text-primary border-secondary hover:bg-secondary-hover hover:border-secondary-hover',
    ghost: 'bg-transparent text-text-primary border-transparent hover:bg-[var(--bg-tertiary)]',
    danger: 'bg-danger text-text-primary border-danger hover:bg-danger-dark hover:border-danger-dark',
  };
  
  // 尺寸样式
  const sizeClasses = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-base',
    lg: 'h-12 px-6 text-lg',
  };
  
  // 状态样式
  const stateClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';
  
  const buttonClass = `${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses} ${widthClass} ${className}`.trim();
  
  // 处理点击事件
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // 添加涟漪效果
    if (showRipple) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = { x, y, id: Date.now() };
      setRipples(prev => [...prev, newRipple]);
      
      // 3秒后移除涟漪
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
    
    // 执行点击回调
    onClick?.();
  };
  
  // 悬停动画配置
  const hoverAnimation = showHover ? {
    scale: 1.02,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  } : {};
  
  // 点击动画配置
  const tapAnimation = showTap ? {
    scale: 0.98,
  } : {};
  
  return (
    <motion.button
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : hoverAnimation}
      whileTap={disabled || loading ? undefined : tapAnimation}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8,
      }}
    >
      {/* 涟漪效果 */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute rounded-full bg-white/30"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
            variants={buttonRippleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          />
        ))}
      </AnimatePresence>
      
      {/* 加载状态 */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-inherit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </motion.div>
      )}
      
      {/* 按钮内容 */}
      <div className={`flex items-center gap-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </motion.button>
  );
};

/**
 * MotionIconButton - 图标按钮版本
 */
interface MotionIconButtonProps extends Omit<MotionButtonProps, 'children'> {
  icon: React.ReactNode;
  label?: string;
}

export const MotionIconButton: React.FC<MotionIconButtonProps> = ({
  icon,
  label,
  ...props
}) => {
  return (
    <MotionButton {...props}>
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ rotate: 15 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          {icon}
        </motion.div>
        {label && <span>{label}</span>}
      </div>
    </MotionButton>
  );
};

/**
 * MotionButtonGroup - 按钮组
 */
interface MotionButtonGroupProps {
  children: React.ReactNode;
  /** 间距 (px) */
  spacing?: number;
  /** 是否显示连接效果 */
  connected?: boolean;
}

export const MotionButtonGroup: React.FC<MotionButtonGroupProps> = ({
  children,
  spacing = 8,
  connected = false,
}) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={`flex ${connected ? 'space-x-0' : `space-x-${spacing}`}`}>
      {childrenArray.map((child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            className: `${child.props.className || ''} ${
              connected && index > 0 ? 'rounded-l-none' : ''
            } ${
              connected && index < childrenArray.length - 1 ? 'rounded-r-none border-r-0' : ''
            }`.trim(),
            style: connected ? { marginLeft: index > 0 ? -1 : 0 } : {},
          });
        }
        return child;
      })}
    </div>
  );
};

export default MotionButton;