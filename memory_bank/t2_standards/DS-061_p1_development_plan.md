# v1.9.0 P1 任务开发计划

**版本**: v1.0.0  
**创建日期**: 2026-02-06 12:19  
**规划者**: Clawd 🦞 (架构师)  

---

## 📊 P1 任务总览

| ID | 任务 | 预计工时 | 依赖 | 优先推荐 |
|----|------|----------|------|----------|
| T-1.9.0-04 | AI 研报增强 | 4-5h | P0 完成 | ⭐⭐⭐ |
| T-1.9.0-05 | 多资产联动分析 | 4-5h | P0 完成 | ⭐⭐ |
| T-1.9.0-06 | 警报系统 | 3-4h | T-03 实时数据 | ⭐⭐ |

**推荐执行顺序**: T-04 → T-06 → T-05

**理由**:
1. **T-04 AI 研报** — 用户价值最高，直接提升产品差异化
2. **T-06 警报系统** — 依赖实时数据流（刚完成），趁热打铁
3. **T-05 多资产联动** — 计算密集型，可独立开发

---

## 🎯 T-1.9.0-04: AI 研报增强

### 现状分析

| 组件 | 状态 | 位置 |
|------|------|------|
| `DeepSeekAnalyzer` | ✅ 已实现 | `libs/quant-engine/ai/report_generator.py` |
| `DeepSeekStrategist` | ✅ 已实现 | `apps/api/core/macro_api_routes.py` |
| API 端点 | ✅ `/macro/analysis/generate` | 已集成 |
| `AIReportPanel` | ✅ 前端组件 | `organisms/AIReportPanel.tsx` |
| 历史存储 | ❌ 缺失 | 需新增 |
| Markdown 渲染 | ❌ 使用 `dangerouslySetInnerHTML` | 需改进 |

### 子任务分解

| ID | 任务 | 描述 | 预计 |
|----|------|------|------|
| **T-04a** | 研报生成触发流程 | 前端调用 API → 显示结果 | 45min |
| **T-04b** | 研报历史存储 | SQLite + 文件系统 | 60min |
| **T-04b-ext** | 数据仓库 + GitHub 同步 | 双层存储 + 权限控制 | 135min |
| **T-04c** | Markdown 渲染 | react-markdown + 代码高亮 | 45min |
| **T-04d** | 研报导出 | Markdown 文件 + PDF (可选) | 45min |
| **T-04e** | 研报列表页 | 历史研报浏览 + 搜索 | 45min |

### 技术方案

#### T-04a: 研报生成触发流程

**前端调用链**:
```
AIReportPanel.onGenerate()
    ↓
reportApi.generateReport(ticker, context)
    ↓
POST /api/v1/macro/analysis/generate
    ↓
DeepSeekStrategist.generate_strategy_report()
    ↓
返回 { report, metrics, model, generated_at }
```

**代码改动** (`AIReportPanel.tsx`):
```tsx
import { reportApi } from '../../services/api';
import { useAnalysisStore } from '../../stores/analysis.store';

const [report, setReport] = useState<AIReport | null>(null);
const [isLoading, setIsLoading] = useState(false);

const handleGenerate = async () => {
  setIsLoading(true);
  try {
    const marketData = useAnalysisStore.getState().marketData;
    const result = await reportApi.generateReport(selectedTicker, {
      marketData,
      timestamp: new Date().toISOString()
    });
    
    setReport({
      id: crypto.randomUUID(),
      title: `${selectedTicker} 策略分析`,
      summary: result.report.slice(0, 200) + '...',
      content: result.report,
      sentiment: detectSentiment(result.report),
      confidence: 0.85,
      tickers: [selectedTicker],
      generatedAt: new Date(result.generated_at),
      model: result.model
    });
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
```

#### T-04b: 研报历史存储

**后端: 新增 SQLite 存储**

