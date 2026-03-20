#!/usr/bin/env bun
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createOpencode } from "@opencode-ai/sdk"
import { seedWorkspace } from "./opencode-model-bench-config"
import { getSDKMessageMetadata, injectServerAuthIntoClient, normalizeSDKResponse } from "../src/shared"

const MODELS = [
  "volcengine-ark-api/doubao-seed-2.0-pro",
  "opencode/mimo-v2-pro-free",
  "kimi-for-coding/k2p5",
  "baishan-cloud/GLM-5",
  "openai/gpt-5.4",
] as const

const MODEL_FILTER = process.env.BENCH_MODEL?.trim()
const CASE_FILTER = process.env.BENCH_CASE?.trim()

type BenchCase = {
  name: string
  agent: string
  prompt: string
  check: (text: string, metrics: CaseMetrics) => { ok: boolean; note: string }
}

type CaseMetrics = {
  totalMs: number
  firstTextMs: number | null
  firstToolMs: number | null
  toolCalls: number
  toolAvgMs: number | null
  text: string
}

const CASES: BenchCase[] = [
  {
    name: "generation",
    agent: "general",
    prompt: "Write a TypeScript function named sumPositive(numbers: number[]): number. Return the sum of positive numbers only. Output code only.",
    check: (text) => ({
      ok: /sumPositive/.test(text) && /return/.test(text),
      note: /sumPositive/.test(text) ? "contains target function" : "missing target function",
    }),
  },
  {
    name: "repo-summary",
    agent: "explore",
    prompt: "Use tools to read package.json and src/runner.ts in this workspace. Answer with exactly 3 bullet points mentioning version, runner, and workspace.",
    check: (text, metrics) => ({
      ok: text.split("\n").filter((line) => line.trim().startsWith("-")).length === 3
        && /version/i.test(text)
        && /runner/i.test(text)
        && /workspace/i.test(text)
        && metrics.toolCalls > 0,
      note: metrics.toolCalls > 0 ? "3 bullets with workspace terms" : "no tool use detected",
    }),
  },
  {
    name: "tool-json",
    agent: "explore",
    prompt: "Use tools in this workspace to read package.json and count TypeScript files under src whose filename contains 'hook'. Return only JSON like {\"version\":\"1.2.3\",\"hook_file_count\":2}.",
    check: (text, metrics) => {
      try {
        const normalized = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "").trim()
        const parsed = JSON.parse(normalized)
        return {
          ok: parsed.version === "9.9.9" && parsed.hook_file_count === 2 && metrics.toolCalls > 0,
          note: `version=${parsed.version} hook_file_count=${parsed.hook_file_count}`,
        }
      } catch {
        return { ok: false, note: "invalid JSON output" }
      }
    },
  },
]

type OpenCodeClient = Awaited<ReturnType<typeof createOpencode>>["client"]

type SessionMessage = {
  id?: string
  role?: string
  parts?: Array<{ type?: string; text?: string }>
  info?: { role?: string }
}

async function readAssistantText(client: OpenCodeClient, sessionId: string): Promise<string> {
  const messagesResponse = await client.session.messages({ path: { id: sessionId } })
  const messages = normalizeSDKResponse(messagesResponse, [] as SessionMessage[], {
    preferResponseOnMissingData: true,
  })
  if (!Array.isArray(messages)) {
    return ""
  }

  const assistantMessages = messages.filter((message) => getSDKMessageMetadata(message).role === "assistant")
  const lastAssistant = assistantMessages.at(-1)
  if (!lastAssistant) {
    return ""
  }

  if (Array.isArray(lastAssistant.parts)) {
    return lastAssistant.parts
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join("")
      .trim()
  }

  const messageId = getSDKMessageMetadata(lastAssistant).id
  if (!messageId) {
    return ""
  }

  const messageResponse = await client.session.message({ path: { id: sessionId, messageID: messageId } })
  const message = normalizeSDKResponse(messageResponse, null as SessionMessage | null, {
    preferResponseOnMissingData: true,
  })
  if (!message || !Array.isArray(message.parts)) {
    return ""
  }

  return message.parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim()
}

