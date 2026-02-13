import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServerConfigProvider } from './contexts/ServerConfigContext';
import { NordicThemeProvider } from '../../../libs/design-system/themes';
import App from './App';
import './index.css';

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3000, // 3秒数据陈旧时间
      retry: 1, // 失败重试1次
      refetchOnWindowFocus: false, // 避免窗口聚焦时频繁刷新
    },
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <NordicThemeProvider>
      <ServerConfigProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ServerConfigProvider>
    </NordicThemeProvider>
  </React.StrictMode>
);
