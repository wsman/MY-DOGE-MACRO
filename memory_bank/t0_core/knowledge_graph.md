# 逆熵实验室 - MY-DOGE-MACRO知识图谱 (Knowledge Graph)

**版本**: v1.8.1 (MY-DOGE-MACRO融合图谱版)
**状态**: 🟢 活跃
**节点数**: ~70+ (融合全局结构 + 项目具体节点)
**用途**: 提供MY-DOGE-MACRO项目系统实体间的高维关联导航，精确反映v1.8.1状态。
**维护机制**: 每次CDD周期结束时更新，宪法变更时强制同步。

---

## 1. 项目概述 (MY-DOGE-MACRO v1.8.1)

MY-DOGE-MACRO是一个三API驱动的量化交易分析系统，集成：
- **DeepSeek AI**: 宏观分析与策略生成
- **Yahoo Finance**: 全球资产价格数据
- **通达信数据库**: 本地A股/美股历史数据

### 1.1 模块化架构 (v1.8.0 Complete)
```text
应用层 (apps/)
├── desktop/               # Tauri + React 19桌面应用 ✅
│   └── src/components/
│       ├── atoms/        # Button, Badge, Card, Icon, Input, Avatar, StatusDot (7个)
│       ├── molecules/    # DataCard, SearchBar, FormGroup, StatusIndicator (4个)
│       ├── organisms/    # MarketOverview, AnalysisPanel, AIReportPanel (3个)
│       └── charts/       # PriceChart, TechnicalIndicators, SubChart, ChartPanel (4个)
└── api/                  # FastAPI后端服务 ✅
    └── core/websocket.py # 实时价格推送

库层 (libs/)
├── quant-engine/         # 量化分析算法 ✅
│   ├── analysis/         # technical_indicators.py (MA/EMA/MACD/RSI/KDJ/Bollinger)
│   └── data/             # tdx_reader.py (通达信集成)
├── design-system/        # UI组件和设计令牌 ✅
└── common/               # 共享工具

基础设施层 (infrastructure/)
├── cdd/                  # 宪法驱动开发工具 ✅
│   └── tools/            # cdd_audit.py, measure_entropy.py, verify_version.py
├── ci-cd/                # 持续集成/部署
└── monitoring/           # 系统监控和告警

数据与配置
├── data/                 # 原始、处理数据和报告
└── config/               # 环境和功能配置

文档层 (memory_bank/t3_documentation/) # 扁平结构
├── api-reference.md      # 完整REST/WebSocket API
├── backend-api.md        # 后端接口详情
├── deployment.md         # 部署指南
├── getting-started.md    # 开发入门
├── index.md              # 文档索引
├── indicators.md         # 技术指标公式
├── modular-architecture.md # 模块化架构
├── overview.md           # 架构概览
├── quickstart.md         # 快速入门
└── document-template.md  # 文档模板
```

### 1.2 系统拓扑

