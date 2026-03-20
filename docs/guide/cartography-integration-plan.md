# Cartography 集成方案

## 目标

为 `opencode-codex-orch` 增加一套 cartography 能力，帮助 agent 更快建立并复用对仓库的紧凑心智模型。这个能力需要符合本 fork 现有的架构风格：显式 skill、slash command、插件 tool、后台 agent，以及轻量验证流程。

## 我们要集成的是什么

上游 slim 的 cartography 思路，本质上是一个混合工作流：

- 生成可追踪的仓库快照文件
- 生成目录级的 `codemap.md` 模板
- 让 explorer 风格的 agent 去补全或刷新这些 map

相关工具里值得借鉴的点：

- `opencode-codex-orch` cartography：使用 `.slim/cartography.json` 加层级化 `codemap.md`
- `JordanCoin/codemap`：提供 diff 视图、依赖流、handoff artifact，以及放在 `.codemap/` 下的项目本地配置

对于本仓库，最合适的是分阶段混合接入：

1. 先做内置 skill，支持显式调用
2. 再做内置 slash command，提供确定性的编排入口
3. 再补内部 tool 层，提供结构化 map 状态
4. 后续再考虑 CLI 辅助命令
5. hook 自动注入放到最后，只有在性能和输出大小都验证安全后再做

## 设计原则

- 第一版必须足够省 token，且输出尽量确定。
- 在新增依赖前，优先复用现有能力。
- 优先使用 Bun 和仓库内 TypeScript，不引入独立 Python 脚本。
- 生成物保存在项目本地，且容易忽略。
- 结构化地图生成和叙述型文档生成要分层。

## 推荐的产物模型

建议使用新的 `.codemap/` 目录，而不是 `.slim/`。这样更贴近当前 codemap 工具生态，也能让功能边界更清晰。

### Phase 1 产物

- `.codemap/state.json`：跟踪文件、目录 hash、配置版本、时间戳
- `.codemap/summary.md`：根级的紧凑仓库地图，给人和 agent 都能看
- `*/codemap.md`：只给少量高价值目录生成可选的目录级地图

### 后续产物

- `.codemap/handoff.latest.json`：面向多 agent 续作的紧凑 handoff artifact
- `.codemap/diff.json`：相对基线或 git ref 的变更文件与受影响目录
- `.codemap/deps.json`：开启 AST 分析时的依赖摘要

## 推荐的用户体验

### 显式 skill

新增一个内置 `cartography` skill，覆盖下面这类请求：

- “给这个仓库建图”
- “先做 codemap 再开始干活”
- “刷新仓库地图”
- “告诉我结构上变了什么”

这个 skill 应该指导 agent 去做这些事：

- 检查是否已经存在 `.codemap/state.json`
- 初始化或刷新仓库状态
- 只为相关目录生成或更新 `codemap.md`
- 使用 `explore` agent 生成目录摘要
- 把根级 map 作为主入口

当前仓库中的接入点：

- `src/features/builtin-skills/types.ts`
- `src/features/builtin-skills/skills/index.ts`
- `src/features/builtin-skills/skills.ts`

### Slash command

新增一个内置 `/codemap` 命令，作为确定性的编排入口。相比让用户手写长 prompt，它更符合当前命令模板体系。

建议的子模式：

- `/codemap init`
- `/codemap refresh`
- `/codemap diff [--ref=<branch>]`
- `/codemap handoff`

这个命令应该负责：

- 创建 todo
- 并行启动 `explore` agent 生成目录摘要
- 在需要理解外部框架结构时，按需调用 `librarian`
- 先汇总子目录结果，最后再写根级 `codemap.md`

当前仓库中的接入点：

- `src/features/builtin-commands/types.ts`
- `src/features/builtin-commands/commands.ts`
- `src/features/builtin-commands/templates/`

### Tool 层

建议单独增加一组 `codemap` tool，让 agent 能直接读取结构化数据，而不是反复解析 markdown。

第一批建议的 tool：

- `codemap_init`：扫描仓库，应用 include/exclude 规则，写入 `.codemap/state.json`
- `codemap_status`：报告 map 是否存在、更新时间、以及变更情况
- `codemap_read`：返回根级或目录级 map 的紧凑片段
- `codemap_refresh`：重新计算 hash，并列出受影响目录

