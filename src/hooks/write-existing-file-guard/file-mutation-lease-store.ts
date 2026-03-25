interface LeaseWaiter {
  ownerID: string
  resolve: (acquired: boolean) => void
  timeoutID: ReturnType<typeof setTimeout>
}

export function createFileMutationLeaseStore(args: { waitTimeoutMs: number }): {
  acquire: (canonicalPath: string, ownerID: string) => Promise<boolean>
  release: (canonicalPath: string, ownerID: string) => void
} {
  const { waitTimeoutMs } = args
  const ownersByPath = new Map<string, string>()
  const waitersByPath = new Map<string, LeaseWaiter[]>()

  const cleanupWaiters = (canonicalPath: string): LeaseWaiter[] => {
    const waiters = waitersByPath.get(canonicalPath) ?? []
    if (waiters.length === 0) {
      waitersByPath.delete(canonicalPath)
      return []
    }
    return waiters
  }

  return {
    acquire: async (canonicalPath, ownerID) => {
      const currentOwner = ownersByPath.get(canonicalPath)
      if (!currentOwner || currentOwner === ownerID) {
        ownersByPath.set(canonicalPath, ownerID)
        return true
      }

      return await new Promise<boolean>((resolve) => {
        const waiters = cleanupWaiters(canonicalPath)
        const waiter: LeaseWaiter = {
          ownerID,
          resolve: (acquired) => {
            clearTimeout(waiter.timeoutID)
            resolve(acquired)
          },
          timeoutID: setTimeout(() => {
            const currentWaiters = waitersByPath.get(canonicalPath) ?? []
            const waiterIndex = currentWaiters.indexOf(waiter)
            if (waiterIndex !== -1) {
              currentWaiters.splice(waiterIndex, 1)
            }
            cleanupWaiters(canonicalPath)
            resolve(false)
          }, waitTimeoutMs),
        }

        waiters.push(waiter)
        waitersByPath.set(canonicalPath, waiters)
      })
    },
    release: (canonicalPath, ownerID) => {
      const currentOwner = ownersByPath.get(canonicalPath)
      if (currentOwner !== ownerID) {
        return
      }

      const waiters = cleanupWaiters(canonicalPath)
      const nextWaiter = waiters.shift()
      if (!nextWaiter) {
        ownersByPath.delete(canonicalPath)
        cleanupWaiters(canonicalPath)
        return
      }

      ownersByPath.set(canonicalPath, nextWaiter.ownerID)
      nextWaiter.resolve(true)
      if (waiters.length === 0) {
        waitersByPath.delete(canonicalPath)
      } else {
        waitersByPath.set(canonicalPath, waiters)
      }
    },
  }
}
