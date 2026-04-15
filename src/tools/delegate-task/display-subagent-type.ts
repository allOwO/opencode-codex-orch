import type { DelegateTaskArgs } from "./types"
import { getCanonicalCategoryName } from "./constants"

export function getDisplaySubagentType(args: Pick<DelegateTaskArgs, "category" | "subagent_type">): string | undefined {
  if (args.category?.trim()) {
    return getCanonicalCategoryName(args.category)
  }

  const subagentType = args.subagent_type?.trim()
  return subagentType ? subagentType : undefined
}
