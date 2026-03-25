# 编辑并发控制改造方案（CAS + 慢速退避）

## 目标

降低批量修改文件时偶发的“基于旧内容继续写入”问题，减少这类报错：

- `Failed to find expected lines in <file>`
- `oldString not found`
- `oldString found multiple times`

这份方案不追求“强行让旧 patch 也能成功”，而是追求两件事：

1. **旧快照绝不静默覆盖新内容**
2. **冲突时稳定失败，并给 agent 明确的重读/重试路径**

另外，本方案明确要求：**不要高频自旋**。冲突重试必须使用较慢、带抖动的退避策略，避免在批量编辑时放大竞争。

---

## 现状与问题

当前仓库里，最相关的路径有：

- `src/hooks/write-existing-file-guard/hook.ts`
- `src/hooks/write-existing-file-guard/file-snapshot.ts`
- `src/hooks/edit-error-recovery/hook.ts`
- `src/plugin/tool-registry.ts`
- `src/tools/hashline-edit/*`

### 已有能力

#### 1. 写前基线保护

`write-existing-file-guard` 会要求 agent 先读文件，再写/改已有文件，避免完全无基线覆盖。

#### 2. hashline_edit 的行级校验

`hashline_edit` 已经具备某种“行级 CAS”特征：

- 读文件时返回 `LINE#ID`
- 写入时带上旧锚点
- 如果该行内容已变化，则拒绝编辑

这比普通 `edit` 的纯文本片段匹配更稳。

### 当前薄弱点

#### 1. 快照判定过弱

`file-snapshot.ts` 目前主要依赖：

- `mtimeMs`
- `size`

这不等价于“内容版本”。在高频写入、同大小替换、时间粒度不足时，可能出现：

- 文件内容已经变了，但快照仍看起来“没变”
- 后续编辑拿着旧内容继续执行

#### 2. 同文件竞争仍可能发生

即使 guard 存在，多个工具调用如果围绕同一文件快速发生，仍可能出现：

- 两次修改基于同一个旧读结果生成
- 第一次成功后，第二次仍按旧内容去匹配
- 于是触发 `Failed to find expected lines`

#### 3. 失败恢复提示还不够聚焦

`edit-error-recovery` 当前主要覆盖的是旧版 `Edit` 工具的典型字符串错误，对“expected lines 未找到”这类问题还可以更明确地指向：

- 这是版本冲突，不一定是文件缺少内容
- 应立即重读
- 同文件不要并发重试

---

## 设计原则

1. **CAS 优先于时间戳判断**
2. **同文件串行优先于高频竞争**
3. **失败要可解释**，不能只说“没找到”
4. **重试要慢**，不能紧密自旋
5. **先覆盖普通 edit/write/patch 路径，再考虑默认启用更强的 hashline_edit**

---

## 推荐演进方向：多级并发控制，而不是单点补丁

如果只加一个“文件锁”，能解决一部分问题，但长期看还不够。更稳的方向是做成**类似 Java 同步体系的多级并发控制**：

- 低层做细粒度互斥
- 上层做范围控制与升级
- 最终提交点再用 CAS 校验版本

也就是说，不是只靠一种机制，而是把下面几层叠起来：

1. **乐观校验层**：文件级 CAS token
2. **细粒度互斥层**：同文件 mutation lease
3. **范围协调层**：目录级 / session 级 gate
4. **高优先级保护层**：极少数情况下的全局冻结开关

这样做的好处是：

- 常见场景只走低成本路径
- 真正有冲突时再逐步升级控制范围
- 不需要把所有修改都压成全局串行

---

## 核心方案

## 一、把当前弱快照升级为文件级 CAS Token

### 目标

让“我现在要写入的文件版本”与“我读到时的文件版本”做显式比较，而不是只比较元数据。

### 建议的 Token 结构

```ts
type FileVersionToken = {
  algorithm: "xxh3_64"
  contentHash: string
  size: number
  mtimeMs: number
}
```

其中真正作为 CAS 主判断依据的是：

- `contentHash`

而 `size` 与 `mtimeMs` 的角色调整为：

