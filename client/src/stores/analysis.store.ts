import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MarketData, RSRSIndicator, VolatilitySkew, RiskSignal, PortfolioSummary } from '../types/market';
import { marketApi } from '../services/api';

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
}

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
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
          lastUpdate: new Date()
        }));
      },

      setRSRSIndicator: (indicator) => {
        set((state) => ({
          rsrsIndicators: { ...state.rsrsIndicators, [indicator.ticker]: indicator }
        }));
      },

      setVolatilitySkew: (skew) => {
        set((state) => ({
          volatilitySkews: { ...state.volatilitySkews, [skew.ticker]: skew }
        }));
      },

      setRiskSignals: (signals) => {
        set(() => ({
          riskSignals: signals
        }));
      },

      setPortfolio: (portfolio) => {
        set(() => ({
          portfolio
        }));
      },

      setLoading: (loading) => {
        set(() => ({
          isLoading: loading
        }));
      },

      setError: (error) => {
        set(() => ({
          error
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
          dataList.forEach(item => {
            marketDataMap[item.ticker] = {
              ticker: item.ticker,
              name: item.name,
              price: item.price,
              change: item.change || 0,
              changePercent: item.changePercent,
              volume: item.volume,
              amount: item.volume * item.price,
              timestamp: Date.now()
            };
          });

          set({
            marketData: marketDataMap,
            lastUpdate: new Date(),
            isLoading: false
          });
          console.log(`✅ 成功获取 ${dataList.length} 条市场数据`);
        } catch (error) {
          console.error('❌ 获取市场数据失败:', error);
          set({ error: String(error), isLoading: false });
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
          error: null
        });
      }
    }),
    {
      name: 'my-doge-analysis-storage',
      version: 1,
      partialize: (state) => ({
        marketData: state.marketData,
        rsrsIndicators: state.rsrsIndicators,
        volatilitySkews: state.volatilitySkews
      })
    }
  )
);

// 便捷选择器
export const selectMarketData = (state: AnalysisState) => state.marketData;
export const selectRSRS = (ticker: string) => (state: AnalysisState) => state.rsrsIndicators[ticker];
export const selectVolatilitySkew = (ticker: string) => (state: AnalysisState) => state.volatilitySkews[ticker];
export const selectRiskSignals = (state: AnalysisState) => state.riskSignals;
export const selectPortfolio = (state: AnalysisState) => state.portfolio;
