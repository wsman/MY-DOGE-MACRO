// Behavior Store - 用户行为追踪与预测系统
// 依据: AI-001 用户行为预测预研实施方案
// 创建: 2026-02-07 (Phase 3: P2智能核心预研)

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ 类型定义 ============

export interface UserInteraction {
  id: string;
  type: 'ticker_click' | 'chart_view' | 'indicator_toggle' | 'refresh' | 'search' | 'panel_switch';
  ticker?: string;            // 相关股票代码
  target?: string;            // 目标元素/组件
  timestamp: Date;           // 时间戳
  metadata?: Record<string, any>; // 额外元数据
  sessionId: string;         // 会话ID
}

export interface TickerBehaviorProfile {
  ticker: string;
  clickCount: number;        // 点击次数
  lastClickTime: Date | null; // 最后点击时间
  viewDuration: number;      // 总查看时长（秒）
  indicatorsUsed: string[];  // 使用的指标
  averageSessionDuration: number; // 平均会话时长
  frequencyScore: number;    // 频率得分（0-100）
  recencyScore: number;      // 新近度得分（0-100）
  predictedNextClick: number; // 预测下次点击概率（0-1）
}

export interface SessionData {
  id: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
  tickersViewed: string[];
  interactions: UserInteraction[];
  deviceInfo?: Record<string, any>;
}

export interface PredictionResult {
  ticker: string;
  probability: number;
  reasons: string[];         // 预测原因
  confidence: number;        // 置信度（0-1）
  recommendedActions: string[]; // 推荐动作
}

// ============ 行为追踪配置 ============

interface BehaviorConfig {
  // 追踪配置
  enabled: boolean;
  maxInteractionsPerSession: number;
  sessionTimeoutMinutes: number;
  
  // 预测算法配置
  recencyWeight: number;     // 新近度权重
  frequencyWeight: number;   // 频率权重
  durationWeight: number;    // 时长权重
  patternWeight: number;     // 模式权重
  
  // 预加载配置
  preloadEnabled: boolean;
  preloadThreshold: number;  // 预加载阈值（概率）
  maxPreloadCount: number;   // 最大预加载数量
  preloadDelayMs: number;    // 预加载延迟（避免过度预加载）
}

// ============ 状态存储 ============

interface BehaviorState {
  // 当前会话
  currentSession: SessionData | null;
  currentTicker: string | null;
  
  // 行为历史
  interactionHistory: UserInteraction[];
  tickerProfiles: Record<string, TickerBehaviorProfile>;
  sessionHistory: SessionData[];
  
  // 预测结果
  currentPredictions: PredictionResult[];
  
  // 配置
  config: BehaviorConfig;
  
  // 操作
  startSession: () => void;
  endSession: () => void;
  recordInteraction: (interaction: Omit<UserInteraction, 'id' | 'timestamp' | 'sessionId'>) => void;
  setCurrentTicker: (ticker: string | null) => void;
  
  // 预测方法
  calculatePredictions: () => PredictionResult[];
  getTopPredictions: (limit?: number) => PredictionResult[];
  updateTickerProfile: (ticker: string) => void;
  
  // 预加载管理
  shouldPreloadTicker: (ticker: string) => boolean;
  getTickersToPreload: () => string[];
  
  // 配置管理
  updateConfig: (config: Partial<BehaviorConfig>) => void;
  resetBehaviorData: () => void;
  
  // 分析工具
  getSessionAnalytics: () => any;
  getTickerAnalytics: (ticker: string) => any;
  getUserPatterns: () => any;
}

// ============ 工具函数 ============

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const getCurrentSessionId = (): string => {
  return sessionStorage.getItem('behavior_session_id') || generateId();
};

const saveSessionId = (sessionId: string): void => {
  sessionStorage.setItem('behavior_session_id', sessionId);
};

// 时间衰减函数（指数衰减）
const timeDecay = (lastTime: Date | null, halfLifeHours: number = 24): number => {
  if (!lastTime) return 0;
  
  const now = new Date();
  const hoursDiff = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.pow(0.5, hoursDiff / halfLifeHours);
  
  return Math.max(0, Math.min(1, decayFactor));
};

