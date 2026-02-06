# 逆熵实验室 - 全局知识图谱 (Global Knowledge Graph)

**状态**: 🟢 活跃
**节点数**: ~70+
**用途**: 提供系统实体间的高维关联导航。
**维护机制**: 每次 CDD 周期结束时更新。

---

## 1. 核心拓扑 (Core Topology)

```mermaid
graph TD
    %% 定义核心层级
    subgraph Kernel [Bootloader Kernel]
        L_Basic[基本法 (LAW-BASIC)]
        L_Proc[程序法 (LAW-PROC)]
        L_Tech[技术法 (LAW-TECH)]
    end

    subgraph Standards [DS Standards Implementation]
        DS_IO[IO与编码 (DS-001/002/003)]
        DS_Sec[安全与合规 (DS-005/006/016)]
        DS_Arch[架构与同构 (DS-007/024/027)]
        DS_MCP[MCP协议 (DS-010/011)]
        DS_045[DS-045 状态机转换]
    end

    subgraph Workflows [Operational Workflows]
        WF_CDD[CDD流程 (WF-201)]
        WF_Ops[运维流程 (WF-220)]
        WF_Sec[安全流程 (WF-210)]
    end

    %% 核心关系边
    L_Basic -->|Governs| L_Proc
    L_Basic -->|Governs| L_Tech
    
    L_Proc -->|Defines| WF_CDD
    L_Proc -->|Defines| WF_Ops
    L_Proc -->|Defines| WF_Sec
    
    L_Tech -->|Mandates| DS_IO
    L_Tech -->|Mandates| DS_Sec
    L_Tech -->|Mandates| DS_Arch
    L_Tech -->|Mandates| DS_045
    
    WF_CDD -->|Requires| DS_Arch
    WF_CDD -->|implements| DS_045
    WF_Ops -->|Requires| DS_MCP
    WF_Sec -->|Requires| DS_Sec
    WF_Sec -->|Requires| DS_IO
    
    DS_Sec -->|Implements| L_Tech
    DS_Arch -->|Implements| L_Tech
    DS_IO -->|Implements| L_Tech
    DS_MCP -->|Implements| L_Tech
    DS_045 -->|Implements| L_Tech
    DS_045 -->|guards| DS_Sec

```

## 2. 领域知识簇 (Domain Clusters)

### 🛡️ 安全与合规 (Security & Compliance)

* **中心节点**: [基本法 §100], [技术法 §310], [基本法 §156]
* **核心标准**: [DS-016 编码安全], [DS-005 重构安全], [DS-006 三阶段逆熵审计], [DS-027 同构验证]
* **关联工作流**: [WF-210 安全操作], [WF-207 文件审查], [WF-201 CDD流程], [WF-206 三位一体收敛]
* **防御网络**: 
  - **DS-016** → 编码安全抗体 (与DS-001/002协同)
  - **DS-005** → 重构安全机制 (与DS-024/006协同) 
  - **DS-006** → 审计体检协议 (验证DS-007/027)
  - **WF-210** → 应急响应流程 (集成DS-003弹性通信)
* **导航示例**:
  > 重构安全: DS-005 (重构安全) → 关联 DS-024 (架构同步) + DS-006 (三阶段审计) → 输出完整方案
  > 编码问题: DS-016 (编码安全) → 关联 DS-001 (UTF-8) + DS-002 (原子写入) → 提供安全I/O方案
  > 安全审计: DS-006 (审计) → 验证 DS-027 (同构) + DS-007 (架构) → 生成审计报告

### ⚙️ 核心架构 (Core Architecture)

* **中心节点**: [Bootloader v1.0], [System Patterns]
* **核心标准**: [DS-024 架构同步], [DS-007 架构验证], [DS-023 双存储映射]
* **概念关联**: 熵减 -> 双存储 -> 单一真理源

### 🔌 输入输出与通信 (I/O & Comm)

* **中心节点**: [技术法 §300]
* **核心标准**: [DS-001 UTF-8], [DS-002 原子写入], [DS-003 弹性通信]
* **故障排除**: [MC-010 故障排除]

### 🐳 Docker与基础设施 (Docker & Infrastructure)

* **中心节点**: [技术法 §300], [基本法 §190], [基础设施宪法第1条]
* **核心文件**: [docker-compose.v3.yml], [Dockerfile.mcp], [Dockerfile.node], [entropy_service/Dockerfile.entropy_service]
* **核心标准**: [DS-047 Docker配置与编排标准实现]
* **关联工作流**: [WF-220 MCP运维流程], [WF-204 危机处理流程], [WF-210 安全操作流程]
* **服务架构**:
  - **Layer 1.5**: MCP核心服务 (2567端口) - Node.js + TypeScript
  - **Layer 1.6**: 熵计算服务 (8001端口) - Python + FastAPI
  - **Layer 5**: 向量数据库 (6333/6334端口) - Qdrant
  - **监控栈**: Prometheus (9090) + Grafana (3000)
