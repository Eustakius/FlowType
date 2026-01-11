import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to a nice laptop size
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to app...');
    await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle0' });

    // Type a bit to show activity? Or just show the initial state.
    // Let's just capture the authentic start screen.

    console.log('Capturing screenshot...');
    // Ensure directory exists (node should handle this relative path if dir exists, otherwise mkdir)
    // We already made the dir earlier.

    await page.screenshot({ path: 'public/screenshots/demo.png', fullPage: false });

    console.log('Screenshot saved to public/screenshots/demo.png');

    await browser.close();
})();
