# opencode-codex-orch

> [OpenCode](https://opencode.ai) 的多智能体编排插件。多模型、多智能体、一支协调有序的 AI 开发团队。

## 它能做什么

opencode-codex-orch 将单个 AI Agent 会话变成一支协调运作的开发团队。Sisyphus 负责编排调度，专业智能体分别负责调研、规划、代码搜索和执行，跨多个模型提供商并行工作。

**核心能力：**

- **多智能体编排**：10 个专业智能体（Sisyphus、Atlas、Oracle、Prometheus、Librarian、Explore、Metis、Momus、Multimodal-Looker、Sisyphus-Junior）
- **多模型路由**：自动调度 Claude、GPT、Kimi、Gemini、GLM 等模型
- **`ultrawork` / `ulw`**：自主执行模式，一键触发
- **基于哈希的编辑**：`LINE#ID` 内容哈希验证，确保文件修改可靠
- **后台智能体**：5+ 个任务并行执行
- **内置 MCP**：Web 搜索、Context7、Grep.app
- **LSP + AST-Grep**：IDE 级别的代码操作精度
- **技能系统**：每个技能自带独立的 MCP 服务器
- **13 个生命周期 Hook**：错误恢复、模型回退、上下文注入等

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
ulw fix the failing tests
```

`ulw` 触发自主执行模式。智能体自动探索代码库、制定计划、实施方案、验证结果。

## 文档

- [概述](docs/guide/overview.md)
- [安装指南](docs/guide/installation.md)
- [编排指南](docs/guide/orchestration.md)
- [智能体与模型匹配](docs/guide/agent-model-matching.md)
- [配置参考](docs/reference/configuration.md)
- [功能参考](docs/reference/features.md)

## 致谢

Prompt 设计参考了 [OpenAI Codex CLI](https://github.com/openai/codex) 的 `prompt.md`。基于哈希的编辑工具灵感来自 [oh-my-pi](https://github.com/can1357/oh-my-pi)。

## 许可证

[SUL-1.0](LICENSE.md)