// 归一化函数
const normalizeScore = (value: number, min: number, max: number): number => {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

// ============ 默认配置 ============

const defaultConfig: BehaviorConfig = {
  enabled: true,
  maxInteractionsPerSession: 1000,
  sessionTimeoutMinutes: 30,
  
  recencyWeight: 0.4,
  frequencyWeight: 0.3,
  durationWeight: 0.2,
  patternWeight: 0.1,
  
  preloadEnabled: true,
  preloadThreshold: 0.3,
  maxPreloadCount: 3,
  preloadDelayMs: 500,
};

// ============ 存储实现 ============

export const useBehaviorStore = create<BehaviorState>()(
  persist(
    (set, get) => ({
      currentSession: null,
      currentTicker: null,
      interactionHistory: [],
      tickerProfiles: {},
      sessionHistory: [],
      currentPredictions: [],
      config: defaultConfig,

      // ============ 会话管理 ============
      
      startSession: () => {
        const sessionId = generateId();
        saveSessionId(sessionId);
        
        const newSession: SessionData = {
          id: sessionId,
          startTime: new Date(),
          totalDuration: 0,
          tickersViewed: [],
          interactions: [],
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
          },
        };
        
        set({ currentSession: newSession });
        
        // 记录会话开始交互
        get().recordInteraction({
          type: 'panel_switch',
          target: 'session_start',
        });
      },

      endSession: () => {
        const state = get();
        if (!state.currentSession) return;
        
        const now = new Date();
        const sessionDuration = (now.getTime() - state.currentSession.startTime.getTime()) / 1000;
        
        const completedSession: SessionData = {
          ...state.currentSession,
          endTime: now,
          totalDuration: sessionDuration,
        };
        
        set((prev) => ({
          currentSession: null,
          sessionHistory: [...prev.sessionHistory, completedSession].slice(-100), // 保留最近100个会话
        }));
      },

      // ============ 交互记录 ============
      
      recordInteraction: (interactionData) => {
        const state = get();
        if (!state.config.enabled) return;
        
        const sessionId = state.currentSession?.id || getCurrentSessionId();
        
        // 如果没有活动会话，创建一个
        if (!state.currentSession) {
          state.startSession();
        }
        
        const interaction: UserInteraction = {
          id: generateId(),
          sessionId,
          timestamp: new Date(),
          ...interactionData,
        };
        
        // 更新当前会话
        const updatedSession = state.currentSession 
          ? {
              ...state.currentSession,
              interactions: [...state.currentSession.interactions, interaction].slice(-state.config.maxInteractionsPerSession),
              tickersViewed: interactionData.ticker 
                ? [...new Set([...state.currentSession.tickersViewed, interactionData.ticker])]
                : state.currentSession.tickersViewed,
            }
          : null;
        
        // 更新交互历史
        const updatedHistory = [...state.interactionHistory, interaction].slice(-5000); // 保留最近5000条记录
        
        set({
          currentSession: updatedSession,
          interactionHistory: updatedHistory,
        });
        
        // 如果涉及股票，更新其行为画像
        if (interactionData.ticker) {
          state.updateTickerProfile(interactionData.ticker);
        }
        
        // 重新计算预测
        if (interactionData.type === 'ticker_click' || interactionData.type === 'search') {
          setTimeout(() => {
            const predictions = state.calculatePredictions();
            set({ currentPredictions: predictions });
          }, 100);
        }
      },

      setCurrentTicker: (ticker) => {
        set({ currentTicker: ticker });
        
        if (ticker) {
          get().recordInteraction({
            type: 'ticker_click',
            ticker,
            target: 'ticker_select',
          });
        }
      },

      // ============ 股票画像更新 ============
      
      updateTickerProfile: (ticker) => {
        const state = get();
        const now = new Date();
        
        // 获取与该股票相关的所有交互
        const tickerInteractions = state.interactionHistory.filter(
          interaction => interaction.ticker === ticker
        );
        
        if (tickerInteractions.length === 0) return;
        
        // 计算点击次数
        const clickCount = tickerInteractions.filter(i => i.type === 'ticker_click').length;
        
        // 计算最后点击时间
        const lastClick = tickerInteractions
          .filter(i => i.type === 'ticker_click')
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        
        // 计算总查看时长（简单估算）
        const viewDuration = tickerInteractions.reduce((total, interaction) => {
          if (interaction.type === 'chart_view') {
            const duration = interaction.metadata?.duration || 60; // 默认60秒
            return total + duration;
          }
          return total;
        }, 0);
        
        // 收集使用的指标
        const indicatorsUsed = Array.from(new Set(
          tickerInteractions
            .filter(i => i.type === 'indicator_toggle' && i.metadata && i.metadata.indicator)
            .map(i => i.metadata.indicator)
        ));
        
        // 计算会话数据
        const tickerSessions = state.sessionHistory.filter(session =>
          session.tickersViewed.includes(ticker)
        );
        const averageSessionDuration = tickerSessions.length > 0
          ? tickerSessions.reduce((sum, s) => sum + s.totalDuration, 0) / tickerSessions.length
          : 0;
        
        // 计算频率得分（基于总点击次数和最近活动）
        const totalClicksAllTickers = Object.values(state.tickerProfiles).reduce(
          (sum, profile) => sum + profile.clickCount, 0
        );
        
        const frequencyScore = totalClicksAllTickers > 0
          ? (clickCount / totalClicksAllTickers) * 100
          : 0;
        
        // 计算新近度得分
        const recencyScore = lastClick
          ? timeDecay(lastClick.timestamp, 24) * 100
          : 0;
        
        const currentProfile: TickerBehaviorProfile = {
          ticker,
          clickCount,
          lastClickTime: lastClick?.timestamp || null,
          viewDuration,
          indicatorsUsed,
          averageSessionDuration,
          frequencyScore,
          recencyScore,
          predictedNextClick: 0,
        };
        
        set((prev) => ({
          tickerProfiles: {
            ...prev.tickerProfiles,
            [ticker]: currentProfile,
          },
        }));
      },

      // ============ 预测算法 ============
      
      calculatePredictions: () => {
        const state = get();
        const { tickerProfiles, config, currentTicker } = state;
        
        if (Object.keys(tickerProfiles).length === 0) {
          return [];
        }
        
        // 获取所有股票的最新画像
        const allTickers = Object.values(tickerProfiles);
        
        // 计算每个股票的预测概率
        const predictions: PredictionResult[] = allTickers.map((profile) => {
          // 基础得分计算
          const recencyScore = profile.recencyScore / 100;
          const frequencyScore = profile.frequencyScore / 100;
          
          // 时长得分（归一化）
          const allDurations = allTickers.map(p => p.viewDuration);
          const maxDuration = Math.max(...allDurations);
          const minDuration = Math.min(...allDurations);
          const durationScore = normalizeScore(profile.viewDuration, minDuration, maxDuration);
          
          // 模式得分（基于指标使用）
          const patternScore = profile.indicatorsUsed.length > 0 ? 0.7 : 0.3;
          
          // 综合概率计算
          const rawProbability = 
            recencyScore * config.recencyWeight +
            frequencyScore * config.frequencyWeight + 
            durationScore * config.durationWeight +
            patternScore * config.patternWeight;
          
          // 如果有当前选中的股票，给予相关股票额外权重
          let adjustedProbability = rawProbability;
          let reasons = [];
          
          if (currentTicker) {
            // 如果这是当前股票，降低概率（用户可能不会立即点击同一个）
            if (profile.ticker === currentTicker) {
              adjustedProbability *= 0.3;
              reasons.push('用户正在查看此股票，可能不会立即再次点击');
            } else {
              // 类似股票的权重增加（简单基于代码相似性）
              const isSimilar = profile.ticker.startsWith(currentTicker.substring(0, 2));
              if (isSimilar) {
                adjustedProbability *= 1.2;
                reasons.push('与当前查看股票代码相似');
              }
            }
          }
          
          // 确保概率在0-1范围内
          const probability = Math.max(0, Math.min(1, adjustedProbability));
          
          // 置信度计算
          const confidence = 
            (profile.clickCount > 10 ? 0.9 : 0.6) * // 数据充足度
            (profile.lastClickTime ? 0.8 : 0.3);    // 数据新近度
          
          // 推荐动作
          const recommendedActions = [];
          if (profile.indicatorsUsed.length === 0) {
            recommendedActions.push('预加载基础K线数据');
          } else {
            recommendedActions.push('预加载常用指标数据');
          }
          if (profile.viewDuration > 300) { // 查看超过5分钟
            recommendedActions.push('预加载深度分析数据');
          }
          
          return {
            ticker: profile.ticker,
            probability,
            reasons,
            confidence,
            recommendedActions,
          };
        });
        
        // 按概率排序
        const sortedPredictions = predictions.sort((a, b) => b.probability - a.probability);
        
        // 更新股票画像中的预测值
        sortedPredictions.forEach((prediction, index) => {
          const ticker = prediction.ticker;
          set((prev) => ({
            tickerProfiles: {
              ...prev.tickerProfiles,
              [ticker]: {
                ...prev.tickerProfiles[ticker],
                predictedNextClick: prediction.probability,
              },
            },
          }));
        });
        
        return sortedPredictions;
      },

      getTopPredictions: (limit = 5) => {
        const state = get();
        const predictions = state.currentPredictions.length > 0 
          ? state.currentPredictions 
          : state.calculatePredictions();
        
        return predictions.slice(0, limit);
      },

      // ============ 预加载管理 ============
      
      shouldPreloadTicker: (ticker) => {
        const state = get();
        if (!state.config.preloadEnabled) return false;
        
        const predictions = state.getTopPredictions(state.config.maxPreloadCount);
        const prediction = predictions.find(p => p.ticker === ticker);
        
        return prediction 
          ? prediction.probability >= state.config.preloadThreshold 
          : false;
      },

      getTickersToPreload: () => {
        const state = get();
        if (!state.config.preloadEnabled) return [];
        
        const predictions = state.getTopPredictions(state.config.maxPreloadCount);
        return predictions
          .filter(p => p.probability >= state.config.preloadThreshold)
          .map(p => p.ticker);
      },

      // ============ 配置管理 ============
      
      updateConfig: (newConfig) => {
        set((state) => ({
          config: {
            ...state.config,
            ...newConfig,
          },
        }));
      },

      resetBehaviorData: () => {
        set({
          interactionHistory: [],
          tickerProfiles: {},
          sessionHistory: [],
          currentPredictions: [],
          currentSession: null,
          currentTicker: null,
        });
      },

      // ============ 分析工具 ============
      
      getSessionAnalytics: () => {
        const state = get();
        const { sessionHistory, currentSession } = state;
        
        const allSessions = [...sessionHistory];
        if (currentSession) {
          allSessions.push(currentSession);
        }
        
        if (allSessions.length === 0) {
          return {
            totalSessions: 0,
            averageSessionDuration: 0,
            totalTickersViewed: 0,
            mostViewedTickers: [],
          };
        }
        
        // 计算统计信息
        const totalDuration = allSessions.reduce((sum, s) => sum + s.totalDuration, 0);
        const averageDuration = totalDuration / allSessions.length;
        
        // 统计所有查看过的股票
        const tickerCounts: Record<string, number> = {};
        allSessions.forEach(session => {
          session.tickersViewed.forEach(ticker => {
            tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
          });
        });
        
        const mostViewedTickers = Object.entries(tickerCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([ticker, count]) => ({ ticker, count }));
        
        return {
          totalSessions: allSessions.length,
          averageSessionDuration: Math.round(averageDuration),
          totalTickersViewed: Object.keys(tickerCounts).length,
          mostViewedTickers,
        };
      },

      getTickerAnalytics: (ticker) => {
        const state = get();
        const profile = state.tickerProfiles[ticker];
        
        if (!profile) {
          return null;
        }
        
        // 获取该股票的交互历史
        const tickerInteractions = state.interactionHistory.filter(
          i => i.ticker === ticker
        );
        
        // 计算交互类型分布
        const interactionTypes = tickerInteractions.reduce((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // 计算时间分布（按小时）
        const hourDistribution = Array(24).fill(0);
        tickerInteractions.forEach(i => {
          const hour = i.timestamp.getHours();
          hourDistribution[hour]++;
        });
        
        return {
          profile,
          totalInteractions: tickerInteractions.length,
          interactionTypes,
          hourDistribution,
          lastUpdated: new Date(),
        };
      },

      getUserPatterns: () => {
        const state = get();
        const { tickerProfiles, interactionHistory } = state;
        
        // 分析热门交易时段
        const allHours = interactionHistory.map(i => i.timestamp.getHours());
        const hourCounts = allHours.reduce((acc, hour) => {
          acc[hour] = (acc[hour] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
        
        const peakHour = Object.entries(hourCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '0';
        
        // 分析常用的指标组合
        const indicatorCombinations: Record<string, number> = {};
        Object.values(tickerProfiles).forEach(profile => {
          const indicators = profile.indicatorsUsed.sort().join(',');
          if (indicators) {
            indicatorCombinations[indicators] = (indicatorCombinations[indicators] || 0) + 1;
          }
        });
        
        const topIndicatorCombo = Object.entries(indicatorCombinations)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || '无';
        
        return {
          totalTickersTracked: Object.keys(tickerProfiles).length,
          totalInteractions: interactionHistory.length,
          peakTradingHour: parseInt(peakHour),
          topIndicatorCombination: topIndicatorCombo,
          averageClicksPerTicker: Object.values(tickerProfiles).reduce(
            (sum, p) => sum + p.clickCount, 0
          ) / Math.max(1, Object.keys(tickerProfiles).length),
        };
      },
    }),
    {
      name: 'my-doge-behavior-storage',
      version: 1,
      // 持久化配置，避免存储过多数据
      partialize: (state) => ({
        tickerProfiles: state.tickerProfiles,
        sessionHistory: state.sessionHistory.slice(-50), // 保留最近50个会话
        config: state.config,
      }),
    }
  )
);

// ============ 便捷函数 ============

/**
 * 初始化行为追踪系统
 */
export const initializeBehaviorTracking = () => {
  const store = useBehaviorStore.getState();
  
  // 检查是否已启用
  if (!store.config.enabled) {
    console.log('[Behavior] 行为追踪已禁用');
    return;
  }
  
  // 开始新会话
  store.startSession();
  
  // 设置会话超时检查
  const checkSessionTimeout = () => {
    const { currentSession, config } = useBehaviorStore.getState();
    if (currentSession) {
      const now = new Date();
      const minutesInactive = (now.getTime() - currentSession.startTime.getTime()) / (1000 * 60);
      
      if (minutesInactive > config.sessionTimeoutMinutes) {
        console.log('[Behavior] 会话超时，结束当前会话');
        store.endSession();
        store.startSession(); // 开始新会话
      }
    }
  };
  
  // 每5分钟检查一次会话超时
  setInterval(checkSessionTimeout, 5 * 60 * 1000);
  
  // 窗口关闭时结束会话
  window.addEventListener('beforeunload', () => {
    store.endSession();
  });
  
  console.log('[Behavior] 行为追踪系统已初始化');
};

/**
 * 记录股票点击
 */
export const recordTickerClick = (ticker: string, metadata?: Record<string, any>) => {
  const store = useBehaviorStore.getState();
  
  if (!store.config.enabled) return;
  
  store.recordInteraction({
    type: 'ticker_click',
    ticker,
    target: 'ticker_select',
    metadata,
  });
  
  // 设置当前股票
  store.setCurrentTicker(ticker);
};

/**
 * 记录图表查看
 */
export const recordChartView = (ticker: string, duration: number) => {
  const store = useBehaviorStore.getState();
  
  if (!store.config.enabled) return;
  
  store.recordInteraction({
    type: 'chart_view',
    ticker,
    target: 'chart_panel',
    metadata: { duration },
  });
};

/**
 * 记录指标切换
 */
export const recordIndicatorToggle = (ticker: string, indicator: string, enabled: boolean) => {
  const store = useBehaviorStore.getState();
  
  if (!store.config.enabled) return;
  
  store.recordInteraction({
    type: 'indicator_toggle',
    ticker,
    target: 'indicator_controls',
    metadata: { indicator, enabled },
  });
};

/**
 * 获取推荐预加载的股票
 */
export const getRecommendedPreloads = (): string[] => {
  const store = useBehaviorStore.getState();
  return store.getTickersToPreload();
};

/**
 * 检查是否应该预加载某个股票
 */
export const shouldPreloadTicker = (ticker: string): boolean => {
  const store = useBehaviorStore.getState();
  return store.shouldPreloadTicker(ticker);
};

/**
 * 获取用户行为分析报告
 */
export const getBehaviorAnalyticsReport = () => {
  const store = useBehaviorStore.getState();
  
  return {
    sessionAnalytics: store.getSessionAnalytics(),
    userPatterns: store.getUserPatterns(),
    topPredictions: store.getTopPredictions(5),
    config: store.config,
    timestamp: new Date(),
  };
};

export default useBehaviorStore;