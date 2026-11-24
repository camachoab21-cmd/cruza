const {chromium}=require('C:/Users/camac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/camac/Documents/Codex/2026-11-05/referenced-chatgpt-conversation-this-is-an/work/browsers/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe'});
 try {
  for(const reducedMotion of ['no-preference','reduce']) {
   const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion});
   const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8765/');
   await page.locator('#auth-user').fill('ESTUDIANTE');await page.locator('#auth-pass').fill('CRUZA2026');await page.locator('#login-button').click();await page.locator('.sidebar').waitFor();
   await page.locator('.sidebar [data-route="inscripcion"]').click();await page.locator('.course-card').first().waitFor();
   assert.equal(await page.locator('link[href*="cruza-expo-pulido.css"]').count(),1);
   const before=await page.locator('.class-block').first().evaluate(e=>getComputedStyle(e,'::after').animationName);
   await page.locator('.class-block').first().hover();
   const after=await page.locator('.class-block').first().evaluate(e=>getComputedStyle(e,'::after').animationName);
   if(reducedMotion==='reduce') assert.equal(after,'none'); else assert.equal(after,'cruza-expo-shine');
   if(reducedMotion==='no-preference') {
    await page.screenshot({path:'docs/auditoria/pulido-claro-escritorio.png'});
    await page.locator('[data-action="theme"]').click();await page.screenshot({path:'docs/auditoria/pulido-oscuro-escritorio.png'});
    await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('.sidebar').waitFor();await page.locator('[data-action="menu"]').click();await page.locator('.sidebar [data-route="inscripcion"]').click();await page.waitForTimeout(500);await page.screenshot({path:'docs/auditoria/pulido-oscuro-movil.png'});
    const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,x:scrollX,offenders:[...document.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right+scrollX>innerWidth+3).slice(0,8).map(e=>({tag:e.tagName,cls:String(e.className),right:e.getBoundingClientRect().right}))}));
    assert.ok(layout.scroll<=layout.width+3,JSON.stringify(layout));
    await page.locator('[data-action="theme"]').click();await page.screenshot({path:'docs/auditoria/pulido-claro-movil.png'});
   }
   assert.deepEqual(errors,[]);console.log(reducedMotion, 'ok',before,'→',after);await context.close();
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
