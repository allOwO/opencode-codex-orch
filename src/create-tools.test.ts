import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import * as categories from "./plugin/available-categories"
import * as skillContextModule from "./plugin/skill-context"
import * as toolRegistry from "./plugin/tool-registry"

describe("createTools", () => {
  afterEach(() => {
    ;(categories.createAvailableCategories as ReturnType<typeof mock.restore> | undefined)?.mockRestore?.()
    ;(skillContextModule.createSkillContext as ReturnType<typeof mock.restore> | undefined)?.mockRestore?.()
    ;(toolRegistry.createToolRegistry as ReturnType<typeof mock.restore> | undefined)?.mockRestore?.()
  })

  it("does not call client.config.get during tool creation", async () => {
    const configGet = mock(async () => ({ data: { skills: { paths: ["/tmp/skills"] } } }))

    spyOn(categories, "createAvailableCategories").mockReturnValue([])
    spyOn(skillContextModule, "createSkillContext").mockResolvedValue({
      mergedSkills: [],
      availableSkills: [],
      browserProvider: "playwright",
      disabledSkills: new Set(),
    })
    spyOn(toolRegistry, "createToolRegistry").mockReturnValue({
      filteredTools: {},
      taskSystemEnabled: false,
    })

    const { createTools } = await import("./create-tools")
    await createTools({
      ctx: {
        directory: process.cwd(),
        client: {
          config: {
            get: configGet,
          },
        },
      } as never,
      pluginConfig: {},
      managers: {
        backgroundManager: {} as never,
        tmuxSessionManager: {} as never,
        skillMcpManager: {} as never,
      },
    })

    expect(configGet).not.toHaveBeenCalled()
  })
})
