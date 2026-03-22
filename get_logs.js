import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  let logOutput = "";
  const log = (msg) => {
      console.log(msg);
      logOutput += msg + '\n';
  };

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => log(`PAGE LOG: [${msg.type()}] ${msg.text()}`));
    page.on('pageerror', error => log(`PAGE ERROR: ${error.message}`));
    page.on('requestfailed', request =>
      log(`REQUEST FAIL: ${request.url()} - ${request.failure() ? request.failure().errorText : ''}`)
    );

    log('Navigating...');
    await page.goto('http://localhost:5173/?view=proposalDetail&id=1', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });
    
    log('Navigation complete. Waiting 2 seconds...');
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
  } catch(e) {
    log(`Puppeteer Error: ${e}`);
  }

  fs.writeFileSync('logs.txt', logOutput);
})();