- **第一层快速预检**
- 发现明显变化时直接 fail fast
- 对大文件场景提供 metadata-only 降级路径

### 行为变化

#### Read 时

读取文件后，为该 session + path 记录：

- 当前 `contentHash`
- 快照时间

#### Write/Edit/Patch 前

先做第一层快速预检：

```ts
current.size === expected.size && current.mtimeMs === expected.mtimeMs
```

如果第一层已经失败，直接判定 stale。

如果第一层通过：

- 对 **<= 2MB** 的普通文本文件，再做第二层 `XXH3_64` 最终确认
- 对 **> 2MB** 的大文件，跳过 hash，降级为 metadata-only 保护

第二层 hash 校验条件是：

```ts
currentHash === expectedHash
```

时才允许继续。

否则直接拒绝，并返回明确的 stale/version mismatch 信息。

### 两档策略

#### 档 1：普通文件（<= 2MB）

- L1：`size + mtimeMs`
- L2：`XXH3_64(content)`

这是默认强保护路径。

#### 档 2：大文件（> 2MB）

- L1：`size + mtimeMs`
- 跳过 `XXH3_64`
- 提升串行化等级

这是显式的弱一致性降级路径，不应伪装成强 CAS。

### 为什么比现在更稳

因为普通文件最终比较的是“内容版本”，而不是只看文件系统元数据；同时大文件场景又避免了高成本全量 hash。

即使出现：

- 同大小替换
- 同一毫秒内多次写入
- 某些平台时间戳精度有限

只要内容变了，CAS 就会失败。

---

## 二、增加同文件级别的串行化保护

CAS 可以防止旧内容覆盖新内容，但不能降低冲突频率本身。

因此建议对**同一个 canonical path** 增加轻量串行化。

### 推荐模型

按文件路径建立一个内存级锁表：

```ts
Map<string, FileMutationLease>
```

同一时刻：

- 不同文件可以并行
- 同一文件只允许一个修改型工具进入临界区

涉及工具：

- `write`
- `edit`
- `multiedit`
- `patch`
- `apply_patch`
- 未来如有需要，也可覆盖 `hashline_edit`

### 为什么不是全局锁

全局锁会显著降低批量改很多文件时的吞吐量；
而**按文件串行**能只在真正有竞争的地方降速。

---

## 二点五、分层锁模型（建议收敛为两层主路径）

这里保留“像 Java sync 一样可升级”的思想，但实现上收敛为**两层主路径**，避免过度复杂化。

### Level 1：文件级互斥

对同一个 canonical path 加 mutation lease：

- 同文件写串行
- 不同文件继续并行

适合：

- 当前最主要的源码编辑场景
- 多 agent 同时改很多文件，但偶尔会碰到同一文件

这是**默认主路径**。

### Level 2：目录级 gate（按需升级）

当一个操作明确会影响某个目录下的多个文件时，可以对目录前缀加范围 gate，例如：

- `src/hooks/write-existing-file-guard/**`
- `src/tools/hashline-edit/**`

语义不是“完全独占整个目录”，而是：

- 该范围内的新写入要先排队/协调
- 范围外文件不受影响

适合：

- 批量重命名
- 结构性重构
- 目录内多文件联动修改

默认不启用 session 级或全局级额外锁，先把主路径限制在两层：

1. 文件级互斥
2. 目录级按需升级

---

## 二点六、等级提升与降级规则

分层控制的关键不是“层数多”，而是**什么时候升级，什么时候回落**。

### 推荐升级规则

#### 从 Level 1 升到 Level 2

当出现任一情况时升级：

- 一次操作明确涉及同目录多个文件
- 目录内连续发生冲突
- 文件超过 2MB 且该目录内存在联动修改
- 任务被识别为重构/rename/move 级别操作

### 推荐降级规则

不要一旦升级就长时间不放。建议：

- 文件 lease：写完成立即释放
- 目录 gate：该批目录级改动完成后释放

原则是：

> 只在真正需要的时候短暂升级，完成后立刻回落到更细粒度的控制。

---

