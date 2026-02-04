// 通用类型定义
export interface PanelPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  minimized?: boolean;
}

export interface PanelState {
  id: string;
  title: string;
  component: string;
  position: PanelPosition;
  active: boolean;
}

export interface LayoutTree {
  type: 'row' | 'column' | 'stack';
  children: LayoutTree[];
  panels?: string[];
  size?: number;
}

// UI主题类型
export type ThemeMode = 'dark' | 'light' | 'system';

export interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  statusBarVisible: boolean;
  notifications: Notification[];
  activeCommandPalette: boolean;
}

// 工作区类型
export interface WorkspaceConfig {
  name: string;
  layout: LayoutTree;
  panels: PanelState[];
  lastActivePanel: string;
  createdAt: Date;
  updatedAt: Date;
}

// 图谱类型
export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  data?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  label?: string;
}

export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: string | null;
  zoom: number;
  pan: { x: number; y: number };
  layoutAlgorithm: 'force' | 'circular' | 'grid';
}

// 命令类型
export interface Command {
  id: string;
  name: string;
  description: string;
  shortcut?: string;
  category: string;
  execute: () => void | Promise<void>;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}