* **导航示例**:
  > 部署问题: Docker基础设施 → 检查 docker-compose.v3.yml → 验证健康检查 → 查看DS-047标准 → 执行WF-220运维流程
  > 健康检查: 服务故障 → 访问 /health 端点 → 查看容器日志 → 使用MC-010故障排除 → 执行WF-204危机处理
  > 配置优化: 性能问题 → 审查Dockerfile配置 → 验证资源限制 → 参考DS-047最佳实践 → 执行架构同步

### 🧠 认知范式 (Cognitive Paradigm)

* **中心节点**: [Bootloader Mode v1.3.2]
* **核心概念**: 索引驱动、图谱导航、架构优先
* **关联标准**: [DS-001 懒加载], [DS-007 架构验证], [DS-024 架构同步]
* **导航示例**:
  > 开发问题: Bootloader Mode → 索引查找 → 图谱推理 → 标准执行 → 熵减验证

## 3. 图谱导航协议 (Navigation Protocol)

当用户查询模糊问题（如"如何保证系统稳定性？"）时，请遵循以下路径：

1. **定位锚点**: 在上述领域簇中找到最接近的入口（如 "Core Architecture"）。
2. **遍历邻居**: 检查该簇下的 `核心标准` 和 `关联工作流`。
3. **多跳推理**: 如果当前节点无法解决，检查其 `Related_To` 边指向的节点。

> **示例**:
> 稳定性 -> 查阅 [Core Architecture] -> 发现 [DS-027 同构验证] -> 关联 [WF-204 危机处理] -> 输出完整方案。

## 4. 文档分级体系 (Document Tiering System)

* **中心节点**: [基本法 §10.6], [Bootloader Mode v1.3.2]
* **核心概念**: T0-T3分级体系、注意力分配、认知层次结构、上下文管理
* **关联文件**: [activeContext.md], [DOCUMENT_TIERING.md], [LAW_REFERENCE_MAP.md]
* **分级定义**:
  - **T0 (Kernel)**: 核心意识层 - 常驻内存 (`activeContext`, `KNOWLEDGE_GRAPH`, 法典内核)
  - **T1 (Index)**: 索引与状态层 - 高频检索 (`LAW_REFERENCE_MAP`, `systemState`)
  - **T2 (Executable)**: 执行规范层 - 按需加载 (`DS-xxx`, `WF-xxx`)
  - **T3 (Archive)**: 分析与归档层 - 离线存储 (分析报告, 历史数据)
* **数学约束**: 
  - $\sum_{file \in Context} \text{Token}(file) \leq T_{limit}$
  - $\text{Attention}(T0) \gg \text{Attention}(T1) > \text{Attention}(T2)$
* **导航示例**:
  > 上下文优化: Bootloader Mode → T0层定位 → T1索引检索 → T2按需加载 → T3审计回溯
  > 高效检索: 问题分析 → 图谱定位(T0) → 索引查找(T1) → 标准执行(T2) → 熵减验证
> 注意力分配: 优先处理T0核心 → 必要时检索T1 → 按需加载T2 → 忽略T3除非审计

### 🤖 Agent系统与智能协作 (Agent Systems & Intelligent Collaboration)

* **中心节点**: [基本法 §180-§189], [技术法 §380-§389], [Bootloader Mode v1.3.2]
* **核心标准**: [AS-101 Agent基础接口规范], [AS-102 内阁总理Agent接口规范], [AS-103 办公厅主任Agent接口规范]
* **关联标准**: [DS-010 MCP工具策略], [DS-011 MCP服务标准], [DS-003 弹性通信], [DS-043 性能监控与告警]
* **架构层级**:
  - **L1入口层**: 办公厅主任Agent (网关管理、意图识别、网络韧性)
  - **L2协调层**: 内阁总理Agent (战略协调、冲突仲裁、降级管理)
  - **L3专业层**: 各专业Agent (法律解释、架构设计、开发实现等)
* **宪法关联**:
  - **§180-§189**: 智能体接口与主权 - 定义Agent层次结构和权限边界
  - **§110**: 协作效率公理 - 优化多Agent协作效率
  - **§152**: 单一真理源公理 - 所有Agent实现必须引用统一规范
  - **§183-§186**: 任务接收、分发与错误隔离 - 网关层操作依据
  - **§184-§185**: 战略协调与降级管理 - 协调层操作依据
