import React, { useRef, useEffect } from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps, DockviewApi } from 'dockview';
import 'dockview/dist/styles/dockview.css';

// 引入面板
import { MarketPanel } from './panels/MarketPanel';
import { SystemTerminal } from './panels/SystemTerminal';
import { ResearchEditor } from './panels/ResearchEditor';
import { PixiGraph } from '../graph/PixiGraph';
import { MacroAnalysisPanel } from './panels/MacroAnalysisPanel';
import { useLayoutStore } from '../../stores/layout.store';
import { useUIStore } from '../../stores/ui.store';
import { showInfo } from '../../stores/ui.store';

// 面板注册表
const components = {
  market: MarketPanel,
  terminal: SystemTerminal,
  editor: ResearchEditor,
  graph: PixiGraph,
  macro: MacroAnalysisPanel,
};

export const MainLayout = () => {
  const api = useRef<DockviewApi | null>(null);
  const { layoutTree, panels, setLayoutTree, serializeLayout, deserializeLayout } = useLayoutStore();
  const { theme } = useUIStore();

  const saveCurrentLayout = () => {
    if (!api.current) return;
    
    try {
      // 获取当前布局状态
      const layout = api.current.toJSON();
      // 这里可以将布局转换为我们的LayoutTree格式
      // 暂时简单保存原始JSON
      const layoutJson = JSON.stringify(layout);
      localStorage.setItem('my-doge-layout-backup', layoutJson);
      
      // 更新store中的布局树
      // 注意：这里需要将Dockview布局转换为我们的LayoutTree格式
      // 暂时先简单存储原始布局
      setLayoutTree({
        type: 'row',
        children: [],
        panels: panels.map(p => p.id)
      });
      
      console.log('Layout saved');
    } catch (error) {
      console.error('Failed to save layout:', error);
    }
  };

  const restoreLayout = (apiInstance: DockviewApi) => {
    try {
      // 尝试从localStorage恢复布局
      const savedLayout = localStorage.getItem('my-doge-layout-backup');
      if (savedLayout) {
        const layout = JSON.parse(savedLayout);
        apiInstance.fromJSON(layout);
        showInfo('Layout Restored', 'Previous layout has been restored successfully.');
        return true;
      }
    } catch (error) {
      console.error('Failed to restore layout:', error);
    }
    
    // 如果没有保存的布局或恢复失败，使用默认布局
    return false;
  };

  const setupDefaultLayout = (apiInstance: DockviewApi) => {
    // 清空所有面板 - 通过遍历所有面板并逐个删除
    const allPanels = apiInstance.panels;
    allPanels.forEach(panel => {
      try {
        apiInstance.removePanel(panel);
      } catch (error) {
        // 忽略删除错误
      }
    });
    
    // --- 初始化默认布局 ---
    // 1. 左侧：市场扫描
    apiInstance.addPanel({
      id: 'market',
      component: 'market',
      title: 'Market Scanner',
      position: { direction: 'left' },
      params: { key: 'market' }
    });

    // 2. 中间：编辑器 (默认占据剩余空间)
    apiInstance.addPanel({
      id: 'editor',
      component: 'editor',
      title: 'Research Note',
      position: { referencePanel: 'market', direction: 'right' },
      params: { key: 'editor' }
    });

    // 3. 右侧：图谱 (与编辑器共享中间区域，或切分到右侧)
    apiInstance.addPanel({
      id: 'graph',
      component: 'graph',
      title: 'Industry Chain',
      position: { referencePanel: 'editor', direction: 'right' },
      params: { key: 'graph' }
    });

    // 4. 底部：终端
    apiInstance.addPanel({
      id: 'terminal',
      component: 'terminal',
      title: 'Terminal',
      position: { direction: 'below' },
      minimumHeight: 200, // 初始高度
      params: { key: 'terminal' }
    });
  };

  const onReady = (event: DockviewReadyEvent) => {
    api.current = event.api;
    
    // 尝试恢复保存的布局
    const restored = restoreLayout(event.api);
    
    // 如果恢复失败，设置默认布局
    if (!restored) {
      setupDefaultLayout(event.api);
    }
    
    // 监听布局变化
    const disposable = event.api.onDidLayoutChange(() => {
      saveCurrentLayout();
    });
    
    // 监听面板激活
    event.api.onDidActivePanelChange((event) => {
      if (event && event.id) {
        // 可以在这里更新store中的activePanelId
        console.log('Active panel changed:', event.id);
      }
    });
    
    // 清理函数
    return () => {
      disposable.dispose();
    };
  };

  // 主题切换效果
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // 保存布局的快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && e.shiftKey) {
        e.preventDefault();
        saveCurrentLayout();
        showInfo('Layout Saved', 'Current layout has been saved.');
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        if (api.current && window.confirm('Reset to default layout?')) {
          setupDefaultLayout(api.current);
          showInfo('Layout Reset', 'Layout has been reset to default.');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen w-screen bg-[#1e1e1e] overflow-hidden">
      <DockviewReact
        components={components}
        onReady={onReady}
        className={`dockview-theme-${theme}`}
        watermarkComponent={() => (
          <div className="text-xs text-gray-500 text-center p-2">
            MY-DOGE Quant System • Use Shift+Ctrl+S to save layout • Shift+Ctrl+R to reset
          </div>
        )}
      />
    </div>
  );
};
