import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Terminal, FileText, BarChart3, Settings, Moon, Sun, Layout, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useUIStore } from '../../stores/ui.store';
import { useLayoutStore } from '../../stores/layout.store';
import { showSuccess, showInfo } from '../../stores/ui.store';

interface CommandItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
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
    toggleStatusBar
  } = useUIStore();
  
  const { 
    resetLayout,
    panels,
    serializeLayout,
    deserializeLayout
  } = useLayoutStore();
  
  const [search, setSearch] = useState('');
  const [value, setValue] = useState('');

  // 命令列表
  const commands: CommandItem[] = [
    // 视图命令
    {
      id: 'toggle-theme',
      name: 'Toggle Theme',
      description: '切换明暗主题',
      icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      category: 'View',
      shortcut: 'Ctrl+T',
      execute: () => {
        toggleTheme();
        showSuccess('Theme Changed', `Switched to ${theme === 'dark' ? 'light' : 'dark'} theme`);
      }
    },
    {
      id: 'toggle-sidebar',
      name: 'Toggle Sidebar',
      description: '显示/隐藏侧边栏',
      icon: sidebarOpen ? <EyeOff size={16} /> : <Eye size={16} />,
      category: 'View',
      shortcut: 'Ctrl+B',
      execute: () => {
        toggleSidebar();
        showInfo('Sidebar', `Sidebar ${sidebarOpen ? 'hidden' : 'shown'}`);
      }
    },
    {
      id: 'toggle-statusbar',
      name: 'Toggle Status Bar',
      description: '显示/隐藏状态栏',
      icon: statusBarVisible ? <EyeOff size={16} /> : <Eye size={16} />,
      category: 'View',
      shortcut: 'Ctrl+Shift+B',
      execute: () => {
        toggleStatusBar();
        showInfo('Status Bar', `Status bar ${statusBarVisible ? 'hidden' : 'shown'}`);
      }
    },
    
    // 布局命令
    {
      id: 'save-layout',
      name: 'Save Layout',
      description: '保存当前布局',
      icon: <Save size={16} />,
      category: 'Layout',
      shortcut: 'Ctrl+Shift+S',
      execute: () => {
        const layoutJson = serializeLayout();
        localStorage.setItem('my-doge-layout-manual', layoutJson);
        showSuccess('Layout Saved', 'Current layout has been saved');
      }
    },
    {
      id: 'reset-layout',
      name: 'Reset Layout',
      description: '重置为默认布局',
      icon: <RefreshCw size={16} />,
      category: 'Layout',
      shortcut: 'Ctrl+Shift+R',
      execute: () => {
        if (window.confirm('Are you sure you want to reset the layout?')) {
          resetLayout();
          showSuccess('Layout Reset', 'Layout has been reset to default');
        }
      }
    },
    {
      id: 'export-layout',
      name: 'Export Layout',
      description: '导出布局配置',
      icon: <Layout size={16} />,
      category: 'Layout',
      execute: () => {
        const layoutJson = serializeLayout();
        const blob = new Blob([layoutJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-doge-layout-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Layout Exported', 'Layout configuration has been exported');
      }
    },
    
    // 面板命令
    {
      id: 'open-market',
      name: 'Open Market Scanner',
      description: '打开市场扫描面板',
      icon: <BarChart3 size={16} />,
      category: 'Panels',
      shortcut: 'Ctrl+1',
      execute: () => {
        // 这里需要实现打开市场面板的逻辑
        showInfo('Market Scanner', 'Opening Market Scanner panel...');
      }
    },
    {
      id: 'open-editor',
      name: 'Open Research Editor',
      description: '打开研究编辑器',
      icon: <FileText size={16} />,
      category: 'Panels',
      shortcut: 'Ctrl+2',
      execute: () => {
        showInfo('Research Editor', 'Opening Research Editor...');
      }
    },
    {
      id: 'open-terminal',
      name: 'Open Terminal',
      description: '打开系统终端',
      icon: <Terminal size={16} />,
      category: 'Panels',
      shortcut: 'Ctrl+`',
      execute: () => {
        showInfo('Terminal', 'Opening Terminal...');
      }
    },
    
    // 系统命令
    {
      id: 'open-settings',
      name: 'Open Settings',
      description: '打开系统设置',
      icon: <Settings size={16} />,
      category: 'System',
      shortcut: 'Ctrl+,',
      execute: () => {
        showInfo('Settings', 'Opening settings...');
      }
    },
    {
      id: 'clear-notifications',
      name: 'Clear Notifications',
      description: '清除所有通知',
      icon: <EyeOff size={16} />,
      category: 'System',
      execute: () => {
        // 这里需要实现清除通知的逻辑
        showInfo('Notifications', 'Clearing notifications...');
      }
    }
  ];

  // 按类别分组
  const commandsByCategory = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // 过滤命令
  const filteredCommands = commands.filter(command =>
    command.name.toLowerCase().includes(search.toLowerCase()) ||
    command.description.toLowerCase().includes(search.toLowerCase()) ||
    command.category.toLowerCase().includes(search.toLowerCase())
  );

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
      commands.forEach(command => {
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
  }, [commandPaletteOpen, commands]);

  if (!commandPaletteOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div 
        className="w-full max-w-2xl bg-[#1e1e1e] border border-gray-800 rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command value={value} onValueChange={setValue} loop>
          <div className="flex items-center border-b border-gray-800 px-4 py-3">
            <Search size={16} className="text-gray-400 mr-3" />
            <Command.Input 
              placeholder="Type a command or search..."
              className="w-full bg-transparent text-white placeholder-gray-500 outline-none text-sm"
              value={search}
              onValueChange={setSearch}
              autoFocus
            />
            <div className="flex items-center gap-2 ml-4">
              <kbd className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded border border-gray-700">
                Esc
              </kbd>
              <span className="text-xs text-gray-500">to close</span>
            </div>
          </div>
          
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-gray-500 text-sm">
              No commands found. Try a different search.
            </Command.Empty>
            
            {Object.entries(commandsByCategory).map(([category, categoryCommands]) => {
              const filtered = categoryCommands.filter(cmd => 
                filteredCommands.includes(cmd)
              );
              
              if (filtered.length === 0) return null;
              
              return (
                <React.Fragment key={category}>
                  <Command.Group 
                    heading={
                      <div className="flex items-center justify-between px-2 py-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          {category}
                        </span>
                        <span className="text-xs text-gray-600">
                          {filtered.length} command{filtered.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    }
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2"
                  >
                    {filtered.map((command) => (
                      <Command.Item
                        key={command.id}
                        value={command.id}
                        onSelect={() => {
                          command.execute();
                          setCommandPaletteOpen(false);
                        }}
                        className="flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer data-[selected=true]:bg-gray-800 data-[selected=true]:text-white text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-gray-400">
                            {command.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{command.name}</span>
                            <span className="text-xs text-gray-500">{command.description}</span>
                          </div>
                        </div>
                        {command.shortcut && (
                          <kbd className="px-2 py-1 text-xs bg-gray-900 text-gray-400 rounded border border-gray-700">
                            {command.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                  
                  <div className="h-px bg-gray-800 mx-2 my-2" />
                </React.Fragment>
              );
            })}
            
            {/* 最近使用/收藏命令 */}
            <Command.Group heading="Recently Used" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2">
              {/* 这里可以添加最近使用的命令 */}
            </Command.Group>
          </Command.List>
          
          <div className="border-t border-gray-800 px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↑</kbd> <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">↓</kbd> to navigate</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700">Enter</kbd> to select</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">MY-DOGE Command Palette</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
};