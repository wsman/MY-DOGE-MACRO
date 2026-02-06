import React, { useEffect, useRef, useState } from 'react';
import './PriceDisplay.css';

interface PriceDisplayProps {
  value: number;
  previousValue?: number;
  currency?: string;
  decimals?: number;
  showChange?: boolean;
  showFlash?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  value,
  previousValue,
  currency = '',
  decimals = 2,
  showChange = true,
  showFlash = true,
}) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);
  
  useEffect(() => {
    if (showFlash && value !== prevRef.current) {
      const direction = value > prevRef.current ? 'up' : 'down';
      setFlash(direction);
      prevRef.current = value;
      
      // 300ms 后移除闪烁
      const timer = setTimeout(() => setFlash(null), 300);
      return () => clearTimeout(timer);
    }
  }, [value, showFlash]);
  
  const changePercent = previousValue 
    ? ((value - previousValue) / previousValue) * 100 
    : 0;
  
  const colorClass = changePercent >= 0 ? 'price--up' : 'price--down';
  const flashClass = flash ? `price--flash-${flash}` : '';
  
  return (
    <span className={`price-display ${colorClass} ${flashClass}`}>
      {currency}{value.toFixed(decimals)}
      {showChange && previousValue && (
        <span className="price-change">
          {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      )}
    </span>
  );
};

export default PriceDisplay;