# opencode-codex-orch

> [OpenCode](https://opencode.ai) 的多智能体编排插件。多模型、多智能体、一支协调有序的 AI 开发团队。

## 项目来源

本项目源自 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)（omo）及其精简变体 oh-my-opencode-slim（omo-slim）。**专为 OpenAI Codex 优化**：已移除所有 Anthropic/Claude 相关的逻辑、提示词和模型路由，只保留精简的 GPT/Codex 编排核心。

在精简版的基础上，本 fork 新增了若干实用技能和 fork 专属工作流（详见下方[内置技能](#内置技能)和 [Fork 专属技能](#fork-专属技能)）。

## 它能做什么

opencode-codex-orch 将单个 AI Agent 会话变成一支协调运作的开发团队。Orchestrator 负责编排调度，专业智能体分别负责调研、审查、代码搜索和执行，跨多个模型提供商并行工作。

**核心能力：**

- **多智能体编排**：使用精简后的智能体表面（Orchestrator、Executor、Reviewer、Oracle、Librarian、Explore、DeepSearch）
- **多模型路由**：自动调度 GPT、Kimi、Gemini、GLM 等模型 — **无 Claude/Anthropic 依赖**
- **基于哈希的编辑**：`LINE#ID` 内容哈希验证，确保文件修改可靠
- **后台智能体**：5+ 个任务并行执行
- **内置 MCP**：Web 搜索、Context7、Grep.app
- **LSP + AST-Grep**：IDE 级别的代码操作精度
- **技能系统**：每个技能自带独立的 MCP 服务器
- **13 个生命周期 Hook**：错误恢复、模型回退、上下文注入等

### 审查与顾问角色

- **Reviewer** —— 默认质量闸门，负责 plans、已完成实现/代码、多轮或最终回答，以及 research reports 的完整性/一致性检查
- **Oracle** —— 仅在升级场景中介入，负责架构权衡、复杂调试，以及安全/性能/数据完整性风险分析

### 内置技能

插件自带以下内置技能：

- **playwright** / **agent-browser** — 浏览器自动化、页面检查、截图与 Web 测试（依赖提供商支持）
- **dev-browser** — 持久化浏览器工作流，用于导航、数据提取和应用测试
- **frontend-ui-ux** — 全面的 UI/UX 设计技能，用于高质量前端工作，包括品牌化着陆页和消费级 UI *（GPT 优化版 prompt）*
- **git-commit / git-rebase / git-search** — Git 工作流技能，涵盖原子化提交、历史重写和代码考古 *（GPT 优化；从原 git-master 拆分，每次调用节省约 85% token）*
- **skill-creator** — 本插件唯一的技能编写工作流入口，整合方法论、作用域选择和技能验证工具链

### Fork 专属技能

以下技能是本 fork 特别新增的：

- **github-triage** — 统一的 GitHub Issue 和 PR 分类处理，支持后台任务并行和 fork 感知审查
- **merge-upstream** — 指导上游合并的工作流，确保保留 fork 身份、精简架构和 Codex 优先的设计决策

## 安装

在 OpenCode 配置文件中添加（`~/.config/opencode/opencode.json`）：

```json
{
  "plugin": ["opencode-codex-orch@latest"]
}
```

本地开发：

```json
{
  "plugin": ["file:///absolute/path/to/opencode-codex-orch/dist/index.js"]
}
```

交互式安装：

```bash
bunx opencode-codex-orch install
```

### 配置文件

- 项目级：`.opencode/opencode-codex-orch.json`
- 用户级：`~/.config/opencode/opencode-codex-orch.json`

## 使用

```bash
opencode
# 然后输入：
fix the failing tests
```

Orchestrator 会自动探索代码库、制定计划、实施方案并验证结果。

## 文档

- [仓库指南](./AGENTS.md)
- [贡献与本地开发](./CONTRIBUTING.md)
- [智能体清单与路由说明](src/agents/AGENTS.md)
- [配置 Schema 指南](src/config/AGENTS.md)
- [功能模块指南](src/features/AGENTS.md)
- [插件装配指南](src/plugin/AGENTS.md)

## 致谢

源自 [oh-my-openagent](https://github.com/code-yeongyu/oh-my-openagent)（omo）及 oh-my-opencode-slim（omo-slim）。Prompt 设计参考了 [OpenAI Codex CLI](https://github.com/openai/codex) 的 `prompt.md`。基于哈希的编辑工具灵感来自 [oh-my-pi](https://github.com/can1357/oh-my-pi)。

## 许可证

[SUL-1.0](LICENSE.md)
