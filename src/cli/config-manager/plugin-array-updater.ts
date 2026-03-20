import { isManagedPluginEntry } from "../plugin-reference"

export function upsertManagedPluginEntry(plugins: string[], pluginEntry: string): string[] {
  const nextPlugins = [...plugins]
  const existingIndex = nextPlugins.findIndex((plugin) => isManagedPluginEntry(plugin))

  if (existingIndex === -1) {
    nextPlugins.push(pluginEntry)
    return nextPlugins
  }

  if (nextPlugins[existingIndex] === pluginEntry) {
    return nextPlugins
  }

  nextPlugins[existingIndex] = pluginEntry
  return nextPlugins
}
