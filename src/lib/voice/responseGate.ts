/** Tracks the current request and rejects events from canceled response IDs. */
export function createResponseGate() {
  let generation = 0;
  let accepting = false;
  let sent = false;
  let activeId: string | undefined;
  let waitingForCancel = false;
  let canceledPendingId: string | undefined;
  const canceledIds = new Set<string>();
  return {
    start() { generation += 1; accepting = true; sent = false; activeId = undefined; return generation; },
    current() { return generation; },
    isBlocked() { return waitingForCancel; },
    failWaiting() { accepting = false; sent = false; generation += 1; },
    isCurrent(token: number) { return accepting && token === generation; },
    markSent(token: number) { if (waitingForCancel || !accepting || token !== generation) return false; sent = true; return true; },
    created(id?: string) {
      if (waitingForCancel) { if (id) { canceledPendingId = id; canceledIds.add(id); } return false; }
      if (!accepting || (id && canceledIds.has(id))) { if (id) canceledIds.add(id); return false; }
      activeId = id;
      return true;
    },
    accepts(id?: string) { return !waitingForCancel && accepting && (!id || (!canceledIds.has(id) && (!activeId || id === activeId))); },
    finish(id?: string) {
      if (waitingForCancel) {
        if (!id || !canceledPendingId || id === canceledPendingId) { if (id) canceledIds.add(id); waitingForCancel = false; canceledPendingId = undefined; }
        return false;
      }
      if (!accepting || (id && (canceledIds.has(id) || (activeId && id !== activeId)))) return false;
      accepting = false; sent = false; return true;
    },
    cancel() {
      const shouldCancel = accepting && sent;
      if (shouldCancel) { waitingForCancel = true; canceledPendingId = activeId; }
      if (activeId) canceledIds.add(activeId);
      accepting = false; sent = false; activeId = undefined; generation += 1;
      return shouldCancel;
    },
  };
}
