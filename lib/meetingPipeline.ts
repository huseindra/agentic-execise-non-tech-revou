export type UrgencyTier = 'CRITICAL' | 'HIGH' | 'NORMAL';

export interface MeetingInput {
  campaignName: string;
  campaignType: string;
  meetingType: string;
  deadline: string;
  daysToDeadline: number;
  meetingNotes: string;
}

export interface SectionExtract {
  keyInsights: string;
  actionItems: string;
  nextSteps: string;
}

export interface AdvisorExtract {
  urgencyTier: UrgencyTier;
  strategicRecommendation: string;
  riskFlags: string;
}

export interface EmailExtract {
  emailSubject: string;
  emailBody: string;
}

/** Mirrors the "Extract Sections" n8n Code node. */
export function extractSections(text: string): SectionExtract {
  const keyInsights = text.match(/keyinsight([\s\S]*?)(?=actionItems|$)/i)?.[1]?.trim() ?? '';
  const actionItems = text.match(/actionItems([\s\S]*?)(?=nextSteps|$)/i)?.[1]?.trim() ?? '';
  const nextSteps = text.match(/nextSteps([\s\S]*?)$/i)?.[1]?.trim() ?? '';
  return { keyInsights, actionItems, nextSteps };
}

/** Mirrors the "Extract Advisor Output" n8n Code node. */
export function extractAdvisorOutput(text: string): AdvisorExtract {
  const tierSection = text.match(/urgencyTier[\s\S]*?\n([^\n]+)/i)?.[1]?.trim() ?? '';
  const tierMatch = tierSection.match(/CRITICAL|HIGH|NORMAL/i);
  const urgencyTier = (tierMatch ? tierMatch[0].toUpperCase() : 'NORMAL') as UrgencyTier;

  const strategicRecommendation =
    text.match(/strategicRecommendation[\s\S]*?\n([\s\S]*?)(?=riskFlags|$)/i)?.[1]?.trim() ?? '';
  const riskFlags = text.match(/riskFlags[\s\S]*?\n([\s\S]*?)$/i)?.[1]?.trim() ?? '';

  return { urgencyTier, strategicRecommendation, riskFlags };
}

/** Mirrors the "Extract Email Writer Output" n8n Code node. */
export function extractEmailOutput(text: string): EmailExtract {
  const emailSubject =
    text.match(/emailSubject[\s\S]*?\n([^\n]+)/i)?.[1]?.trim() ?? 'Campaign Deadline Alert';
  const emailBody = text.match(/emailBody[\s\S]*?\n([\s\S]*?)$/i)?.[1]?.trim() ?? '';
  return { emailSubject, emailBody };
}

/** Mirrors the "Filter D-3 Only" node condition (days to deadline <= 3). */
export function isD3Reminder(daysToDeadline: number): boolean {
  return daysToDeadline <= 3;
}

/** Deterministic urgency tier used when no AI advisor is configured. */
export function ruleBasedUrgencyTier(daysToDeadline: number): UrgencyTier {
  if (daysToDeadline <= 1) return 'CRITICAL';
  if (daysToDeadline <= 3) return 'HIGH';
  return 'NORMAL';
}

const ACTION_KEYWORDS = [
  'finalize',
  'prepare',
  'confirm',
  'complete',
  'follow up',
  'review',
  'send',
  'launch',
  'submit',
  'align',
  'obtain',
  'schedule',
];

function splitNotesIntoLines(notes: string): string[] {
  return notes
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

/** Fallback for the "Transcribe Meeting Text" + "Extract Sections" steps, used when no AI key is configured. */
export function buildFallbackSections(meetingNotes: string): SectionExtract {
  const lines = splitNotesIntoLines(meetingNotes);

  const keyInsights = lines.length
    ? lines.slice(0, 5).map((line) => `• ${line}`).join('\n')
    : '• No meeting notes provided.';

  const actionLines = lines.filter((line) =>
    ACTION_KEYWORDS.some((keyword) => line.toLowerCase().includes(keyword))
  );
  const actionItems = (
    actionLines.length ? actionLines : ['Team – review meeting notes and assign clear owners for follow-up.']
  )
    .map((line) => `• ${line}`)
    .join('\n');

  const nextSteps = lines.length
    ? '• Confirm ownership for each action item above.\n• Revisit open items in the next campaign sync.'
    : '• No next steps identified.';

  return { keyInsights, actionItems, nextSteps };
}

/** Fallback for the "Campaign Advisor Agent" step, used when no AI key is configured. */
export function buildFallbackAdvisorOutput(
  input: Pick<MeetingInput, 'campaignName' | 'deadline' | 'daysToDeadline'>,
  sections: SectionExtract
): AdvisorExtract {
  const urgencyTier = ruleBasedUrgencyTier(input.daysToDeadline);
  const strategicRecommendation = [
    `• Prioritize closing open action items for ${input.campaignName} before ${input.deadline}.`,
    `• Escalate blockers to stakeholders given ${input.daysToDeadline} day(s) remaining.`,
  ].join('\n');
  const riskFlags = sections.actionItems
    ? `• Unresolved action items may slip past the ${input.deadline} deadline.`
    : '• No action items captured — confirm nothing was missed.';

  return { urgencyTier, strategicRecommendation, riskFlags };
}

/** Fallback for the "Email Tone Writer Agent" step, used when no AI key is configured. */
export function buildFallbackEmail(
  input: Pick<MeetingInput, 'campaignName' | 'deadline' | 'daysToDeadline'>,
  advisor: AdvisorExtract,
  sections: SectionExtract
): EmailExtract {
  const emailSubject = `${advisor.urgencyTier}: ${input.campaignName} deadline in ${input.daysToDeadline} day(s)`;
  const emailBody = [
    `This is a ${advisor.urgencyTier.toLowerCase()} priority update on ${input.campaignName}, due ${input.deadline}.`,
    `Key action items:\n${sections.actionItems}`,
    `Top recommendation:\n${advisor.strategicRecommendation.split('\n')[0] ?? ''}`,
    'Please confirm status on open items before the deadline.',
  ].join('\n\n');

  return { emailSubject, emailBody };
}

/** Mirrors the Gmail message built in the "Send D-3 Reminder Email" node. */
export function buildDeadlineReminderMessage(
  input: Pick<MeetingInput, 'campaignName' | 'daysToDeadline'>
): string {
  return `Your deadline for ${input.campaignName} is at risk, it reaches ${input.daysToDeadline} days to deadline`;
}
