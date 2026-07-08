import { describe, it, expect } from 'vitest';
import {
  extractSections,
  extractAdvisorOutput,
  extractEmailOutput,
  isD3Reminder,
  ruleBasedUrgencyTier,
  buildFallbackSections,
  buildFallbackAdvisorOutput,
  buildFallbackEmail,
  buildDeadlineReminderMessage,
} from './meetingPipeline';

describe('extractSections', () => {
  it('parses keyinsight, actionItems, and nextSteps from AI output', () => {
    const text = [
      'keyinsight',
      '• Team agreed to prioritize Beauty category.',
      'actionItems',
      '• Marketing – finalize hero SKU list.',
      'nextSteps',
      '• Obtain inventory confirmation.',
    ].join('\n');

    const result = extractSections(text);

    expect(result.keyInsights).toContain('Beauty category');
    expect(result.actionItems).toContain('hero SKU list');
    expect(result.nextSteps).toContain('inventory confirmation');
  });

  it('returns empty strings when sections are missing', () => {
    expect(extractSections('')).toEqual({ keyInsights: '', actionItems: '', nextSteps: '' });
  });
});

describe('extractAdvisorOutput', () => {
  it('parses urgencyTier, strategicRecommendation, and riskFlags', () => {
    const text = [
      'urgencyTier',
      'CRITICAL',
      'strategicRecommendation',
      '• Escalate to leadership.',
      'riskFlags',
      '• Inventory shortage on hero SKU.',
    ].join('\n');

    const result = extractAdvisorOutput(text);

    expect(result.urgencyTier).toBe('CRITICAL');
    expect(result.strategicRecommendation).toContain('Escalate');
    expect(result.riskFlags).toContain('Inventory shortage');
  });

  it('defaults to NORMAL when no tier keyword is found', () => {
    const result = extractAdvisorOutput('urgencyTier\nunclear\nstrategicRecommendation\nsomething');
    expect(result.urgencyTier).toBe('NORMAL');
  });
});

describe('extractEmailOutput', () => {
  it('parses emailSubject and emailBody', () => {
    const text = 'emailSubject\nCampaign at risk\nemailBody\nPlease review the open items.';
    const result = extractEmailOutput(text);

    expect(result.emailSubject).toBe('Campaign at risk');
    expect(result.emailBody).toContain('review the open items');
  });

  it('falls back to a default subject when missing', () => {
    const result = extractEmailOutput('no matching sections here');
    expect(result.emailSubject).toBe('Campaign Deadline Alert');
  });
});

describe('isD3Reminder', () => {
  it('is true at exactly 3 days and fewer', () => {
    expect(isD3Reminder(3)).toBe(true);
    expect(isD3Reminder(1)).toBe(true);
    expect(isD3Reminder(0)).toBe(true);
  });

  it('is false beyond 3 days', () => {
    expect(isD3Reminder(4)).toBe(false);
  });
});

describe('ruleBasedUrgencyTier', () => {
  it('is CRITICAL at 1 day or fewer', () => {
    expect(ruleBasedUrgencyTier(1)).toBe('CRITICAL');
    expect(ruleBasedUrgencyTier(0)).toBe('CRITICAL');
  });

  it('is HIGH between 2 and 3 days', () => {
    expect(ruleBasedUrgencyTier(2)).toBe('HIGH');
    expect(ruleBasedUrgencyTier(3)).toBe('HIGH');
  });

  it('is NORMAL beyond 3 days', () => {
    expect(ruleBasedUrgencyTier(10)).toBe('NORMAL');
  });
});

describe('buildFallbackSections', () => {
  it('extracts action-y lines as action items', () => {
    const notes = 'Team discussed the roadmap.\nMarketing will finalize hero SKUs by Friday.\nCRM will confirm the push schedule.';
    const result = buildFallbackSections(notes);

    expect(result.actionItems).toContain('finalize hero SKUs');
    expect(result.actionItems).toContain('confirm the push schedule');
    expect(result.keyInsights).toContain('roadmap');
  });

  it('provides a generic action item when none are found', () => {
    const result = buildFallbackSections('We had a general catch up.');
    expect(result.actionItems).toContain('assign clear owners');
  });

  it('handles empty notes', () => {
    const result = buildFallbackSections('');
    expect(result.keyInsights).toBe('• No meeting notes provided.');
    expect(result.nextSteps).toBe('• No next steps identified.');
  });
});

describe('buildFallbackAdvisorOutput', () => {
  it('derives urgency tier from days to deadline', () => {
    const sections = buildFallbackSections('Finalize the creative assets.');
    const result = buildFallbackAdvisorOutput(
      { campaignName: 'Payday Sale', deadline: '2026-07-10', daysToDeadline: 1 },
      sections
    );
    expect(result.urgencyTier).toBe('CRITICAL');
    expect(result.strategicRecommendation).toContain('Payday Sale');
  });
});

describe('buildFallbackEmail', () => {
  it('builds a subject line including urgency and campaign name', () => {
    const sections = buildFallbackSections('Finalize the creative assets.');
    const advisor = buildFallbackAdvisorOutput(
      { campaignName: 'Payday Sale', deadline: '2026-07-10', daysToDeadline: 1 },
      sections
    );
    const email = buildFallbackEmail(
      { campaignName: 'Payday Sale', deadline: '2026-07-10', daysToDeadline: 1 },
      advisor,
      sections
    );

    expect(email.emailSubject).toBe('CRITICAL: Payday Sale deadline in 1 day(s)');
    expect(email.emailBody).toContain('Payday Sale');
  });
});

describe('buildDeadlineReminderMessage', () => {
  it('matches the wording sent by the Gmail node in the source workflow', () => {
    const message = buildDeadlineReminderMessage({ campaignName: 'Payday Sale', daysToDeadline: 3 });
    expect(message).toBe('Your deadline for Payday Sale is at risk, it reaches 3 days to deadline');
  });
});
