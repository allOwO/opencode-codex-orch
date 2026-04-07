/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test"
import { buildTaskManagementSection } from "./default"

describe("buildTaskManagementSection", () => {
  it("includes task_id in task_update examples when task system is enabled", () => {
    const result = buildTaskManagementSection(true)

    expect(result).toContain('task_update(task_id="...", status="in_progress")')
    expect(result).toContain('task_update(task_id="...", status="completed")')
    expect(result).not.toContain('task_update(status="in_progress")')
    expect(result).not.toContain('task_update(status="completed")')
  })
})
