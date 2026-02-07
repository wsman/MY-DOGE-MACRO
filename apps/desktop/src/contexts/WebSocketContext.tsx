import React, { createContext, useContext, ReactNode } from 'react';
import { 
  useWebSocketWithThrottle, 
  UseWebSocketWithThrottleReturn, 
  UseWebSocketWithThrottleOptions 
} from '../hooks/useWebSocketWithThrottle';

// 兼容类型：使用节流版hook但保持相同的类型接口
const WebSocketContext = createContext<UseWebSocketWithThrottleReturn | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  debug?: boolean;
  batchSize?: number;
  batchTimeout?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  debug = false,
  batchSize = 30,
  batchTimeout = 16
}) => {
  const ws = useWebSocketWithThrottle({ 
    debug, 
    batchSize,
    batchTimeout,
    enablePerformanceMonitoring: debug
  });
  
  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): UseWebSocketWithThrottleReturn => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;
