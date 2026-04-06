import { getPlanProgress, readBoulderState } from "../../features/boulder-state"
import {
  getActiveContinuationMarkerReason,
  isContinuationMarkerActive,
  readContinuationMarker,
} from "../../features/run-continuation-state"

export interface ContinuationState {
  hasActiveBoulder: boolean
  hasHookMarker: boolean
  hasTodoHookMarker: boolean
  hasActiveHookMarker: boolean
  activeHookMarkerReason: string | null
}

export function getContinuationState(directory: string, sessionID: string): ContinuationState {
  const marker = readContinuationMarker(directory, sessionID)

  return {
    hasActiveBoulder: hasActiveBoulderContinuation(directory, sessionID),
    hasHookMarker: marker !== null,
    hasTodoHookMarker: marker?.sources.todo !== undefined,
    hasActiveHookMarker: isContinuationMarkerActive(marker),
    activeHookMarkerReason: getActiveContinuationMarkerReason(marker),
  }
}

function hasActiveBoulderContinuation(directory: string, sessionID: string): boolean {
  const boulder = readBoulderState(directory)
  if (!boulder) return false
  if (!boulder.session_ids.includes(sessionID)) return false

  const progress = getPlanProgress(boulder.active_plan)
  return !progress.isComplete
}