文件: `apps/api/core/report_storage.py`
```python
import sqlite3
from datetime import datetime
from typing import List, Optional
import json
import os

class ReportStorage:
    def __init__(self, db_path: str = "data/reports.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id TEXT PRIMARY KEY,
                    ticker TEXT NOT NULL,
                    title TEXT NOT NULL,
                    summary TEXT,
                    content TEXT NOT NULL,
                    sentiment TEXT,
                    confidence REAL,
                    model TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata TEXT
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_ticker ON reports(ticker)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_created ON reports(created_at DESC)")
    
    def save(self, report: dict) -> str:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO reports (id, ticker, title, summary, content, sentiment, confidence, model, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                report['id'],
                report['ticker'],
                report['title'],
                report.get('summary'),
                report['content'],
                report.get('sentiment'),
                report.get('confidence'),
                report.get('model'),
                json.dumps(report.get('metadata', {}))
            ))
        return report['id']
    
    def get(self, report_id: str) -> Optional[dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
            return dict(row) if row else None
    
    def list(self, limit: int = 20, offset: int = 0, ticker: str = None) -> List[dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            query = "SELECT * FROM reports"
            params = []
            if ticker:
                query += " WHERE ticker = ?"
                params.append(ticker)
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]
    
    def delete(self, report_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
            return cursor.rowcount > 0
```

**后端: 新增 API 端点** (`macro_api_routes.py`)
```python
from .report_storage import ReportStorage

report_storage = ReportStorage()

@router.get("/reports", dependencies=[Depends(verify_token)])
async def list_reports(limit: int = 20, offset: int = 0, ticker: str = None):
    reports = report_storage.list(limit, offset, ticker)
    return {"reports": reports, "total": len(reports)}

@router.get("/reports/{report_id}", dependencies=[Depends(verify_token)])
async def get_report(report_id: str):
    report = report_storage.get(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.delete("/reports/{report_id}", dependencies=[Depends(verify_token)])
async def delete_report(report_id: str):
    if not report_storage.delete(report_id):
        raise HTTPException(status_code=404, detail="Report not found")
    return {"success": True}
```

#### T-04c: Markdown 渲染

**安装依赖**:
```bash
npm install react-markdown remark-gfm rehype-highlight
```

**新组件**: `apps/desktop/src/components/atoms/MarkdownRenderer/MarkdownRenderer.tsx`
```tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = ''
}) => {
  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 自定义表格样式
          table: ({ children }) => (
            <div className="table-wrapper">
              <table>{children}</table>
            </div>
          ),
          // 自定义代码块
          code: ({ inline, className, children, ...props }) => {
            if (inline) {
              return <code className="inline-code" {...props}>{children}</code>;
            }
            return <code className={className} {...props}>{children}</code>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
```

#### T-04d: 研报导出

**Markdown 导出** (简单):
```tsx
const exportMarkdown = (report: AIReport) => {
  const content = `# ${report.title}\n\n**生成时间**: ${report.generatedAt}\n**模型**: ${report.model}\n\n---\n\n${report.content}`;
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.ticker}_report_${Date.now()}.md`;
  a.click();
};
```

**PDF 导出** (可选，使用 Tauri):
```rust
// src-tauri/src/lib.rs
use tauri_plugin_printer::PrinterExt;
// 或使用 html2pdf.js 前端方案
```

#### T-04e: 研报列表页

**新路由**: `/reports`

**新组件**: `apps/desktop/src/components/pages/ReportsPage.tsx`
```tsx
export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    reportApi.getReports(50).then(setReports).finally(() => setLoading(false));
  }, []);
  
  return (
    <div className="reports-page">
      <h1>历史研报</h1>
      <SearchBar onSearch={handleSearch} />
      <ReportList reports={reports} onSelect={handleSelect} onDelete={handleDelete} />
    </div>
  );
};
```

### 验收标准

- [ ] 点击「生成研报」调用 DeepSeek API 成功返回
- [ ] 研报自动保存到 SQLite 数据库
- [ ] 研报内容正确渲染 Markdown (表格、代码块、列表)
- [ ] 可导出 .md 文件
- [ ] 研报列表页可浏览、搜索、删除历史记录

---

## 🎯 T-1.9.0-05: 多资产联动分析

### 现状分析

