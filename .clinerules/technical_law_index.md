# 技术法索引 (Technical Law Index)

**版本**: v1.8.1 (宪法升级版 - 从MY-DOGE-DEMO v6.8.1同步)
**状态**: 🟢 引导模式 (Bootloader Mode)
**说明**: MY-DOGE-MACRO技术法标准索引，**完整收录**所有 DS-Series 标准。严禁凭空生成代码，必须查阅本索引。

---

## 第一章：数学公理与总纲 (§300)
1.  **复杂度约束**: 操作复杂度收敛于 $O(1)$ 或 $O(\log N)$。
2.  **原子性**: 文件写入与状态更新必须是原子的。
3.  **引用完整性**: 所有代码引用必须指向有效的真理源。

---

## 第二章：完整标准目录 (Standard Catalog)
> 整合自 `STANDARD_CATALOG.md`，按领域分类。

### 2.1 输入输出与持久化 (I/O & Persistence)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-001** | UTF-8输出配置 | `standards/DS-001_UTF-8输出配置标准实现.md` |
| **DS-002** | 原子文件写入 | `standards/DS-002_原子文件写入标准实现.md` |
| **DS-023** | 双存储双射映射 | `standards/DS-023_双存储双射映射标准实现.md` |
| **DS-028** | Markdown围栏解析 | `standards/DS-028_Markdown围栏解析器标准实现.md` |
| **DS-029** | 嵌入式块分块器 | `standards/DS-029_嵌入式块分块器标准实现.md` |
| **DS-030** | 混合检索引擎 | `standards/DS-030_混合检索引擎标准实现.md` |

### 2.2 架构与系统卫生 (Architecture & Hygiene)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-004** | 知识漂移检测 | `standards/DS-004_知识漂移检测标准实现.md` |
| **DS-005** | 自动化重构安全 | `standards/DS-005_自动化重构安全标准实现.md` |
| **DS-024** | 自动化架构同步 | `standards/DS-024_自动化架构同步标准实现.md` |
| **DS-025** | 批量引用更新 | `standards/DS-025_批量引用更新操作标准实现.md` |
| **DS-026** | 元数据标准化 | `standards/DS-026_元数据标准化与重构设计方案.md` |
| **DS-040** | .d.ts文件迁移 | `standards/DS-040_.d.ts文件迁移标准实现.md` |
| **DS-044** | 法典图谱韧性分析 | `standards/DS-044_法典图谱韧性分析标准实现.md` |
| **DS-045** | 状态机转换标准 | `standards/DS-045_状态机转换标准实现.md` |

### 2.3 审计与验证 (Audit & Verification)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-006** | 三阶段逆熵审计 | `standards/DS-006_三阶段逆熵审计标准实现.md` |
| **DS-007** | 架构同构性验证 | `standards/DS-007_架构同构性验证标准实现.md` |
| **DS-008** | 接口契约一致性验证 | `standards/DS-008_接口契约一致性验证标准实现.md` |
| **DS-009** | 圈复杂度测量 | `standards/DS-009_圈复杂度测量标准实现.md` |
| **DS-014** | 语义边界检测 | `standards/DS-014_语义边界检测标准实现.md` |
| **DS-027** | 双存储同构验证 | `standards/DS-027_双存储同构验证标准实现.md` |

### 2.4 通信与服务 (Communication & Services)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-003** | 弹性通信 (G.U.A.R.D) | `standards/DS-003_弹性通信标准实现.md` |
| **DS-010** | MCP工具策略 | `standards/DS-010_MCP工具策略标准实现.md` |
| **DS-011** | MCP服务标准 | `standards/DS-011_MCP服务标准实现.md` |
| **DS-012** | 依赖注入配置 | `standards/DS-012_依赖注入配置标准实现.md` |
| **DS-022** | Colyseus集成 | `standards/DS-022_Colyseus_集成标准实现.md` |
| **DS-036** | 会话管理迁移 | `standards/DS-036_会话管理迁移标准实现.md` |
| **DS-037** | 健康探针服务 | `standards/DS-037_健康探针服务标准实现.md` |
| **DS-038** | TypeScript模块分离 | `standards/DS-038_TypeScript模块导入分离标准实现.md` |
| **DS-039** | 工具调用桥接器 | `standards/DS-039_工具调用桥接器标准实现.md` |

### 2.5 安全与认证 (Security & Auth)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-016** | 编码安全处理 | `standards/DS-016_编码安全处理标准实现.md` |
| **DS-035** | 类型公理优先原则 | `standards/DS-035_类型公理优先原则标准实现.md` |
| **DS-041** | ModernAuthProfiles | `standards/DS-041_ModernAuthProfiles标准实现.md` |
| **DS-042** | ModernModelSelector | `standards/DS-042_ModernModelSelector标准实现.md` |
| **DS-043** | 性能监控与告警 | `standards/DS-043_性能监控与告警标准实现.md` |

