import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAnalysisStore } from '../stores/analysis.store';
import { apiClient } from '../services/api';

/**
 * WebSocket 消息类型定义
 */
export interface WebSocketMessage {
  type: 'price_update' | 'subscribe_result' | 'unsubscribe_result' | 'pong' | 'stats';
  ticker?: string;
  data?: any;
  success?: boolean;
  timestamp?: string;
}

/**
 * WebSocket 连接状态
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

/**
 * useWebSocket Hook 配置选项
 */
export interface UseWebSocketOptions {
  /** WebSocket 服务器 URL，默认从 API 配置推断 */
  url?: string;
  /** 认证 token，默认从 API 客户端获取 */
  token?: string;
  /** 自动重连间隔（毫秒），默认 3000ms */
  reconnectInterval?: number;
  /** 最大重连次数，默认 10 次 */
  maxReconnectAttempts?: number;
  /** 心跳间隔（毫秒），默认 15000ms */
  heartbeatInterval?: number;
  /** 启用调试日志 */
  debug?: boolean;
}

/**
 * WebSocket Hook 返回值
 */
export interface UseWebSocketReturn {
  /** 连接状态 */
  status: WebSocketStatus;
  /** 连接错误信息 */
  error: string | null;
  /** 活跃的订阅列表 */
  subscriptions: string[];
  /** 连接统计信息 */
  stats: {
    messagesReceived: number;
    messagesSent: number;
    lastMessageTime: Date | null;
    reconnectAttempts: number;
  };
  /** 订阅指定 ticker */
  subscribe: (ticker: string) => void;
  /** 取消订阅指定 ticker */
  unsubscribe: (ticker: string) => void;
  /** 手动连接 */
  connect: () => void;
  /** 手动断开连接 */
  disconnect: () => void;
  /** 发送 ping 消息 */
  sendPing: () => void;
  /** 获取连接统计 */
  getStats: () => void;
}

/**
 * 高性能 WebSocket Hook，支持自动重连、心跳检测、订阅管理
 * 
 * 功能特点：
 * 1. 自动重连机制，指数退避策略
 * 2. 心跳检测保持连接活跃
 * 3. 订阅管理，自动重新订阅
 * 4. 与 Zustand store 深度集成，实时更新市场数据
 * 5. 连接状态监控和错误处理
 */