| 组件 | 状态 | 位置 |
|------|------|------|
| `GlobalMacroLoader` | ✅ 已实现 | `apps/api/core/macro_api_routes.py` |
| 相关性计算 | ❌ 缺失 | 需新增 |
| 联动可视化 | ❌ 缺失 | 需新增 |
| 核心资产监控 | ⚠️ 部分 | QQQ/GLD/BTC 已有数据 |

### 子任务分解

| ID | 任务 | 描述 | 预计 |
|----|------|------|------|
| **T-05a** | 相关性矩阵计算 | 后端计算 + 缓存 | 60min |
| **T-05b** | 相关性热力图 | D3.js / ECharts 可视化 | 60min |
| **T-05c** | 资产联动面板 | 多资产实时对比 | 60min |
| **T-05d** | 异动检测 | 相关性突变警报 | 45min |

### 技术方案

#### T-05a: 相关性矩阵计算

**后端**: `apps/api/core/correlation.py`
```python
import pandas as pd
import numpy as np
from typing import Dict, List

class CorrelationAnalyzer:
    def __init__(self, window: int = 60):
        self.window = window  # 60天滚动窗口
    
    def calculate_matrix(self, prices: pd.DataFrame) -> Dict:
        """计算资产相关性矩阵"""
        returns = prices.pct_change().dropna()
        corr_matrix = returns.corr()
        
        return {
            "matrix": corr_matrix.to_dict(),
            "assets": list(corr_matrix.columns),
            "period": {
                "start": str(prices.index[0]),
                "end": str(prices.index[-1]),
                "days": len(prices)
            }
        }
    
    def detect_divergence(self, prices: pd.DataFrame, threshold: float = 0.3) -> List[Dict]:
        """检测相关性异动"""
        returns = prices.pct_change().dropna()
        
        # 计算滚动相关性
        rolling_corr = returns.rolling(self.window).corr()
        
        # 与历史均值比较
        historical_corr = returns.corr()
        recent_corr = returns.tail(self.window).corr()
        
        divergences = []
        for i, asset1 in enumerate(returns.columns):
            for j, asset2 in enumerate(returns.columns):
                if i >= j:
                    continue
                diff = abs(recent_corr.loc[asset1, asset2] - historical_corr.loc[asset1, asset2])
                if diff > threshold:
                    divergences.append({
                        "asset1": asset1,
                        "asset2": asset2,
                        "historical": float(historical_corr.loc[asset1, asset2]),
                        "recent": float(recent_corr.loc[asset1, asset2]),
                        "change": float(diff),
                        "signal": "decorrelation" if recent_corr.loc[asset1, asset2] < historical_corr.loc[asset1, asset2] else "convergence"
                    })
        
        return divergences
```

**API 端点**:
```python
@router.get("/macro/correlation", dependencies=[Depends(verify_token)])
async def get_correlation_matrix():
    config = MacroConfig()
    loader = GlobalMacroLoader(config)
    data = loader.fetch_combined_data()
    
    analyzer = CorrelationAnalyzer()
    matrix = analyzer.calculate_matrix(data)
    divergences = analyzer.detect_divergence(data)
    
    return {
        "correlation": matrix,
        "divergences": divergences,
        "updated_at": datetime.now().isoformat()
    }
```

#### T-05b: 相关性热力图

**新组件**: `apps/desktop/src/components/charts/CorrelationHeatmap.tsx`

使用 ECharts (已在项目中):
```tsx
import ReactECharts from 'echarts-for-react';

interface CorrelationHeatmapProps {
  data: { matrix: Record<string, Record<string, number>>; assets: string[] };
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ data }) => {
  const option = {
    tooltip: { position: 'top' },
    grid: { height: '70%', top: '10%' },
    xAxis: { type: 'category', data: data.assets, splitArea: { show: true } },
    yAxis: { type: 'category', data: data.assets, splitArea: { show: true } },
    visualMap: {
      min: -1, max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: { color: ['#ef4444', '#fbbf24', '#22c55e'] }
    },
    series: [{
      type: 'heatmap',
      data: generateHeatmapData(data),
      label: { show: true, formatter: ({ value }) => value[2].toFixed(2) }
    }]
  };
  
  return <ReactECharts option={option} style={{ height: 400 }} />;
};
```