```mermaid
graph TD
    subgraph "数据源"
        DS[DeepSeek API]
        YF[Yahoo Finance]
        TX[通达信 DB]
    end
    
    subgraph "库层 (libs/)"
        QE[量化引擎]
        QE_A[analysis/]
        QE_D[data/]
        DSYS[设计系统]
    end
    
    subgraph "应用层 (apps/)"
        API[API服务]
        API_WS[WebSocket]
        DESK[桌面应用]
        DESK_CHART[图表组件]
        DESK_ORG[有机体组件]
    end
    
    DS --> QE
    YF --> QE
    TX --> QE_D
    QE --> API
    API_WS --> DESK
    API --> DESK
    DSYS --> DESK
    DESK --> DESK_CHART
    DESK --> DESK_ORG
````

---

## 2. 核心宪法拓扑 (Core Constitutional Topology)

```mermaid
graph TD
    %% 定义核心宪法层级
    subgraph Kernel [引导内核]
        L_Basic[基本法 (LAW-BASIC)]
        L_Proc[程序法 (LAW-PROC)]
        L_Tech[技术法 (LAW-TECH)]
    end

    subgraph Standards [项目标准实现]
        DS_Context[上下文管理 (DS-007)]
        DS_Arch[前端架构现代化 (DS-057)]
        DS_Roadmap[v1.8.0路线图 (DS-058)]
        DS_CodeReview[代码审查 (DS-060)]
        DS_UTF8[UTF-8输出配置 (DS-001)]
        DS_Atomic[原子文件写入 (DS-002)]
        DS_Comm[弹性通信 (DS-003)]
    end

    subgraph Workflows [项目工作流]
        WF_CDD[CDD流程 (WF-201)]
        WF_Clarify[问题澄清 (WF-001)]
        WF_Amend[修正工作流 (WF-amend)]
        WF_Crisis[危机处理流程 (WF-204)]
    end

    %% 核心关系边
    L_Basic -->|管辖| L_Proc
    L_Basic -->|管辖| L_Tech
    
    L_Proc -->|定义| WF_CDD
    L_Proc -->|定义| WF_Clarify
    L_Proc -->|定义| WF_Amend
    L_Proc -->|定义| WF_Crisis
    
    L_Tech -->|要求| DS_Context
    L_Tech -->|要求| DS_Arch
    L_Tech -->|要求| DS_Roadmap
    L_Tech -->|要求| DS_CodeReview
    L_Tech -->|要求| DS_UTF8
    L_Tech -->|要求| DS_Atomic
    L_Tech -->|要求| DS_Comm
    
    WF_CDD -->|需要| DS_Arch
    WF_CDD -->|实施| DS_CodeReview
    WF_Clarify -->|需要| DS_Context
    WF_Crisis -->|实施| DS_Comm
    
    DS_Context -->|实施| L_Tech
    DS_Arch -->|实施| L_Tech
    DS_Roadmap -->|实施| L_Tech
    DS_CodeReview -->|实施| L_Tech
    DS_UTF8 -->|实施| L_Tech
    DS_Atomic -->|实施| L_Tech
    DS_Comm -->|实施| L_Tech
    DS_CodeReview -->|守卫| DS_Context
