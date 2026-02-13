# 基本法索引 (Basic Law Index)

**版本**: v2.0.0-alpha (MY-DOGE-MACRO Docker容器化版)
**状态**: 🟢 生产就绪 (Production Ready)
**说明**: 本文档是MY-DOGE-MACRO项目的最高宪法内核，整合了所有核心公理与架构约束，作为CDD开发时始终加载的**唯一公理源**。精确反映本项目v2.0.0-alpha状态。

---

## 第一章：核心公理集 (Constitutional Axioms)
> 整合自 `.clinerules/` 和项目实际状态，定义系统的物理与逻辑法则。

| 条款 | 公理名称 | 核心定义 | 项目状态 |
|------|----------|----------|----------|
| **§102.3** | 宪法同步公理 | 版本变更必须触发全体系同步扫描与强制对齐 | ✅ 当前v2.0.0-alpha |
| **§104** | 功能分层拓扑公理 | 系统严格遵循T0-T3分层架构，层级间单向依赖 | ✅ T0-T3已实现 |
| **§114** | 双存储同构公理 | 内存状态必须与文件系统状态一致 ($S_{runtime} \equiv S_{disk}$) | ✅ Qdrant+文件系统 |
| **§124** | 编码一致性公理 | 禁止热更新，启动过程必须确定且可重复 | ✅ UTF-8原子写入 |
| **§125** | 数据完整性公理 | 所有状态变更必须是原子的，且经过完整性校验 | ✅ 原子操作协议 |
| **§130** | MCP微内核神圣公理 | MCP工具是系统与外界交互的唯一合法途径 | ✅ MCP服务已部署 |
| **§141** | 熵减验证公理 | 重构必须满足语义保持性 ($S' = S$) 和熵减验证 ($H' \leq H$) | ✅ 审计协议 |
| **§152** | 单一真理源公理 | `memory_bank` 是可执行规范的唯一真理源，引用而非复制 | ✅ 本文件为真理源 |
| **§153** | T3文档结构公理 | `memory_bank/t3_documentation/` 必须保持扁平结构，禁止子目录 | ✅ 扁平结构已实施 |
| **§160** | 用户主权公理 | AI是执行器，人类用户拥有最终决策权与否决权 | ✅ CDD用户批准 |
| **§171** | 上下文单一存储公理 | 活动上下文 (`activeContext`) 必须存储在单一位置 | ✅ `active_context.md` |
| **§172** | 上下文时效性公理 | activeContext保留最近3天内关键事件概要，早期事件迁移至T1 | ✅ 自动归档机制 |
| **§180** | 渲染复杂度公理 | 严格限制单次渲染的Token数量，优先使用摘要与索引 | ✅ 摘要优先策略 |
| **§181** | 类型公理优先原则 | 类型定义 (.d.ts) 先于代码实现 ($T_{define} \rightarrow T_{implement}$) | ✅ TypeScript严格模式 |
| **§190** | 网络韧性公理 | 通信必须具备熔断、重试与降级机制 | ✅ G.U.A.R.D.弹性通信 |
| **§193** | 模型选择器公理 | 必须根据任务复杂度动态选择最优模型以平衡成本与性能 | ✅ ModernModelSelector |
| **§381** | 安全公理 | 检查依赖包存在性，使用参数化查询防御注入 | ✅ 依赖检查+参数化查询 |

---

## 第二章：引导加载协议 (Bootloader Protocol)

**定义**: 基于索引和图谱的轻量级认知模式，强调"信任架构，而非内容"。

### 2.1 核心原则
1.  **信任索引**: 内存中仅加载内核，具体知识按需加载。
2.  **图谱优先**: 复杂问题优先使用知识图谱导航。
3.  **架构驱动**: 代码实现遵循架构约束，而非临时决策。
4.  **项目精确**: 所有内容必须精确反映MY-DOGE-MACRO v2.0.0-alpha状态。

### 2.2 MY-DOGE-MACRO启动序列
1.  加载 `active_context.md` (自我意识 - T0)
2.  加载 `basic_law_index.md` (本文件 - 核心公理)
3.  加载 `procedural_law_index.md` (流程索引)
4.  加载 `technical_law_index.md` (技术标准索引)
5.  加载 `knowledge_graph.md` (项目知识图谱)