export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    url: customUrl,
    token: customToken,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 15000,
    debug = false,
  } = options;

  // Refs 用于存储可变状态，避免闭包问题
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const clientIdRef = useRef(`client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const messagesReceivedRef = useRef(0);
  const messagesSentRef = useRef(0);

  // State
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);

  // 获取 Zustand store
  const setMarketData = useAnalysisStore((state) => state.setMarketData);

  // 调试日志函数
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[WebSocket]', ...args);
    }
  }, [debug]);

  // 获取 WebSocket URL
  const getWebSocketUrl = useCallback(async (): Promise<string> => {
    if (customUrl) {
      return customUrl;
    }

    // 从 API 配置推断 WebSocket URL
    const config = apiClient.getConfig();
    if (config) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//localhost:${config.port}/ws/${clientIdRef.current}`;
    }

    // 默认开发配置
    return `ws://localhost:8765/ws/${clientIdRef.current}`;
  }, [customUrl]);

  // 获取认证 token
  const getAuthToken = useCallback((): string => {
    if (customToken) {
      return customToken;
    }

    const config = apiClient.getConfig();
    if (config) {
      return config.token;
    }

    return 'mydoge-token-123456'; // 默认开发 token
  }, [customToken]);

  // 发送 WebSocket 消息
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        messagesSentRef.current += 1;
        log('Sent message:', message);
      } catch (err) {
        console.error('Error sending WebSocket message:', err);
      }
    } else {
      log('Cannot send message, WebSocket not open');
    }
  }, [log]);

  // 订阅 ticker
  const subscribe = useCallback((ticker: string) => {
    if (!subscriptionsRef.current.has(ticker)) {
      subscriptionsRef.current.add(ticker);
      setSubscriptions(Array.from(subscriptionsRef.current));
      
      // 如果已连接，立即发送订阅消息
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({
          action: 'subscribe',
          ticker,
          token: getAuthToken(),
        });
        log(`Subscribed to ${ticker}`);
      }
    }
  }, [sendMessage, getAuthToken, log]);

  // 取消订阅 ticker
  const unsubscribe = useCallback((ticker: string) => {
    if (subscriptionsRef.current.has(ticker)) {
      subscriptionsRef.current.delete(ticker);
      setSubscriptions(Array.from(subscriptionsRef.current));
      
      // 如果已连接，立即发送取消订阅消息
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({
          action: 'unsubscribe',
          ticker,
          token: getAuthToken(),
        });
        log(`Unsubscribed from ${ticker}`);
      }
    }
  }, [sendMessage, getAuthToken, log]);

  // 处理接收到的消息
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      messagesReceivedRef.current += 1;
      setLastMessageTime(new Date());
      
      log('Received message:', message);
      
      switch (message.type) {
        case 'price_update':
          if (message.ticker && message.data) {
            // 更新 Zustand store 中的市场数据
            const { price, change, volume } = message.data;
            setMarketData(message.ticker, {
              ticker: message.ticker,
              name: message.ticker, // 实际应用中应从其他地方获取名称
              price,
              change,
              changePercent: (change / price) * 100,
              volume,
              high: price * 1.01, // 模拟值
              low: price * 0.99,  // 模拟值
              open: price * 1.005, // 模拟值
              previousClose: price * 0.995, // 模拟值
              timestamp: new Date(),
            });
          }
          break;
          
        case 'subscribe_result':
          if (!message.success && message.ticker) {
            log(`Subscription failed for ${message.ticker}`);
            // 从订阅列表中移除失败的 ticker
            subscriptionsRef.current.delete(message.ticker);
            setSubscriptions(Array.from(subscriptionsRef.current));
          }
          break;
          
        case 'unsubscribe_result':
          // 无需特别处理
          break;
          
        case 'pong':
          log('Received pong response');
          break;
          
        case 'stats':
          log('Connection stats:', message.data);
          break;
          
        default:
          log('Unknown message type:', message.type);
      }
    } catch (err) {
      console.error('Error parsing WebSocket message:', err, event.data);
    }
  }, [setMarketData, log]);

  // 清理重连定时器
  const cleanupReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 清理心跳定时器
  const cleanupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // 启动心跳检测
  const startHeartbeat = useCallback(() => {
    cleanupHeartbeat();
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendMessage({
          action: 'ping',
          timestamp: new Date().toISOString(),
        });
        log('Sent heartbeat ping');
      }
    }, heartbeatInterval);
  }, [sendMessage, heartbeatInterval, cleanupHeartbeat, log]);

  // 重新连接逻辑
  const reconnect = useCallback(async () => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setStatus('error');
      setError(`Max reconnection attempts (${maxReconnectAttempts}) exceeded`);
      log('Max reconnection attempts exceeded');
      return;
    }

    cleanupReconnect();
    
    // 指数退避策略
    const delay = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current), 30000);
    
    log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current += 1;
      connect();
    }, delay);
  }, [reconnectInterval, maxReconnectAttempts, cleanupReconnect, connect, log]);

  // 连接 WebSocket
  const connect = useCallback(async () => {
    // 清理现有连接
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    cleanupReconnect();
    cleanupHeartbeat();
    
    try {
      const wsUrl = await getWebSocketUrl();
      setStatus('connecting');
      setError(null);
      
      log(`Connecting to ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        log('WebSocket connected');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        // 启动心跳检测
        startHeartbeat();
        
        // 重新订阅所有 ticker
        subscriptionsRef.current.forEach((ticker) => {
          sendMessage({
            action: 'subscribe',
            ticker,
            token: getAuthToken(),
          });
        });
      };
      
      ws.onmessage = handleMessage;
      
      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setStatus('error');
      };
      
      ws.onclose = (event) => {
        log(`WebSocket closed: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
        
        if (event.wasClean) {
          setStatus('disconnected');
        } else {
          setStatus('reconnecting');
          reconnect();
        }
        
        cleanupHeartbeat();
        wsRef.current = null;
      };
      
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(`Failed to create WebSocket: ${err}`);
      setStatus('error');
      reconnect();
    }
  }, [getWebSocketUrl, getAuthToken, handleMessage, reconnect, startHeartbeat, cleanupReconnect, cleanupHeartbeat, log]);

  // 断开连接
  const disconnect = useCallback(() => {
    log('Disconnecting WebSocket');
    
    cleanupReconnect();
    cleanupHeartbeat();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setStatus('disconnected');
    reconnectAttemptsRef.current = 0;
  }, [cleanupReconnect, cleanupHeartbeat, log]);

  // 发送 ping
  const sendPing = useCallback(() => {
    sendMessage({
      action: 'ping',
      timestamp: new Date().toISOString(),
    });
  }, [sendMessage]);

  // 获取统计信息
  const getStats = useCallback(() => {
    sendMessage({
      action: 'get_stats',
    });
  }, [sendMessage]);

  // 组件挂载时自动连接
  useEffect(() => {
    connect();
    
    // 组件卸载时清理
    return () => {
      disconnect();
      cleanupReconnect();
      cleanupHeartbeat();
    };
  }, [connect, disconnect, cleanupReconnect, cleanupHeartbeat]);

  // 返回 hook 接口
  return {
    status,
    error,
    subscriptions,
    stats: {
      messagesReceived: messagesReceivedRef.current,
      messagesSent: messagesSentRef.current,
      lastMessageTime,
      reconnectAttempts: reconnectAttemptsRef.current,
    },
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    sendPing,
    getStats,
  };
};

// 默认导出
export default useWebSocket;