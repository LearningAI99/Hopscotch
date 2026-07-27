#!/usr/bin/env node
/**
 * Hopscotch feedback report
 * -------------------------
 * Fetches the published Google Sheet CSV of feedback, computes stats,
 * and (if ANTHROPIC_API_KEY is set) asks Claude for a qualitative
 * summary of the free-text comments. Outputs a markdown report to stdout.
 *
 * Usage:
 *   node scripts/feedback-report.mjs            # full report
 *   node scripts/feedback-report.mjs --if-new   # exit 78 if no new feedback in last 24h (used by the daily action to skip quiet days)
 *
 * Requires Node 18+ (built-in fetch). No dependencies.
 * Optional env: ANTHROPIC_API_KEY — without it you still get the stats,
 * just no AI summary of comments.
 */

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRYc27PKdt6Lob2fviO2vmCgjcj0fXaEj75_4zG3A0h-JTJijPvjV6n6PnaexNPudBbUa1U-e2SjYBW/pub?gid=1352764332&single=true&output=csv';

const IF_NEW_ONLY = process.argv.includes('--if-new');

/* ---------- CSV parsing (handles quoted fields with commas/newlines) ---------- */
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== ''));
}

/* ---------- Tolerant timestamp parsing (Google Sheets locale varies) ---------- */
function parseTimestamp(s) {
  if (!s) return null;
  // Try native first (handles ISO)
  const native = new Date(s);
  if (!isNaN(native)) return native;
  // Try DD/MM/YYYY HH:MM:SS and MM/DD/YYYY HH:MM:SS
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, a, b, y, h, mi, se] = m.map(Number);
  // If first number can only be a day (>12), it's DD/MM; if second can only be a day, MM/DD; otherwise assume DD/MM (Google's non-US default)
  const asDDMM = new Date(y, b - 1, a, h, mi, se);
  const asMMDD = new Date(y, a - 1, b, h, mi, se);
  if (a > 12) return asDDMM;
  if (b > 12) return asMMDD;
  return asDDMM;
}

/* ---------- Claude summary of comments ---------- */
async function claudeSummary(comments) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  if (!comments.length) return 'No written comments in this period.';
  const prompt = `You are summarising user feedback for Hopscotch, a travel repositioning cost calculator (it tells users whether driving/bussing to a cheaper departure airport is worth it, with cross-border warnings).

Below are free-text feedback comments, one per line. Summarise them for the product owner:
- Group into themes (data corrections, feature requests, bugs, praise, confusion).
- Surface any specific factual claims (e.g. "the Niagara drop fee is wrong") prominently — these are the most valuable.
- Do NOT quote abusive or profane submissions; if any are purely abusive with no substantive content, just count them at the end as "N abusive submissions with no substantive content." If an angry comment contains a real point, extract the point in neutral language.
- Be concise: this is a daily digest, not an essay. Use short bullet points.

Comments:
${comments.map(c => '- ' + c.replace(/\s+/g, ' ').slice(0, 500)).join('\n')}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    return `_(AI summary unavailable: API returned ${res.status})_`;
  }
  const data = await res.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
}

/* ---------- Main ---------- */
async function main() {
  const res = await fetch(CSV_URL, { redirect: 'follow' });
  if (!res.ok) {
    console.error(`Failed to fetch CSV: HTTP ${res.status}`);
    process.exit(1);
  }
  const text = await res.text();
  const rows = parseCSV(text);
  if (rows.length < 1) { console.log('# Hopscotch feedback report\n\nNo data in the sheet yet.'); return; }

  const dataRows = rows.slice(1) // drop header
    .map(r => ({ ts: parseTimestamp(r[0]), choice: (r[1] || '').trim(), comment: (r[2] || '').trim() }))
    .filter(r => r.choice || r.comment);

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recent = dataRows.filter(r => r.ts && r.ts >= dayAgo);
  const undated = dataRows.filter(r => !r.ts);

  if (IF_NEW_ONLY && recent.length === 0 && undated.length === 0) {
    console.error('No new feedback in the last 24h — skipping report.');
    process.exit(78); // conventional "neutral/skip" code, checked by the workflow
  }

  const count = (list, val) => list.filter(r => r.choice === val).length;
  const line = (label, list) =>
    `| ${label} | ${count(list, 'Yes, booking it')} | ${count(list, 'Maybe, still deciding')} | ${count(list, 'No, not worth it')} | ${list.length} |`;

  const recentComments = recent.filter(r => r.comment).map(r => r.comment);
  const allComments = dataRows.filter(r => r.comment).map(r => r.comment);
  const summaryInput = recent.length ? recentComments : allComments;
  const summary = await claudeSummary(summaryInput);

  const out = [];
  out.push(`# Hopscotch feedback report — ${now.toISOString().slice(0, 10)}`);
  out.push('');
  out.push(`| Period | Booking | Deciding | Not worth it | Total |`);
  out.push(`|---|---|---|---|---|`);
  out.push(line('Last 24h', recent));
  out.push(line('All time', dataRows));
  if (undated.length) out.push(`\n_${undated.length} row(s) had unparseable timestamps and are counted in all-time only._`);
  out.push('');
  out.push(`## Comments${recent.length ? ' (last 24h)' : ' (all time — none in last 24h)'}`);
  out.push('');
  out.push(summary !== null ? summary : [
    '_No ANTHROPIC_API_KEY set — raw comment list below (no AI summary):_',
    '',
    ...(summaryInput.length ? summaryInput.map(c => '- ' + c) : ['_No comments yet._']),
  ].join('\n'));
  out.push('');
  out.push(`---`);
  out.push(`_Generated ${now.toISOString()} · data source: published responses sheet_`);
  console.log(out.join('\n'));
}

main().catch(e => { console.error(e); process.exit(1); });