## 二点七、等待策略：像 monitor 一样阻塞，别像 busy-spin 一样空转

如果你想要更像 Java `synchronized` / monitor 的体验，推荐语义是：

- **优先排队等待**
- **次选慢速退避**
- **不要忙等**

更具体地说：

### 首选：条件等待 / 队列唤醒

理想模型是：

1. 请求进入该文件或该范围的等待队列
2. 当前持有者释放后，唤醒下一个请求
3. 下一个请求再做最终 CAS 校验

这比自旋更像 Java monitor，也最省 CPU。

### 备选：慢速退避轮询

如果实现上暂时还做不到显式唤醒，再退而求其次：

- 80ms 起步
- 指数退避
- 带抖动
- 严格限制次数

但这只是替代方案，不应作为长期主路径。

---

## 三、退避策略：慢速、有限、自带抖动

用户要求“自旋不要那么快”，这里明确给出建议：

### 不要做的事

- 不要 `while(true)` 紧密轮询
- 不要 1ms / 5ms / 10ms 级别快速重试
- 不要在冲突时立即连续重放同一 patch

### 推荐退避参数

若必须等待同文件锁释放，建议：

```ts
initialDelayMs = 80
multiplier = 1.8
maxDelayMs = 600
jitter = ±25%
maxAttempts = 5
```

一个典型序列可能是：

- 第 1 次：约 80ms
- 第 2 次：约 140ms
- 第 3 次：约 250ms
- 第 4 次：约 450ms
- 第 5 次：约 600ms

总等待时间控制在大约 1.5s 内，够温和，也不会把 session 卡太久。

### 更推荐的策略

如果实现成本允许，**优先使用队列/lease，而不是自旋重试**：

1. 尝试获取该文件的 mutation lease
2. 获取不到则按上面的退避等待
3. 超过上限直接失败，提示重读/重试

这比“疯狂自旋直到拿到锁”为好。

---

## 四、让失败信息显式变成“版本冲突”

对于用户和 agent，下面这两种错误含义完全不同：

1. **内容真的不存在**
2. **内容存在过，但在你写入前已经变成别的版本**

现在很多报错会让人误以为是第 1 种。建议增加明确错误文案：

```text
File version changed since last read. Your edit was based on a stale snapshot.
Read the file again before retrying. Do not run concurrent edits on the same file.
```

并在 `edit-error-recovery` 里把以下模式纳入恢复提示：

- `Failed to find expected lines`
- `oldString not found`
- `oldString found multiple times`
- 未来新增的 `version mismatch` / `stale snapshot` 错误

---

## 四、两档文件策略与性能边界

### 为什么只保留两档

当前目标只有一个核心分界：

> 这个文件值不值得做内容 hash。

因此只保留两档即可：

- **<= 2MB**：强保护
- **> 2MB**：弱保护 + 更强串行化

三档会增加实现复杂度，但收益有限。

### 为什么不使用 `ino`

`ino` 更偏向文件对象身份，不是内容版本信号。

对当前并发编辑保护目标来说：

- 内容变更时 `ino` 常常不变
- 它不能替代 hash
- 相比 `size + mtimeMs`，额外收益有限

因此当前方案明确**不使用 `ino`**。

### 2MB 以上为什么允许跳过 hash

因为大文件场景里，CPU 平稳性优先于强 CAS。

但要明确：

- 这是降级路径
- 正确性弱于普通文件
- 必须用更强串行化补回来

---

## 五、与 hashline_edit 的关系

### 结论

**CAS 不是 hashline_edit 的替代品，两者应叠加。**

### 分层理解

#### 文件级 CAS

解决的是：

- “整个文件版本已经不是我刚读到的那个了”

#### 行级 hashline_edit

解决的是：

- “我想改的这一行/这一段是否还是我看到的那一版”

### 推荐落地顺序

1. 先给普通 `write/edit/patch` 路径加两档式文件级 CAS
2. 再逐步把更多修改场景导向 `hashline_edit`
3. 最终形成：

- 普通工具：文件级 CAS 兜底
- hashline_edit：文件级 CAS + 行级锚点校验

