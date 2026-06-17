import { chromium } from 'playwright';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ANTHROPIC_API_KEY;
const APP_URL = process.env.APP_URL || 'https://iamin.lovable.app';

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY not set. Create .env file with your API key.');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: API_KEY,
});

const reportsDir = 'test-reports';
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = path.join(reportsDir, `report-${timestamp}.md`);
let report = `# Automated Testing Report\n\n**Timestamp:** ${new Date().toISOString()}\n**App URL:** ${APP_URL}\n\n`;

async function analyzeScreenshot(page, stepName, description) {
  try {
    const screenshot = await page.screenshot({ encoding: 'base64' });

    console.log(`\n📸 Analyzing: ${stepName}`);

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this screenshot of the app. ${description}\n\nLook for:\n1. UI bugs (misaligned, cut-off, hidden elements)\n2. Missing content or broken states\n3. Error messages or console issues\n4. Usability problems\n5. Performance issues (loading states, lag)\n\nBe specific. If everything looks good, say so.`,
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: screenshot,
              },
            },
          ],
        },
      ],
    });

    const analysis = response.content[0].type === 'text' ? response.content[0].text : '';

    console.log(`✅ Analysis complete`);
    report += `\n## ${stepName}\n\n${description}\n\n**Analysis:**\n${analysis}\n\n---\n`;

    return analysis;
  } catch (error) {
    console.error(`❌ Error analyzing ${stepName}:`, error.message);
    report += `\n## ${stepName}\n\n**ERROR:** ${error.message}\n\n---\n`;
    return null;
  }
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.createBrowserContext({ viewport: { width: 390, height: 844 } }); // iPhone size
  const page = await context.newPage();

  try {
    console.log(`🚀 Starting test agent for ${APP_URL}\n`);

    // Wait for app to load
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Test 1: Feed page
    await analyzeScreenshot(
      page,
      'Feed Page (Landing)',
      'Should show "I am (IN)" header, tabs (Inner Circle / City Pulse), event cards, and bottom tab bar.'
    );

    // Test 2: Try to navigate to calendar
    await page.click('text=Calendar').catch(() => {});
    await page.waitForTimeout(1500);
    await analyzeScreenshot(
      page,
      'Calendar Tab',
      'Should show a calendar view. Check for rendering issues, dates, and event indicators.'
    );

    // Test 3: Capsule tab
    await page.click('text=Capsule').catch(() => {});
    await page.waitForTimeout(1500);
    await analyzeScreenshot(
      page,
      'Capsule Tab',
      'Should show capsule/memory circles. Check if they render properly and are clickable.'
    );

    // Test 4: Profile tab
    await page.click('text=Profile').catch(() => {});
    await page.waitForTimeout(1500);
    await analyzeScreenshot(
      page,
      'Profile Tab',
      'Should show user profile, avatar, stats, highlights row. Check glass effects and scrollability.'
    );

    // Test 5: Settings
    try {
      await page.click('[aria-label="Settings"]').catch(() => {});
      await page.waitForTimeout(1000);
      await analyzeScreenshot(
        page,
        'Settings Sheet',
        'Should show settings options. Check if sheet opens, content is readable, buttons work.'
      );
      await page.click('text=Back').catch(() => page.press('Escape'));
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('⚠️  Settings sheet not found, skipping');
    }

    // Test 6: Notifications
    try {
      await page.click('[aria-label*="notification"], [aria-label*="Bell"]').catch(() => {});
      await page.waitForTimeout(1000);
      await analyzeScreenshot(
        page,
        'Notifications Screen',
        'Should show notification list. Check grouping (today/earlier), read/unread states.'
      );
      await page.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      console.log('⚠️  Notifications not found, skipping');
    }

    // Test 7: Try clicking first event card
    try {
      const firstCard = await page.locator('[role="button"]').filter({ has: page.locator('text=/VORSICHT|Flohmarkt|Kellernacht/') }).first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForTimeout(1500);
        await analyzeScreenshot(
          page,
          'Event Detail Screen',
          'Should show event title, location, attendees, radar/line tabs, RSVP button. Check layout and interactivity.'
        );
        await page.press('Escape');
        await page.waitForTimeout(500);
      }
    } catch (e) {
      console.log('⚠️  Event detail interaction failed, skipping');
    }

    // Test 8: Bottom bar glass effect check
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await analyzeScreenshot(
      page,
      'Bottom Navigation Bar (Glass Effect)',
      'Check that the bottom tab bar has blur/glass effect and feed cards scroll underneath it without being clipped.'
    );

    // Test 9: Scroll test
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
    await analyzeScreenshot(
      page,
      'Feed Scroll Behavior',
      'Cards should scroll smoothly. Check that cards bleed under the glass nav bar. No layout shifts or jumps.'
    );

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test suite error:', error.message);
    report += `\n\n## Fatal Error\n\n${error.message}\n`;
  } finally {
    // Generate console logs if available
    const logs = await page.evaluate(() => window.__errors__ || []);
    if (logs.length > 0) {
      report += `\n## Console Errors\n\n\`\`\`\n${logs.join('\n')}\n\`\`\`\n`;
    }

    await browser.close();

    // Write report
    fs.writeFileSync(reportFile, report);
    console.log(`\n📄 Report saved to: ${reportFile}`);
    console.log('\n─────────────────────');
    console.log(report);
  }
}

runTests().catch(console.error);
