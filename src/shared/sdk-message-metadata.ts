import { isRecord } from "./record-type-guard"

type SDKMessageTime = string | { created?: number; updated?: number; completed?: number }

export interface SDKMessageMetadata {
  id?: string
  role?: string
  time?: SDKMessageTime
  agent?: string
}

function getStringField(value: Record<string, unknown>, key: string): string | undefined {
  return typeof value[key] === "string" ? value[key] : undefined
}

function getTimeField(value: Record<string, unknown>, key: string): SDKMessageTime | undefined {
  const candidate = value[key]
  return typeof candidate === "string" || isRecord(candidate) ? candidate : undefined
}

export function getSDKMessageMetadata(value: unknown): SDKMessageMetadata {
  if (!isRecord(value)) return {}

  const info = isRecord(value.info) ? value.info : null

  return {
    id: getStringField(value, "id") ?? (info ? getStringField(info, "id") : undefined),
    role: getStringField(value, "role") ?? (info ? getStringField(info, "role") : undefined),
    time: getTimeField(value, "time") ?? (info ? getTimeField(info, "time") : undefined),
    agent: getStringField(value, "agent") ?? (info ? getStringField(info, "agent") : undefined),
  }
}
