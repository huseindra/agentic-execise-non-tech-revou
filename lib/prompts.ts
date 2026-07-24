import type { AdvisorExtract, MeetingInput, SectionExtract } from './meetingPipeline';

/** Mirrors the "Transcribe Meeting Text" node's system framing. */
export const TRANSCRIBE_SYSTEM = 'You are an Ecommerce Meeting Assistant.';

export function buildTranscribePrompt(meetingNotes: string): string {
  return `Analyze the following meeting notes and extract the information into three sections.

Meeting Notes:
${meetingNotes}

Instructions:

1. keyinsight
Summarize the main discussions, decisions, priorities, campaign objectives, hero SKUs, risks, dependencies, and important business updates discussed during the meeting.
Write in concise bullet points.

2. actionItems
List all action items mentioned in the meeting.
Include:
- Team or owner (if mentioned, otherwise infer logically)
- Task or deliverable
- Deadline or dependency if mentioned

3. nextSteps
Describe the immediate follow-up actions required after the meeting, including unresolved issues, pending approvals, dependencies, and topics that require another discussion.
Focus on what should happen next rather than repeating action items.

Guidelines:
- Remove filler words and repetitive statements.
- Preserve product names, campaign names, channels, and important concerns.
- Do not invent facts.
- Infer owners only when obvious.
- Keep outputs concise and professional.

Respond with sections labeled exactly: keyinsight, actionItems, nextSteps.`;
}

/** Mirrors the "Campaign Advisor Agent" node's system message. */
export const ADVISOR_SYSTEM =
  'You are a Campaign Strategy Advisor. You assess urgency, surface risks, and give clear strategic direction for ecommerce campaign teams. Always respond with the three sections: urgencyTier, strategicRecommendation, riskFlags.';

export function buildAdvisorPrompt(
  input: Pick<MeetingInput, 'campaignName' | 'campaignType' | 'meetingType' | 'daysToDeadline'>,
  sections: SectionExtract
): string {
  return `You are a Campaign Strategy Advisor for an ecommerce performance marketing agency.

Analyze this campaign and provide your advisory output.

Campaign: ${input.campaignName}
Type: ${input.campaignType}
Meeting Type: ${input.meetingType}
Days to Deadline: ${input.daysToDeadline}

Key Insights:
${sections.keyInsights}

Action Items:
${sections.actionItems}

Next Steps:
${sections.nextSteps}

Respond in exactly this format (use these exact section labels):

urgencyTier
CRITICAL, HIGH, or NORMAL — based on days to deadline and open items.

strategicRecommendation
2-3 bullet points. Most important moves before deadline. Focus on risk mitigation and prioritization.

riskFlags
1-3 specific risks from the meeting content that could derail the campaign.

Be direct. No filler. Reference actual campaign names, SKUs, or channels.`;
}

/** Mirrors the "Email Tone Writer Agent" node's system message. */
export const EMAIL_SYSTEM =
  'You are a Campaign Communications Writer. You write concise, professional deadline alert emails. Tone rules: CRITICAL = direct and urgent, HIGH = firm and collaborative, NORMAL = clear and informational. Always respond with two sections: emailSubject and emailBody.';

export function buildEmailPrompt(
  input: Pick<MeetingInput, 'campaignName' | 'deadline' | 'daysToDeadline'>,
  advisor: AdvisorExtract,
  sections: SectionExtract
): string {
  return `Write a deadline alert email for the following campaign.

Campaign: ${input.campaignName}
Days to Deadline: ${input.daysToDeadline}
Deadline: ${input.deadline}
Urgency Tier: ${advisor.urgencyTier}

Action Items:
${sections.actionItems}

Next Steps:
${sections.nextSteps}

Strategic Recommendation:
${advisor.strategicRecommendation}

Risk Flags:
${advisor.riskFlags}

Respond in exactly this format:

emailSubject
One subject line matching the urgency tier.

emailBody
3-5 short paragraphs. Plain text only, no HTML.
Open with urgency context. Summarize key action items. Include top strategic recommendation. Close with a clear call to action.
Under 200 words. Addressed to the team, not an individual.`;
}
