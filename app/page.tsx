'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface AnalysisResult {
  keyInsights: string;
  actionItems: string;
  nextSteps: string;
  urgencyTier: 'CRITICAL' | 'HIGH' | 'NORMAL';
  strategicRecommendation: string;
  riskFlags: string;
  emailSubject: string;
  emailBody: string;
  needsD3Reminder: boolean;
  reminderMessage: string | null;
  usedAi: boolean;
}

interface ChecklistEntry {
  id: string;
  campaignName: string;
  campaignType: string;
  meetingType: string;
  deadline: string;
  daysToDeadline: number;
  urgencyTier: string;
  approverName: string;
  savedAt: string;
}

const URGENCY_CLASS: Record<string, string> = {
  CRITICAL: styles.badgeCritical,
  HIGH: styles.badgeHigh,
  NORMAL: styles.badgeNormal,
};

const initialForm = {
  campaignName: '',
  campaignType: '',
  meetingType: '',
  deadline: '',
  daysToDeadline: 7,
  meetingNotes: '',
};

function Bullets({ text }: { text: string }) {
  const items = text
    .split('\n')
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);

  if (!items.length) {
    return <p className={styles.emptyText}>Nothing generated for this section.</p>;
  }

  return (
    <ul className={styles.bulletList}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function MeetingCopilotPage() {
  const [form, setForm] = useState(initialForm);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [approverName, setApproverName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [meetings, setMeetings] = useState<ChecklistEntry[]>([]);

  async function loadMeetings() {
    try {
      const res = await fetch('/api/meetings');
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    } catch {
      // Non-fatal — the saved-checklist table just stays empty.
    }
  }

  useEffect(() => {
    loadMeetings();
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBanner(null);
    setAnalysis(null);
    setLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong while analyzing the meeting notes.');
        return;
      }

      setAnalysis(data);
    } catch {
      setError('Could not reach the analysis service. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!analysis || !approverName.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: form.campaignName,
          campaignType: form.campaignType,
          meetingType: form.meetingType,
          deadline: form.deadline,
          daysToDeadline: form.daysToDeadline,
          keyInsights: analysis.keyInsights,
          actionItems: analysis.actionItems,
          nextSteps: analysis.nextSteps,
          urgencyTier: analysis.urgencyTier,
          approverName: approverName.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Could not save the checklist.');
        return;
      }

      const reminderNote = analysis.needsD3Reminder
        ? ` A deadline reminder email was sent: "${analysis.reminderMessage}"`
        : '';
      setBanner(`Checklist saved and approved by ${approverName.trim()}.${reminderNote}`);
      setAnalysis(null);
      setApproverName('');
      setForm(initialForm);
      await loadMeetings();
    } catch {
      setError('Could not reach the server to save the checklist.');
    } finally {
      setSaving(false);
    }
  }

  function handleReject() {
    setAnalysis(null);
    setApproverName('');
    setBanner(null);
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.heading}>Meeting Copilot</h1>
          <p className={styles.subheading}>
            Turn raw meeting notes into key insights, action items, a strategic recommendation, and a
            ready-to-send deadline email — with a human approval step before anything is saved.
          </p>
        </header>

        {banner && <div className={styles.banner}>{banner}</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>1. Meeting details</h2>
          <form className={styles.form} onSubmit={handleAnalyze}>
            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Campaign name</span>
                <input
                  required
                  value={form.campaignName}
                  onChange={(e) => setForm({ ...form, campaignName: e.target.value })}
                  placeholder="Payday Deals - Beauty"
                />
              </label>
              <label className={styles.field}>
                <span>Campaign type</span>
                <input
                  value={form.campaignType}
                  onChange={(e) => setForm({ ...form, campaignType: e.target.value })}
                  placeholder="Performance Marketing"
                />
              </label>
            </div>

            <div className={styles.formRow}>
              <label className={styles.field}>
                <span>Meeting type</span>
                <input
                  value={form.meetingType}
                  onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
                  placeholder="Weekly Sync"
                />
              </label>
              <label className={styles.field}>
                <span>Deadline</span>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span>Days to deadline</span>
                <input
                  type="number"
                  min={0}
                  value={form.daysToDeadline}
                  onChange={(e) => setForm({ ...form, daysToDeadline: Number(e.target.value) })}
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>Meeting notes</span>
              <textarea
                required
                rows={6}
                value={form.meetingNotes}
                onChange={(e) => setForm({ ...form, meetingNotes: e.target.value })}
                placeholder="Team agreed to prioritize Beauty category. Hero SKUs include Wardah Serum and Garnier Micellar Water. Marketing will finalize hero SKU list by Friday..."
              />
            </label>

            <button className={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze meeting'}
            </button>
          </form>
        </section>

        {analysis && (
          <>
            <section className={styles.card}>
              <div className={styles.sectionTitleRow}>
                <h2 className={styles.sectionTitle}>2. AI analysis</h2>
                <span className={`${styles.badge} ${URGENCY_CLASS[analysis.urgencyTier]}`}>
                  {analysis.urgencyTier}
                </span>
              </div>
              <p className={styles.aiSourceNote}>
                {analysis.usedAi
                  ? 'Generated with OpenAI.'
                  : 'Generated with the built-in rule-based assistant (set OPENAI_API_KEY to use OpenAI instead).'}
              </p>

              <div className={styles.grid3}>
                <div>
                  <h3 className={styles.subTitle}>Key Insights</h3>
                  <Bullets text={analysis.keyInsights} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Action Items</h3>
                  <Bullets text={analysis.actionItems} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Next Steps</h3>
                  <Bullets text={analysis.nextSteps} />
                </div>
              </div>

              <div className={styles.grid2}>
                <div>
                  <h3 className={styles.subTitle}>Strategic Recommendation</h3>
                  <Bullets text={analysis.strategicRecommendation} />
                </div>
                <div>
                  <h3 className={styles.subTitle}>Risk Flags</h3>
                  <Bullets text={analysis.riskFlags} />
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>3. Email draft</h2>
              <div className={styles.emailBox}>
                <p className={styles.emailSubject}>{analysis.emailSubject}</p>
                <p className={styles.emailBody}>{analysis.emailBody}</p>
              </div>
              {analysis.needsD3Reminder && (
                <p className={styles.reminderNote}>
                  ⏰ Within 3 days of deadline — approving below will also trigger a deadline reminder
                  email.
                </p>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.sectionTitle}>4. Human review &amp; approval</h2>
              <div className={styles.approvalRow}>
                <label className={styles.field}>
                  <span>Approver name</span>
                  <input
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    placeholder="Ninda"
                  />
                </label>
                <div className={styles.approvalActions}>
                  <button
                    className={styles.primaryButton}
                    onClick={handleApprove}
                    disabled={saving || !approverName.trim()}
                  >
                    {saving ? 'Saving…' : 'Approve & save checklist'}
                  </button>
                  <button className={styles.secondaryButton} onClick={handleReject} disabled={saving}>
                    Discard
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>Saved meeting checklists</h2>
          {meetings.length === 0 ? (
            <p className={styles.emptyText}>No checklists approved yet.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Type</th>
                    <th>Meeting</th>
                    <th>Deadline</th>
                    <th>Urgency</th>
                    <th>Approver</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m.id}>
                      <td>{m.campaignName}</td>
                      <td>{m.campaignType}</td>
                      <td>{m.meetingType}</td>
                      <td>
                        {m.deadline} ({m.daysToDeadline}d)
                      </td>
                      <td>
                        <span className={`${styles.badge} ${URGENCY_CLASS[m.urgencyTier]}`}>
                          {m.urgencyTier}
                        </span>
                      </td>
                      <td>{m.approverName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
