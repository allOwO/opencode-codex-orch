import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import { getSDKMessageMetadata, isSqliteBackend, normalizeSDKResponse } from "../../../shared"
import { isRecord } from "../../../shared/record-type-guard"
import type { StoredMessageMeta } from "../types"
import { getMessageDir } from "./message-dir"

type OpencodeClient = PluginInput["client"]

function normalizeSDKMessage(
  sessionID: string,
  value: unknown
): StoredMessageMeta | null {
  const metadata = getSDKMessageMetadata(value)
  if (!metadata.id) return null

  const roleValue = metadata.role
  const role: StoredMessageMeta["role"] = roleValue === "assistant" ? "assistant" : "user"

  const timeValue = metadata.time
  const created =
    isRecord(timeValue) && typeof timeValue.created === "number"
      ? timeValue.created
      : 0

  return {
    id: metadata.id,
    sessionID,
    role,
    time: { created },
  }
}

export function readMessages(sessionID: string): StoredMessageMeta[] {
  if (isSqliteBackend()) return []

  const messageDir = getMessageDir(sessionID)
  if (!messageDir || !existsSync(messageDir)) return []

  const messages: StoredMessageMeta[] = []
  for (const file of readdirSync(messageDir)) {
    if (!file.endsWith(".json")) continue
    try {
      const content = readFileSync(join(messageDir, file), "utf-8")
      messages.push(JSON.parse(content))
    } catch (error) {
      void error
    }
  }

  return messages.sort((a, b) => {
    const aTime = a.time?.created ?? 0
    const bTime = b.time?.created ?? 0
    if (aTime !== bTime) return aTime - bTime
    return a.id.localeCompare(b.id)
  })
}

export async function readMessagesFromSDK(
  client: OpencodeClient,
  sessionID: string
): Promise<StoredMessageMeta[]> {
  try {
    const response = await client.session.messages({ path: { id: sessionID } })
    const data = normalizeSDKResponse(response, [] as unknown[], {
      preferResponseOnMissingData: true,
    })
    if (!Array.isArray(data)) return []

    const messages = data
      .map((msg): StoredMessageMeta | null => normalizeSDKMessage(sessionID, msg))
      .filter((msg): msg is StoredMessageMeta => msg !== null)

    return messages.sort((a, b) => {
      const aTime = a.time?.created ?? 0
      const bTime = b.time?.created ?? 0
      if (aTime !== bTime) return aTime - bTime
      return a.id.localeCompare(b.id)
    })
  } catch {
    return []
  }
}
