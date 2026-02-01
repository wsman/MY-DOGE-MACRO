import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PanelState, LayoutTree, PanelPosition } from '../types';

interface LayoutStore {
  // 面板状态
  panels: PanelState[];
  activePanelId: string | null;
  
  // 布局树
  layoutTree: LayoutTree | null;
  
  // 操作
  addPanel: (panel: Omit<PanelState, 'position'> & { position?: Partial<PanelPosition> }) => void;
  removePanel: (panelId: string) => void;
  updatePanelPosition: (panelId: string, position: Partial<PanelPosition>) => void;
  setActivePanel: (panelId: string) => void;
  minimizePanel: (panelId: string) => void;
  restorePanel: (panelId: string) => void;
  
  // 布局操作
  setLayoutTree: (tree: LayoutTree) => void;
  resetLayout: () => void;
  
  // 序列化/反序列化
  serializeLayout: () => string;
  deserializeLayout: (json: string) => void;
}

const defaultLayoutTree: LayoutTree = {
  type: 'row',
  children: [
    {
      type: 'column',
      size: 25,
      children: [],
      panels: ['market']
    },
    {
      type: 'column',
      size: 50,
      children: [],
      panels: ['editor']
    },
    {
      type: 'column',
      size: 25,
      children: [],
      panels: ['graph']
    }
  ]
};

const defaultPanels: PanelState[] = [
  {
    id: 'market',
    title: 'Market Scanner',
    component: 'market',
    position: { x: 0, y: 0, width: 300, height: 600 },
    active: true
  },
  {
    id: 'editor',
    title: 'Research Editor',
    component: 'editor',
    position: { x: 300, y: 0, width: 600, height: 600 },
    active: true
  },
  {
    id: 'graph',
    title: 'Industry Graph',
    component: 'graph',
    position: { x: 900, y: 0, width: 300, height: 600 },
    active: true
  },
  {
    id: 'terminal',
    title: 'System Terminal',
    component: 'terminal',
    position: { x: 0, y: 600, width: 1200, height: 200 },
    active: true
  }
];

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      panels: defaultPanels,
      activePanelId: 'editor',
      layoutTree: defaultLayoutTree,

      addPanel: (panelData) => {
        const position = panelData.position || { x: 100, y: 100, width: 400, height: 300 };
        const panel: PanelState = {
          ...panelData,
          position: {
            x: position.x || 100,
            y: position.y || 100,
            width: position.width || 400,
            height: position.height || 300,
            minimized: position.minimized || false
          },
          active: true
        };
        
        set((state) => ({
          panels: [...state.panels, panel],
          activePanelId: panel.id
        }));
      },

      removePanel: (panelId) => {
        set((state) => ({
          panels: state.panels.filter((p) => p.id !== panelId),
          activePanelId: state.activePanelId === panelId ? 
            (state.panels.find(p => p.id !== panelId)?.id || null) : 
            state.activePanelId
        }));
      },

      updatePanelPosition: (panelId, position) => {
        set((state) => ({
          panels: state.panels.map((panel) =>
            panel.id === panelId
              ? {
                  ...panel,
                  position: {
                    ...panel.position,
                    ...position
                  }
                }
              : panel
          )
        }));
      },

      setActivePanel: (panelId) => {
        set(() => ({
          activePanelId: panelId
        }));
      },

      minimizePanel: (panelId) => {
        set((state) => ({
          panels: state.panels.map((panel) =>
            panel.id === panelId
              ? {
                  ...panel,
                  position: {
                    ...panel.position,
                    minimized: true
                  }
                }
              : panel
          )
        }));
      },

      restorePanel: (panelId) => {
        set((state) => ({
          panels: state.panels.map((panel) =>
            panel.id === panelId
              ? {
                  ...panel,
                  position: {
                    ...panel.position,
                    minimized: false
                  }
                }
              : panel
          )
        }));
      },

      setLayoutTree: (tree) => {
        set(() => ({
          layoutTree: tree
        }));
      },

      resetLayout: () => {
        set(() => ({
          panels: defaultPanels,
          layoutTree: defaultLayoutTree,
          activePanelId: 'editor'
        }));
      },

      serializeLayout: () => {
        const state = get();
        return JSON.stringify({
          panels: state.panels,
          layoutTree: state.layoutTree,
          activePanelId: state.activePanelId,
          timestamp: new Date().toISOString()
        });
      },

      deserializeLayout: (json) => {
        try {
          const data = JSON.parse(json);
          set(() => ({
            panels: data.panels || defaultPanels,
            layoutTree: data.layoutTree || defaultLayoutTree,
            activePanelId: data.activePanelId || 'editor'
          }));
        } catch (error) {
          console.error('Failed to deserialize layout:', error);
          // 恢复默认布局
          set(() => ({
            panels: defaultPanels,
            layoutTree: defaultLayoutTree,
            activePanelId: 'editor'
          }));
        }
      }
    }),
    {
      name: 'my-doge-layout-storage',
      version: 1,
      // 只存储必要的面板数据，避免存储过大
      partialize: (state) => ({
        panels: state.panels.map(p => ({
          id: p.id,
          title: p.title,
          component: p.component,
          position: {
            x: p.position.x,
            y: p.position.y,
            width: p.position.width,
            height: p.position.height,
            minimized: p.position.minimized
          },
          active: p.active
        })),
        layoutTree: state.layoutTree,
        activePanelId: state.activePanelId
      })
    }
  )
);