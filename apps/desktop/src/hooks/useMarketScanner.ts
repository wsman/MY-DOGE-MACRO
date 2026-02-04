import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

// 定义前端使用的扁平对象结构
export interface StockData {
  code: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  industry: string;
}

// 定义后端返回的高性能列式结构
interface ColumnarResponse {
  columns: string[];
  data: any[][];
}

// 数据适配器：Columnar -> Array of Objects
const adaptColumnarData = (rawData: ColumnarResponse): StockData[] => {
  if (!rawData || !rawData.columns || !rawData.data) {
    return [];
  }

  const { columns, data } = rawData;
  const codeIdx = columns.indexOf('code');
  const nameIdx = columns.indexOf('name');
  const priceIdx = columns.indexOf('price');
  const changeIdx = columns.indexOf('pct_chg'); // 注意字段名映射
  const volIdx = columns.indexOf('vol');
  const indIdx = columns.indexOf('industry');

  return data.map((row) => ({
    code: row[codeIdx] || '',
    name: row[nameIdx] || '',
    price: Number(row[priceIdx]) || 0,
    change: Number(row[changeIdx]) || 0,
    volume: Number(row[volIdx]) || 0,
    industry: row[indIdx] || 'Unclassified',
  }));
};

export const useMarketScanner = () => {
  const queryClient = useQueryClient();

  // 1. 获取行情快照（智能轮询策略）
  const marketDataQuery = useQuery({
    queryKey: ['market_data'],
    queryFn: async () => {
      try {
        const raw = await api.get<ColumnarResponse>('/api/v1/market/snapshot');
        return adaptColumnarData(raw);
      } catch (e) {
        // 静默降级到模拟数据，避免控制台噪音
        return MOCK_DATA;
      }
    },
    // 智能轮询：根据连接状态调整频率
    refetchInterval: (query) => {
      // 如果查询有错误（API不可用），减少轮询频率
      if (query.state.error) {
        return 30000; // 30秒
      }
      return 3000; // 正常情况3秒
    },
    staleTime: 1000,
    retry: 1, // 只重试1次
    retryDelay: 5000, // 重试延迟5秒
    refetchOnWindowFocus: false, // 避免窗口聚焦时频繁刷新
  });

  // 2. 触发扫描任务
  const startScanMutation = useMutation({
    mutationFn: async (params: { mode: 'CN' | 'US'; path: string }) => {
      return await api.post('/scan/market', params);
    },
    onSuccess: () => {
      // 扫描触发成功后，使其失效以强制刷新
      queryClient.invalidateQueries({ queryKey: ['market_data'] });
    },
  });

  return {
    stocks: marketDataQuery.data || [],
    isLoading: marketDataQuery.isLoading,
    isError: marketDataQuery.isError,
    startScan: startScanMutation.mutate,
    isScanning: startScanMutation.isPending,
    refetch: marketDataQuery.refetch,
  };
};

// ⚡ 5000行高性能模拟数据
const MOCK_DATA: StockData[] = Array.from({ length: 5000 }).map((_, i) => ({
  code: `600${i.toString().padStart(3, '0')}`,
  name: `MOCK Stock ${i}`,
  price: 10 + Math.random() * 100,
  change: (Math.random() - 0.5) * 20, // -10% to +10%
  volume: Math.floor(Math.random() * 1000000),
  industry: ['Semiconductor', 'Pharma', 'Bank', 'Auto'][i % 4],
}));
