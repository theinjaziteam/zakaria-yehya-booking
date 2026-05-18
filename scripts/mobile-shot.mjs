import { chromium, devices } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ ...devices['iPhone 14 Pro Max'] });
const page = await context.newPage();
await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' });
await page.screenshot({ path: '/mnt/user-data/outputs/zakaria-home-mobile.png', fullPage: true });
await browser.close();
