import type { BackgroundTask } from "./types"

export type BackgroundTaskNotificationStatus = "COMPLETED" | "CANCELLED" | "INTERRUPTED"

export function buildBackgroundTaskNotificationText(input: {
  task: BackgroundTask
  duration: string
  statusText: BackgroundTaskNotificationStatus
  allComplete: boolean
  remainingCount: number
  completedTasks: BackgroundTask[]
}): string {
  const { task, duration, statusText, allComplete, remainingCount, completedTasks } = input

  const errorInfo = task.error ? `\n**Error:** ${task.error}` : ""

  if (allComplete) {
    const hasNonCompletedTasks = completedTasks.some((t) => t.status !== "completed")
    const allDoneBanner = hasNonCompletedTasks
      ? "[ALL BACKGROUND TASKS FINISHED]"
      : "[ALL BACKGROUND TASKS COMPLETE]"
    const completedTasksTitle = hasNonCompletedTasks ? "Final Statuses" : "Completed"
    const completedTasksText = completedTasks
      .map((t) => `- \`${t.id}\`: ${t.status} — ${t.description}`)
      .join("\n")

    return `<system-reminder>
${allDoneBanner}

**${completedTasksTitle}:**
${completedTasksText || `- \`${task.id}\`: ${task.status} — ${task.description}`}

Use \`background_output(task_id="<id>")\` to retrieve each result.
</system-reminder>`
  }

  const agentInfo = task.category ? `${task.agent} (${task.category})` : task.agent

  return `<system-reminder>
[BACKGROUND TASK ${statusText}]
**ID:** \`${task.id}\`
**Description:** ${task.description}
**Agent:** ${agentInfo}
**Duration:** ${duration}${errorInfo}

**${remainingCount} task${remainingCount === 1 ? "" : "s"} still in progress.** You WILL be notified when ALL complete.
Do NOT poll - continue productive work.

Use \`background_output(task_id="${task.id}")\` to retrieve this result when ready.
</system-reminder>`
}
