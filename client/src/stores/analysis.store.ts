import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MarketData, RSRSIndicator, VolatilitySkew, RiskSignal, PortfolioSummary } from '../types/market';

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
