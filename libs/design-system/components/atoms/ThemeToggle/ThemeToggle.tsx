// ThemeToggle - 主题切换原子组件
// Created: 2026-02-06

import React from 'react';
import { useUIStore } from '../../stores/ui.store';
import { toggleTheme } from '../../services/theme';
import { Button } from './Button';

interface ThemeToggleProps {
  variant?: 'button' | 'icon' | 'switch';
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  variant = 'button', 
  size = 'md' 
}) => {
  const { theme, toggleTheme: storeToggleTheme } = useUIStore();

  const handleToggle = () => {
    storeToggleTheme();
    toggleTheme();
  };

  const isDark = theme === 'dark';

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={handleToggle}
        aria-label={`切换到${isDark ? '浅色' : '深色'}主题`}
        title={`当前主题：${isDark ? '深色' : '浅色'}`}
      >
        {isDark ? '🌙' : '☀️'}
      </Button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className="theme-switch">
        <button
          className={`theme-switch-toggle ${isDark ? 'dark' : 'light'}`}
          onClick={handleToggle}
          aria-label={`切换到${isDark ? '浅色' : '深色'}主题`}
          title={`当前主题：${isDark ? '深色' : '浅色'}`}
        >
          <span className="theme-switch-slider"></span>
          <span className="theme-switch-sun">☀️</span>
          <span className="theme-switch-moon">🌙</span>
        </button>
      </div>
    );
  }

  // Default button variant
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      leftIcon={isDark ? '🌙' : '☀️'}
    >
      {isDark ? '浅色模式' : '深色模式'}
    </Button>
  );
};

// CSS for switch variant
const themeSwitchStyles = `
.theme-switch {
  display: inline-flex;
  align-items: center;
}

.theme-switch-toggle {
  position: relative;
  width: 60px;
  height: 32px;
  border: 2px solid var(--color-border, #e0e0e0);
  border-radius: 16px;
  background: var(--color-surface, #ffffff);
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.theme-switch-toggle:hover {
  border-color: var(--color-primary, #3b82f6);
}

.theme-switch-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: var(--color-primary, #3b82f6);
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.theme-switch-toggle.dark .theme-switch-slider {
  transform: translateX(28px);
}

.theme-switch-sun,
.theme-switch-moon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  transition: opacity 0.3s ease;
}

.theme-switch-sun {
  left: 8px;
  opacity: 1;
}

.theme-switch-moon {
  right: 8px;
  opacity: 0.5;
}

.theme-switch-toggle.dark .theme-switch-sun {
  opacity: 0.5;
}

.theme-switch-toggle.dark .theme-switch-moon {
  opacity: 1;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = themeSwitchStyles;
  document.head.appendChild(styleElement);
}

export default ThemeToggle;