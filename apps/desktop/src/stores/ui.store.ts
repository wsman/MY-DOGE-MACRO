import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode, Notification } from '../types';

interface UIStore {
  // 主题设置
  theme: ThemeMode;

  // 界面状态
  sidebarOpen: boolean;
  statusBarVisible: boolean;
  commandPaletteOpen: boolean;

  // 通知系统
  notifications: Notification[];
  unreadCount: number;

  // 操作
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleStatusBar: () => void;
  setStatusBarVisible: (visible: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // 通知操作
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  removeNotification: (notificationId: string) => void;
  clearNotifications: () => void;
  clearAllNotifications: () => void;

  // 计算属性
  getNotificationsByType: (type: Notification['type']) => Notification[];
}

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: true,
      statusBarVisible: true,
      commandPaletteOpen: false,
      notifications: [],
      unreadCount: 0,

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        }));
      },

      setTheme: (theme) => {
        set(() => ({
          theme,
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        }));
      },

      setSidebarOpen: (open) => {
        set(() => ({
          sidebarOpen: open,
        }));
      },

      toggleStatusBar: () => {
        set((state) => ({
          statusBarVisible: !state.statusBarVisible,
        }));
      },

      setStatusBarVisible: (visible) => {
        set(() => ({
          statusBarVisible: visible,
        }));
      },

      toggleCommandPalette: () => {
        set((state) => ({
          commandPaletteOpen: !state.commandPaletteOpen,
        }));
      },

      setCommandPaletteOpen: (open) => {
        set(() => ({
          commandPaletteOpen: open,
        }));
      },

      addNotification: (notificationData) => {
        const notification: Notification = {
          id: generateId(),
          timestamp: new Date(),
          read: false,
          ...notificationData,
        };

        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50), // 限制最多50条
          unreadCount: state.unreadCount + 1,
        }));

        // 自动移除旧通知（超过100条）
        setTimeout(() => {
          const currentState = get();
          if (currentState.notifications.length > 100) {
            set((state) => ({
              notifications: state.notifications.slice(0, 100),
            }));
          }
        }, 0);
      },

      markNotificationAsRead: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification
          );

          const unreadCount = updatedNotifications.filter((n) => !n.read).length;

          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      removeNotification: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          const updatedNotifications = state.notifications.filter((n) => n.id !== notificationId);

          const unreadDecrement = notification && !notification.read ? 1 : 0;

          return {
            notifications: updatedNotifications,
            unreadCount: state.unreadCount - unreadDecrement,
          };
        });
      },

      clearNotifications: () => {
        set((state) => {
          // 只清除已读通知
          const unreadNotifications = state.notifications.filter((n) => !n.read);

          return {
            notifications: unreadNotifications,
            unreadCount: unreadNotifications.length,
          };
        });
      },

      clearAllNotifications: () => {
        set(() => ({
          notifications: [],
          unreadCount: 0,
        }));
      },

      getNotificationsByType: (type) => {
        return get().notifications.filter((n) => n.type === type);
      },
    }),
    {
      name: 'my-doge-ui-storage',
      version: 1,
      // 只存储主题和界面状态，不存储通知（避免存储过大）
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        statusBarVisible: state.statusBarVisible,
      }),
      // 迁移函数，处理版本升级
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 从版本0迁移到版本1
          return {
            ...persistedState,
            commandPaletteOpen: false,
            notifications: [],
            unreadCount: 0,
          };
        }
        return persistedState;
      },
    }
  )
);

// 导出便捷函数
export const showNotification = (type: Notification['type'], title: string, message: string) => {
  const store = useUIStore.getState();
  store.addNotification({ type, title, message });
};

export const showSuccess = (title: string, message: string) =>
  showNotification('success', title, message);

export const showError = (title: string, message: string) =>
  showNotification('error', title, message);

export const showWarning = (title: string, message: string) =>
  showNotification('warning', title, message);

export const showInfo = (title: string, message: string) =>
  showNotification('info', title, message);
