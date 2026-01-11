import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const url = 'http://127.0.0.1:8000';

    // Helper to save screenshot
    const shoot = async (name) => {
        await page.screenshot({ path: `public/screenshots/${name}.png` });
        console.log(`Saved ${name}.png`);
    };

    try {
        // 1. Home / Comfy Theme (Default)
        console.log('Capturing Home...');
        await page.goto(url, { waitUntil: 'networkidle0' });
        // Click focus overlay if present
        const overlay = await page.$('.cursor-pointer');
        if (overlay) await overlay.click();
        await new Promise(r => setTimeout(r, 500)); // Wait for fade
        await shoot('feature_home_comfy');

        // 2. Cyber Theme
        console.log('Capturing Cyber Theme...');
        // Click button with title='cyber'
        await page.click('button[title="cyber"]');
        await new Promise(r => setTimeout(r, 500)); // Wait for theme transition
        await shoot('feature_theme_cyber');

        // Return to comfy
        await page.click('button[title="comfy"]');
        await new Promise(r => setTimeout(r, 500));

        // 3. Zen Mode (Active Typing)
        console.log('Capturing Zen Mode...');
        await page.keyboard.type('t'); // Start typing to trigger running state
        await new Promise(r => setTimeout(r, 1000)); // Wait for opacity fade
        await shoot('feature_zen_mode');

        // 4. Result Card
        console.log('Capturing Result Card...');
        await page.reload({ waitUntil: 'networkidle0' });
        // Click focus again
        const overlay2 = await page.$('.cursor-pointer');
        if (overlay2) await overlay2.click();
        await new Promise(r => setTimeout(r, 500));

        // Get all chars to type
        // The structure is span.relative > span.text-sub (or active class)
        // We can just get text content of the container
        const text = await page.evaluate(() => {
            const container = document.querySelector('.max-w-4xl.text-2xl');
            return container ? container.innerText : "";
        });

        // Clean newlines if any, logic mimics Game.jsx usually just joins words
        // Actually the DOM has spans. Let's type what we see.
        // If we type fast, accuracy should be 100%.
        if (text) {
            console.log(`Typing ${text.length} chars...`);
            await page.keyboard.type(text, { delay: 10 }); // Fast typing
            // Wait for result card
            await page.waitForSelector('.text-7xl', { timeout: 5000 });
            await new Promise(r => setTimeout(r, 1000)); // Wait for animation
            await shoot('feature_result_card');
        }

    } catch (e) {
        console.error('Error capturing gallery:', e);
    }

    await browser.close();
})();