这样可以避免把所有业务逻辑都塞进 skill 和 command。

当前仓库中的接入点：

- `src/tools/index.ts`
- `src/plugin/tool-registry.ts`
- 新增模块 `src/tools/codemap/`

### CLI

不要一开始就引入一个大型独立 codemap 二进制。等内部 tool 工作流稳定后，再增加窄而明确的 CLI 辅助命令。

后续可考虑的命令：

- `bunx opencode-codex-orch codemap init`
- `bunx opencode-codex-orch codemap refresh`
- `bunx opencode-codex-orch codemap diff`

当前入口文件：

- `src/cli/cli-program.ts`

## 分阶段实施方案

## Phase 0：方案和 schema 对齐

交付物：

- 确定产物目录和 schema 版本
- 确定适合本仓库风格的 include/exclude 默认规则
- 确定根级 map 和目录级 map 的最大输出预算

关键决策：

- 生成状态保存在 `.codemap/`
- 默认忽略测试、文档、构建产物、锁文件噪音和依赖目录
- 初始优先适配 TypeScript 仓库，但文件匹配逻辑保持语言无关

## Phase 1：MVP 仓库状态和根级摘要

范围：

- 用 TypeScript/Bun 实现状态扫描和 hash 计算
- 生成 `.codemap/state.json`
- 生成 `.codemap/summary.md`
- 增加内置 `cartography` skill
- 增加 `/codemap init` 和 `/codemap refresh`

实现要点：

- 优先复用插件里现有的文件系统能力，以及 git/Bash 能力
- 不做 daemon
- 先不做 AST 依赖图
- 先不做自动 hook 注入

成功标准：

- agent 能通过显式调用 skill 在一次工作流里生成根级 map
- 重复执行 refresh 时，只刷新变更目录
- 输出足够紧凑，可以在日常 session 中使用

## Phase 2：层级地图和 diff 感知

范围：

- 为选中的目录生成 `codemap.md`
- 基于文件 hash 变化找出受影响目录
- 增加 `/codemap diff [--ref=<branch>]`
- 增加 `codemap_read` 和 `codemap_status` tool

实现要点：

- 目录选择必须是启发式的，不能默认给每个目录都生成 map
- 优先考虑 `src/`、`packages/`、`docs/` 这类顶层域，但前提是它们确实包含有意义的代码或配置
- 目录摘要继续复用 `explore`，不要把一个巨大的总结器塞进 tool 里

成功标准：

- 只刷新变更目录，而不是重建全部地图
- 根级 map 能清楚引用子目录 map
- 在陌生仓库里，生成的地图确实能提高 agent 导航效率

## Phase 3：依赖流和 handoff artifact

范围：

- 增加可选的依赖摘要
- 增加 `.codemap/handoff.latest.json`
- 增加 `/codemap handoff`

实现要点：

- 优先复用仓库现有能力：LSP symbols、references，以及环境里已有的 `ast-grep`
- 依赖分析做成可选能力，受配置或 feature gate 控制
- handoff artifact 必须紧凑且稳定

成功标准：

- agent 在跨 session 或跨 agent 交接时，需要重复解释的仓库上下文明显变少
- 依赖摘要能识别关键 hub，而不是输出整张大图

## Phase 4：安全的自动化 hook

范围：

- 评估在 session start 时注入根级 codemap 摘要
- 评估在大规模文件修改后给出 refresh 建议

防护原则：

- 绝不自动注入完整目录级 map
- 强制限制字节数和行数
- 对超大仓库或生成失败的陈旧状态自动禁用

这一阶段应当放到真实使用证明“产物足够小且确实有用”之后。

## 内部接入点

### Skills

- `src/features/builtin-skills/types.ts`
- `src/features/builtin-skills/skills/index.ts`
- `src/features/builtin-skills/skills.ts`

在这里新增 `cartography` 内置 skill 对象，并保持 prompt 简洁、显式调用导向。

### Commands

- `src/features/builtin-commands/types.ts`
- `src/features/builtin-commands/commands.ts`
- `src/features/builtin-commands/templates/`

