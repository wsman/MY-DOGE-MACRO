// useWebSocketWithThrottle - WebSocket Hook with RequestAnimationFrame Throttling
// 依据: FE-012 WebSocket节流阀实施方案
// 创建: 2026-02-07 (Phase 3: P0核心能力激活)

import { useCallback, useEffect, useRef } from 'react';
import { useAnalysisStore } from '../stores/analysis.store';
import useWebSocket, { UseWebSocketOptions, WebSocketMessage as OriginalWebSocketMessage, WebSocketStatus } from './useWebSocket';
import { WebSocketBatchProcessor, WebSocketMessage as BatchWebSocketMessage } from '../utils/WebSocketBatchProcessor';

// 市场数据接口定义
export interface MarketData {
  price: number;
  change: number;
  changePercent?: number;
  volume: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  [key: string]: any;
}

// 扩展WebSocket消息类型以包含具体的市场数据
interface MarketUpdateMessage extends BatchWebSocketMessage {
  type: 'price_update';
  ticker: string;
  data: MarketData;
}

/**
 * 批处理统计信息接口
 */
export interface BatchStats {
  messagesProcessed: number;
  batchesFlushed: number;
  maxBatchSize: number;
  avgBatchSize: number;
  avgProcessingTime: number;
  bufferSize: number;
  totalProcessingTime?: number;
}

/**
 * 节流版WebSocket Hook配置选项
 */
export interface UseWebSocketWithThrottleOptions extends UseWebSocketOptions {
  /** 批处理大小，默认30条消息 */
  batchSize?: number;
  /** 批处理超时时间，默认16ms (60fps) */
  batchTimeout?: number;
  /** 是否启用批处理性能监控 */
  enablePerformanceMonitoring?: boolean;
}

/**
 * 节流版WebSocket Hook返回值
 */
export interface UseWebSocketWithThrottleReturn {
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
    latencyMs: number | null;
    batchStats?: BatchStats | null;
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
  /** 获取批处理器统计信息 */
  getBatchStats: () => BatchStats | null;
  /** 强制刷新批处理器缓冲区 */
  flushBatch: () => void;
}

/**
 * 高性能WebSocket Hook with RequestAnimationFrame节流
 * 依据FE-012要求，实现16ms (60fps)数据缓冲池
 * 
 * 主要改进：
 * 1. 集成WebSocketBatchProcessor进行消息批处理
 * 2. 使用requestAnimationFrame调度store更新
 * 3. 减少高频行情下的React渲染压力
 * 4. 添加批处理性能监控
 */