### 验收标准

- [ ] API 返回完整相关性矩阵
- [ ] 热力图正确渲染 (颜色: 红=-1, 黄=0, 绿=+1)
- [ ] 检测到相关性异动时生成警报
- [ ] 多资产面板实时更新

---

## 🎯 T-1.9.0-06: 警报系统

### 现状分析

| 组件 | 状态 | 位置 |
|------|------|------|
| `Notification` 类型 | ✅ 已定义 | `types/index.ts` |
| `ui.store` 通知管理 | ✅ 已实现 | `stores/ui.store.ts` |
| Tauri Notification | ❌ 未集成 | 需新增 |
| 价格阈值监控 | ❌ 缺失 | 需新增 |
| 技术指标信号 | ❌ 缺失 | 需新增 |

### 子任务分解

| ID | 任务 | 描述 | 预计 |
|----|------|------|------|
| **T-06a** | 警报规则引擎 | 前端规则配置 + 存储 | 45min |
| **T-06b** | 价格阈值监控 | WebSocket 数据 → 规则匹配 | 45min |
| **T-06c** | 技术指标信号 | RSRS/VolSkew 触发警报 | 30min |
| **T-06d** | Tauri 系统通知 | 桌面原生通知 | 30min |
| **T-06e** | 通知中心 UI | 历史通知列表 + 管理 | 30min |

### 技术方案

#### T-06a: 警报规则引擎

**类型定义**: `types/alerts.ts`
```typescript
export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  type: 'price_above' | 'price_below' | 'change_percent' | 'rsrs_signal' | 'volatility_high';
  ticker: string;
  threshold: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  lastTriggeredAt?: Date;
  cooldownMinutes: number; // 防止频繁触发
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  ticker: string;
  message: string;
  currentValue: number;
  threshold: number;
  triggeredAt: Date;
  acknowledged: boolean;
}
```

**Zustand Store**: `stores/alert.store.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AlertStore {
  rules: AlertRule[];
  events: AlertEvent[];
  addRule: (rule: Omit<AlertRule, 'id' | 'createdAt'>) => void;
  removeRule: (ruleId: string) => void;
  toggleRule: (ruleId: string) => void;
  triggerAlert: (event: Omit<AlertEvent, 'id' | 'triggeredAt'>) => void;
  acknowledgeEvent: (eventId: string) => void;
  clearEvents: () => void;
}

export const useAlertStore = create<AlertStore>()(
  persist(
    (set) => ({
      rules: [],
      events: [],
      
      addRule: (ruleData) => set((state) => ({
        rules: [...state.rules, {
          ...ruleData,
          id: crypto.randomUUID(),
          createdAt: new Date()
        }]
      })),
      
      // ... 其他方法
    }),
    { name: 'alert-storage' }
  )
);
```

#### T-06b: 价格阈值监控

**Hook**: `hooks/useAlertMonitor.ts`
```typescript
import { useEffect, useCallback } from 'react';
import { useAnalysisStore } from '../stores/analysis.store';
import { useAlertStore } from '../stores/alert.store';
import { sendTauriNotification } from '../utils/notifications';

export const useAlertMonitor = () => {
  const marketData = useAnalysisStore((state) => state.marketData);
  const rules = useAlertStore((state) => state.rules);
  const triggerAlert = useAlertStore((state) => state.triggerAlert);
  
  const checkRules = useCallback(() => {
    const now = Date.now();
    
    rules.filter(r => r.enabled).forEach((rule) => {
      const data = marketData[rule.ticker];
      if (!data) return;
      
      // 冷却检查
      if (rule.lastTriggeredAt) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (now - new Date(rule.lastTriggeredAt).getTime() < cooldownMs) return;
      }
      
      let triggered = false;
      let message = '';
      
      switch (rule.type) {
        case 'price_above':
          triggered = data.price > rule.threshold;
          message = `${rule.ticker} 价格突破 ${rule.threshold}`;
          break;
        case 'price_below':
          triggered = data.price < rule.threshold;
          message = `${rule.ticker} 价格跌破 ${rule.threshold}`;
          break;
        case 'change_percent':
          triggered = Math.abs(data.changePercent) > rule.threshold;
          message = `${rule.ticker} 波动超过 ${rule.threshold}%`;
          break;
      }
      
      if (triggered) {
        triggerAlert({
          ruleId: rule.id,
          ruleName: rule.name,
          ticker: rule.ticker,
          message,
          currentValue: data.price,
          threshold: rule.threshold,
          acknowledged: false
        });
        
        // 系统通知
        sendTauriNotification(rule.name, message, rule.priority);
      }
    });
  }, [marketData, rules, triggerAlert]);
  
  // 每次市场数据更新时检查
  useEffect(() => {
    checkRules();
  }, [marketData, checkRules]);
};
```