在这里新增 `/codemap` 内置命令，模式上可以参考当前仓库里的 `/refactor`、`/init-deep`、`/skill-creator`。

### Tooling

- `src/tools/index.ts`
- `src/plugin/tool-registry.ts`
- `src/plugin/skill-context.ts`

tool 层负责持久化状态和结构化读取，skill 与 command 负责围绕这些 tool 做编排。

### Config

后续可扩展的配置面：

- `codemap.enabled`
- `codemap.include`
- `codemap.exclude`
- `codemap.max_summary_bytes`
- `codemap.max_directory_maps`
- `codemap.dependency_analysis`

大概率需要修改的 schema 位置：

- `src/config/schema/opencode-codex-orch-config.ts`
- `src/config/schema/` 下的相关 schema 文件

### CLI 文档和用户文档

- `src/cli/cli-program.ts`
- `docs/reference/cli.md`
- `docs/reference/features.md`
- `docs/guide/`

## 依赖策略

### MVP 阶段要避免的东西

- 不引入上游那种 `cartographer.py` Python 依赖
- 不引入后台 daemon
- 不做远程仓库分析
- 除非现有仓库工具明确不够，否则不强制新增外部包

### 优先复用的能力

- Bun runtime 和当前 TypeScript 代码库
- `explore` 用于仓库内结构发现
- `librarian` 用于需要外部框架上下文的场景
- LSP tool 用于符号发现
- 当前仓库已经在 refactor 工作流中提到的 `ast-grep` 生态

### 后续可选接入

如果后续证明更丰富的依赖流确实有价值，可以评估下面几条路径：

1. 复用仓库现有对 `ast-grep` 的预期，在仓库内自己实现一个窄范围依赖摘要器
2. 借鉴 `JordanCoin/codemap` 的输出格式思路，但不引入它完整的 daemon 和 hook 模型
3. 支持导入外部工具预生成的 codemap artifact，而不是把全部分析都内建进来

## 风险与应对

### 输出膨胀

风险：地图太大，既不适合自动注入，也只对人类有用。

应对：

- 严格的字节预算
- 先做根级摘要
- 子地图只给选中的目录生成
- 能返回结构化 tool 输出时，就不要优先返回整段 markdown

### 仓库变化过快

风险：生成地图很快过时。

应对：

- 在 `.codemap/state.json` 中记录文件和目录 hash
- 提供具备 diff 感知的 refresh 流程
- 避免重建未变化地图

### 维护成本

风险：全语言依赖分析会带来较高维护负担。

应对：

- 在 MVP 价值没被证明前，先延后 AST 重功能
- 依赖分析做成可选、有限范围的能力

### Hook 噪音

风险：自动 session 注入反而降低 prompt 质量。

应对：

- MVP 阶段不做自动 hook 集成
- 先量化产物大小和实际使用价值

## 推荐的 MVP 任务拆分

1. 定义 `.codemap/state.json` 的 schema 和序列化辅助逻辑。
2. 实现基于 Bun 的仓库扫描器，并带上 include/exclude 默认规则。
3. 实现 `codemap_init` 和 `codemap_refresh` tool。
4. 增加内置 `cartography` skill 的 metadata 和 prompt。
5. 增加 `/codemap` 命令模板，先覆盖 init 和 refresh 工作流。
6. 基于 tool 输出生成 `.codemap/summary.md`。
7. 在 CLI 文档和 feature 文档里补充使用说明。
8. 为扫描器、状态 diff、命令注册、skill 注册增加聚焦测试。

## 验证计划

真正进入实现阶段后，建议至少验证这些层次：

- state hash 和目录选择的单元测试
- built-in skill 注册测试
- built-in command 注册测试
- tool 层输出紧凑性与 schema 稳定性测试
- `bun test`
- `bun run typecheck`
- `bun run build`

## 推荐的第一批交付切片

先交付一个小而有用的版本：

- 内置 `cartography` skill
- `/codemap init` 和 `/codemap refresh`
- `.codemap/state.json`
- `.codemap/summary.md`
- 不做 AST 图分析
- 不做 hook 自动注入
- 不做 daemon

这个切片最符合本 fork 的设计取向：小、明确、容易验证。
