# Running your own Hopscotch

Everything here is for the person deploying the calculator — none of it is needed just to use it. The tool works out of the box; these steps wire up feedback, affiliate revenue, and the daily report.

## 1. Feedback pipeline (recommended)

The feedback card posts submissions invisibly to a Google Form, which writes them to a Google Sheet.

1. Create a Google Form with two questions, worded **exactly**:
   - Multiple choice: **Are you going to make this trip?** — options `Yes, booking it` / `Maybe, still deciding` / `No, not worth it`
   - Paragraph: **Anything we got wrong or missed?** (not required)
2. Responses tab → link to a new spreadsheet.
3. Form ⋮ menu → **Pre-fill form** → pick dummy answers → **Get link**. The URL contains your form ID and two `entry.XXXXXXX` field IDs.
4. In `index.html`, find the marked config block at the top of the `<script>` and set `GOOGLE_FORM_URL` (everything before `/viewform`), `FB_FIELD_CHOICE`, and `FB_FIELD_TEXT`.
5. **Publish** the form with responder access set to *Anyone with the link* — unpublished or restricted forms silently reject submissions.

If you skip this, the feedback card still shows but submissions go nowhere.

## 2. Affiliate ID (optional)

Sign up free at [CJ.com](https://www.cj.com) or [Awin](https://www.awin.com) and apply to the Rentalcars.com program. Put your affiliate code in `AFFILIATE_ID` in the same config block. The "Get real rental quote" button works without it — you just won't earn commission on bookings.

## 3. Footer links

Swap `YOUR_GITHUB_USERNAME` in the footer of `index.html` so "spotted something outdated?" points at your repo's issues.

## 4. Deploy (free)

Any static host works:

- **GitHub Pages** — Settings → Pages → deploy from branch. Live in minutes at `username.github.io/hopscotch`
- **Netlify** — drag the folder onto [app.netlify.com/drop](https://app.netlify.com/drop)
- **Vercel** — import the repo, zero config

A custom domain runs ~$15/year if you want one. Total running cost otherwise: $0.

## 5. Daily feedback report (optional, free)

A GitHub Action (`.github/workflows/daily-report.yml`) reads a published CSV of your responses sheet daily at 14:00 UTC and posts a digest as a GitHub issue — counts of booking/deciding/not-worth-it plus the comments. GitHub's notifications then email it to you. Quiet days are skipped automatically.

1. In the responses spreadsheet: **File → Share → Publish to web** → select the responses sheet → format **CSV** → Publish. Copy the link.
2. Set `CSV_URL` at the top of `scripts/feedback-report.mjs` to that link. (Note: publish-to-web means anyone with the exact URL can read the CSV — acceptable for anonymous feedback, but know the trade-off.)
3. Push to your default branch. Done — the workflow needs no other configuration. Trigger it manually anytime from the **Actions** tab → *Daily feedback report* → *Run workflow*.

**Optional AI summary:** add a repository secret named `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions) and the report upgrades itself from a raw comment list to a Claude-written digest — themes grouped, factual corrections surfaced first, abusive submissions counted but never quoted. Costs pennies at typical volume; without the key the report runs entirely free.

To run a report locally: `node scripts/feedback-report.mjs` (Node 18+).

Note: GitHub pauses scheduled workflows after 60 days of repo inactivity — you'll get a one-click re-enable email if that happens.
