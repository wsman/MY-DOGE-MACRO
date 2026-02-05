# My Doge Macro 🐶📈

> 基于 AI Agent 的全栈量化情报与研报生成系统。  
> **版本**: v1.8.0 (核心功能完成)  
> **类型**: AI驱动的量化分析系统  
> **创建**: 2026-02-03 | **更新**: 2026-02-05

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.12-blue)
![React](https://img.shields.io/badge/react-19-blue)
![Status](https://img.shields.io/badge/status-stable-green)
![Architecture](https://img.shields.io/badge/architecture-Modular%20v1.8.0-blue)
![CDD](https://img.shields.io/badge/CDD-v1.6.1-green)

## 🚀 v1.8.0 核心功能完成

### ✨ 新增功能 (2026-02-05)

#### 图表可视化组件
- **技术指标**: MA/EMA/MACD/RSI/Bollinger/KDJ 完整支持
- **子图系统**: MACD/RSI/KDJ/Volume 独立子图
- **图表面板**: 可配置的完整 K 线图表

#### Dashboard 组件
- **市场概览**: 多资产行情展示
- **分析面板**: 资产详情 + 技术指标
- **AI 研报**: DeepSeek 驱动的研报展示

#### 后端增强
- **WebSocket**: 实时价格推送
- **技术指标库**: Python 完整实现
- **通达信集成**: 本地 A 股数据读取

### 📊 模块化架构状态

**迁移状态**: ✅ Phase 2 完成

| 组件 | 目标路径 | 状态 | 详情 |
|------|----------|------|------|
| **设计系统** | `libs/design-system/` | ✅ 完成 | 原子设计 + BEM + 组件库 |
| **前端应用** | `apps/desktop/` | ✅ 完成 | React 19 + Tauri v2 桌面应用 |
| **后端 API** | `apps/api/` | ✅ 完成 | FastAPI + WebSocket |
| **量化引擎** | `libs/quant-engine/` | ✅ 完成 | 技术指标 + 通达信读取 |
| **基础设施** | `infrastructure/` | ✅ 完成 | CDD工具、CI/CD、监控 |

### v1.7.0 完整模块化迁移

**架构迁移完成**:
- `client/` → `apps/desktop/` ✅
- `server/` → `apps/api/` ✅
- `engine/` → `libs/quant-engine/` ✅
- `scripts/` → `infrastructure/cdd/tools/` ✅

### v1.5.0 前端架构现代化已完成

**29/29 任务完成** - 原子设计 + BEM + 组件库全面升级：

- **原子设计结构**: 完整的原子/分子/组织/模板目录结构
- **设计系统**: 色彩、排版、间距、阴影等设计令牌
- **组件库**: 7个原子组件 + 4个分子组件 (Button, Icon, Badge, Card, Input, Avatar, StatusDot, StatusIndicator, DataCard, SearchBar, FormGroup)
- **CSS 标准**: BEM 命名规范 + CSS 变量
- **Storybook**: 5个组件故事，80%+ 覆盖率
- **设计系统文档**: `apps/desktop/DESIGN_SYSTEM.md` 完整文档

## 🎯 项目概述

My Doge Macro 是一个基于 AI Agent 的全栈量化情报与研报生成系统。

### 核心目的
- **全球宏观分析**: 科技股、黄金、数字货币、A股联动分析
- **AI研报生成**: 基于 DeepSeek API 的自动化报告生成
- **高级量化指标**: RSRS、波动率偏度等专业指标
- **实时市场扫描**: 多市场并行扫描和动量分析

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端 UI** | React 19 + TypeScript | Tauri 桌面应用 (apps/desktop/) |
| **App Shell** | Tauri v2 (Rust) | 跨平台桌面框架 |
| **后端 API** | Python FastAPI | RESTful API 服务 (apps/api/) |
| **量化引擎** | pandas, numpy, scipy | 量化算法 (libs/quant-engine/) |
| **数据源** | yfinance, 通达信 DB | 市场数据获取 |
| **AI 引擎** | DeepSeek API | 智能分析与报告 |
| **架构** | Monorepo + 模块化 | 清晰的关注点分离 |

## 📁 项目结构

### 新架构结构 (v1.6.0+)
```
MY-DOGE-MACRO/
├── apps/                    # 应用层 (桌面应用、API服务)
├── libs/                    # 共享库 (量化引擎、设计系统)
├── infrastructure/         # 基础设施 (CDD工具、CI/CD)
├── config/                 # 配置管理
├── data/                   # 数据存储
└── memory_bank/            # 📚 统一文档体系 (CDD)
    ├── core/               # T0 核心宪法
    ├── t1_axioms/             # T1 公理层
    ├── t2_standards/      # T2 标准层
    └── t3_documentation/   # T3 用户/开发者文档
```

### 详细目录结构
```
MY-DOGE-MACRO/
├── apps/                    # 应用层
│   ├── desktop/            # 桌面应用 (Tauri + React 19)
│   │   ├── src/           # React 组件和页面
│   │   ├── src-tauri/     # Tauri 桌面壳
│   │   ├── stories/       # Storybook 组件故事
│   │   └── tests/         # 前端测试
│   └── api/                # 后端API服务 (FastAPI) ✅
│       ├── core/           # 核心模块 (WebSocket, 配置)
│       ├── routes/         # API 路由
│       └── tests/          # 后端测试
│
├── libs/                    # 共享库
│   ├── quant-engine/       # 量化引擎 (Python算法) ✅
│   │   ├── analysis/       # 技术指标、RSRS、波动率
│   │   ├── data/           # 数据读取 (yfinance, 通达信)
│   │   └── tests/          # 算法测试
│   ├── design-system/      # 设计系统 (React组件) ✅
│   │   ├── tokens/        # 设计令牌 (色彩、排版、间距)
│   │   ├── components/    # 可复用组件库
│   │   └── stories/       # 组件文档
│   └── common/             # 通用工具和类型定义 [规划中]
│       ├── types/         # 共享TypeScript类型
│       └── utils/         # 通用工具函数
│
├── infrastructure/         # 基础设施
│   ├── cdd/               # CDD工具和文档工作流
│   ├── ci-cd/             # CI/CD配置和脚本
│   └── monitoring/        # 监控和告警配置
│
├── config/                 # 配置文件
│   ├── environments/      # 环境配置 (开发/测试/生产)
│   ├── features/          # 功能开关和配置
│   └── secrets/           # 密钥管理模板 (.env.example)
│
├── data/                   # 数据层
│   ├── raw/               # 原始市场数据
│   ├── processed/         # 处理后的分析数据
│   └── reports/           # AI生成的研报
│
├── memory_bank/            # 📚 统一文档体系 (CDD v1.8.0)
│   ├── t0_core/          # T0 核心宪法
│   │   ├── active_context.md
│   │   ├── knowledge_graph.md
│   │   └── *_law_index.md
│   ├── t1_axioms/            # T1 公理层
│   ├── t2_standards/     # T2 标准层
│   ├── t2_protocols/      # T2 工作流协议
│   └── t3_documentation/  # T3 用户/开发者文档
│       ├── README.md      # 文档中心
│       ├── api/           # API 文档
│       ├── architecture/  # 架构文档
│       ├── deployment/    # 部署指南
│       └── guides/        # 使用指南
│
├── scripts/               # 项目级脚本
└── tests/                 # 集成测试和端到端测试
```

### 旧架构结构 (v1.5.0 及之前)
> **注意**: 以下为正在迁移的旧结构，新开发应使用新架构

```
MY-DOGE-MACRO/ (旧路径)
├── client/           # 前端 (正在迁移到 apps/desktop/)
├── apps/api/         # 后端API服务 (已迁移到 apps/api/)
├── engine/           # 量化引擎 (正在迁移到 libs/quant-engine/)
└── ...              # 其他目录
```

## 🚀 快速启动

### 使用新架构 (推荐)

#### 后端开发 (新架构)
```bash
cd apps/api
pip install -r requirements.txt
python main.py --host 0.0.0.0 --port 8765
```

#### 前端开发 (新路径)
```bash
cd apps/desktop
npm install
npm run tauri dev
```

#### 设计系统开发
```bash
cd libs/design-system
npm install
npm run storybook
```

### 使用旧架构 (兼容性)
```bash
# 前端 (旧路径)
cd client
npm install
npm run tauri dev

# 后端 (旧路径)
cd server
pip install -r requirements.txt
python server.py --host 0.0.0.0 --port 8765
```

### 新架构导入示例
```typescript
// 使用路径别名导入设计系统
import { colors } from '@design-system/tokens/colors';
import { Button } from '@design-system/components/Button';

// 导入共享类型 (规划中)
// import { MarketData } from '@common/types/market';
```

```python
# 量化引擎导入 (规划中)
# from libs.quant_engine.src.analysis.rsrs import calculate_rsrs
# from libs.quant_engine.src.data.acquisition import fetch_market_data
```

## 🎯 完整启动指南

> **注意**: 本部分整合自 `START_GUIDE.md`，提供详细的启动操作指南和环境设置说明。

### 概述
MY-DOGE-MACRO 是一个基于AI Agent的量化情报与研报生成系统，采用模块化架构（v1.6.0）。项目包含：
- **后端API服务**：Python FastAPI (apps/api/)
- **前端桌面应用**：Tauri v2 + React 19 (apps/desktop/)
- **设计系统**：React组件库 (libs/design-system/)

### 环境要求

#### 1. Python环境 (后端)
- Python 3.12+ (已安装：Python 3.13.11)
- 安装依赖：`pip install -r server/requirements.txt`

#### 2. Node.js环境 (前端)
- Node.js 18+ 
- npm包管理器

#### 3. Rust环境 (Tauri桌面应用)
- Rust工具链（包括cargo）
- 运行：`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

#### 4. 系统依赖 (Ubuntu/Linux)
- GTK+库和开发工具
- 运行：`sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev build-essential pkg-config`

### 完整的启动流程

#### 第一步：安装系统依赖（仅限Ubuntu/Debian）
```bash
# 更新包管理器
sudo apt update

# 安装Tauri所需系统依赖
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev \
    build-essential curl wget file libssl-dev \
    libayatana-appindicator3-dev librsvg2-dev \
    pkg-config
```

#### 第二步：安装Python依赖（后端）
```bash
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO/apps/api
pip install -r requirements.txt
```

#### 第三步：安装Node.js依赖（前端）
```bash
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO/apps/desktop
npm install
```

#### 第四步：安装Rust工具链（仅首次需要）
```bash
# 安装Rust（包括cargo）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 重新加载shell配置
source "$HOME/.cargo/env"

# 验证安装
rustc --version
cargo --version
```

### 启动项目

#### 方案A：完整启动（推荐）

**终端1 - 启动后端API服务：**
```bash
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO/apps/api
python main.py --host 0.0.0.0 --port 8765
```

**终端2 - 启动前端桌面应用：**
```bash
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO/apps/desktop
npm run tauri dev
```

#### 方案B：仅启动后端（API开发）
```bash
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO
python -m server.server --host localhost --port 8765
```

访问API文档：http://localhost:8765/docs

#### 方案C：仅启动前端（UI开发）
```bash
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO/apps/desktop
npm run tauri dev
```

#### 方案D：使用快速启动脚本
创建启动脚本 `start_mydoge.sh`：
```bash
#!/bin/bash
# MY-DOGE-MACRO 快速启动脚本

# 切换到项目目录
cd /home/wsman/桌面/Coding\ Task/MY-DOGE-MACRO

# 启动后端
echo "启动后端API服务..."
nohup python -m server.server --host 0.0.0.0 --port 8765 > /tmp/mydoge-server.log 2>&1 &

# 等待后端启动
sleep 3

# 检查后端状态
if curl -s http://localhost:8765/health_check > /dev/null; then
    echo "✅ 后端API启动成功！访问：http://localhost:8765"
else
    echo "❌ 后端API启动失败，查看日志：/tmp/mydoge-server.log"
    exit 1
fi

# 启动前端
echo "启动前端桌面应用..."
cd apps/desktop
npm run tauri dev
```

### 验证启动成功

#### 后端验证
```bash
# 健康检查
curl http://localhost:8765/health_check
# 应返回：{"status":"ok","timestamp":"...","version":"1.0.0"}

# API文档
打开浏览器访问：http://localhost:8765/docs
```

#### 前端验证
- Tauri桌面应用窗口应该自动打开
- 应用标题：MY-DOGE Quant System

### 常见问题解决

#### 1. 端口8765被占用
```bash
# 检查占用进程
lsof -ti:8765

# 停止进程
kill -TERM <进程ID>

# 或使用不同端口启动
python -m server.server --host 0.0.0.0 --port 8766
```

#### 2. Python导入错误
错误：`ModuleNotFoundError: No module named 'server.core'`
解决方案：使用模块方式运行
```bash
# 正确方式
python -m server.server

# 错误方式（不要使用）
cd server && python server.py
```

#### 3. Tauri构建失败 - 缺少GLIB库
错误：`The system library 'glib-2.0' required by crate 'glib-sys' was not found`
解决方案：
```bash
# 安装缺失的系统依赖
sudo apt install -y libgtk-3-dev libwebkit2gtk-4.1-dev pkg-config

# 验证glib安装
pkg-config --modversion glib-2.0
```

#### 4. 缺少Rust/Cargo
错误：`failed to run 'cargo metadata' command`
解决方案：
```bash
# 安装Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### 项目结构说明

```
MY-DOGE-MACRO/
├── server/           # 后端API服务（Python FastAPI）
│   ├── server.py     # 主服务文件
│   ├── core/         # 核心API路由
│   └── requirements.txt
├── apps/desktop/     # 前端桌面应用（Tauri + React）
│   ├── src/          # React组件
│   ├── src-tauri/    # Tauri Rust代码
│   └── package.json
└── libs/design-system/ # 设计系统
```

### 开发注意事项

1. **后端API令牌**：默认使用 `mydoge-token-123456`
2. **CORS配置**：允许所有来源（开发环境）
3. **数据存储**：项目使用内存存储，重启后数据会丢失
4. **日志查看**：后端日志输出到控制台，前端日志在Tauri窗口

### 获取帮助

1. 查看详细文档：本README文档
2. 检查问题：运行内置诊断工具
3. 提交问题：GitHub Issues

---

**启动状态检查清单：**
- [ ] 系统依赖已安装（GTK+等）
- [ ] Python依赖已安装（FastAPI等）
- [ ] Node.js依赖已安装（npm install）
- [ ] Rust工具链已安装（cargo --version）
- [ ] 端口8765可用（未被占用）
- [ ] 后端API响应正常（curl测试）
- [ ] 前端Tauri应用正常启动

## 📖 CDD 工作流

项目遵循 CDD v1.6.1 五状态工作流:

```
State A → State B → State C → State D → State E
  加载      规划      实现      验证      收敛
```

**CDD 版本**: v1.6.1
**系统熵 ($H_{sys}$)**: 0.50 (健康)

## 📚 文档目录与体系

### 文档目录

| 文档 | 描述 | 状态 |
|------|------|------|
| [项目README](../../README.md) | 项目概述、快速开始、功能特性 | ✅ 最新 (v1.6.0) |
| [变更日志](../../CHANGELOG.md) | 版本历史记录和变更详情 | ✅ 最新 |

#### 架构文档
| 文档 | 描述 | 适用版本 |
|------|------|----------|
| [v1.6.0模块化架构](./memory_bank/t3_documentation/architecture/v1.6.0-modular-architecture.md) | 新模块化架构设计、迁移状态、依赖关系 | v1.6.0+ |
| [设计系统](../../apps/desktop/DESIGN_SYSTEM.md) | 前端设计系统规范、组件库、设计令牌 | v1.5.0+ |

#### 开发文档
| 文档 | 描述 | 用途 |
|------|------|------|
| [快速入门](./memory_bank/t3_documentation/development/getting-started.md) | 环境设置、安装步骤、开发工作流 | 新开发者入门 |
| [后端API文档](./memory_bank/t3_documentation/api/backend-api.md) | API端点、请求/响应格式、认证机制 | API集成和开发 |
| [CDD文档体系](../../memory_bank/t0_core/) | Constitution-Driven Development文档 | 项目管理和工作流 |

#### 部署文档
| 文档 | 描述 | 目标环境 |
|------|------|----------|
| [部署指南](./memory_bank/t3_documentation/deployment/deployment-guide.md) | 桌面应用和API服务部署 | 生产环境 |
| [CI/CD配置](../../.github/workflows/) | GitHub Actions工作流配置 | 持续集成/部署 |

### 文档体系说明

| 级别 | 目录 | 说明 |
|------|------|------|
| **T0** | `memory_bank/t0_core/` | 核心宪法文档 (每次会话加载) |
| **T1** | `memory_bank/t1_axioms/` | 公理层 (技术上下文、行为模式) |
| **T2** | `memory_bank/t2_protocols/` | 工作流协议 |
| **T2** | `memory_bank/t2_standards/` | 实现标准 (架构标准、代码规范) |
| **T3** | `memory_bank/t3_documentation/` | 用户和开发者文档 (统一存放) |

### 文档维护流程

1. **确定更新范围**: 根据架构变更或功能更新确定需要更新的文档
2. **更新文档内容**: 按照文档模板和规范更新内容
3. **验证准确性**: 确保文档与实际代码和功能一致
4. **版本控制**: 更新文档版本和最后更新日期
5. **链接检查**: 验证所有内部和外部链接有效性

### 文档标准

- **Markdown格式**: 使用标准Markdown语法
- **版本标注**: 每个文档顶部标注版本和最后更新日期
- **目录结构**: 使用清晰的标题层级
- **代码示例**: 提供可运行的代码示例
- **链接引用**: 使用相对路径引用其他文档

### 🆘 获取帮助

#### 遇到问题？
1. **查看相关文档**: 首先查阅本文档和具体功能文档
2. **检查现有问题**: 查看GitHub Issues是否有类似问题
3. **运行诊断**: 使用内置诊断工具检查系统状态
4. **提交新问题**: 提供详细的错误信息、复现步骤和环境信息

#### 联系方式
- **主要渠道**: [GitHub Issues](https://github.com/wsman/MY-DOGE-MACRO/issues)
- **文档问题**: 直接提交文档更新PR
- **紧急问题**: 标注为高优先级Issue

## 🔧 开发指南

### 环境设置
1. **Python 环境**: `python3.12+`, `pip install -r server/requirements.txt`
2. **Node.js 环境**: `node18+`, `npm install` 在相应应用目录
3. **Rust 环境**: 用于 Tauri 桌面应用 (自动安装)

### 导入示例 (新架构)
```typescript
// 使用路径别名导入设计系统
import { colors } from '@design-system/tokens/colors';
import { Button } from '@design-system/components/Button';
```

## 🎉 版本历史

### 版本概览表

| 版本 | 发布日期 | 状态 | 核心特性 | 项目指标 |
|------|----------|------|----------|----------|
| **v1.6.0** | 2026-02-05 | 🚀 进行中 | 模块化架构迁移 | 系统熵: 0.50 |
| **v1.5.0** | 2026-02-04 | ✅ 完成 | 前端架构现代化 | 组件: 12个，覆盖率: ~45% |
| **v1.4.0** | 2026-02-03 | ✅ 完成 | 基础设施和CDD工具链 | 测试: 15个单元测试 |
| **v1.3.0** | 2026-01-XX | ✅ 完成 | 宏观分析面板 | AI报告生成功能 |
| **v1.2.0** | 2026-01-XX | ✅ 完成 | 性能优化 (50x RSRS加速) | React.memo + useCallback |
| **v1.1.0** | 2026-01-XX | ✅ 完成 | T-C3 集成 | 端口配置和路由改进 |
| **v1.0.0** | 2026-01-XX | ✅ 完成 | 初始版本发布 | CDD框架集成 |

### 关键版本亮点

#### v1.5.0 (2026-02-04) - 前端架构现代化
- **原子设计结构**: 完整的原子/分子/组织/模板目录
- **组件库**: 7个原子组件 + 4个分子组件 (Button, Icon, Badge, Card, Input, Avatar, StatusDot, StatusIndicator, DataCard, SearchBar, FormGroup)
- **设计系统**: BEM命名 + CSS变量 + Storybook (5个故事，80%+覆盖率)
- **迁移**: 18个组件文件现代化，29/29任务完成
- **文档**: 完整设计系统文档 `apps/desktop/DESIGN_SYSTEM.md`

#### v1.4.0 (2026-02-03) - 基础设施和CDD工具链
- **CDD工具链**: 便携式预提交检查，移除硬编码路径
- **CI/CD**: GitHub Actions集成，启用CDD检查
- **单元测试**: 15个新增测试，覆盖server/core模块
- **系统熵**: 稳定在0.50，系统健康
- **项目质量**: 最新审计8.75/10通过

#### v1.3.0 (2026-01-XX) - 宏观分析面板
- **市场分析**: 风险信号、RSRS趋势、波动率偏度监控
- **资产联动**: Gold/BTC比率分析，核心资产性能表
- **AI报告**: 自动化宏观研报生成
- **API扩展**: 新增多个宏观分析API端点

### 查看完整变更记录

**详细变更日志请查看**: [CHANGELOG.md](./CHANGELOG.md) - 包含每个版本的完整Added/Changed/Fixed/Removed记录，遵循Keep a Changelog标准格式。

> **提示**: CHANGELOG.md是项目的标准变更日志文件，包含每个版本的详细技术变更记录。本版本历史表格提供快速概览，详细技术变更请查看CHANGELOG.md。

## 📊 系统指标

| 指标 | 值 | 状态 |
|------|-----|------|
| **当前版本** | v1.6.0 | 🚀 新架构 |
| **系统熵** | 0.50 | 🟡 健康 |
| **最新审计** | 8.75/10 | ✅ 通过 |
| **组件数量** | 12个 | ✅ 良好 |
| **测试覆盖率** | ~45% | 🟡 改进中 |
| **CDD 版本** | v1.6.1 | ✅ 最新 |
| **设计系统迁移** | ✅ 完成 | 已迁移到 `libs/design-system/` |
| **路径映射配置** | ✅ 完成 | `@design-system/*`, `@libs/*` |

## 🔗 相关链接

- **GitHub**: https://github.com/wsman/MY-DOGE-MACRO
- **CDD Framework**: [OpenClaw CDD Skill](../openclaw/skills/cdd/)
- **设计系统**: `apps/desktop/DESIGN_SYSTEM.md`
- **文档中心**: `memory_bank/t3_documentation/README.md`
- **API文档**: `memory_bank/t3_documentation/api/backend-api.md`
- **架构文档**: `memory_bank/t3_documentation/architecture/v1.6.0-modular-architecture.md`
- **项目种子文档**: `memory_bank/t0_core/project_readme.md` (CDD T0文档)

## 🤖 AI Agent 友好架构

新模块化结构为AI Agent提供清晰的模块边界和标准化接口，便于理解和开发。架构设计考虑了以下AI Agent友好特性：

- **清晰的模块边界**: 应用层、库层、基础设施层分离
- **标准化接口**: REST API、类型系统、设计令牌
- **渐进式迁移**: 兼容新旧架构，平滑过渡
- **文档完整性**: 完整的文档体系和版本控制

## 📝 许可证

Apache License 2.0

---

Built with ❤️ by Negentropy Lab