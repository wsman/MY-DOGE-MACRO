// AnimatedSidebar Component - Framer Motion增强版侧边栏
// 依据: FE-014 Framer Motion深度应用实施方案
// 创建: 2026-02-07 (Phase 3: P1视觉与体验增强)

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { animationPresets, createSpringAnimation } from '../motion/animations';
import './MainLayout.css';

interface SidebarItemProps {
  icon?: string;
  label: string;
  active?: boolean;
  dot?: 'success' | 'danger';
  onClick?: () => void;
  index?: number;
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface AnimatedSidebarProps {
  selectedTicker?: string;
  onStockSelect?: (ticker: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// 动画化侧边栏项
export const AnimatedSidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active = false,
  dot,
  onClick,
  index = 0,
}) => {
  const itemVariants = {
    initial: {
      opacity: 0,
      x: -20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.34, 1.56, 0.64, 1] as const,
      },
    },
    hover: {
      backgroundColor: 'var(--color-primary-light, rgba(59, 130, 246, 0.1))',
      x: 5,
      transition: {
        duration: 0.2,
        ease: [0.34, 1.56, 0.64, 1] as const,
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
      },
    },
  };

  const dotVariants = {
    initial: {
      scale: 0,
    },
    animate: {
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 500,
        damping: 30,
      },
    },
  };

  return (
    <motion.div
      className={`sidebar--item ${active ? 'sidebar--item-active' : ''}`}
      onClick={onClick}
      variants={itemVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
    >
      <div className="sidebar--item-content">
        {icon && (
          <motion.span 
            className="sidebar--item-icon"
            animate={{
              scale: active ? 1.1 : 1,
              rotate: active ? [0, 5, -5, 0] : 0,
            }}
            transition={{
              duration: 0.3,
              times: [0, 0.33, 0.66, 1],
              ease: 'easeInOut',
            }}
          >
            {icon}
          </motion.span>
        )}
        
        <span className="sidebar--item-label">{label}</span>
        
        {dot && (
          <motion.span 
            className={`sidebar-item-dot sidebar-item-dot-${dot}`}
            variants={dotVariants}
            animate="animate"
          />
        )}
      </div>
      
      {/* 活跃指示器 */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="sidebar--item-indicator"
            initial={{ width: 0 }}
            animate={{ width: 4 }}
            exit={{ width: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1] as const,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 动画化侧边栏区域
export const AnimatedSidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  children,
  collapsed = false,
  onToggle,
}) => {
  const sectionVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1] as const,
        staggerChildren: 0.05,
      },
    },
  };

  const contentVariants = {
    initial: {
      height: 0,
      opacity: 0,
    },
    animate: {
      height: 'auto',
      opacity: 1,
      transition: {
        height: {
          duration: 0.3,
          ease: [0.34, 1.56, 0.64, 1] as const,
        },
        opacity: {
          duration: 0.2,
          delay: 0.1,
        },
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: {
          duration: 0.3,
          ease: [0.34, 1.56, 0.64, 1] as const,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  };

  const iconVariants = {
    collapsed: {
      rotate: -180,
    },
    expanded: {
      rotate: 0,
    },
  };

  return (
    <motion.div 
      className="sidebar--section animated"
      variants={sectionVariants}
      initial="initial"
      animate="animate"
    >
      <motion.h3 
        className="sidebar--title"
        whileHover={{ scale: 1.02 }}
        onClick={onToggle}
      >
        {title}
        {onToggle && (
          <motion.span
            className="sidebar--toggle-icon"
            variants={iconVariants}
            animate={collapsed ? 'collapsed' : 'expanded'}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
          >
            ▼
          </motion.span>
        )}
      </motion.h3>
      
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            className="sidebar--list animated"
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 主要动画侧边栏组件
export const AnimatedSidebar: React.FC<AnimatedSidebarProps> = ({
  selectedTicker = '600000',
  onStockSelect,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const sidebarVariants = {
    collapsed: {
      width: 60,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
    expanded: {
      width: 280,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 40,
      },
    },
  };

  const collapseButtonVariants = {
    initial: {
      rotate: 0,
    },
    collapsed: {
      rotate: 180,
    },
    expanded: {
      rotate: 0,
    },
  };

  // 导航项
  const navItems = [
    { icon: '📊', label: '市场扫描' },
    { icon: '⭐', label: '自选股' },
    { icon: '📈', label: '深度分析' },
    { icon: '📁', label: '历史记录' },
    { icon: '⚙️', label: '设置' },
  ];

  // 快速选择股票
  const quickStocks = [
    { ticker: '600000', name: '浦发银行' },
    { ticker: '000001', name: '平安银行' },
    { ticker: '002415', name: '海康威视' },
    { ticker: '600519', name: '贵州茅台' },
    { ticker: '000858', name: '五粮液' },
    { ticker: '300059', name: '东方财富' },
  ];

  return (
    <motion.aside
      className="main--sidebar animated"
      variants={sidebarVariants}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      initial="expanded"
    >
      {/* 折叠按钮 */}
      <motion.div
        className="sidebar--collapse-button"
        onClick={onToggleCollapse}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        variants={collapseButtonVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
      >
        ◀
      </motion.div>

      {/* 仅当展开时显示标题 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="sidebar--header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="sidebar--logo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🦞
            </motion.div>
            <motion.h2 
              className="sidebar--title-main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              我的DOGE
            </motion.h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 导航区域 */}
      <AnimatedSidebarSection title="导航" collapsed={isCollapsed}>
        {navItems.map((item, index) => (
          <AnimatedSidebarItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={index === 0}
            index={index}
          />
        ))}
      </AnimatedSidebarSection>

      {/* 快速选择区域 */}
      <AnimatedSidebarSection title="快速选择" collapsed={isCollapsed}>
        {quickStocks.map((stock, index) => (
          <AnimatedSidebarItem
            key={stock.ticker}
            label={isCollapsed ? '' : `${stock.ticker} ${stock.name}`}
            active={selectedTicker === stock.ticker}
            dot={selectedTicker === stock.ticker ? 'success' : undefined}
            onClick={() => onStockSelect?.(stock.ticker)}
            index={index}
          />
        ))}
      </AnimatedSidebarSection>

      {/* 扫描按钮 */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            className="sidebar--footer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <motion.button
              className="sidebar--scan-button"
              whileHover={{ 
                scale: 1.05,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
              }}
              whileTap={{ scale: 0.95 }}
              transition={createSpringAnimation(300, 20)}
            >
              <motion.span
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                🚀
              </motion.span>
              开始扫描
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

// 集成到现有布局的包装器组件
export const MainLayoutWithAnimations: React.FC<{
  children?: React.ReactNode;
  selectedTicker?: string;
  onStockSelect?: (ticker: string) => void;
}> = ({ children, selectedTicker, onStockSelect }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const handleStockSelect = (ticker: string) => {
    onStockSelect?.(ticker);
  };

  return (
    <div className="main--layout animated">
      {/* 使用动画侧边栏 */}
      <AnimatedSidebar
        selectedTicker={selectedTicker}
        onStockSelect={handleStockSelect}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 主内容区域 */}
      <motion.main
        className="main--area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {children}
      </motion.main>
    </div>
  );
};

export default AnimatedSidebar;