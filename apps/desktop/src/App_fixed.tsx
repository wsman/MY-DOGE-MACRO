import { WebSocketProvider } from './contexts/WebSocketContext';
import Router from './routes';

function App() {
  // 开发环境下启用WebSocket调试
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <WebSocketProvider debug={isDev}>
      <Router />
    </WebSocketProvider>
  );
}

export default App;