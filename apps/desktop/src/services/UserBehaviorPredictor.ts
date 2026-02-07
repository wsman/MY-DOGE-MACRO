// UserBehaviorPredictor - 用户行为预测服务
// 依据: AI-001 用户行为预测预研实施方案
// 创建: 2026-02-07 (Phase 3: P2智能核心预研)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ 类型定义 ============

export interface UserInteraction {
  /** 事件类型 */
  type: 'click' | 'view' | 'hover' | 'search' | 'select';
  /** 事件目标 (如股票代码) */
  target: string;
  /** 事件上下文 */
  context?: Record<string, any>;
  /** 事件时间戳 */
  timestamp: number;
  /** 事件位置 (可选) */
  location?: string;
}

export interface UserBehaviorPattern {
  /** 用户ID (匿名) */
  userId: string;
  /** 交互历史 */
  interactions: UserInteraction[];
  /** 统计数据 */
  statistics: {
    totalInteractions: number;
    lastActive: number;
    favoriteTickers: Array<{ ticker: string; count: number; lastSeen: number }>;
    timePatterns: Record<string, number>; // 时间分布
    contextPatterns: Record<string, number>; // 上下文分布
  };
}

export interface PredictionResult {
  /** 预测的股票代码列表 */
  predictedTickers: string[];
  /** 预测置信度 */
  confidence: number;
  /** 预测依据 */
  reasoning: string[];
  /** 是否需要预加载 */
  shouldPreload: boolean;
  /** 预测生成时间 */
  timestamp: number;
}

export interface PredictionConfig {
  /** 启用预测功能 */
  enabled: boolean;
  /** 预测时间窗口 (毫秒) */
  timeWindow: number;
  /** 最大预测数量 */
  maxPredictions: number;
  /** 最小置信度阈值 */
  minConfidence: number;
  /** 是否记录详细日志 */
  debug: boolean;
}

// ============ 预测算法 ============

/**
 * 基于频率的预测算法
 * 统计用户历史点击频率，预测可能再次点击的股票
 */
