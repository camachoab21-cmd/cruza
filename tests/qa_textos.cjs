const { chromium } = require('C:/Users/camac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath: 'C:/Users/camac/Documents/Codex/2026-11-05/referenced-chatgpt-conversation-this-is-an/work/browsers/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:8765/');
    await page.locator('#auth-user').fill('ESTUDIANTE');
    await page.locator('#auth-pass').fill('CRUZA2026');
    await page.locator('#login-button').click();
    await page.locator('.sidebar').waitFor();
    const dashboard = await page.locator('#content').innerText();
    assert.doesNotMatch(dashboard, /\b1 pendientes\b/);
    assert.doesNotMatch(dashboard, /Próxima clase/);
    await page.locator('.sidebar [data-route="calendario"]').click();
    const calendar = await page.locator('#content').innerText();
    assert.match(calendar, /mié/i);
    assert.match(calendar, /sáb/i);
    assert.doesNotMatch(calendar, /\b2026-11-11\b/);
    await page.locator('.sidebar [data-route="notas"]').click();
    assert.doesNotMatch(await page.locator('#content').innerText(), /Escala oficial/);
    console.log('Textos de tablero, calendario y notas: correctos');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
