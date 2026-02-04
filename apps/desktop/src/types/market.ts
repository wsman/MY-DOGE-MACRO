// 市场数据类型定义
export interface MarketData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
}

export interface RSRSIndicator {
  ticker: string;
  value: number; // -1.0 to 1.0
  score: number; // 0-100
  signal: 'long' | 'short' | 'hold';
  updatedAt: Date;
}

export interface VolatilitySkew {
  ticker: string;
  shortVol: number; // 5-day
  longVol: number; // 20-day
  ratio: number; // short/long
  signal: 'high' | 'normal' | 'low';
  updatedAt: Date;
}

export interface RiskSignal {
  type: 'volatility' | 'trend' | 'momentum' | 'correlation';
  level: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface PortfolioSummary {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  positions: Position[];
}

export interface Position {
  ticker: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface MacroReport {
  id: string;
  title: string;
  generatedAt: Date;
  summary: string;
  marketOutlook: string;
  strategyRecommendations: string[];
  risks: string[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