---

## 建议修改点

## Phase 1：最小可用改造

### 1. `src/hooks/write-existing-file-guard/file-snapshot.ts`

把当前快照结构升级为两档版本 token，例如：

- 新增 `contentHash`
- `snapshotsMatch()` 先比 `size + mtimeMs`
- `<= 2MB` 时再比 `contentHash`
- `> 2MB` 时明确走 metadata-only 降级

### 2. `src/hooks/write-existing-file-guard/hook.ts`

增加同文件 mutation lease / 轻量队列：

- before 阶段尝试获取文件级 lease
- after 阶段释放 lease
- 获取不到时走慢速退避
- 超限后返回明确冲突错误

### 3. `src/hooks/edit-error-recovery/hook.ts`

把“expected lines 未找到”纳入恢复模式，并追加更强提示：

- 立刻 read
- 不要继续用旧 patch
- 同文件避免并发编辑

## Phase 2：与 hashline_edit 融合

### 4. `src/plugin/tool-registry.ts`

评估是否在更成熟后默认打开 `hashline_edit`，或至少在特定 agent/模式下优先使用。

### 5. `src/tools/hashline-edit/*`

保留现有行级校验，同时允许上层把文件级 CAS token 一并带进来，形成双保险。

---

## 建议数据流

```text
Read(file)
  -> compute contentHash
  -> store session baseline

Write/Edit/Patch(file)
  -> acquire per-file lease
  -> compute current contentHash
  -> compare with stored baseline
     -> mismatch: fail fast with stale/version message
     -> match: proceed
  -> write
  -> compute new contentHash
  -> refresh session baseline
  -> release lease
```

---

## 失败与重试策略

### 允许自动重试的情况

- 只是 lease 被其他同文件写操作短暂占用

### 不建议自动重试的情况

- CAS mismatch
- hashline mismatch
- `Failed to find expected lines`

这些情况说明问题不是“再试一次也许就行”，而是**当前编辑输入已经过时**。此时应：

1. 重新读取当前文件
2. 基于新内容重新生成编辑
3. 再提交一次修改

---

## 成功标准

满足以下条件，说明方案有效：

1. 批量修改大量文件时，同文件冲突显著减少
2. 冲突发生时，错误能明确指向 stale/version mismatch
3. 不再依赖 `mtimeMs + size` 作为普通文件的唯一正确性来源
4. 不出现高频自旋导致的 CPU 空转或日志噪音
5. agent 在冲突后会更稳定地执行 `read -> regenerate -> retry`

---

## 风险与权衡

### 1. 额外哈希计算成本

文件级 CAS 需要读取并计算 hash，会有额外开销。

权衡上，这个成本通常值得，因为这里换来的是：

- 更少的错误覆盖
- 更少的无意义重试
- 更稳定的批量编辑行为

### 2. 同文件吞吐量会下降

同文件串行化会降低单文件高并发吞吐量，但这是有意为之：

- 我们要的是正确性优先
- 同文件高并发编辑本来就不稳定

### 3. 普通 edit 仍不如 hashline_edit 稳

即便加了文件级 CAS，普通 `edit` 依然没有 `LINE#ID` 那样的精细定位能力。

所以最佳方向仍然是：

- 短期：先用 CAS 修好底层并发问题
- 中期：更多路径切换到 hashline_edit

---

## 推荐结论

推荐采用下面这组组合，而不是单点修补：

1. **两档文件级 CAS：<= 2MB 用 `size + mtimeMs + XXH3_64`，> 2MB 用 `size + mtimeMs`**
2. **两层并发控制：文件级优先，目录级按需升级**
3. **同文件 mutation lease / 队列化**
4. **慢速退避，不做紧密自旋**
5. **把失败文案升级为显式 stale/version mismatch**
6. **继续保留并逐步推广 hashline_edit 的行级校验**

这套组合能同时改善：

- 偶发“expected lines not found”
- 批量修改时的同文件竞争
- 失败后 agent 的恢复路径不清晰

而且它与现有架构兼容，适合按 Phase 1 → Phase 2 逐步落地。
