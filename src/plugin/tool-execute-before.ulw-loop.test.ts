import { describe, expect, test } from "bun:test"
import { mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { createToolExecuteAfterHandler } from "./tool-execute-after"
import { createToolExecuteBeforeHandler } from "./tool-execute-before"
import { ULTRAWORK_VERIFICATION_PROMISE } from "../hooks/ralph-loop/constants"
import { clearState, readState, writeState } from "../hooks/ralph-loop/storage"

describe("tool.execute.before ultrawork oracle verification", () => {
	function createCtx(directory: string) {
		return {
			directory,
			client: {
				session: {
					messages: async () => ({ data: [] }),
				},
			},
		}
	}

	test("#given retired ulw state exists #when oracle task runs #then retired verification prompt is not injected", async () => {
		const directory = join(tmpdir(), `tool-before-ulw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: ULTRAWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			ultrawork: true,
			verification_pending: true,
		})

		const handler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const output = {
			args: {
				subagent_type: "oracle",
				run_in_background: true,
				prompt: "Check it",
			} as Record<string, unknown>,
		}

		await handler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, output)

		expect(readState(directory)?.verification_attempt_id).toBeUndefined()
		expect(output.args.run_in_background).toBe(true)
		expect(output.args.prompt).toBe("Check it")

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given ulw loop is not awaiting verification #when oracle task runs #then prompt is unchanged", async () => {
		const directory = join(tmpdir(), `tool-before-ulw-${Date.now()}-plain`)
		mkdirSync(directory, { recursive: true })
		const handler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const output = {
			args: {
				subagent_type: "oracle",
				run_in_background: true,
				prompt: "Check it",
			} as Record<string, unknown>,
		}

		await handler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, output)

		expect(output.args.run_in_background).toBe(true)
		expect(output.args.prompt).toBe("Check it")

		rmSync(directory, { recursive: true, force: true })
	})

	test("#given retired ulw verification state #when oracle task finishes #then verification session id is not stored", async () => {
		const directory = join(tmpdir(), `tool-after-ulw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: ULTRAWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			ultrawork: true,
			verification_pending: true,
		})

		const beforeHandler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const beforeOutput = {
			args: {
				subagent_type: "oracle",
				run_in_background: true,
				prompt: "Check it",
			} as Record<string, unknown>,
		}
		await beforeHandler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, beforeOutput)

		const handler = createToolExecuteAfterHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteAfterHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteAfterHandler>[0]["hooks"],
		})

		await handler(
			{ tool: "task", sessionID: "ses-main", callID: "call-1" },
			{
				title: "oracle task",
				output: "done",
				metadata: {
					agent: "oracle",
					prompt: String(beforeOutput.args.prompt),
					sessionId: "ses-oracle",
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBeUndefined()

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given retired ulw verification state #when repeated oracle tasks finish #then no verification session is recorded", async () => {
		const directory = join(tmpdir(), `tool-race-ulw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		writeState(directory, {
			active: true,
			iteration: 3,
			completion_promise: ULTRAWORK_VERIFICATION_PROMISE,
			initial_completion_promise: "DONE",
			started_at: new Date().toISOString(),
			prompt: "Ship feature",
			session_id: "ses-main",
			ultrawork: true,
			verification_pending: true,
		})

		const beforeHandler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})
		const afterHandler = createToolExecuteAfterHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteAfterHandler>[0]["ctx"],
			hooks: {} as Parameters<typeof createToolExecuteAfterHandler>[0]["hooks"],
		})

		const firstOutput = {
			args: {
				subagent_type: "oracle",
				run_in_background: true,
				prompt: "Check it",
			} as Record<string, unknown>,
		}
		await beforeHandler({ tool: "task", sessionID: "ses-main", callID: "call-1" }, firstOutput)
		const firstAttemptId = readState(directory)?.verification_attempt_id

		const secondOutput = {
			args: {
				subagent_type: "oracle",
				run_in_background: true,
				prompt: "Check it again",
			} as Record<string, unknown>,
		}
		await beforeHandler({ tool: "task", sessionID: "ses-main", callID: "call-2" }, secondOutput)
		const secondAttemptId = readState(directory)?.verification_attempt_id

		expect(firstAttemptId).toBeUndefined()
		expect(secondAttemptId).toBeUndefined()

		await afterHandler(
			{ tool: "task", sessionID: "ses-main", callID: "call-1" },
			{
				title: "oracle task",
				output: "done",
				metadata: {
					agent: "oracle",
					prompt: String(firstOutput.args.prompt),
					sessionId: "ses-oracle-old",
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBeUndefined()

		await afterHandler(
			{ tool: "task", sessionID: "ses-main", callID: "call-2" },
			{
				title: "oracle task",
				output: "done",
				metadata: {
					agent: "oracle",
					prompt: String(secondOutput.args.prompt),
					sessionId: "ses-oracle-new",
				},
			},
		)

		expect(readState(directory)?.verification_session_id).toBeUndefined()

		clearState(directory)
		rmSync(directory, { recursive: true, force: true })
	})

	test("#given retired ulw-loop command #when skill tool runs #then ralph loop is not started", async () => {
		const directory = join(tmpdir(), `tool-before-retired-ulw-${Date.now()}`)
		mkdirSync(directory, { recursive: true })
		const startLoopCalls: Array<Record<string, unknown>> = []

		const handler = createToolExecuteBeforeHandler({
			ctx: createCtx(directory) as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["ctx"],
			hooks: {
				ralphLoop: {
					startLoop: (sessionId: string, prompt: string, options?: Record<string, unknown>) => {
						startLoopCalls.push({ sessionId, prompt, options })
					},
					cancelLoop: () => {},
				},
			} as unknown as Parameters<typeof createToolExecuteBeforeHandler>[0]["hooks"],
		})

		await handler(
			{ tool: "skill", sessionID: "ses-main", callID: "call-ulw" },
			{ args: { name: "ulw-loop" } },
		)

		expect(startLoopCalls).toHaveLength(0)

		rmSync(directory, { recursive: true, force: true })
	})
})
