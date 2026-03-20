import type { ToolContext } from "@opencode-ai/plugin/tool"
import { beforeEach, describe, expect, it, mock } from "bun:test"

import type { ServerLookupResult } from "./types"

const aggregateDiagnosticsForDirectoryMock = mock(async () => "directory diagnostics")
const withLspClientMock = mock(async () => ({ items: [] }))
const isDirectoryPathMock = mock(() => false)
const findServerForExtensionMock = mock((extension: string): ServerLookupResult => ({
  status: "found" as const,
  server: {
    id: "test-server",
    command: ["test-server"],
    extensions: [extension],
    priority: 1,
  },
}))

mock.module("./directory-diagnostics", () => ({
  aggregateDiagnosticsForDirectory: aggregateDiagnosticsForDirectoryMock,
}))

mock.module("./lsp-client-wrapper", () => ({
  isDirectoryPath: isDirectoryPathMock,
  withLspClient: withLspClientMock,
}))

mock.module("./config", () => ({
  findServerForExtension: findServerForExtensionMock,
}))

import { lsp_diagnostics } from "./diagnostics-tool"

const TEST_CONTEXT: ToolContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
}

describe("lsp_diagnostics", () => {
  beforeEach(() => {
    aggregateDiagnosticsForDirectoryMock.mockReset()
    aggregateDiagnosticsForDirectoryMock.mockImplementation(async () => "directory diagnostics")
    withLspClientMock.mockReset()
    withLspClientMock.mockImplementation(async () => ({ items: [] }))
    isDirectoryPathMock.mockReset()
    isDirectoryPathMock.mockImplementation(() => false)
    findServerForExtensionMock.mockReset()
    findServerForExtensionMock.mockImplementation((extension: string): ServerLookupResult => ({
      status: "found" as const,
      server: {
        id: "test-server",
        command: ["test-server"],
        extensions: [extension],
        priority: 1,
      },
    }))
  })

  it("returns a skip message for unsupported file extensions", async () => {
    findServerForExtensionMock.mockReturnValue({
      status: "not_configured",
      extension: ".md",
      availableServers: ["typescript"],
    })

    const result = await lsp_diagnostics.execute({ filePath: "README.md" }, TEST_CONTEXT)

    expect(result).toBe("No diagnostics found: no LSP server configured for extension .md")
    expect(withLspClientMock).not.toHaveBeenCalled()
  })

  it("returns a skip message for unsupported directory extension scans", async () => {
    isDirectoryPathMock.mockReturnValue(true)
    findServerForExtensionMock.mockReturnValue({
      status: "not_configured",
      extension: ".md",
      availableServers: ["typescript"],
    })

    const result = await lsp_diagnostics.execute({ filePath: "docs", extension: ".md" }, TEST_CONTEXT)

    expect(result).toBe("No diagnostics found: no LSP server configured for extension .md")
    expect(aggregateDiagnosticsForDirectoryMock).not.toHaveBeenCalled()
  })
})
