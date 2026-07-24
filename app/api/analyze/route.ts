import { NextResponse } from 'next/server';
import {
  buildDeadlineReminderMessage,
  buildFallbackAdvisorOutput,
  buildFallbackEmail,
  buildFallbackSections,
  extractAdvisorOutput,
  extractEmailOutput,
  extractSections,
  isD3Reminder,
  type MeetingInput,
} from '../../../lib/meetingPipeline';
import { isAiConfigured, runChatCompletion } from '../../../lib/openai';
import {
  ADVISOR_SYSTEM,
  buildAdvisorPrompt,
  buildEmailPrompt,
  buildTranscribePrompt,
  EMAIL_SYSTEM,
  TRANSCRIBE_SYSTEM,
} from '../../../lib/prompts';

export async function POST(request: Request) {
  const body = await request.json();

  const input: MeetingInput = {
    campaignName: String(body.campaignName ?? '').trim(),
    campaignType: String(body.campaignType ?? '').trim(),
    meetingType: String(body.meetingType ?? '').trim(),
    deadline: String(body.deadline ?? '').trim(),
    daysToDeadline: Number(body.daysToDeadline ?? 0),
    meetingNotes: String(body.meetingNotes ?? '').trim(),
  };

  if (!input.campaignName || !input.meetingNotes) {
    return NextResponse.json(
      { error: 'campaignName and meetingNotes are required' },
      { status: 400 }
    );
  }
  if (!Number.isFinite(input.daysToDeadline)) {
    return NextResponse.json({ error: 'daysToDeadline must be a number' }, { status: 400 });
  }

  const aiConfigured = isAiConfigured();
  let usedAi = false;
  let sections;
  let advisor;
  let email;

  if (aiConfigured) {
    try {
      const transcript = await runChatCompletion(TRANSCRIBE_SYSTEM, buildTranscribePrompt(input.meetingNotes));
      sections = extractSections(transcript);

      const advisorText = await runChatCompletion(ADVISOR_SYSTEM, buildAdvisorPrompt(input, sections));
      advisor = extractAdvisorOutput(advisorText);

      const emailText = await runChatCompletion(EMAIL_SYSTEM, buildEmailPrompt(input, advisor, sections));
      email = extractEmailOutput(emailText);

      usedAi = true;
    } catch {
      // Fall through to the deterministic path below if the OpenAI call fails.
    }
  }

  if (!usedAi) {
    sections = buildFallbackSections(input.meetingNotes);
    advisor = buildFallbackAdvisorOutput(input, sections);
    email = buildFallbackEmail(input, advisor, sections);
  }

  const needsD3Reminder = isD3Reminder(input.daysToDeadline);
  const reminderMessage = needsD3Reminder ? buildDeadlineReminderMessage(input) : null;

  return NextResponse.json({
    input,
    ...sections!,
    ...advisor!,
    ...email!,
    needsD3Reminder,
    reminderMessage,
    usedAi,
  });
}
