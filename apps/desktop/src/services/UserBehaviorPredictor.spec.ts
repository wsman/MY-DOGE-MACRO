import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useUserBehaviorPredictor } from './UserBehaviorPredictor';

// Mock system time
const mockDate = new Date(2023, 0, 1, 10, 0, 0).getTime(); // 10:00 AM

// Mock localStorage if not available (Node environment)
if (typeof window === 'undefined' || !window.localStorage) {
  const localStorageMock = (function() {
    let store: Record<string, string> = {};
    return {
      getItem: function(key: string) {
        return store[key] || null;
      },
      setItem: function(key: string, value: string) {
        store[key] = value.toString();
      },
      clear: function() {
        store = {};
      },
      removeItem: function(key: string) {
        delete store[key];
      }
    };
  })();
  
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
  });
}

describe('UserBehaviorPredictor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
    
    // Reset store state
    useUserBehaviorPredictor.setState({
      interactions: [],
      behaviorPatterns: [],
      currentPrediction: null,
      predictionHistory: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should log interactions correctly', () => {
    // Log an interaction
    useUserBehaviorPredictor.getState().logInteraction({
      type: 'view',
      target: 'AAPL',
    });

    const state = useUserBehaviorPredictor.getState();
    expect(state.interactions).toHaveLength(1);
    expect(state.interactions[0]).toMatchObject({
      type: 'view',
      target: 'AAPL',
      timestamp: mockDate,
    });
  });

  it('should predict based on frequency', () => {
    const { logInteraction, generatePrediction } = useUserBehaviorPredictor.getState();

    // Log AAPL 5 times
    for (let i = 0; i < 5; i++) {
      useUserBehaviorPredictor.getState().logInteraction({ type: 'view', target: 'AAPL' });
    }
    // Log GOOGL 1 time
    useUserBehaviorPredictor.getState().logInteraction({ type: 'view', target: 'GOOGL' });

    const prediction = useUserBehaviorPredictor.getState().generatePrediction();

    expect(prediction.predictedTickers).toContain('AAPL');
    expect(prediction.predictedTickers[0]).toBe('AAPL'); // Most frequent should be first
    expect(prediction.confidence).toBeGreaterThan(0);
    expect(prediction.reasoning.some(r => r.includes('最常查看'))).toBe(true);
  });

  it('should predict based on time pattern', () => {
    // Current mock time is 10:00 AM
    
    // We need to manually inject past interactions because logInteraction uses current time (mocked)
    // We want to simulate interactions that happened at 10:00 AM on previous days
    
    const pastInteractions = [
      { type: 'view', target: 'TSLA', timestamp: mockDate - 24 * 60 * 60 * 1000 }, // Yesterday 10:00
      { type: 'view', target: 'TSLA', timestamp: mockDate - 48 * 60 * 60 * 1000 }, // 2 days ago 10:00
      { type: 'view', target: 'TSLA', timestamp: mockDate - 72 * 60 * 60 * 1000 }, // 3 days ago 10:00
    ];
    
    // Manually set state
    useUserBehaviorPredictor.setState({ interactions: pastInteractions as any });
    
    const prediction = useUserBehaviorPredictor.getState().generatePrediction();
    
    // TSLA should be predicted because of time pattern (10:00 AM)
    expect(prediction.predictedTickers).toContain('TSLA');
    
    // Check reasoning text (implementation detail dependent)
    // The implementation checks for "time pattern" or "时间模式"
    const hasTimeReasoning = prediction.reasoning.some(
      r => r.includes('时间模式') || r.includes('Time Pattern')
    );
    expect(hasTimeReasoning).toBe(true);
  });

  it('should trim interactions to limit memory usage', () => {
    // Default limit is 1000 in the implementation
    const limit = 1000;
    
    // Log 1005 interactions
    for (let i = 0; i < limit + 5; i++) {
      useUserBehaviorPredictor.getState().logInteraction({ type: 'view', target: 'AAPL' });
    }
    
    const state = useUserBehaviorPredictor.getState();
    expect(state.interactions).toHaveLength(limit);
    
    // The oldest 5 should be gone, only recent ones remain
    // Since all have same timestamp in this loop (mockDate), order depends on push
    // We assume array is trimmed from start
  });
});