```

---

## 3. 领域知识簇 (Domain Clusters)

### 🛡️ 安全与合规 (Security & Compliance) - MY-DOGE-MACRO状态

- __中心节点__: [基本法 §381], [技术法 §300], [基本法 §125]

- __核心标准__: [DS-056 安全加固 ✅], [DS-055 前端UI标准 ✅], [缺失: DS-016 编码安全]

- __关联工作流__: [WF-201 CDD流程 ✅], [缺失: WF-210 安全操作], [缺失: WF-207 文件审查]

- __防御网络__:

  - __DS-056__ → 安全加固规范 (项目实际存在)
  - __缺失: DS-016__ → 编码安全抗体 (待实现)
  - __缺失: DS-005__ → 重构安全机制 (待实现)
  - __缺失: WF-210__ → 应急响应流程 (待实现)

- __导航示例__:

  > 安全开发: 基本法§381 → 关联DS-056 → 执行CDD流程(WF-201) → 代码审查(DS-060) 编码问题: 技术法§300 → 关联缺失DS-016 → 创建标准 → 实施安全加固 安全审计: 基本法§125 → 验证数据完整性 → 执行三级验证协议

### ⚙️ 核心架构 (Core Architecture) - ✅ 已完成

- __中心节点__: [模块化架构 v1.8.0], [System Patterns], [基本法 §104]

- __核心标准__: [DS-057 前端架构现代化 ✅], [DS-007 上下文管理 ✅], [缺失: DS-024 架构同步]

- __概念关联__: 熵减 -> 双存储 -> 单一真理源

- __项目状态__:

  - ✅ 前端现代化完成 (v1.5.0)
  - ✅ 架构迁移完成 (v1.7.0)
  - ✅ 核心功能完成 (v1.8.0)
  - ✅ .clinerules精简完成 (2026-02-07)
  - ✅ 宪法文件融合完成 (v1.8.1)

### 🔌 输入输出与通信 (I/O & Comm) - ✅ 高优先级完成

- __中心节点__: [技术法 §300], [基本法 §190]
- __核心标准__: [DS-001 UTF-8 ✅], [DS-002 原子写入 ✅], [DS-003 弹性通信 ✅]
- __故障排除__: [缺失: MC-010 故障排除]
- __项目状态__: 
  - ✅ WebSocket实时推送 (已完成)
  - ✅ 基础I/O标准 (DS-001, DS-002, DS-003 已实现)
  - ✅ 危机处理工作流 (WF-204 已实现)
  - 📋 安全操作流程 (WF-210 待实现)

### 🐳 Docker与基础设施 (Docker & Infrastructure)

- __中心节点__: [技术法 §300], [基本法 §190]

- __核心文件__: [docker-compose.v3.yml ✅], [缺失: Dockerfile.mcp], [缺失: Dockerfile.node], [缺失: Dockerfile.entropy]

- __核心标准__: [缺失: DS-047 Docker配置与编排标准实现]

- __关联工作流__: [缺失: WF-220 MCP运维流程], [WF-204 危机处理流程 ✅], [缺失: WF-210 安全操作流程]

- __服务架构__:

  - __缺失: Layer 1.5__: MCP核心服务 (2567端口) - Node.js + TypeScript
  - __缺失: Layer 1.6__: 熵计算服务 (8001端口) - Python + FastAPI
  - __缺失: Layer 5__: 向量数据库 (6333/6334端口) - Qdrant
  - __缺失: 监控栈__: Prometheus (9090) + Grafana (3000)

- __导航示例__:

  > 部署问题: Docker基础设施 → 检查 docker-compose.v3.yml → 验证健康检查 → 查看缺失DS-047标准 → 创建标准 → 执行待实现WF-220运维流程

### 🧠 认知范式 (Cognitive Paradigm) - ✅ 活跃

- __中心节点__: [引导模式 v1.3.2], [基本法 §180]

- __核心概念__: 索引驱动、图谱导航、架构优先

- __关联标准__: [DS-001 UTF-8 ✅], [DS-007 架构验证 ✅], [缺失: DS-024 架构同步]

- __导航示例__:

  > 开发问题: 引导模式 → 索引查找(T0文档) → 图谱推理(本文件) → 标准执行 → 熵减验证 当前任务: .clinerules合并 → 加载T0核心 → 融合文件 → 精简结构 → 三级验证

### 🤖 Agent系统与智能协作 (Agent Systems & Intelligent Collaboration) - ⚠️ 文件不存在

- __中心节点__: [基本法 §180-§189], [技术法 §380-§389]

- __核心标准__: [AS-101 Agent基础接口规范 (合并版 v1.3.0) ⚠️ 文件不存在], [AS-102 内阁总理Agent接口规范 (合并版 v1.3.0) ⚠️ 文件不存在], [AS-103 办公厅主任Agent接口规范 (合并版 v1.3.0) ⚠️ 文件不存在]

- __关联标准__: [缺失: DS-010 MCP工具策略], [缺失: DS-011 MCP服务标准], [DS-003 弹性通信 ✅], [缺失: DS-043 性能监控]

- __架构层级__:

  - __L1入口层__: 办公厅主任Agent (网关管理、意图识别、网络韧性) - ⚠️ 待实现
  - __L2协调层__: 内阁总理Agent (战略协调、冲突仲裁、降级管理) - ⚠️ 待实现
  - __L3专业层__: 各专业Agent (法律解释、架构设计、开发实现等) - ⚠️ 待实现

### 🔄 项目与孵化 (Projects & Incubation)

- __中心节点__: [MY-DOGE-MACRO v1.8.1], [Negentropy-Lab v1.3.0], [程序法 §230-§232]

- __核心关系__: 孵化关系、同步回流、架构演进

- __关联文件__: [active_context.md], [程序法索引 §230-§232], [缺失: incubationState.md]

- __孵化网络__:

  - __Negentropy-Lab__ → 孵化 → __MY-DOGE-MACRO__ (前端架构实验与设计系统提取)
  - __MY-DOGE-MACRO__ → 回流 → __Negentropy-Lab__ (设计系统标准化与宪法框架同步)
  - __共享核心__: 法典内核(.clinerules)、宪法公理、基础技术标准

- __工作流关联__:

  - __缺失: WF-230__: 项目孵化流程 - 从主项目创建专门化子项目
  - __缺失: WF-231__: 架构回流流程 - 子项目成果同步回主项目
  - __缺失: WF-232__: 版本协调流程 - 管理版本兼容性与同步策略

### 📚 索引与文档架构整合 (Index & Document Architecture Integration) - ✅ 已完成

- __中心节点__: [引导模式 v1.3.2], [技术法索引 §300 ✅], [程序法索引 §200 ✅], [基本法索引 §102.3 ✅], [基本法 §152 ✅]

- __核心概念__: 索引整合、版本同步、单一真理源、熵减优化

- __整合状态__:

  - ✅ __法典内核索引__: `memory_bank/t0_core/technical_law_index.md` (v1.8.1) - 完整收录所有DS标准状态，已更新DS-001, DS-002, DS-003状态
  - ✅ __程序法索引__: `memory_bank/t0_core/procedural_law_index.md` (v1.8.1) - 完整收录工作流状态，已更新WF-204状态
  - ✅ __基本法索引__: `memory_bank/t0_core/basic_law_index.md` (v1.8.1) - 完整公理集
  - ✅ __知识图谱__: `memory_bank/t0_core/knowledge_graph.md` (v1.8.1) - 本文件融合完成，已更新项目实际状态
  - ✅ __.clinerules精简__: 已完成，`.clinerules`作为入口索引文件
  - ✅ __宪法文件统一__: 所有宪法内容统一到`memory_bank/t0_core/`目录

- __宪法依据__:

  - __§102.3宪法同步公理__: 强制版本一致性，当前统一为v1.8.1
  - __§152单一真理源公理__: 减少索引重叠，`memory_bank/t0_core/`成为唯一真理源
  - __§141熵减验证__: 确保整合后系统有序度提升 (ΔH > 0)
  - __§125数据完整性公理__: 备份与验证确保整合过程安全

- __最近更新__ (2026-02-09):
  - ✅ 更新技术法索引，修正DS-001, DS-002, DS-003状态为实际存在
  - ✅ 更新程序法索引，修正WF-204状态为实际存在
  - ✅ 更新知识图谱，反映项目实际状态
  - ✅ 创建高优先级标准模板 (DS-001, DS-002, DS-003)
  - ✅ 创建关键工作流模板 (WF-204危机处理流程)

---

## 4. 文档分级体系 (Document Tiering System) - MY-DOGE-MACRO实现

- __中心节点__: [基本法 §10.6], [引导模式 v1.3.2]

- __核心概念__: T0-T3分级体系、注意力分配、认知层次结构、上下文管理

- __关联文件__: [active_context.md], [基本法索引], [本知识图谱]

- __分级定义__:

  - __T0 (Kernel)__: 核心意识层 - 常驻内存 (`t0_core/`目录所有文件)
  - __T1 (Index)__: 索引与状态层 - 高频检索 (`t1_axioms/`目录)
  - __T2 (Executable)__: 执行规范层 - 按需加载 (`t2_standards/`, `t2_protocols/`)
  - __T3 (Archive)__: 分析与归档层 - 离线存储 (`t3_documentation/`扁平结构)

- __数学约束__:

  - $\sum_{file \in Context} \text{Token}(file) \leq T_{limit}$ (约128K tokens)
  - $\text{Attention}(T0) \gg \text{Attention}(T1) > \text{Attention}(T2)$

- __导航示例__:

  > 上下文优化: 引导模式 → T0层定位(`t0_core/`) → T1索引检索(`t1_axioms/`) → T2按需加载 → T3审计回溯 高效检索: 问题分析 → 图谱定位(T0) → 索引查找(T1) → 标准执行(T2) → 熵减验证 注意力分配: 优先处理T0核心 → 必要时检索T1 → 按需加载T2 → 忽略T3除非审计

---

## 5. 图谱导航协议 (Navigation Protocol) - MY-DOGE-MACRO优化

当用户查询模糊问题（如"如何保证系统稳定性？"）时，请遵循以下路径：

### 5.1 定位锚点

在上述领域簇中找到最接近的入口：

- "稳定性" -> 查阅 [核心架构] -> 发现 [DS-057 前端架构现代化 ✅]
- "安全" -> 查阅 [安全与合规] -> 发现 [DS-056 安全加固 ✅]
- "性能" -> 查阅 [缺失标准] -> 发现 [DS-043 性能监控待实现]
- "危机处理" -> 查阅 [程序法] -> 发现 [WF-204 危机处理流程 ✅]

### 5.2 遍历邻居

检查该簇下的 `核心标准` 和 `关联工作流`：

- 对于DS-057: 检查关联的 [WF-201 CDD流程 ✅] 和 [L_Tech 技术法]
- 对于WF-204: 检查关联的 [DS-003 弹性通信 ✅] 和 [DS-001 UTF-8 ✅]
- 对于缺失标准: 检查实现优先级，创建标准文件

### 5.3 多跳推理

如果当前节点无法解决，检查其 `Related_To` 边指向的节点：

- 技术问题 -> 宪法依据(基本法) -> 实施标准(技术法) -> 执行流程(程序法)

### 5.4 项目状态感知

__关键原则__: 始终检查项目实际状态：

- ✅ 标记已完成的组件 (如DS-001, DS-002, DS-003, WF-204)
- ⚠️ 标记文件不存在的引用
- 📋 标记待实现的功能
- ⏳ 标记进行中的任务

> __导航示例__: 
> - 稳定性 -> 查阅 [核心架构] -> 发现 [DS-057 前端架构现代化 ✅] -> 关联 [WF-201 CDD流程 ✅] -> 输出"使用CDD流程实施架构现代化"
> - 危机处理 -> 查阅 [输入输出与通信] -> 发现 [DS-003 弹性通信 ✅] -> 关联 [WF-204 危机处理流程 ✅] -> 输出"执行WF-204危机处理流程，基于DS-003弹性通信标准"
> - 编码问题 -> 查阅 [安全与合规] -> 发现 [缺失: DS-016 编码安全] -> 输出"需要实现DS-016编码安全处理标准"

---

## 6. 宪法合规性验证

### 6.1 单一真理源验证
- ✅ 所有宪法文件统一在`memory_bank/t0_core/`目录
- ✅ `.clinerules`仅作为入口索引，不包含具体宪法内容
- ✅ 所有索引引用指向实际存在的文件路径

### 6.2 熵减验证
- ✅ 文件结构精简，消除重复索引
- ✅ 清晰标识缺失标准和工作流
- ✅ 提供实现优先级指导
- ✅ 实际存在的标准和工作流已准确标记

### 6.3 架构同构性验证
- ✅ T0-T3分层架构严格执行
- ✅ 模块化架构(v1.8.0)已完成
- ✅ 宪法索引与项目状态保持同步

---

**版本信息**: 知识图谱 v1.8.1 | **最后更新**: 2026-02-09 | **项目状态**: MY-DOGE-MACRO v1.8.1 活跃

**宪法约束**: 遵循§152单一真理源公理，本图谱精确反映MY-DOGE-MACRO v1.8.1系统状态。所有导航决策应基于本图谱提供的实际项目状态。