async function runCase(client: OpenCodeClient, directory: string, benchCase: BenchCase): Promise<CaseMetrics> {
  const created = await client.session.create({
    body: { title: `bench:${benchCase.name}`, permission: [{ permission: "question", action: "deny", pattern: "*" }] },
    query: { directory },
  })
  const session = normalizeSDKResponse(created, null as { id?: string } | null, { preferResponseOnMissingData: true })
  const sessionId = session?.id
  if (!sessionId) throw new Error(`Failed to create session for ${benchCase.name}: ${JSON.stringify(created)}`)
  const events = await client.event.subscribe({ query: { directory } })
  const start = Date.now()
  let text = ""
  let firstTextMs: number | null = null
  let firstToolMs: number | null = null
  let sawAssistantText = false
  let lastEventAt = Date.now()
  let activeTools = 0
  let toolCalls = 0
  const runningTools: number[] = []
  const toolDurations: number[] = []
  const collector = (async () => {
    for await (const event of events.stream as AsyncIterable<{ type?: string; properties?: Record<string, unknown> }>) {
      const props = event.properties ?? {}
      lastEventAt = Date.now()
      if (event.type === "message.part.delta" && props.field === "text" && typeof props.delta === "string") {
        text += props.delta
        firstTextMs ??= Date.now() - start
        sawAssistantText = true
      }
      if (event.type === "message.part.updated") {
        const part = props.part as Record<string, unknown> | undefined
        if (part?.type === "text" && typeof part.text === "string") {
          text = part.text
          firstTextMs ??= Date.now() - start
          sawAssistantText = true
        }
      }
      if (event.type === "tool.execute") {
        runningTools.push(Date.now())
        activeTools += 1
        toolCalls += 1
        firstToolMs ??= Date.now() - start
      }
      if (event.type === "tool.result") {
        const startedAt = runningTools.shift()
        if (startedAt) toolDurations.push(Date.now() - startedAt)
        activeTools = Math.max(0, activeTools - 1)
      }
    }
  })()
  await client.session.promptAsync({
    path: { id: sessionId },
    body: { agent: benchCase.agent, tools: { question: false }, parts: [{ type: "text", text: benchCase.prompt }] },
    query: { directory },
  })
  while (Date.now() - start < 45000) {
    await Bun.sleep(400)
    if (sawAssistantText && activeTools === 0 && Date.now() - lastEventAt > 4000) break
  }
  await events.stream.return?.(undefined)
  await collector.catch(() => undefined)
  const totalMs = Date.now() - start
  const toolAvgMs = toolDurations.length ? Math.round(toolDurations.reduce((sum, value) => sum + value, 0) / toolDurations.length) : null
  const finalText = await readAssistantText(client, sessionId)
  return { totalMs, firstTextMs, firstToolMs, toolCalls, toolAvgMs, text: finalText || text.trim() }
}

async function main(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "opencode-model-bench-"))
  const { client, server } = await createOpencode({ hostname: "127.0.0.1" })
  injectServerAuthIntoClient(client)
  try {
    for (const model of MODELS) {
      if (MODEL_FILTER && model !== MODEL_FILTER) {
        continue
      }
      const dir = join(root, model.replaceAll("/", "_"))
      await seedWorkspace(dir, model)
      console.log(`\n== ${model} ==`)
      for (const benchCase of CASES) {
        if (CASE_FILTER && benchCase.name !== CASE_FILTER) {
          continue
        }
        const metrics = await runCase(client, dir, benchCase)
        const verdict = benchCase.check(metrics.text, metrics)
        console.log(JSON.stringify({
          model,
          case: benchCase.name,
          pass: verdict.ok,
          note: verdict.note,
          total_ms: metrics.totalMs,
          first_text_ms: metrics.firstTextMs,
          first_tool_ms: metrics.firstToolMs,
          tool_calls: metrics.toolCalls,
          tool_avg_ms: metrics.toolAvgMs,
          output_preview: metrics.text.slice(0, 160),
        }))
      }
    }
  } finally {
    server.close()
    await rm(root, { recursive: true, force: true })
  }
}

await main()
