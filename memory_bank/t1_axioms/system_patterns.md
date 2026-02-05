# System Patterns - Architecture Constraints

> **Version**: v1.0.0  
> **Last Updated**: 2026-02-01 21:30

## Directory Structure

```
MY-DOGE-MICRO/
├── src/                    # React 19 frontend
│   ├── components/
│   │   ├── common/        # 通用组件
│   │   ├── dashboard/     # 仪表盘组件 (v1.5.0新增)
│   │   ├── charts/        # 图表组件 (v1.5.0新增)
│   │   ├── settings/      # 设置面板 (v1.5.0新增)
│   │   ├── layout/        # 布局组件
│   │   ├── commands/      # 命令面板
│   │   ├── graph/         # 图谱组件
│   │   └── editor/        # 编辑器组件
│   ├── services/          # 服务层
│   │   ├── api.ts         # API客户端
│   │   └── theme.ts       # 主题服务 (v1.5.0新增)
│   ├── stores/            # 状态管理
│   │   ├── ui.store.ts    # UI状态
│   │   ├── layout.store.ts# 布局状态
│   │   └── analysis.store.ts # 分析状态 (v1.5.0新增)
│   ├── types/             # 类型定义
│   │   ├── index.ts       # 通用类型
│   │   └── market.ts      # 市场类型 (v1.5.0新增)
│   ├── hooks/             # 自定义Hooks
│   └── workers/           # Web Workers
├── src-tauri/              # Tauri v2 shell
├── python_service/         # FastAPI backend
│   ├── server.py          # API服务器
│   ├── data_acquisition.py # 数据采集 (v1.5.0新增)
│   ├── analysis_rsrs.py   # RSRS算法 (v1.5.0新增)
│   ├── analysis_volatility.py # 波动率分析 (v1.5.0新增)
│   ├── report_generator.py # DeepSeek集成 (v1.5.0新增)
│   ├── data/              # 数据模块
│   ├── core/              # 核心模块
│   ├── macro/             # 宏观分析
│   ├── micro/             # 微观分析
│   └── utils/             # 工具函数
├── memory_bank/           # CDD documents
│   ├── core/              # T0 documents
│   ├── t1_axioms/            # T1 documents
│   ├── t2_protocols/      # T2 protocols
│   └── t2_standards/     # T2 standards
├── specs/                 # 功能规格 (v1.5.0新增)
├── tests/                 # 测试文件 (v1.5.0新增)
├── macro_report/          # 生成的报告
└── config/                # 配置文件
```

## Architecture Constraints

1. **Data Flow**: Data Sources → Analysis Engine → Output
2. **State Management**: Zustand for frontend state
3. **API Layer**: Python FastAPI exposes REST endpoints
4. **IPC**: Tauri handles Rust ↔ JavaScript communication
5. **Frontend Architecture**: Atomic Design (Atoms → Molecules → Organisms → Templates → Pages)
6. **Design System**: Design Tokens first (colors, typography, spacing, radius)

## Tier 1 Verification Target

```python
# Tier 1 checks:
# 1. File structure matches this pattern
# 2. Import paths are relative to project root
# 3. Configuration files are in config/ directory
# 4. Frontend uses Atomic Design structure (T-C5)
# 5. Components use Design Tokens for styling
```

---

## 📌 T-C5 Frontend Modernization (Pending)

**Feature ID**: T-C5  
**Status**: Backlog  
**Target**: Transform frontend to Atomic Design + Design System

### Current Structure (To Be Migrated)
```
src/components/
├── charts/          # PriceChart.tsx
├── commands/        # CommandPalette.tsx
├── dashboard/       # Dashboard.tsx
├── graph/           # PixiGraph.tsx
├── layout/          # MainLayout.tsx, panels/
└── settings/        # SettingsPanel.tsx
```

### Target Structure (Atomic Design)
```
src/components/
├── atoms/           # Button, Input, Icon, Badge, Card...
├── molecules/       # SearchBar, DataCard, FormGroup...
├── organisms/       # MarketTable, DashboardGrid...
├── templates/       # MainLayout, DashboardTemplate...
└── pages/           # DashboardPage, MarketPage...

src/design-system/
├── tokens/          # colors.ts, typography.ts, spacing.ts
└── foundations/     # colors.css, reset.css
```

### Migration Order
1. StatusDot (ConnectionStatus)
2. ServiceStatus → StatusIndicator
3. Dashboard → DataCard-based
4. MarketTable → Atomic components
5. PriceChart → Design System
6. CommandPalette → Atomic components
7. MainLayout → Templates
