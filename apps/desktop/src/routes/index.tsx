import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ConnectionStatus from '../components/ConnectionStatus';
import { CommandPalette } from '../components/commands/CommandPalette';
import { ServerSettings } from '../components/ServerSettings';
import ServiceStatus from '../components/ServiceStatus';
import { PageSkeleton } from '../components/skeletons/PageSkeleton';
import { RouteTransition } from '../components/transitions/RouteTransition';

// 懒加载页面组件
const Dashboard = lazy(() => import('../components/dashboard/Dashboard'));
const MarketPanel = lazy(() => import('../components/layout/panels/MarketPanel').then(module => ({ default: module.MarketPanel })));
const MacroAnalysisPanel = lazy(() => import('../components/layout/panels/MacroAnalysisPanel').then(module => ({ default: module.MacroAnalysisPanel })));
const ResearchEditor = lazy(() => import('../components/layout/panels/ResearchEditor').then(module => ({ default: module.ResearchEditor })));
const SystemTerminal = lazy(() => import('../components/layout/panels/SystemTerminal').then(module => ({ default: module.SystemTerminal })));
const ReportsPage = lazy(() => import('../components/pages/ReportsPage').then(module => ({ default: module.ReportsPage })));

// 错误页面组件
const ErrorPage = ({ error }: { error?: any }) => (
  <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">⚠️ 页面加载失败</h1>
      <p className="text-gray-400 mb-6">抱歉，页面加载时出现错误。</p>
      <button 
        className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        onClick={() => window.location.reload()}
      >
        刷新页面
      </button>
    </div>
  </div>
);

// 路由配置
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'market',
        element: <MarketPanel />,
      },
      {
        path: 'macro',
        element: <MacroAnalysisPanel />,
      },
      {
        path: 'research',
        element: <ResearchEditor />,
      },
      {
        path: 'terminal',
        element: <SystemTerminal />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
    ],
  },
]);

// 根布局组件
function RootLayout() {
  return (
    <div className="relative h-screen w-screen bg-black">
      {/* 核心布局层 */}
      <MainLayout>
        <RouteTransition animationType="slide-up" duration={300}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </RouteTransition>
      </MainLayout>

      {/* 命令面板 */}
      <CommandPalette />

      {/* 悬浮状态栏 (临时方案，后续移入 Status Bar) */}
      <div className="absolute top-1 right-1 z-50 flex gap-2">
        <ServerSettings />
        <ServiceStatus />
      </div>
    </div>
  );
}

// 路由提供者组件
export function Router() {
  return <RouterProvider router={router} />;
}

// 路由工具函数
export const routes = {
  dashboard: '/',
  market: '/market',
  macro: '/macro',
  research: '/research',
  terminal: '/terminal',
  reports: '/reports',
};

// 默认导出路由提供者
export default Router;