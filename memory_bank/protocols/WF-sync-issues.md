# WF-SYNC-ISSUES: GitHub Issues 同步协议

**版本**: v1.5.0  
**协议类型**: T2-工作流协议  
**触发**: State B (Tasking结束) 或 State C (执行中)

---

## 1. 目标

将 DS-052 原子任务清单中的 Markdown 任务自动转换为 GitHub Issues，并保持双向链接。

## 2. 前置检查

1. **Git Remote**: 必须配置了指向 GitHub 的 remote.origin.url
2. **MCP Server**: GitHub MCP Server 必须活跃
3. **DS-052**: 必须存在 `memory_bank/standards/DS-052_atomic_tasks.md`

## 3. 执行流程

### Step 1: 解析任务
扫描 DS-052 中未标记 Issue ID 的任务：
- `- [ ] {Task}` → ✅ 新任务，需要同步
- `- [ ] {Task} [#123]` → ⏭️ 已同步，跳过
- `- [x] {Task}` → ⏭️ 已完成，跳过

### Step 2: 创建 Issue
调用 GitHub API 创建 Issue：
```markdown
**Title**: `[Task] {Task Description}`
**Body**: 包含来源、上下文、相关规范
**Labels**: `cdd-task`, `feature-{feature-id}`
```

### Step 3: 回写链接
更新 DS-052，添加 Issue 链接：
```
- [ ] 实现用户登录接口 → - [ ] 实现用户登录接口 [#101]
```

## 4. 异常处理

| 场景 | 处理方式 |
|------|----------|
| Remote Mismatch | 终止并警告 |
| API Rate Limit | 暂停并提示 |
| MCP 不可用 | 跳过同步，记录警告 |
| Issue 创建失败 | 记录错误，继续下一任务 |

---

**版本**: v1.5.0
