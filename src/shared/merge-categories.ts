import type { CategoriesConfig, CategoryConfig } from "../config/schema"
import { DEFAULT_CATEGORIES, getCanonicalCategoryName } from "../tools/delegate-task/constants"

/**
 * Merge default and user categories, filtering out disabled ones.
 * Single source of truth for category merging across the codebase.
 */
export function mergeCategories(
  userCategories?: CategoriesConfig,
): Record<string, CategoryConfig> {
  const normalizedUserCategories = userCategories
    ? Object.fromEntries(
        Object.entries(userCategories).map(([name, config]) => [getCanonicalCategoryName(name), config]),
      )
    : undefined

  const merged = userCategories
    ? { ...DEFAULT_CATEGORIES, ...normalizedUserCategories }
    : { ...DEFAULT_CATEGORIES }

  return Object.fromEntries(
    Object.entries(merged).filter(([, config]) => !config.disable),
  )
}
