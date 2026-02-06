// CommandPalette - Migrated to Atomic Design (T-C5.21)
// Uses: Input, Button, Card, Icon atoms
// Last Updated: 2026-02-03

import React, { useEffect, useState, useMemo } from 'react';
import { Command } from 'cmdk';
import { useUIStore } from '../../stores/ui.store';
import { useLayoutStore } from '../../stores/layout.store';
import { showSuccess, showInfo } from '../../stores/ui.store';
import { Icon, IconName } from '@design-system/components/Icon';
import { Badge } from '@design-system/components/Badge';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  category: string;
  shortcut?: string;
  execute: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    theme,
    toggleTheme,
    sidebarOpen,
    toggleSidebar,
    statusBarVisible,
    toggleStatusBar,
  } = useUIStore();

  const { resetLayout, serializeLayout } = useLayoutStore();

  const [search, setSearch] = useState('');
  const [value, setValue] = useState('');

  // 命令列表
  const commands: CommandItem[] = useMemo(
    () => [
      // 视图命令
      {
        id: 'toggle-theme',
        name: '切换主题',
        description: '切换明暗主题',
        icon: theme === 'dark' ? 'settings' : 'settings',
        category: '视图',
        shortcut: 'Ctrl+T',
        execute: () => {
          toggleTheme();
          showSuccess('主题已切换', `切换到 ${theme === 'dark' ? '浅色' : '深色'} 主题`);
        },
      },
      {
        id: 'toggle-sidebar',
        name: '切换侧边栏',
        description: '显示/隐藏侧边栏',
        icon: sidebarOpen ? 'eye-off' : 'eye',
        category: '视图',
        shortcut: 'Ctrl+B',
        execute: () => {
          toggleSidebar();
          showInfo('侧边栏', `侧边栏已${sidebarOpen ? '隐藏' : '显示'}`);
        },
      },
      {
        id: 'toggle-statusbar',
        name: '切换状态栏',
        description: '显示/隐藏状态栏',
        icon: statusBarVisible ? 'eye-off' : 'eye',
        category: '视图',
        shortcut: 'Ctrl+Shift+B',
        execute: () => {
          toggleStatusBar();
          showInfo('状态栏', `状态栏已${statusBarVisible ? '隐藏' : '显示'}`);
        },
      },

      // 布局命令
      {
        id: 'save-layout',
        name: '保存布局',
        description: '保存当前布局',
        icon: 'download',
        category: '布局',
        shortcut: 'Ctrl+Shift+S',
        execute: () => {
          const layoutJson = serializeLayout();
          localStorage.setItem('my-doge-layout-manual', layoutJson);
          showSuccess('布局已保存', '当前布局已保存');
        },
      },
      {
        id: 'reset-layout',
        name: '重置布局',
        description: '重置为默认布局',
        icon: 'refresh',
        category: '布局',
        shortcut: 'Ctrl+Shift+R',
        execute: () => {
          if (window.confirm('确定要重置布局吗？')) {
            resetLayout();
            showSuccess('布局已重置', '布局已恢复到默认值');
          }
        },
      },
      {
        id: 'export-layout',
        name: '导出布局',
        description: '导出布局配置',
        icon: 'upload',
        category: '布局',
        execute: () => {
          const layoutJson = serializeLayout();
          const blob = new Blob([layoutJson], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `my-doge-layout-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          showSuccess('布局已导出', '布局配置已导出');
        },
      },

      // 面板命令
      {
        id: 'open-market',
        name: '打开市场扫描',
        description: '打开市场扫描面板',
        icon: 'chart',
        category: '面板',
        shortcut: 'Ctrl+1',
        execute: () => {
          showInfo('市场扫描', '正在打开市场扫描面板...');
        },
      },
      {
        id: 'open-editor',
        name: '打开研究编辑器',
        description: '打开研究编辑器',
        icon: 'folder',
        category: '面板',
        shortcut: 'Ctrl+2',
        execute: () => {
          showInfo('研究编辑器', '正在打开研究编辑器...');
        },
      },
      {
        id: 'open-terminal',
        name: '打开终端',
        description: '打开系统终端',
        icon: 'terminal',
        category: '面板',
        shortcut: 'Ctrl+`',
        execute: () => {
          showInfo('终端', '正在打开终端...');
        },
      },

      // 系统命令
      {
        id: 'open-settings',
        name: '打开设置',
        description: '打开系统设置',
        icon: 'cog',
        category: '系统',
        shortcut: 'Ctrl+,',
        execute: () => {
          showInfo('设置', '正在打开设置...');
        },
      },
      {
        id: 'clear-notifications',
        name: '清除通知',
        description: '清除所有通知',
        icon: 'close',
        category: '系统',
        execute: () => {
          showInfo('通知', '正在清除通知...');
        },
      },
    ],
    [
      theme,
      sidebarOpen,
      statusBarVisible,
      toggleTheme,
      toggleSidebar,
      toggleStatusBar,
      resetLayout,
      serializeLayout,
    ]
  );

  // 按类别分组
  const commandsByCategory = useMemo(() => {
    return commands.reduce(
      (acc, command) => {
        if (!acc[command.category]) {
          acc[command.category] = [];
        }
        acc[command.category].push(command);
        return acc;
      },
      {} as Record<string, CommandItem[]>
    );
  }, [commands]);

  // 过滤命令
  const filteredCommands = useMemo(() => {
    if (!search) {
      return commands;
    }
    return commands.filter(
      (command) =>
        command.name.toLowerCase().includes(search.toLowerCase()) ||
        command.description.toLowerCase().includes(search.toLowerCase()) ||
        command.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [commands, search]);

  // 全局快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P 或 Cmd+K 打开命令面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Ctrl+K 打开命令面板
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Escape 关闭命令面板
      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }

      // 注册其他快捷键
      commands.forEach((command) => {
        if (command.shortcut) {
          const [modifier, key] = command.shortcut.split('+');
          const isMatch =
            (modifier.includes('Ctrl') ? e.ctrlKey : true) &&
            (modifier.includes('Shift') ? e.shiftKey : true) &&
            (modifier.includes('Alt') ? e.altKey : true) &&
            e.key.toLowerCase() === key.toLowerCase();

          if (isMatch) {
            e.preventDefault();
            command.execute();
          }
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, commands, setCommandPaletteOpen]);

  if (!commandPaletteOpen) {
    return null;
  }

  return (
    <div className="command--palette-overlay" onClick={() => setCommandPaletteOpen(false)}>
      <div className="command--palette-dialog" onClick={(e) => e.stopPropagation()}>
        <Command value={value} onValueChange={setValue} loop>
          {/* Search Input */}
          <div className="command--palette-search">
            <Icon name="search" size="md" className="search--icon" />
            <Command.Input
              placeholder="输入命令或搜索..."
              value={search}
              onValueChange={setSearch}
              autoFocus
              className="command--input"
            />
            <div className="command--shortcuts">
              <kbd>Esc</kbd>
              <span>关闭</span>
            </div>
          </div>

          <Command.List className="command--list">
            <Command.Empty className="command--empty">未找到命令，请尝试其他搜索</Command.Empty>

            {Object.entries(commandsByCategory).map(([category, categoryCommands]) => {
              const filtered = categoryCommands.filter((cmd) => filteredCommands.includes(cmd));

              if (filtered.length === 0) {
                return null;
              }

              return (
                <React.Fragment key={category}>
                  <Command.Group
                    heading={
                      <div className="command--group-heading">
                        <span>{category}</span>
                        <Badge variant="neutral" size="sm">
                          {filtered.length}
                        </Badge>
                      </div>
                    }
                    className="command--group"
                  >
                    {filtered.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={command.id}
                        onSelect={() => {
                          command.execute();
                          setCommandPaletteOpen(false);
                        }}
                        className="command--item"
                      >
                        <div className="command--item-left">
                          <Icon name={command.icon} size="sm" />
                          <div className="command--item-content">
                            <span className="command--item-name">{command.name}</span>
                            <span className="command--item-desc">{command.description}</span>
                          </div>
                        </div>
                        {command.shortcut && (
                          <kbd className="command--shortcut-key">{command.shortcut}</kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                  <div className="command--divider" />
                </React.Fragment>
              );
            })}
          </Command.List>

          <div className="command--footer">
            <div className="command--footer-hints">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> 导航
              </span>
              <span>
                <kbd>Enter</kbd> 选择
              </span>
            </div>
            <span className="command--footer-brand">MY-DOGE Command Palette</span>
          </div>
        </Command>
      </div>
    </div>
  );
};

export default CommandPalette;
