import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const logs = [];
page.on('console', msg => logs.push(`console:${msg.type()}: ${msg.text()}`));
page.on('pageerror', err => logs.push(`pageerror: ${err.message}`));
page.on('requestfailed', req => logs.push(`requestfailed: ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`));
page.on('response', res => {
	if (res.status() >= 400) {
		logs.push(`response:${res.status()} ${res.request().method()} ${res.url()}`);
	}
});
await page.goto('http://localhost:4200', { waitUntil: 'networkidle', timeout: 60000 });
console.log('TITLE=' + await page.title());
console.log('BODY_TEXT=' + await page.locator('body').innerText().catch(() => 'ERR'));
console.log('URL=' + page.url());
console.log(logs.join('\n'));
await browser.close();