/// <reference types="bun-types" />

import { describe, it, expect } from "bun:test"
import type { OpenCodeCodexOrchConfig } from "../../config"
import { resolveRunAgent, waitForEventProcessorShutdown } from "./runner"

const createConfig = (overrides: Partial<OpenCodeCodexOrchConfig> = {}): OpenCodeCodexOrchConfig => ({
  ...overrides,
})

describe("resolveRunAgent", () => {
  it("uses CLI agent over env and config", () => {
    // given
    const config = createConfig({ default_run_agent: "Reviewer" })
    const env = { OPENCODE_DEFAULT_AGENT: "Executor" }

    // when
    const agent = resolveRunAgent(
      { message: "test", agent: "Orchestrator" },
      config,
      env
    )

    // then
    expect(agent).toBe("Orchestrator")
  })

  it("uses env agent over config", () => {
    // given
    const config = createConfig({ default_run_agent: "Reviewer" })
    const env = { OPENCODE_DEFAULT_AGENT: "Executor" }

    // when
    const agent = resolveRunAgent({ message: "test" }, config, env)

    // then
    expect(agent).toBe("Executor")
  })

  it("uses config agent over default", () => {
    // given
    const config = createConfig({ default_run_agent: "Reviewer" })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Reviewer")
  })

  it("falls back to orchestrator when none set", () => {
    // given
    const config = createConfig()

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Orchestrator")
  })

  it("skips disabled orchestrator for next available core agent", () => {
    // given
    const config = createConfig({ disabled_agents: ["orchestrator"] })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Reviewer")
  })

  it("maps display-name style default_run_agent values to canonical display names", () => {
    // given
    const config = createConfig({ default_run_agent: "Orchestrator" })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Orchestrator")
  })
})

describe("waitForEventProcessorShutdown", () => {

  it("returns quickly when event processor completes", async () => {
    //#given
    const eventProcessor = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 25)
    })
    const start = performance.now()

    //#when
    await waitForEventProcessorShutdown(eventProcessor, 200)

    //#then
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
  })

  it("times out and continues when event processor does not complete", async () => {
    //#given
    const eventProcessor = new Promise<void>(() => { })
    const timeoutMs = 200
    const start = performance.now()

    //#when
    await waitForEventProcessorShutdown(eventProcessor, timeoutMs)

    //#then
    const elapsed = performance.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(timeoutMs - 10)
  })
})