* **导航示例**:
  > Agent架构设计: Bootloader Mode → 检查Agent系统簇 → 查看三层架构 → 参考AS-101基础接口 → 实现具体Agent
  > 协作问题: 多Agent冲突 → 检查AS-102内阁总理Agent规范 → 实施冲突仲裁 → 验证宪法合规(§184)
  > 网关管理: 用户请求处理 → 查看AS-103办公厅主任Agent规范 → 实现意图识别 → 配置网络韧性(§190)
  > 性能监控: Agent性能问题 → 关联DS-043性能监控标准 → 实施健康检查 → 执行降级管理(§185)

### 🔄 项目与孵化 (Projects & Incubation)

* **中心节点**: [MY-DOGE-MACRO v1.8.1], [Negentropy-Lab v1.3.0], [程序法 §230-§232]
* **核心关系**: 孵化关系、同步回流、架构演进
* **关联文件**: [activeContext.md], [程序法索引 §230-§232], [incubationState.md]
* **孵化网络**:
  - **Negentropy-Lab** → 孵化 → **MY-DOGE-MACRO** (前端架构实验与设计系统提取)
  - **MY-DOGE-MACRO** → 回流 → **Negentropy-Lab** (设计系统标准化与宪法框架同步)
  - **共享核心**: 法典内核(.clinerules)、宪法公理、基础技术标准
* **工作流关联**:
  - **WF-230**: 项目孵化流程 - 从主项目创建专门化子项目
  - **WF-231**: 架构回流流程 - 子项目成果同步回主项目
  - **WF-232**: 版本协调流程 - 管理版本兼容性与同步策略
* **导航示例**:
  > 架构问题: MY-DOGE-DEMO → 检查孵化关系 → 参考Negentropy-Lab三层架构 → 评估回流可行性 → 执行WF-231回流流程
  > 标准更新: Negentropy-Lab新标准 → 验证宪法合规 → 通过WF-232版本协调 → 回流至MY-DOGE-DEMO
  > 开发模式: 高风险功能 → 使用WF-230孵化子项目 → 隔离实验 → 验证后回流

### 📚 索引与文档架构整合 (Index & Document Architecture Integration)

* **中心节点**: [Bootloader Mode v1.3.2], [技术法索引 §300], [程序法索引 §200], [基本法 §102.3], [基本法 §152]
* **核心概念**: 索引整合、版本同步、单一真理源、熵减优化
* **整合状态**:
  - ✅ **法典内核索引**: `.clinerules/technical_law_index.md` (v1.8.1) - 完整收录所有DS标准
  - ✅ **程序法索引**: `.clinerules/procedural_law_index.md` (v1.8.1) - 完整收录所有工作流
  - ⚠️ **整合完成**: `DEVELOPMENT_STANDARDS.md` → 技术法索引第二章 (标记为deprecated)
  - ⚠️ **整合完成**: `DEVELOPMENT_WORKFLOW.md` → 程序法索引第一、二章 (标记为deprecated)
  - ✅ **版本统一**: `API_INDEX.md`, `MCP_REFERENCE.md` 升级到v6.8.0，解决§102.3宪法违反
  - ✅ **专业参考**: `Agent_Reference.md` 已正确整合到技术法索引2.9章节
* **宪法依据**:
  - **§102.3宪法同步公理**: 强制版本一致性，解决v5.5.x到v6.8.0的升级
  - **§152单一真理源公理**: 减少索引重叠，从5个独立索引优化到3个以下
  - **§141熵减验证**: 确保整合后系统有序度提升 (ΔH > 0)
  - **§125数据完整性公理**: 备份与验证确保整合过程安全
* **导航示例**:
  > 标准查找: 开发需求 → 访问技术法索引第二章 → 定位DS-xxx标准 → 按需加载
  > 工作流执行: 操作需求 → 访问程序法索引第一、二章 → 定位WF-xxx工作流 → 按需执行
  > 宪法合规: 版本检查 → 验证所有文件版本为v6.8.0 → 确保§102.3合规
  > 熵减优化: 架构审计 → 比较整合前后文件数量 → 验证ΔH>0系统有序度提升
* **维护指南**:
  1. **新增标准**: 直接添加到`technical_law_index.md`第二章相应类别
  2. **新增工作流**: 直接添加到`procedural_law_index.md`相应章节
  3. **版本升级**: 所有相关文件必须同步升级到相同版本
  4. **宪法验证**: 每次变更必须通过§102.3和§152验证