---

## 第三章：三级验证协议 (§156)

| Tier | 验证类型 | 数学公理 | 验证工具 | 项目状态 |
|------|----------|----------|----------|----------|
| **Tier 1** | 结构验证 | $S_{fs} \cong S_{doc}$ | `judicial_verify_structure` | ✅ 架构同构性 |
| **Tier 2** | 签名验证 | $I_{code} \supseteq I_{doc}$ | `judicial_verify_signatures` | ✅ 接口一致性 |
| **Tier 3** | 行为验证 | $B_{code} \equiv B_{spec}$ | `judicial_run_tests` | ✅ 测试覆盖 |

**验证流程**: 
1. **Tier 1**: 验证物理文件系统与架构文档同构性
2. **Tier 2**: 验证代码实现与接口规范签名一致性
3. **Tier 3**: 验证实际行为与规格说明书等价性

---

## 第四章：全局引用映射 (Global Reference Map)
> 精确匹配MY-DOGE-MACRO v2.0.0-alpha项目结构

* **0x00 核心法典**: 本文件及兄弟索引文件 (`t0_core/`)
* **0x10 系统架构**: `t1_axioms/system_patterns.md`, `memory_bank/t3_documentation/modular-architecture.md`
* **0x20 运行时上下文**: `t0_core/active_context.md`, `t1_axioms/behavior_context.md`, `t1_axioms/tech_context.md`
* **0x30 技术参考库**: `memory_bank/t2_protocols/API_INDEX.md`, `memory_bank/t2_protocols/MCP_REFERENCE.md`, `memory_bank/t2_protocols/Agent_Reference.md`
* **0x40 项目文档**: `memory_bank/t3_documentation/` (扁平结构)

---

## 第五章：项目特定条款

### §153 T3文档结构公理
`memory_bank/t3_documentation/` 目录必须保持严格的扁平结构：
- 所有文档文件必须位于顶级目录
- 禁止创建任何子目录
- 确保一致的可访问性和单一源完整性
- 当前状态: ✅ 完全合规 (v1.8.0架构迁移完成)

### §201 CDD流程状态
- **CDD Framework**: v1.6.1
- **当前项目**: MY-DOGE-MACRO v2.0.0-alpha
- **架构状态**: Docker容器化架构 (Production Ready)
- **核心功能**: ✅ 图表模块 + ✅ 实时WebSocket + ✅ 量化引擎 + ✅ Docker部署

### §381 安全状态
- **依赖检查**: 定期审计`requirements.txt`和`package.json`
- **注入防御**: 所有数据库查询使用参数化查询
- **编码安全**: UTF-8输出配置 (DS-001) + 原子写入 (DS-002)

---

## 第六章：版本信息

| 组件 | 版本 | 状态 |
|------|------|------|
| **项目版本** | MY-DOGE-MACRO v2.0.0-alpha | 🟢 生产就绪 |
| **CDD框架** | v1.6.1 | ✅ 运行中 |
| **宪法版本** | v2.0.0-alpha | ✅ 本文件 |
| **架构版本** | Docker容器化 v2.0.0 | ✅ 生产就绪 |
| **前端版本** | React 19 + Tauri v2 | ✅ 生产就绪 |
| **后端版本** | FastAPI + WebSocket | ✅ 运行中 |

---

## 第七章：引用路径

| 法典类型 | 文档名称 | 项目路径 |
|----------|----------|----------|
| **基本法** | 本文件 | `memory_bank/t0_core/basic_law_index.md` |
| **程序法** | 程序法索引 | `memory_bank/t0_core/procedural_law_index.md` |
| **技术法** | 技术法索引 | `memory_bank/t0_core/technical_law_index.md` |
| **知识图谱** | 项目知识图谱 | `memory_bank/t0_core/knowledge_graph.md` |
| **活跃上下文** | 当前任务状态 | `memory_bank/t0_core/active_context.md` |

---

*遵循宪法约束: 代码即数学证明，架构即宪法约束。本项目精确反映MY-DOGE-MACRO v2.0.0-alpha状态。*

**宪法版本**: v2.0.0-alpha | **更新时间**: 2026-02-14 | **项目**: MY-DOGE-MACRO
