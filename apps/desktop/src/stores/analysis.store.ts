import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  MarketData,
  RSRSIndicator,
  VolatilitySkew,
  RiskSignal,
  PortfolioSummary,
} from '../types/market';
import { marketApi, analysisApi, reportApi, api } from '../services/api';

interface AnalysisState {
  // 市场数据
  marketData: Record<string, MarketData>;
  lastUpdate: Date | null;

  // 技术指标
  rsrsIndicators: Record<string, RSRSIndicator>;
  volatilitySkews: Record<string, VolatilitySkew>;
  riskSignals: RiskSignal[];

  // 投资组合
  portfolio: PortfolioSummary | null;

  // API状态
  isLoading: boolean;
  error: string | null;

  // 操作
  setMarketData: (ticker: string, data: MarketData) => void;
  setRSRSIndicator: (indicator: RSRSIndicator) => void;
  setVolatilitySkew: (skew: VolatilitySkew) => void;
  setRiskSignals: (signals: RiskSignal[]) => void;
  setPortfolio: (portfolio: PortfolioSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  
  // API方法
  fetchMarketSnapshot: () => Promise<void>;
  fetchKlineData: (symbol: string, limit?: number) => Promise<any>;
  calculateRSRS: (ticker: string, period?: number) => Promise<any>;
  calculateVolatilitySkew: (ticker: string, shortPeriod?: number, longPeriod?: number) => Promise<any>;
  analyzeBatch: (tickers: string[]) => Promise<any>;
  generateAIReport: (ticker: string, context?: string) => Promise<any>;
  testApiConnection: () => Promise<any>;
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      marketData: {},
      lastUpdate: null,
      rsrsIndicators: {},
      volatilitySkews: {},
      riskSignals: [],
      portfolio: null,
      isLoading: false,
      error: null,

      setMarketData: (ticker, data) => {
        set((state) => ({
          marketData: { ...state.marketData, [ticker]: data },
          lastUpdate: new Date(),
        }));
      },

      setRSRSIndicator: (indicator) => {
        set((state) => ({
          rsrsIndicators: { ...state.rsrsIndicators, [indicator.ticker]: indicator },
        }));
      },

      setVolatilitySkew: (skew) => {
        set((state) => ({
          volatilitySkews: { ...state.volatilitySkews, [skew.ticker]: skew },
        }));
      },

      setRiskSignals: (signals) => {
        set(() => ({
          riskSignals: signals,
        }));
      },

      setPortfolio: (portfolio) => {
        set(() => ({
          portfolio,
        }));
      },

      setLoading: (loading) => {
        set(() => ({
          isLoading: loading,
        }));
      },

      setError: (error) => {
        set(() => ({
          error,
        }));
      },

      // T-C3: 从后端获取市场快照
      fetchMarketSnapshot: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔄 正在获取市场快照...');
          const dataList = await marketApi.getSnapshot();

          // 转换为 Record 格式
          const marketDataMap: Record<string, MarketData> = {};
          dataList.forEach((item) => {
            marketDataMap[item.ticker] = {
              ticker: item.ticker,
              name: item.name,
              price: item.price,
              change: item.change || 0,
              changePercent: item.changePercent,
              volume: item.volume,
              high: item.price, // 使用price作为临时值
              low: item.price * 0.99, // 临时值
              open: item.price * 1.01, // 临时值
              previousClose: item.price * 0.98, // 临时值
              timestamp: new Date(),
            };
          });

          set({
            marketData: marketDataMap,
            lastUpdate: new Date(),
            isLoading: false,
          });
          console.log(`✅ 成功获取 ${dataList.length} 条市场数据`);
        } catch (error) {
          console.error('❌ 获取市场数据失败:', error);
          set({ error: String(error), isLoading: false });
        }
      },

      // API 集成方法
      // 1. 获取 K 线数据
      fetchKlineData: async (symbol: string, limit: number = 500) => {
        set({ isLoading: true, error: null });
        try {
          console.log(`🔄 正在获取 ${symbol} 的K线数据...`);
          const klineData = await marketApi.getKline(symbol, limit);
          
          // 更新市场数据中的最新价格
          if (klineData.length > 0) {
            const latest = klineData[klineData.length - 1];
            const tickerData = get().marketData[symbol];
            
            if (tickerData) {
              set((state) => ({
                marketData: {
                  ...state.marketData,
                  [symbol]: {
                    ...tickerData,
                    price: latest.close,
                    high: latest.high,
                    low: latest.low,
                    open: latest.open,
                    volume: latest.volume,
                    timestamp: new Date(),
                  },
                },
                lastUpdate: new Date(),
              }));
            }
          }
          
          set({ isLoading: false });
          return klineData;
        } catch (error) {
          console.error(`❌ 获取 ${symbol} K线数据失败:`, error);
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      // 2. 计算 RSRS 指标
      calculateRSRS: async (ticker: string, period: number = 20) => {
        set({ isLoading: true, error: null });
        try {
          console.log(`🔄 正在计算 ${ticker} 的RSRS指标...`);
          const rsrsData = await analysisApi.calculateRSRS(ticker, period);
          
          set((state) => ({
            rsrsIndicators: {
              ...state.rsrsIndicators,
              [ticker]: rsrsData,
            },
            isLoading: false,
          }));
          
          return rsrsData;
        } catch (error) {
          console.error(`❌ 计算 ${ticker} RSRS指标失败:`, error);
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      // 3. 计算波动率偏度
      calculateVolatilitySkew: async (
        ticker: string, 
        shortPeriod: number = 5, 
        longPeriod: number = 20
      ) => {
        set({ isLoading: true, error: null });
        try {
          console.log(`🔄 正在计算 ${ticker} 的波动率偏度...`);
          const volatilityData = await analysisApi.calculateVolatilitySkew(
            ticker, 
            shortPeriod, 
            longPeriod
          );
          
          set((state) => ({
            volatilitySkews: {
              ...state.volatilitySkews,
              [ticker]: volatilityData,
            },
            isLoading: false,
          }));
          
          return volatilityData;
        } catch (error) {
          console.error(`❌ 计算 ${ticker} 波动率偏度失败:`, error);
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      // 4. 批量分析多个股票
      analyzeBatch: async (tickers: string[]) => {
        set({ isLoading: true, error: null });
        try {
          console.log(`🔄 正在批量分析 ${tickers.length} 个股票...`);
          
          const results = await Promise.allSettled(
            tickers.map(async (ticker) => {
              const [kline, rsrs, volatility] = await Promise.all([
                marketApi.getKline(ticker, 100),
                analysisApi.calculateRSRS(ticker),
                analysisApi.calculateVolatilitySkew(ticker),
              ]);
              
              return { ticker, kline, rsrs, volatility };
            })
          );
          
          // 更新 store
          const successfulResults = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map(r => r.value);
          
          successfulResults.forEach(({ ticker, kline, rsrs, volatility }) => {
            // 更新市场数据
            if (kline.length > 0) {
              const latest = kline[kline.length - 1];
              const tickerData = get().marketData[ticker];
              
              if (tickerData) {
                set((state) => ({
                  marketData: {
                    ...state.marketData,
                    [ticker]: {
                      ...tickerData,
                      price: latest.close,
                      high: latest.high,
                      low: latest.low,
                      open: latest.open,
                      volume: latest.volume,
                      timestamp: new Date(),
                    },
                  },
                }));
              }
            }
            
            // 更新指标
            if (rsrs) {
              set((state) => ({
                rsrsIndicators: {
                  ...state.rsrsIndicators,
                  [ticker]: rsrs,
                },
              }));
            }
            
            if (volatility) {
              set((state) => ({
                volatilitySkews: {
                  ...state.volatilitySkews,
                  [ticker]: volatility,
                },
              }));
            }
          });
          
          set({ 
            isLoading: false,
            lastUpdate: new Date(),
          });
          
          return results;
        } catch (error) {
          console.error('❌ 批量分析失败:', error);
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      // 5. 生成 AI 研报
      generateAIReport: async (ticker: string, context: string = '') => {
        set({ isLoading: true, error: null });
        try {
          console.log(`🔄 正在为 ${ticker} 生成AI研报...`);
          const report = await reportApi.generateReport(ticker, context);
          
          // 可以在这里将研报存储到额外的状态中，如果需要的话
          console.log('✅ AI研报生成成功');
          
          set({ isLoading: false });
          return report;
        } catch (error) {
          console.error(`❌ 生成 ${ticker} AI研报失败:`, error);
          set({ error: String(error), isLoading: false });
          throw error;
        }
      },

      // 6. 测试 API 连接
      testApiConnection: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log('🔄 正在测试API连接...');
          const result = await api.testConnection();
          
          set({ 
            isLoading: false,
            error: result.success ? null : 'API连接失败',
          });
          
          return result;
        } catch (error) {
          console.error('❌ API连接测试失败:', error);
          set({ 
            error: String(error), 
            isLoading: false,
          });
          throw error;
        }
      },

      clearAll: () => {
        set({
          marketData: {},
          lastUpdate: null,
          rsrsIndicators: {},
          volatilitySkews: {},
          riskSignals: [],
          portfolio: null,
          error: null,
        });
      },
    }),
    {
      name: 'my-doge-analysis-storage',
      version: 1,
      partialize: (state) => ({
        marketData: state.marketData,
        rsrsIndicators: state.rsrsIndicators,
        volatilitySkews: state.volatilitySkews,
      }),
    }
  )
);

// 便捷选择器
export const selectMarketData = (state: AnalysisState) => state.marketData;
export const selectRSRS = (ticker: string) => (state: AnalysisState) =>
  state.rsrsIndicators[ticker];
export const selectVolatilitySkew = (ticker: string) => (state: AnalysisState) =>
  state.volatilitySkews[ticker];
export const selectRiskSignals = (state: AnalysisState) => state.riskSignals;
export const selectPortfolio = (state: AnalysisState) => state.portfolio;
export const selectIsLoading = (state: AnalysisState) => state.isLoading;
export const selectError = (state: AnalysisState) => state.error;
export const selectLastUpdate = (state: AnalysisState) => state.lastUpdate;

// T-C2.3: 高性能选择器 (使用 shallow 比较)
// 这些选择器确保只有相关数据变化时才触发重新渲染

// 市场数据选择器组
export const selectMarketDataKeys = (state: AnalysisState) => Object.keys(state.marketData);

// 单个市场数据选择器
export const selectMarketDataByTicker = (ticker: string) => (state: AnalysisState) =>
  state.marketData[ticker];

// 所有指标选择器
export const selectAllIndicators = (state: AnalysisState) => ({
  rsrsIndicators: state.rsrsIndicators,
  volatilitySkews: state.volatilitySkews,
});

// 批量数据选择器 (shallow 比较)
export const selectMarketDataBatch = (state: AnalysisState) => state.marketData;

export const selectRSRSBatch = (state: AnalysisState) => state.rsrsIndicators;

export const selectVolatilityBatch = (state: AnalysisState) => state.volatilitySkews;

// 组合选择器 (用于 Dashboard 等复杂组件)
export const selectDashboardData = (state: AnalysisState) => ({
  marketData: state.marketData,
  riskSignals: state.riskSignals,
  portfolio: state.portfolio,
  lastUpdate: state.lastUpdate,
  isLoading: state.isLoading,
});

// API 状态选择器
export const selectApiStatus = (state: AnalysisState) => ({
  isLoading: state.isLoading,
  error: state.error,
  lastUpdate: state.lastUpdate,
});

// ============================================================================
// T-C2.4: Selector Hooks (性能优化的 React Hooks)
// ============================================================================

/**
 * Hook: useMarketData
 * 获取市场数据，支持单个或批量获取
 */
export function useMarketData(): Record<string, MarketData>;
export function useMarketData(ticker: string): MarketData | undefined;
export function useMarketData(ticker?: string): Record<string, MarketData> | MarketData | undefined {
  const marketData = useAnalysisStore(selectMarketDataBatch);
  
  if (ticker) {
    return marketData[ticker];
  }
  return marketData;
}

/**
 * Hook: useRSRSIndicator
 * 获取单个标的的 RSRS 指标
 */
export function useRSRSIndicator(ticker: string) {
  return useAnalysisStore(selectRSRS(ticker));
}

/**
 * Hook: useVolatilitySkew
 * 获取单个标的的波动率偏度
 */
export function useVolatilitySkew(ticker: string) {
  return useAnalysisStore(selectVolatilitySkew(ticker));
}

/**
 * Hook: useRiskSignals
 * 获取所有风险信号
 */
export function useRiskSignals() {
  return useAnalysisStore(selectRiskSignals);
}

/**
 * Hook: usePortfolio
 * 获取投资组合数据
 */
export function usePortfolio() {
  return useAnalysisStore(selectPortfolio);
}

/**
 * Hook: useDashboardData
 * 获取 Dashboard 所需的所有数据 (优化过的批量获取)
 */
export function useDashboardData() {
  return useAnalysisStore(selectDashboardData);
}

/**
 * Hook: useApiStatus
 * 获取 API 状态
 */
export function useApiStatus() {
  return useAnalysisStore(selectApiStatus);
}
