import React, { createContext, useContext, ReactNode } from 'react';
import { useWebSocket, UseWebSocketReturn, UseWebSocketOptions } from '../hooks/useWebSocket';

const WebSocketContext = createContext<UseWebSocketReturn | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  debug?: boolean;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  debug = false 
}) => {
  const ws = useWebSocket({ debug });
  
  return (
    <WebSocketContext.Provider value={ws}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): UseWebSocketReturn => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketProvider;