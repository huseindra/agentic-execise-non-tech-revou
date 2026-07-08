# Meeting Copilot

A Next.js (App Router, TypeScript) product built from the **"Meeting Plan Reminder with Agent"** n8n
workflow. Where the original workflow read meeting notes from Google Sheets, ran them through a chain
of OpenAI/LangChain nodes, and emailed a deadline reminder via Gmail, this app puts the same pipeline
behind a single web page so a PM can run it interactively:

1. **Meeting details form** — campaign name/type, meeting type, deadline, and raw meeting notes
   (replaces the "Read Meeting Plans" Google Sheets node).
2. **AI analysis** — extracts Key Insights, Action Items, and Next Steps from the notes, then runs a
   Campaign Advisor pass that assigns an urgency tier (`CRITICAL` / `HIGH` / `NORMAL`), a strategic
   recommendation, and risk flags (mirrors the "Transcribe Meeting Text", "Campaign Advisor Agent",
   and "Route by Urgency" nodes).
3. **Email draft** — a tone-matched deadline alert email (mirrors the "Email Tone Writer Agent" node).
4. **Human review & approval** — an approver name + Approve/Discard step before anything is persisted
   (mirrors the "Human Review / Approval" wait node).
5. **Saved checklists** — approved meetings are saved to a checklist table, and campaigns within 3 days
   of their deadline automatically get a reminder message (mirrors "Save Checklist to Sheet",
   "Filter D-3 Only", and "Send D-3 Reminder Email").

## AI provider

Set `OPENAI_API_KEY` to have the analysis, advisor, and email-writing steps run against OpenAI
(`gpt-4o-mini`), using the same prompts as the n8n workflow's agent nodes. Without a key, the app falls
back to a deterministic, rule-based generator so the whole product works out of the box with no
external services.

## Known limitation

Saved checklists are held in server memory for the running process — they reset on restart and won't
be shared across serverless instances in production. That's fine for this demo; a real deployment
would swap `lib/meetingStore.ts` for a database.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To use OpenAI instead of the built-in fallback:

```bash
OPENAI_API_KEY=sk-... npm run dev
```

## Running Tests

```bash
npm test
```

## Deploying to Vercel

Push this repository to GitHub, then import it on [vercel.com](https://vercel.com). Set the
`OPENAI_API_KEY` environment variable if you want AI-generated (rather than rule-based) output.

## Also included: Pricing demo

The original pricing demo page from this repo now lives at `/pricing`.