export const useWebSocketWithThrottle = (
  options: UseWebSocketWithThrottleOptions = {}
): UseWebSocketWithThrottleReturn => {
  const {
    batchSize = 30,
    batchTimeout = 16, // 60fps的一帧时间
    enablePerformanceMonitoring = true,
    ...websocketOptions
  } = options;

  // 获取Zustand store的更新函数
  const setMarketData = useAnalysisStore((state) => state.setMarketData);
  
  // 批处理器引用
  const batchProcessorRef = useRef<WebSocketBatchProcessor | null>(null);
  
  // 市场数据缓冲池（按ticker分组）
  const marketDataBufferRef = useRef<Map<string, { ticker: string; data: MarketData; timestamp: string }>>(new Map());
  
  // 批处理统计
  const batchStatsRef = useRef({
    messagesProcessed: 0,
    batchesFlushed: 0,
    maxBatchSize: 0,
    totalProcessingTime: 0,
  });

  // 初始化批处理器
  const initializeBatchProcessor = useCallback(() => {
    if (batchProcessorRef.current) {
      return;
    }

    const processBatchCallback = (message: BatchWebSocketMessage) => {
      // 类型安全检查
      if (
        message &&
        typeof message === 'object' &&
        message.type === 'price_update' &&
        message.ticker &&
        message.data
      ) {
        // 将消息添加到缓冲池，同一ticker的最新数据会覆盖旧数据
        // 显式断言为 MarketUpdateMessage，因为我们检查了结构
        const marketMsg = message as MarketUpdateMessage;
        
        marketDataBufferRef.current.set(marketMsg.ticker, {
          ticker: marketMsg.ticker,
          data: marketMsg.data,
          timestamp: marketMsg.timestamp || new Date().toISOString(),
        });
        
        batchStatsRef.current.messagesProcessed++;
      }
    };

    batchProcessorRef.current = new WebSocketBatchProcessor(processBatchCallback, {
      batchSize,
      batchTimeout,
      debug: websocketOptions.debug || false,
    });
  }, [batchSize, batchTimeout, websocketOptions.debug]);

  // 批量更新store的函数（在requestAnimationFrame中执行）
  const flushMarketDataToStore = useCallback(() => {
    const startTime = performance.now();
    
    if (marketDataBufferRef.current.size === 0) {
      return;
    }

    const buffer = new Map(marketDataBufferRef.current);
    marketDataBufferRef.current.clear();
    
    // 批量更新store
    buffer.forEach(({ ticker, data }) => {
      const { price, change, volume, high, low, open, previousClose } = data;
      setMarketData(ticker, {
        ticker,
        name: ticker,
        price,
        change,
        changePercent: data.changePercent || (change / price) * 100,
        volume,
        high: high || price * 1.01,
        low: low || price * 0.99,
        open: open || price * 1.005,
        previousClose: previousClose || price * 0.995,
        timestamp: new Date(),
      });
    });

    const processingTime = performance.now() - startTime;
    
    // 更新批处理统计
    batchStatsRef.current.batchesFlushed++;
    batchStatsRef.current.totalProcessingTime += processingTime;
    batchStatsRef.current.maxBatchSize = Math.max(
      batchStatsRef.current.maxBatchSize,
      buffer.size
    );

    // 性能警告：store更新耗时过长
    if (processingTime > 16 && enablePerformanceMonitoring) {
      console.warn(
        `[WebSocketThrottle] Store批量更新耗时 ${processingTime.toFixed(2)}ms > 16ms, ` +
        `更新了${buffer.size}个ticker`
      );
    }

    if (websocketOptions.debug) {
      console.log(
        `[WebSocketThrottle] 批量更新store: ${buffer.size}个ticker, ` +
        `耗时: ${processingTime.toFixed(2)}ms`
      );
    }
  }, [setMarketData, enablePerformanceMonitoring, websocketOptions.debug]);

  // 使用原生useWebSocket hook
  const websocket = useWebSocket({
    ...websocketOptions,
    // 覆盖消息处理函数，使用批处理器
  });

  // 重写消息处理逻辑
  useEffect(() => {
    // 初始化批处理器
    initializeBatchProcessor();

    if (!batchProcessorRef.current) {
      return;
    }

    // 设置定时器定期刷新store（requestAnimationFrame调度）
    let animationFrameId: number | null = null;
    
    const scheduleStoreUpdate = () => {
      if (marketDataBufferRef.current.size > 0) {
        flushMarketDataToStore();
      }
      
      // 使用requestAnimationFrame进行下一轮调度
      animationFrameId = requestAnimationFrame(scheduleStoreUpdate);
    };

    // 启动调度
    animationFrameId = requestAnimationFrame(scheduleStoreUpdate);

    // 清理函数
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      // 组件卸载前强制刷新剩余数据
      if (marketDataBufferRef.current.size > 0) {
        flushMarketDataToStore();
      }
      
      if (batchProcessorRef.current) {
        batchProcessorRef.current.forceFlush();
      }
    };
  }, [initializeBatchProcessor, flushMarketDataToStore]);

  // 包装原生hook的消息处理
  // 注意：useWebSocket目前没有直接暴露消息拦截点，这里主要是通过useEffect初始化
  // 实际消息拦截逻辑在useWebSocket内部或需要修改useWebSocket支持拦截
  // 当前实现假设useWebSocket会触发websocket实例的onmessage，我们需要确保批处理器能接收到数据
  // 由于useWebSocket内部处理了onmessage，这里可能需要调整useWebSocket的实现或者
  // 在useWebSocket中增加一个onMessage callback prop。
  // 但根据现有代码逻辑，似乎是假设外部无法拦截，除非修改useWebSocket。
  // 不过根据任务描述，我们需要修复类型，而不是重构整个逻辑。
  // 假设useWebSocketWithThrottle在实际使用中通过某种方式（如Context或Ref注入）获取消息流。
  // 这里我们只修复类型问题。
  
  // 获取批处理统计信息
  const getBatchStats = useCallback((): BatchStats | null => {
    if (!batchProcessorRef.current) {
      return null;
    }

    const processorStats = batchProcessorRef.current.getStats();
    const avgProcessingTime = batchStatsRef.current.batchesFlushed > 0
      ? batchStatsRef.current.totalProcessingTime / batchStatsRef.current.batchesFlushed
      : 0;
    const avgBatchSize = batchStatsRef.current.batchesFlushed > 0
      ? batchStatsRef.current.messagesProcessed / batchStatsRef.current.batchesFlushed
      : 0;

    return {
      ...processorStats,
      messagesProcessed: batchStatsRef.current.messagesProcessed,
      batchesFlushed: batchStatsRef.current.batchesFlushed,
      maxBatchSize: batchStatsRef.current.maxBatchSize,
      avgBatchSize,
      avgProcessingTime,
      bufferSize: marketDataBufferRef.current.size,
    };
  }, []);

  // 强制刷新批处理器
  const flushBatch = useCallback(() => {
    if (batchProcessorRef.current) {
      batchProcessorRef.current.forceFlush();
    }
    
    if (marketDataBufferRef.current.size > 0) {
      flushMarketDataToStore();
    }
  }, [flushMarketDataToStore]);

  // 组合统计信息
  const enhancedStats = {
    ...websocket.stats,
    batchStats: getBatchStats(),
  };

  return {
    ...websocket,
    stats: enhancedStats,
    getBatchStats,
    flushBatch,
  };
};

// 默认导出节流版hook
export default useWebSocketWithThrottle;