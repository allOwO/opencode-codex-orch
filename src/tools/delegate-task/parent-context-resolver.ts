import type { ToolContextWithMetadata } from "./types"
import type { OpencodeClient } from "./types"
import type { ParentContext } from "./executor-types"
import { resolveMessageContext } from "../../features/hook-message-injector"
import { getSessionAgent } from "../../features/claude-code-session-state"
import { log } from "../../shared/logger"
import { getMessageDir } from "../../shared/opencode-message-dir"
import { normalizeSDKResponse } from "../../shared"

interface SessionMessagePart {
  type?: string
  text?: string
  synthetic?: boolean
}

interface SessionMessage {
  info?: {
    role?: string
    time?: { created?: number }
  }
  parts?: SessionMessagePart[]
}

function extractAgentsContext(messages: SessionMessage[]): string | undefined {
  const userMessages = messages
    .filter((message) => message.info?.role === "user")
    .sort((a, b) => (b.info?.time?.created ?? 0) - (a.info?.time?.created ?? 0))

  for (const message of userMessages) {
    const syntheticText = message.parts
      ?.filter((part) => part.type === "text" && part.synthetic && typeof part.text === "string")
      .map((part) => part.text?.trim())
      .filter((text): text is string => Boolean(text))

    if (syntheticText && syntheticText.length > 0) {
      return syntheticText.join("\n\n")
    }
  }

  return undefined
}

export async function resolveParentContext(
  ctx: ToolContextWithMetadata,
  client: OpencodeClient
): Promise<ParentContext> {
  const messageDir = getMessageDir(ctx.sessionID)
  const { prevMessage, firstMessageAgent } = await resolveMessageContext(
    ctx.sessionID,
    client,
    messageDir
  )

  const sessionAgent = getSessionAgent(ctx.sessionID)
  const parentAgent = ctx.agent ?? sessionAgent ?? firstMessageAgent ?? prevMessage?.agent

  log("[task] parentAgent resolution", {
    sessionID: ctx.sessionID,
    messageDir,
    ctxAgent: ctx.agent,
    sessionAgent,
    firstMessageAgent,
    prevMessageAgent: prevMessage?.agent,
    resolvedParentAgent: parentAgent,
  })

  const parentModel = prevMessage?.model?.providerID && prevMessage?.model?.modelID
    ? {
        providerID: prevMessage.model.providerID,
        modelID: prevMessage.model.modelID,
        ...(prevMessage.model.variant ? { variant: prevMessage.model.variant } : {}),
      }
    : undefined

  let agentsContext: string | undefined
  try {
    const messagesResponse = await client.session.messages({ path: { id: ctx.sessionID } })
    const messages = normalizeSDKResponse(messagesResponse, [] as SessionMessage[], {
      preferResponseOnMissingData: true,
    })
    agentsContext = extractAgentsContext(messages)
  } catch {
    agentsContext = undefined
  }

  return {
    sessionID: ctx.sessionID,
    messageID: ctx.messageID,
    agent: parentAgent,
    model: parentModel,
    agentsContext,
  }
}