function frequencyBasedPrediction(
  interactions: UserInteraction[],
  config: PredictionConfig
): PredictionResult {
  const tickerCounts: Record<string, { count: number; lastSeen: number }> = {};
  const now = Date.now();
  
  // 统计时间窗口内的交互
  interactions.forEach(interaction => {
    if (now - interaction.timestamp <= config.timeWindow) {
      if (!tickerCounts[interaction.target]) {
        tickerCounts[interaction.target] = { count: 0, lastSeen: interaction.timestamp };
      }
      tickerCounts[interaction.target].count++;
      tickerCounts[interaction.target].lastSeen = Math.max(
        tickerCounts[interaction.target].lastSeen,
        interaction.timestamp
      );
    }
  });
  
  // 按频率和最近性排序
  const sortedTickers = Object.entries(tickerCounts)
    .map(([ticker, data]) => ({
      ticker,
      score: calculateScore(data.count, data.lastSeen, now),
      count: data.count,
      recency: now - data.lastSeen,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, config.maxPredictions);
  
  const predictedTickers = sortedTickers.map(item => item.ticker);
  const confidence = calculateConfidence(sortedTickers, interactions.length);
  
  return {
    predictedTickers,
    confidence,
    reasoning: [
      `基于过去${Math.round(config.timeWindow / 3600000)}小时内${sortedTickers.length}只股票的${interactions.length}次交互`,
      `最常查看的股票: ${sortedTickers.slice(0, 3).map(t => t.ticker).join(', ')}`,
    ],
    shouldPreload: confidence >= config.minConfidence,
    timestamp: now,
  };
}

/**
 * 基于时间模式的预测算法
 * 根据用户历史时间模式预测当前时间可能查看的股票
 */
function timePatternPrediction(
  interactions: UserInteraction[],
  config: PredictionConfig
): PredictionResult {
  const now = Date.now();
  const currentHour = new Date().getHours();
  
  // 统计各时间段的历史行为
  const hourlyPatterns: Record<number, Record<string, number>> = {};
  
  interactions.forEach(interaction => {
    const hour = new Date(interaction.timestamp).getHours();
    if (!hourlyPatterns[hour]) {
      hourlyPatterns[hour] = {};
    }
    if (!hourlyPatterns[hour][interaction.target]) {
      hourlyPatterns[hour][interaction.target] = 0;
    }
    hourlyPatterns[hour][interaction.target]++;
  });
  
  // 查找当前时间段的历史模式
  const currentPattern = hourlyPatterns[currentHour] || {};
  const similarHours = findSimilarHours(currentHour, Object.keys(hourlyPatterns).map(Number));
  
  // 合并相似时间段的数据
  const combinedPattern: Record<string, number> = { ...currentPattern };
  similarHours.forEach(hour => {
    const pattern = hourlyPatterns[hour];
    if (pattern) {
      Object.entries(pattern).forEach(([ticker, count]) => {
        combinedPattern[ticker] = (combinedPattern[ticker] || 0) + count * 0.5; // 降低权重
      });
    }
  });
  
  // 按频率排序
  const sortedTickers = Object.entries(combinedPattern)
    .map(([ticker, count]) => ({ ticker, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, config.maxPredictions);
  
  const predictedTickers = sortedTickers.map(item => item.ticker);
  const confidence = sortedTickers.length > 0 ? Math.min(0.6 + sortedTickers[0].count * 0.1, 0.9) : 0;
  
  return {
    predictedTickers,
    confidence,
    reasoning: [
      `基于时间模式预测 (当前时间: ${currentHour}:00)`,
      `历史数据显示您在此时段最常查看: ${sortedTickers.slice(0, 3).map(t => t.ticker).join(', ')}`,
    ],
    shouldPreload: confidence >= config.minConfidence,
    timestamp: now,
  };
}

/**
 * 基于相关性预测算法
 * 预测用户可能对相关股票感兴趣
 */
function correlationBasedPrediction(
  interactions: UserInteraction[],
  knownCorrelations: Record<string, string[]>,
  config: PredictionConfig
): PredictionResult {
  const now = Date.now();
  const recentInteractions = interactions.filter(
    interaction => now - interaction.timestamp <= config.timeWindow
  );
  
  if (recentInteractions.length === 0) {
    return {
      predictedTickers: [],
      confidence: 0,
      reasoning: ['暂无近期交互数据'],
      shouldPreload: false,
      timestamp: now,
    };
  }
  
  // 提取最近查看的股票
  const recentTickers = [...new Set(recentInteractions.map(i => i.target))].slice(0, 5);
  
  // 根据相关性查找相关股票
  const correlatedTickers = new Set<string>();
  recentTickers.forEach(ticker => {
    const correlations = knownCorrelations[ticker] || [];
    correlations.forEach(correlatedTicker => {
      if (!recentTickers.includes(correlatedTicker)) {
        correlatedTickers.add(correlatedTicker);
      }
    });
  });
  
  const predictedTickers = Array.from(correlatedTickers).slice(0, config.maxPredictions);
  const confidence = predictedTickers.length > 0 ? 0.5 : 0;
  
  return {
    predictedTickers,
    confidence,
    reasoning: [
      `基于相关性预测`,
      `您最近查看的${recentTickers.length}只股票相关股票: ${predictedTickers.slice(0, 5).join(', ')}`,
    ],
    shouldPreload: predictedTickers.length > 0,
    timestamp: now,
  };
}

/**
 * 组合预测算法（加权平均）
 */
function combinedPrediction(
  interactions: UserInteraction[],
  correlations: Record<string, string[]>,
  config: PredictionConfig
): PredictionResult {
  const predictions = [
    frequencyBasedPrediction(interactions, config),
    timePatternPrediction(interactions, config),
    correlationBasedPrediction(interactions, correlations, config),
  ];
  
  // 过滤掉低置信度的预测
  const validPredictions = predictions.filter(p => p.confidence >= config.minConfidence);
  
  if (validPredictions.length === 0) {
    return {
      predictedTickers: [],
      confidence: 0,
      reasoning: ['所有预测算法置信度均低于阈值'],
      shouldPreload: false,
      timestamp: Date.now(),
    };
  }
  
  // 合并预测结果（加权）
  const tickerScores: Record<string, number> = {};
  const allReasoning: string[] = [];
  
  validPredictions.forEach((prediction, index) => {
    const weight = prediction.confidence;
    prediction.predictedTickers.forEach((ticker, rank) => {
      const rankScore = 1 / (rank + 1); // 排名越高分数越高
      tickerScores[ticker] = (tickerScores[ticker] || 0) + weight * rankScore;
    });
    allReasoning.push(...prediction.reasoning);
  });
  
  // 按分数排序
  const sortedTickers = Object.entries(tickerScores)
    .map(([ticker, score]) => ({ ticker, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, config.maxPredictions);
  
  const predictedTickers = sortedTickers.map(item => item.ticker);
  const confidence = Math.min(
    validPredictions.reduce((sum, p) => sum + p.confidence, 0) / validPredictions.length,
    0.95
  );
  
  return {
    predictedTickers,
    confidence,
    reasoning: [...new Set(allReasoning)], // 去重
    shouldPreload: confidence >= config.minConfidence && predictedTickers.length > 0,
    timestamp: Date.now(),
  };
}

// ============ 辅助函数 ============

function calculateScore(count: number, lastSeen: number, now: number): number {
  const frequencyWeight = Math.log(count + 1); // 对数频率权重
  const recencyWeight = 1 / (1 + Math.log(1 + (now - lastSeen) / 3600000)); // 时间衰减
  return frequencyWeight * 0.7 + recencyWeight * 0.3;
}

function calculateConfidence(sortedTickers: Array<any>, totalInteractions: number): number {
  if (sortedTickers.length === 0) return 0;
  
  const topScore = sortedTickers[0].score;
  const totalScore = sortedTickers.reduce((sum, item) => sum + item.score, 0);
  const scoreRatio = topScore / (totalScore || 1);
  const interactionFactor = Math.min(totalInteractions / 10, 1);
  
  return Math.min(scoreRatio * 0.8 + interactionFactor * 0.2, 0.95);
}

function findSimilarHours(targetHour: number, availableHours: number[]): number[] {
  return availableHours.filter(hour => {
    const diff = Math.abs(hour - targetHour);
    return diff <= 2 || diff >= 22; // 考虑跨天相似时段
  });
}

// ============ Store 定义 ============

interface UserBehaviorPredictorState {
  // 配置
  config: PredictionConfig;
  
  // 数据
  interactions: UserInteraction[];
  behaviorPatterns: UserBehaviorPattern[];
  knownCorrelations: Record<string, string[]>; // 已知的股票相关性
  
  // 预测结果
  currentPrediction: PredictionResult | null;
  predictionHistory: PredictionResult[];
  
  // 操作
  logInteraction: (interaction: Omit<UserInteraction, 'timestamp'>) => void;
  clearInteractions: (maxAge?: number) => void;
  updateConfig: (config: Partial<PredictionConfig>) => void;
  generatePrediction: () => PredictionResult;
  getPredictedTickers: () => string[];
  shouldPreload: (ticker: string) => boolean;
  addCorrelation: (ticker: string, correlatedTickers: string[]) => void;
  getBehaviorStatistics: () => {
    totalInteractions: number;
    recentInteractions: number;
    favoriteTickers: Array<{ ticker: string; count: number }>;
    predictionAccuracy?: number;
  };
}

export const useUserBehaviorPredictor = create<UserBehaviorPredictorState>()(
  persist(
    (set, get) => ({
      // 默认配置
      config: {
        enabled: true,
        timeWindow: 24 * 3600000, // 24小时
        maxPredictions: 5,
        minConfidence: 0.3,
        debug: typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development',
      },
      
      // 默认数据
      interactions: [],
      behaviorPatterns: [],
      knownCorrelations: {
        'AAPL': ['MSFT', 'GOOGL', 'AMZN', 'TSLA'],
        'MSFT': ['AAPL', 'GOOGL', 'AMZN', 'NVDA'],
        'GOOGL': ['AAPL', 'MSFT', 'AMZN', 'META'],
        'AMZN': ['AAPL', 'MSFT', 'GOOGL', 'TSLA'],
        'TSLA': ['AAPL', 'NIO', 'LCID', 'RIVN'],
        '600000': ['600036', '601398', '601939', '601988'], // 中国银行
        '000001': ['000002', '000063', '000858', '000725'], // 平安银行
      },
      
      // 预测结果
      currentPrediction: null,
      predictionHistory: [],
      
      // 记录用户交互
      logInteraction: (interaction) => {
        const newInteraction: UserInteraction = {
          ...interaction,
          timestamp: Date.now(),
        };
        
        set((state) => {
          const newInteractions = [...state.interactions, newInteraction];
          // 保持最近1000次交互
          const trimmedInteractions = newInteractions.slice(-1000);
          
          return {
            interactions: trimmedInteractions,
          };
        });
        
        // 记录调试日志
        if (get().config.debug) {
          console.log('[UserBehavior] 记录交互:', newInteraction);
        }
      },
      
      // 清理过期的交互记录
      clearInteractions: (maxAge = 7 * 24 * 3600000) => { // 默认7天
        const now = Date.now();
        set((state) => ({
          interactions: state.interactions.filter(
            interaction => now - interaction.timestamp <= maxAge
          ),
        }));
      },
      
      // 更新配置
      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
      },
      
      // 生成预测
      generatePrediction: () => {
        const state = get();
        if (!state.config.enabled || state.interactions.length === 0) {
          const emptyPrediction: PredictionResult = {
            predictedTickers: [],
            confidence: 0,
            reasoning: ['预测功能未启用或暂无交互数据'],
            shouldPreload: false,
            timestamp: Date.now(),
          };
          set({ currentPrediction: emptyPrediction });
          return emptyPrediction;
        }
        
        const prediction = combinedPrediction(
          state.interactions,
          state.knownCorrelations,
          state.config
        );
        
        set((state) => ({
          currentPrediction: prediction,
          predictionHistory: [...state.predictionHistory.slice(-100), prediction], // 保持最近100次预测
        }));
        
        if (state.config.debug) {
          console.log('[UserBehavior] 生成预测:', prediction);
        }
        
        return prediction;
      },
      
      // 获取预测的股票代码
      getPredictedTickers: () => {
        const state = get();
        if (!state.currentPrediction || !state.currentPrediction.shouldPreload) {
          return [];
        }
        return state.currentPrediction.predictedTickers;
      },
      
      // 检查是否应该预加载某个股票
      shouldPreload: (ticker: string) => {
        const state = get();
        if (!state.currentPrediction || !state.currentPrediction.shouldPreload) {
          return false;
        }
        return state.currentPrediction.predictedTickers.includes(ticker);
      },
      
      // 添加股票相关性
      addCorrelation: (ticker, correlatedTickers) => {
        set((state) => ({
          knownCorrelations: {
            ...state.knownCorrelations,
            [ticker]: [...new Set(correlatedTickers)],
          },
        }));
      },
      
      // 获取行为统计
      getBehaviorStatistics: () => {
        const state = get();
        const now = Date.now();
        const recentInteractions = state.interactions.filter(
          i => now - i.timestamp <= 24 * 3600000
        );
        
        // 统计股票点击频率
        const tickerCounts: Record<string, number> = {};
        state.interactions.forEach(interaction => {
          tickerCounts[interaction.target] = (tickerCounts[interaction.target] || 0) + 1;
        });
        
        const favoriteTickers = Object.entries(tickerCounts)
          .map(([ticker, count]) => ({ ticker, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        return {
          totalInteractions: state.interactions.length,
          recentInteractions: recentInteractions.length,
          favoriteTickers,
        };
      },
    }),
    {
      name: 'my-doge-user-behavior',
      version: 1,
      partialize: (state) => ({
        interactions: state.interactions.slice(-500), // 只保存最近500次交互
        behaviorPatterns: state.behaviorPatterns,
        knownCorrelations: state.knownCorrelations,
        config: state.config,
      }),
    }
  )
);

// ============ 预加载服务 ============

/**
 * 数据预加载服务
 * 根据预测结果预加载股票数据
 */
export class DataPreloader {
  private preloadQueue: string[] = [];
  private preloading = false;
  private maxConcurrent = 2;
  private preloadCache = new Map<string, { data: any; timestamp: number }>();
  private cacheTTL = 5 * 60000; // 5分钟
  
  constructor(
    private fetchData: (ticker: string) => Promise<any>,
    private onPreloadComplete?: (ticker: string, data: any) => void
  ) {}
  
  /**
   * 预加载股票数据
   */
  async preloadTickers(tickers: string[]): Promise<void> {
    if (!tickers.length) return;
    
    // 过滤已缓存的数据
    const now = Date.now();
    const tickersToPreload = tickers.filter(ticker => {
      const cached = this.preloadCache.get(ticker);
      return !cached || now - cached.timestamp > this.cacheTTL;
    });
    
    if (!tickersToPreload.length) return;
    
    this.preloadQueue.push(...tickersToPreload);
    
    if (!this.preloading) {
      this.startPreloading();
    }
  }
  
  private async startPreloading(): Promise<void> {
    if (this.preloading || this.preloadQueue.length === 0) return;
    
    this.preloading = true;
    
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, this.maxConcurrent);
      
      try {
        await Promise.all(
          batch.map(async (ticker) => {
            try {
              const data = await this.fetchData(ticker);
              const now = Date.now();
              
              this.preloadCache.set(ticker, { data, timestamp: now });
              
              if (this.onPreloadComplete) {
                this.onPreloadComplete(ticker, data);
              }
              
              console.log(`[DataPreloader] 预加载完成: ${ticker}`);
            } catch (error) {
              console.error(`[DataPreloader] 预加载失败 ${ticker}:`, error);
            }
          })
        );
      } catch (error) {
        console.error('[DataPreloader] 批量预加载失败:', error);
      }
      
      // 添加小延迟避免过载
      if (this.preloadQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    this.preloading = false;
  }
  
  /**
   * 从缓存获取数据
   */
  getFromCache(ticker: string): any | null {
    const cached = this.preloadCache.get(ticker);
    if (cached && Date.now() - cached.timestamp <= this.cacheTTL) {
      return cached.data;
    }
    return null;
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.preloadCache.clear();
  }
  
  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    totalCached: number;
    cacheHitRate?: number;
    memoryUsage?: string;
  } {
    const totalCached = this.preloadCache.size;
    // 简单估算内存使用（不准确，仅供参考）
    const memoryUsage = `${Math.round(totalCached * 10)}KB`; // 估算
    
    return {
      totalCached,
      memoryUsage,
    };
  }
}

// ============ 默认导出 ============

export default {
  useUserBehaviorPredictor,
  DataPreloader,
  
  // 便捷方法
  logInteraction: (interaction: Omit<UserInteraction, 'timestamp'>) => {
    const { logInteraction } = useUserBehaviorPredictor.getState();
    logInteraction(interaction);
  },
  
  generatePrediction: (): PredictionResult => {
    const { generatePrediction } = useUserBehaviorPredictor.getState();
    return generatePrediction();
  },
  
  getPredictedTickers: (): string[] => {
    const { getPredictedTickers } = useUserBehaviorPredictor.getState();
    return getPredictedTickers();
  },
  
  getBehaviorStats: () => {
    const { getBehaviorStatistics } = useUserBehaviorPredictor.getState();
    return getBehaviorStatistics();
  },
};

// 导出类型
export type {
  UserInteraction,
  UserBehaviorPattern,
  PredictionResult,
  PredictionConfig,
};