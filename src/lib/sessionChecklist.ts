type ChecklistStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function clearChecklist(storage: Pick<Storage, 'removeItem'>, caseId: string) {
  storage.removeItem(`sherpas-action-checklist:${caseId}`);
}

export function loadChecklist(storage: ChecklistStorage, caseId: string, count: number): number[] {
  try {
    const value: unknown = JSON.parse(storage.getItem(`sherpas-action-checklist:${caseId}`) ?? '[]');
    return Array.isArray(value) ? [...new Set(value.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < count))] : [];
  } catch { return []; }
}

export function saveChecklist(storage: ChecklistStorage, caseId: string, items: number[]): boolean {
  try {
    storage.setItem(`sherpas-action-checklist:${caseId}`, JSON.stringify(items));
    return true;
  } catch { return false; }
}