### 2.6 前端与可视化 (Frontend & Vis)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-013** | 滑动窗口分片算法 | `standards/DS-013_滑动窗口分片算法标准实现.md` |
| **DS-015** | 重叠策略优化 | `standards/DS-015_重叠策略优化标准实现.md` |
| **DS-017** | 逆熵前端设计系统 | `standards/DS-017_逆熵前端设计系统规范__Entropy_Design_System_.md` |
| **DS-018** | 游标分页 | `standards/DS-018_游标分页标准实现__Cursor_Pagination_.md` |
| **DS-019** | 可视化熵减 | `standards/DS-019_可视化熵减标准实现__Visual_Entropy_Reduction_.md` |
| **DS-020** | 渐进式增强 | `standards/DS-020_渐进式增强标准实现__Progressive_Enhancement_.md` |
| **DS-021** | 渲染资源管理 | `standards/DS-021_渲染资源管理标准实现__Rendering_Resource_Management_.md` |

### 2.7 自动化运维 (AIOps & Automation)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-046** | 自动化运维预测模型 | `standards/DS-046_自动化运维预测模型标准实现.md` |

### 2.8 Docker与基础设施编排 (Docker & Infrastructure)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **DS-047** | Docker配置与编排标准实现 | `standards/DS-047_Docker配置与编排标准实现.md` |
| **Docker-Compose** | 编排配置文件 | `docker-compose.v3.yml` |
| **Dockerfile.mcp** | MCP核心服务镜像 | `Dockerfile.mcp` |
| **Dockerfile.node** | Node.js服务器镜像 | `Dockerfile.node` |
| **Dockerfile.entropy** | 熵计算服务镜像 | `engine/entropy_service/Dockerfile.entropy_service` |

### 2.9 Agent系统与智能协作 (Agent Systems & Intelligent Collaboration)
| ID | 标准名称 | 路径 (Pointer) |
|----|----------|----------------|
| **AR-001** | **Agent架构与术语统一参考文档 (整合版 v2.0.0)** | `storage/memory_bank/03_protocols/Agent_Reference.md` |
| **AS-101** | Agent接口规范 (合并版 v1.3.0) | `storage/memory_bank/03_protocols/agent_standards/AS-101_Agent接口规范_合并版.md` |
| **AS-102** | 内阁总理Agent接口规范 (合并版 v1.3.0) | `storage/memory_bank/03_protocols/agent_standards/AS-102_内阁总理Agent接口规范_合并版.md` |
| **AS-103** | 办公厅主任Agent接口规范 (合并版 v1.3.0) | `storage/memory_bank/03_protocols/agent_standards/AS-103_办公厅主任Agent接口规范_合并版.md` |
| **TL-001** | 三层Agent架构规范 (已整合到AR-001) | **整合到** `storage/memory_bank/03_protocols/Agent_Reference.md` |

**宪法依据**: §180-§189智能体接口与主权、§110协作效率公理、§152单一真理源公理
**核心架构**: L1入口层(办公厅主任Agent) → L2协调层(内阁总理Agent) → L3专业层(各专业Agent)
**AI友好度**: ⭐⭐⭐⭐⭐ (5/5星 - 专为AI Agent设计)
**版本**: v1.3.0 (AI友好化增强，合并书记员职责，增强为统一入口)
**关键更新**:
- **办公厅主任Agent**: 统一用户对话入口 + 书记员职责合并
- **内阁总理Agent**: 战略协调增强 + AI友好化接口
- **Agent基础接口**: 三层架构完整定义 + AI实现模板
**关联标准**: DS-010(MCP工具策略)、DS-011(MCP服务标准)、DS-003(弹性通信)、DS-043(性能监控)

### 2.10 API与MCP参考库 (API & MCP Reference Library)
| ID | 参考文档名称 | 路径 (Pointer) |
|----|-------------|----------------|
| **API-INDEX** | **API参考索引 (完整版 v6.8.0)** | `storage/memory_bank/03_protocols/API_INDEX.md` |
| **MCP-REFERENCE** | **MCP工具参考库 (完整版 v6.8.0)** | `storage/memory_bank/03_protocols/MCP_REFERENCE.md` |

**宪法依据**: §152单一真理源公理、§102.3宪法同步公理、§130 MCP微内核神圣公理
**核心功能**:
- **API参考索引**: 包含所有REST API、WebSocket API、熵计算服务API的完整规范
- **MCP工具参考**: 包含所有MCP工具的定义、使用方法和宪法依据
**版本**: v6.8.0 (与法典内核版本统一)
**导航路径**: 通过本索引可直接访问API和MCP的完整参考文档，无需单独查找

---

## 第三章：使用指南
开发者在实施任何功能时，必须首先查阅本索引，找到对应的 `DS-xxx` 标准，并严格按照标准文件中的规范进行编码。

*遵循宪法约束: 技术即标准，执行即合规。*