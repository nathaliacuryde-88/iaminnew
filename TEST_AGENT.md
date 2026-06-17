# Automated Testing Agent

This test agent automatically crawls your live app and uses Claude to identify bugs, UX issues, and broken flows.

## Setup

### 1. Get your API key
- Go to [console.anthropic.com](https://console.anthropic.com)
- Create an API key
- Copy it

### 2. Create `.env` file
```bash
cp .env.example .env
```

Edit `.env` and add:
```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
APP_URL=https://iamin.lovable.app
```

If you want to test locally instead:
```
APP_URL=http://localhost:5173
```

### 3. Run the test agent
```bash
npm run test:agent
```

The agent will:
- Open your app in a simulated iPhone (390×844)
- Navigate through key flows (feed, calendar, capsule, profile, settings, etc.)
- Take screenshots at each step
- Send them to Claude for analysis
- Generate a detailed report in `test-reports/`

## What it checks

✅ **UI Issues:** Layout bugs, cut-off elements, glass effect problems
✅ **Missing Content:** Broken states, empty feeds, failed loads
✅ **User Flows:** Onboarding, RSVP, navigate tabs, open modals
✅ **Performance:** Loading states, scroll lag, network issues
✅ **Error States:** Console errors, missing data, failed requests

## Report

After running, check `test-reports/report-TIMESTAMP.md` for:
- Screenshots analysis
- Identified bugs
- UI/UX issues
- Recommendations

## Run automatically

### Option A: Run daily
```bash
npm run test:agent  # run manually once a day
```

### Option B: GitHub Actions (scheduled)
Create `.github/workflows/test-agent.yml`:

```yaml
name: Automated Testing Agent

on:
  schedule:
    - cron: '0 9 * * *'  # Every day at 9 AM UTC
  workflow_dispatch:     # Manually trigger

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm install
      - run: npm run test:agent
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          APP_URL: https://iamin.lovable.app
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-reports
          path: test-reports/
```

Then add your API key as a GitHub secret:
1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `ANTHROPIC_API_KEY`
4. Paste your API key

## Output

Each run generates a markdown report with:
- Timestamp and app URL
- Screenshots with Claude's analysis
- Identified bugs and issues
- Console errors (if any)

Reports are saved in `test-reports/` and can be stored as GitHub artifacts for history.

## Tips

- Run this **before pushing to GitHub** to catch bugs early
- Schedule it to run daily on your live Lovable preview
- Share reports with your team to discuss found issues
- Use findings to prioritize fixes

## Customizing

To add more test flows, edit `scripts/test-agent.mjs` and add more `analyzeScreenshot()` calls.

Example:
```javascript
// Click create button
await page.click('[data-testid="create-btn"]');
await page.waitForTimeout(1500);
await analyzeScreenshot(
  page,
  'Create Event Modal',
  'Should show form fields: title, date, location, vibe category.'
);
```

---

**Note:** The test agent uses your Claude API credits. Typical analysis costs ~$0.10-0.30 per run (9-12 screenshots × ~0.03 per image).
