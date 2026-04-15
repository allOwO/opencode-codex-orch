import type { OpencodeClient } from "./types"
import type { SessionMessage } from "./executor-types"
import { normalizeSDKResponse } from "../../shared"
import { extractErrorMessage, extractErrorName } from "../../features/background-agent/error-classifier"

function getAssistantSessionError(message: SessionMessage): { name?: string; message?: string } | undefined {
  const rawMessage = message as SessionMessage & {
    error?: unknown
    info?: SessionMessage["info"] & { error?: unknown }
  }

  const errorCandidate = rawMessage.error ?? rawMessage.info?.error
  if (errorCandidate) {
    return {
      name: extractErrorName(errorCandidate),
      message: extractErrorMessage(errorCandidate),
    }
  }

  const errorParts = rawMessage.parts?.filter((part) => part.type === "error") ?? []
  if (errorParts.length > 0) {
    const errorMessage = errorParts.map((part) => part.text ?? "").join("\n").trim()
    if (errorMessage) {
      return { message: errorMessage }
    }
  }

  return undefined
}

function formatAssistantSessionError(sessionID: string, error: { name?: string; message?: string }): string {
  const detail = error.name && error.message
    ? `${error.name}: ${error.message}`
    : error.message ?? error.name ?? "Unknown session error"

  return `Delegated agent session failed.\n\n**Error**: ${detail}\n**Session ID**: ${sessionID}`
}

export async function fetchSyncResult(
  client: OpencodeClient,
  sessionID: string,
  anchorMessageCount?: number
): Promise<{ ok: true; textContent: string } | { ok: false; error: string }> {
  const messagesResult = await client.session.messages({
    path: { id: sessionID },
  })

  if ((messagesResult as { error?: unknown }).error) {
    return { ok: false, error: `Error fetching result: ${(messagesResult as { error: unknown }).error}\n\nSession ID: ${sessionID}` }
  }

  const messages = normalizeSDKResponse(messagesResult, [] as SessionMessage[], {
    preferResponseOnMissingData: true,
  })

  const messagesAfterAnchor = anchorMessageCount !== undefined ? messages.slice(anchorMessageCount) : messages

  if (anchorMessageCount !== undefined && messagesAfterAnchor.length === 0) {
    return {
      ok: false,
      error: `Session completed but no new response was generated. The model may have failed silently.\n\nSession ID: ${sessionID}`,
    }
  }

  const assistantMessages = messagesAfterAnchor
    .filter((m) => m.info?.role === "assistant")
    .sort((a, b) => (b.info?.time?.created ?? 0) - (a.info?.time?.created ?? 0))
  const lastMessage = assistantMessages[0]
  const assistantError = assistantMessages
    .map((message) => getAssistantSessionError(message))
    .find((error): error is { name?: string; message?: string } => Boolean(error))

  if (anchorMessageCount !== undefined && !lastMessage) {
    return {
      ok: false,
      error: `Session completed but no new response was generated. The model may have failed silently.\n\nSession ID: ${sessionID}`,
    }
  }

  if (!lastMessage) {
    return { ok: false, error: `No assistant response found.\n\nSession ID: ${sessionID}` }
  }

  if (assistantError) {
    return {
      ok: false,
      error: formatAssistantSessionError(sessionID, assistantError),
    }
  }

  // Search assistant messages (newest first) for one with text/reasoning content.
  // The last assistant message may only contain tool calls with no text.
  let textContent = ""
  for (const msg of assistantMessages) {
    const textParts = msg.parts?.filter((p) => p.type === "text" || p.type === "reasoning") ?? []
    const content = textParts.map((p) => p.text ?? "").filter(Boolean).join("\n")
    if (content) {
      textContent = content
      break
    }
  }

  return { ok: true, textContent }
}
