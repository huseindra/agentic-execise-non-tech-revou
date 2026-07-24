import { NextResponse } from 'next/server';
import { listChecklists, saveChecklist } from '../../../lib/meetingStore';

export async function GET() {
  return NextResponse.json({ meetings: listChecklists() });
}

const REQUIRED_FIELDS = [
  'campaignName',
  'campaignType',
  'meetingType',
  'deadline',
  'urgencyTier',
  'approverName',
] as const;

export async function POST(request: Request) {
  const body = await request.json();

  for (const field of REQUIRED_FIELDS) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const saved = saveChecklist({
    campaignName: body.campaignName,
    campaignType: body.campaignType,
    meetingType: body.meetingType,
    deadline: body.deadline,
    daysToDeadline: Number(body.daysToDeadline ?? 0),
    keyInsights: body.keyInsights ?? '',
    actionItems: body.actionItems ?? '',
    nextSteps: body.nextSteps ?? '',
    urgencyTier: body.urgencyTier,
    approverName: body.approverName,
  });

  return NextResponse.json({ meeting: saved });
}
