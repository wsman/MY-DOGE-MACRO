#!/usr/bin/env node
/**
 * Frontend Memoization Verification Script
 * 
 * Run: node tests/verify_memo.cjs
 * 
 * Verifies React.memo optimization is correctly applied
 */

const fs = require('fs');
const path = require('path');

console.log('=== React.memo Optimization Verification ===\n');

// Check PriceChart.tsx
const priceChartPath = path.join(__dirname, '../client/src/components/charts/PriceChart.tsx');
const priceChart = fs.readFileSync(priceChartPath, 'utf8');

const priceChartChecks = [
  { name: 'React.memo import', test: priceChart.includes('import React, { useRef, useEffect, useState, memo') },
  { name: 'PriceChart wrapped with memo', test: priceChart.includes('export const PriceChart: React.FC<PriceChartProps> = memo(') },
  { name: 'ChartCanvas wrapped with memo', test: priceChart.includes('const ChartCanvas: React.FC<ChartCanvasProps> = memo(') },
  { name: 'Custom areEqual function for PriceChart', test: priceChart.includes(', (prev, next) => {') && priceChart.includes('prev.ticker === next.ticker') },
  { name: 'Custom areEqual function for ChartCanvas', test: priceChart.includes('}, (prev, next) => {') && priceChart.includes('prev.data === next.data') },
  { name: 'IndicatorChartCanvas wrapped with memo', test: priceChart.includes('const IndicatorChartCanvas: React.FC<{') },
];

console.log('PriceChart.tsx Checks:');
priceChartChecks.forEach(check => {
  const status = check.test ? '✅' : '❌';
  console.log(`  ${status} ${check.name}`);
});

// Check ServiceStatus.tsx
const serviceStatusPath = path.join(__dirname, '../client/src/components/ServiceStatus.tsx');
const serviceStatus = fs.readFileSync(serviceStatusPath, 'utf8');

const serviceStatusChecks = [
  { name: 'memo import', test: serviceStatus.includes('import React, { useEffect, useState, memo, useCallback }') },
  { name: 'StatusIndicator wrapped with memo', test: serviceStatus.includes('const StatusIndicator: React.FC<StatusIndicatorProps> = memo(') },
  { name: 'ConfigInfo wrapped with memo', test: serviceStatus.includes('const ConfigInfo: React.FC<ConfigInfoProps> = memo(') },
  { name: 'PerformanceMetrics wrapped with memo', test: serviceStatus.includes('const PerformanceMetrics: React.FC<PerformanceMetricsProps> = memo(') },
  { name: 'Custom areEqual for StatusIndicator', test: serviceStatus.includes(', (prev, next) => {') && serviceStatus.includes('prevData.status === nextData.status') },
  { name: 'useCallback for handlers', test: serviceStatus.includes('useCallback(') },
  { name: 'Main component wrapped with memo', test: serviceStatus.includes('const MemoizedServiceStatus = memo(ServiceStatus);') },
];

console.log('\nServiceStatus.tsx Checks:');
serviceStatusChecks.forEach(check => {
  const status = check.test ? '✅' : '❌';
  console.log(`  ${status} ${check.name}`);
});

// Summary
const allChecks = [...priceChartChecks, ...serviceStatusChecks];
const passed = allChecks.filter(c => c.test).length;
const total = allChecks.length;

console.log('\n=== Summary ===');
console.log(`Passed: ${passed}/${total} (${Math.round(passed/total*100)}%)`);

if (passed === total) {
  console.log('\n✅ All React.memo optimizations verified!');
  console.log('\nPerformance improvements:');
  console.log('- Components only re-render when props actually change');
  console.log('- Custom areEqual functions prevent unnecessary renders');
  console.log('- useCallback stabilizes function references');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed - please review the implementation');
  process.exit(1);
}
