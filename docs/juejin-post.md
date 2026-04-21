# 我做了个 AI 代码审查工具，想听听大家意见

## 背景

代码审查一直是团队质量的关键，但现实很骨感：

- 人工 review 耗时且不稳定（状态好认真看，状态差走马观花）
- 传统静态分析工具（SonarQube）规则僵化，无法理解业务逻辑
- GitHub Copilot 能帮你写代码，但不会帮你 review 代码

## 我做的这个东西

**DevNorm** — AI 原生的代码审查平台

开源地址：https://github.com/mlxlx01/devnorm

### 核心思路

不是做一个"更严格的 linter"，而是做一个**能理解代码意图的 reviewer**。

基于 dotclaude 项目多年积累的 code review 方法论，转化为可量化的审查标准：

```
- 置信度 gating（低于 8/10 的不报）
- 严重程度分级（Blocker / Major / Minor）
- 可操作的修复建议
```

### 技术方案

```
DevNorm CLI（本地） → MiniMax API（国产模型） → 结构化审查报告
```

支持：TypeScript、Python、Go、Rust，自动检测技术栈。

### 使用方式

```bash
# 安装
npm install -g devnorm

# 初始化
devnorm init

# 审查代码
devnorm review ./src
```

输出示例：

```
============================================================
📊 REVIEW RESULTS
============================================================

🚨 2 findings (Confidence >= 8):

  [Major] 可能存在的空指针访问
    File: src/services/user.ts:45
    Confidence: 9/10
    Problem: 当 user.profile 为 null 时（OAuth 用户首次登录）
    Fix: user.profile?.name ?? 'Anonymous'

  [Minor] 错误处理过于宽泛
    File: src/api/auth.ts:78
    Confidence: 8/10
    Problem: catch 捕获了所有异常，包括网络超时
    Fix: 添加错误类型判断

📝 Summary: 建议修复 1 个 Blocker 后合并
============================================================
```

## 商业模式

**开源层**：CLI 工具免费，MIT 协议
**商业层**：团队协作、GitHub App 自动 review、质量仪表盘（规划中）

## 问大家几个问题

1. **代码审查你最痛的是什么？** — 我最痛的是"低级 bug 反复出现，review 时候没注意到"
2. **你会为这类工具付费吗？** — 如果能做到"比人工 review 更准"，愿意花多少？
3. **有什么功能是你特别想要的？** — GitHub App 集成？Jira 联动？质量趋势图？

## 想参与的

GitHub 仓库已经开源，欢迎：
- ⭐ Star
- 🐛 提 Issue（功能建议 / Bug）
- 🤝 Pull Request

---

如果你也在做类似的事情，或者对这个方向有思考，欢迎评论区交流！