#### T-06d: Tauri 系统通知

**工具函数**: `utils/notifications.ts`
```typescript
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export async function sendTauriNotification(
  title: string,
  body: string,
  priority: 'low' | 'medium' | 'high' = 'medium'
) {
  // 检查权限
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }
  
  if (permissionGranted) {
    await sendNotification({
      title,
      body,
      sound: priority === 'high' ? 'default' : undefined
    });
  }
}
```

**Tauri 配置**: `tauri.conf.json`
```json
{
  "plugins": {
    "notification": {
      "all": true
    }
  }
}
```

### 验收标准

- [ ] 可创建/编辑/删除价格阈值规则
- [ ] 价格触发阈值时生成警报事件
- [ ] 系统托盘弹出原生通知
- [ ] 通知中心显示历史警报
- [ ] 冷却机制防止重复触发

---

## 📅 执行时间线

```
Day 1 (今日下午):
├── T-04a 研报生成触发 (45min)
├── T-04c Markdown 渲染 (45min)
└── 预计完成: T-04 的 50%

Day 2:
├── T-04b 研报历史存储 (60min)
├── T-04d 研报导出 (45min)
├── T-04e 研报列表页 (45min)
└── 预计完成: T-04 100%

Day 3:
├── T-06a 警报规则引擎 (45min)
├── T-06b 价格阈值监控 (45min)
├── T-06d Tauri 通知 (30min)
└── 预计完成: T-06 的 80%

Day 4:
├── T-06c 技术指标信号 (30min)
├── T-06e 通知中心 UI (30min)
├── T-05a 相关性矩阵 (60min)
└── 预计完成: T-06 100% + T-05 的 30%

Day 5:
├── T-05b 相关性热力图 (60min)
├── T-05c 资产联动面板 (60min)
├── T-05d 异动检测 (45min)
└── 预计完成: T-05 100%
```

**总预计**: 5-6 个工作半天 (~24h，含数据仓库扩展)

---

## 📁 文件变更总览

| 操作 | 文件 | 任务 |
|------|------|------|
| **新增** | `apps/api/core/report_storage.py` | T-04b |
| **新增** | `apps/api/core/correlation.py` | T-05a |
| **修改** | `apps/api/core/macro_api_routes.py` | T-04b, T-05a |
| **新增** | `src/components/atoms/MarkdownRenderer/` | T-04c |
| **新增** | `src/components/pages/ReportsPage.tsx` | T-04e |
| **新增** | `src/components/charts/CorrelationHeatmap.tsx` | T-05b |
| **新增** | `src/types/alerts.ts` | T-06a |
| **新增** | `src/stores/alert.store.ts` | T-06a |
| **新增** | `src/hooks/useAlertMonitor.ts` | T-06b |
| **新增** | `src/utils/notifications.ts` | T-06d |
| **新增** | `src/components/organisms/NotificationCenter.tsx` | T-06e |
| **修改** | `src/routes/index.tsx` | T-04e |
| **修改** | `tauri.conf.json` | T-06d |

---

*规划基于 CDD v1.6.1 架构标准 | 2026-02-06*
