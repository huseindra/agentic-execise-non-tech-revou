export interface ChecklistEntry {
  id: string;
  campaignName: string;
  campaignType: string;
  meetingType: string;
  deadline: string;
  daysToDeadline: number;
  keyInsights: string;
  actionItems: string;
  nextSteps: string;
  urgencyTier: string;
  approverName: string;
  savedAt: string;
}

/**
 * In-memory stand-in for the "Save Checklist to Sheet" Google Sheets step.
 * Persists only for the lifetime of the server process — fine for this demo.
 */
const checklist: ChecklistEntry[] = [];

export function saveChecklist(entry: Omit<ChecklistEntry, 'id' | 'savedAt'>): ChecklistEntry {
  const saved: ChecklistEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
  };
  checklist.unshift(saved);
  return saved;
}

export function listChecklists(): ChecklistEntry[] {
  return checklist;
}
