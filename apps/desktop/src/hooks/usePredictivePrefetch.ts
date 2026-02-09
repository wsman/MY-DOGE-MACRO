import { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { marketApi } from '../services/api';

/**
 * usePredictivePrefetch - A hook to prefetch data based on user hover intent
 * Optimized for low latency and reduced API calls (80ms debounce)
 */
export const usePredictivePrefetch = () => {
  const queryClient = useQueryClient();
  const hoverTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const prefetchStockData = useCallback(async (ticker: string) => {
    // Check if data is already in cache and not stale
    const cachedData = queryClient.getQueryData(['kline', ticker]);
    if (cachedData) return;

    console.log(`[PredictivePrefetch] Prefetching K-line data for ${ticker}`);
    
    try {
      await queryClient.prefetchQuery({
        queryKey: ['kline', ticker],
        queryFn: () => marketApi.getKline(ticker, 100),
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    } catch (error) {
      console.warn(`[PredictivePrefetch] Failed to prefetch ${ticker}:`, error);
    }
  }, [queryClient]);

  const onHoverStart = useCallback((ticker: string) => {
    // Clear any existing timeout for this ticker
    if (hoverTimeoutRef.current[ticker]) {
      clearTimeout(hoverTimeoutRef.current[ticker]);
    }

    // Set a new timeout (80ms as specified in MISSION)
    hoverTimeoutRef.current[ticker] = setTimeout(() => {
      prefetchStockData(ticker);
      delete hoverTimeoutRef.current[ticker];
    }, 80);
  }, [prefetchStockData]);

  const onHoverEnd = useCallback((ticker: string) => {
    if (hoverTimeoutRef.current[ticker]) {
      clearTimeout(hoverTimeoutRef.current[ticker]);
      delete hoverTimeoutRef.current[ticker];
    }
  }, []);

  return {
    onHoverStart,
    onHoverEnd
  };
};

export default usePredictivePrefetch;
