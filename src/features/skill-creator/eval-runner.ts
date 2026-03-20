import { mkdtemp, mkdir, cp, rm } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"

import type { SessionMessage } from "../../tools/session-manager/types"
import { readSessionMessages, resetStorageClient, setStorageClient } from "../../tools/session-manager/storage"
import { run } from "../../cli/run"
import { createServerConnection } from "../../cli/run/server-connection"
import type { RunResult, RunOptions } from "../../cli/run/types"
import type { SkillEvalCase, SkillEvalCaseRun, SkillEvalRunReport, SkillEvalSuite } from "./types"

function buildEvalPrompt(skillName: string, evalCase: SkillEvalCase): string {
  const fileLines = evalCase.files?.length
    ? `Files available in the current workspace:\n${evalCase.files.map((file) => `- ${file}`).join("\n")}`
    : "No extra fixture files were provided for this eval case."

  return [
    `Evaluate the local skill \`${skillName}\`.`,
    `First call \`skill(name="${skillName}")\` to load the skill instructions.`,
    "Follow the loaded guidance while solving the task.",
    fileLines,
    "Task:",
    evalCase.prompt,
    "Finish with a concise RESULT section.",
  ].join("\n\n")
}

async function captureRunResult(options: RunOptions): Promise<{ exitCode: number; result: RunResult }> {
  const originalWrite = process.stdout.write.bind(process.stdout)
  let output = ""

  process.stdout.write = ((chunk: Uint8Array | string, ...rest: unknown[]) => {
    output += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf-8")
    const callback = rest.find((item): item is (error?: Error | null) => void => typeof item === "function")
    callback?.(null)
    return true
  }) as NodeJS.WriteStream["write"]

  try {
    const exitCode = await run({ ...options, json: true, timestamp: false })
    const jsonLine = output.trim().split(/\n/).filter(Boolean).at(-1)
    if (!jsonLine) {
      throw new Error("Run command did not emit JSON output.")
    }

    return {
      exitCode,
      result: JSON.parse(jsonLine) as RunResult,
    }
  } finally {
    process.stdout.write = originalWrite
  }
}

async function withStorageMessages(sessionId: string): Promise<SessionMessage[]> {
  const abortController = new AbortController()
  const { client, cleanup } = await createServerConnection({ signal: abortController.signal })
  setStorageClient(client)
  try {
    return await readSessionMessages(sessionId)
  } finally {
    resetStorageClient()
    abortController.abort()
    cleanup()
  }
}

function flattenAssistantText(messages: SessionMessage[]): string {
  return messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) => message.parts)
    .map((part) => part.text ?? part.output ?? "")
    .filter(Boolean)
    .join("\n")
}

function flattenTranscript(messages: SessionMessage[]): string {
  return messages
    .flatMap((message) => message.parts)
    .map((part) => [part.text, part.thinking, part.tool, part.output, part.error].filter(Boolean).join(" "))
    .filter(Boolean)
    .join("\n")
}

function collectToolNames(messages: SessionMessage[]): string[] {
  return [...new Set(
    messages
      .flatMap((message) => message.parts)
      .map((part) => part.tool)
      .filter((tool): tool is string => typeof tool === "string" && tool.length > 0),
  )]
}

function detectSkillInvocation(messages: SessionMessage[], skillName: string): boolean {
  return messages.some((message) =>
    message.parts.some((part) => {
      if ((part.tool ?? "").toLowerCase() !== "skill") {
        return false
      }
      return typeof part.input?.name === "string" && part.input.name.toLowerCase() === skillName.toLowerCase()
    }),
  )
}

async function createEvalWorkspace(skillDir: string, skillName: string, evalBaseDir: string, files: string[]): Promise<{ workspaceDir: string; cleanup: () => Promise<void> }> {
  const workspaceDir = await mkdtemp(join(tmpdir(), "oco-skill-eval-"))
  const skillTargetDir = join(workspaceDir, ".opencode", "skills", skillName)
  await mkdir(dirname(skillTargetDir), { recursive: true })
  await cp(skillDir, skillTargetDir, { recursive: true })

  for (const file of files) {
    const sourcePath = resolve(evalBaseDir, file)
    const targetPath = join(workspaceDir, file)
    await mkdir(dirname(targetPath), { recursive: true })
    await cp(sourcePath, targetPath, { recursive: true })
  }

  return {
    workspaceDir,
    cleanup: async () => {
      await rm(workspaceDir, { recursive: true, force: true })
    },
  }
}

export async function runSkillEvalSuite(options: {
  skillDir: string
  skillName: string
  evalFilePath: string
  suite: SkillEvalSuite
  agent: string
  keepWorkspace?: boolean
  timeoutMs?: number
}): Promise<SkillEvalRunReport> {
  const evalBaseDir = dirname(options.evalFilePath)
  const cases: SkillEvalCaseRun[] = []

  for (const evalCase of options.suite.evals) {
    const { workspaceDir, cleanup } = await createEvalWorkspace(
      options.skillDir,
      options.skillName,
      evalBaseDir,
      evalCase.files ?? [],
    )

    try {
      const prompt = buildEvalPrompt(options.skillName, evalCase)
      const { exitCode, result } = await captureRunResult({
        message: prompt,
        agent: options.agent,
        directory: workspaceDir,
        timeoutMs: options.timeoutMs,
      })
      const messages = await withStorageMessages(result.sessionId)

      cases.push({
        case_id: evalCase.id,
        prompt: evalCase.prompt,
        files: evalCase.files ?? [],
        expectations: evalCase.expectations,
        session_id: result.sessionId,
        exit_code: exitCode,
        success: result.success,
        duration_ms: result.durationMs,
        message_count: result.messageCount,
        summary: result.summary,
        assistant_text: flattenAssistantText(messages),
        transcript_text: flattenTranscript(messages),
        tool_names: collectToolNames(messages),
        skill_invoked: detectSkillInvocation(messages, options.skillName),
        workspace_dir: options.keepWorkspace ? workspaceDir : undefined,
      })
    } finally {
      if (!options.keepWorkspace) {
        await cleanup()
      }
    }
  }

  return {
    generated_at: new Date().toISOString(),
    skill_name: options.skillName,
    skill_path: options.skillDir,
    eval_file_path: options.evalFilePath,
    agent: options.agent,
    timeout_ms: options.timeoutMs,
    cases,
  }
}
