import assert from 'node:assert/strict';
import fs from 'node:fs';
import { join } from 'node:path';
import { axePath, docs, launch, out, root } from './harness.mjs';
for (const [name, width, height, lang, theme] of [
  ['mobile', 390, 844, 'ar','dark'], ['desktop',1440,1000,'en','dark'],
  ['small',320,730,'en','light'], ['tablet',768,1024,'ar','light'],
  ['laptop',1024,768,'en','light'], ['compact-desktop',1280,800,'ar','dark'],
]) {
  const browser = await launch({ disableWebGL: true });
  try {
    const ctx = await browser.newContext({ viewport:{width,height}, reducedMotion:'reduce' });
    const offOrigin = new Set();
    await ctx.route('**/*', route => {
      const url = route.request().url();
      if(url.startsWith(root)) return route.continue();
      offOrigin.add(new URL(url).host);
      return route.abort();
    });
    await ctx.addInitScript(({lang,theme})=>{localStorage.setItem('insco_language_v1',lang);localStorage.setItem('insco_theme_v1',theme);},{lang,theme});
    const page = await ctx.newPage();
    const responseErrors = [], pageErrors = [], consoleErrors = [];
    page.on('response',r=>{ if(r.url().startsWith(root) && r.status()>=400) responseErrors.push([r.status(),r.url()]); });
    page.on('pageerror',e=>pageErrors.push(e.message));
    page.on('console',msg=>{if(msg.type()==='error') consoleErrors.push(msg.text());});
    await page.goto(root,{waitUntil:'networkidle'});
    const hero = page.getByTestId('corporate-landing-hero');
    await hero.waitFor();
    await hero.getByTestId('corporate-hero-poster').locator('img').evaluate(img=>img.decode());
    const skr = await page.evaluate(()=>[...new Set(performance.getEntriesByType('resource').map(e=>e.name).filter(name=>/\.js$/.test(name)))].map(u=>u.split('/').at(-1)));
    assert.equal(skr.some(n=>/^(InscoHero3dBanner|three|OrbitControls|CompanyDemoPortal)/i.test(n)), false);
    const rawJSBytes = skr.reduce((sum,n)=>sum + fs.statSync(join(docs, `assets/${n}`)).size,0);
    async function layout(where) {
      await page.waitForTimeout(110);
      const result = await page.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,
        dir:document.documentElement.dir, theme:document.documentElement.dataset.theme}));
      if(result.doc > width) console.log(JSON.stringify({overflow:where,...result}));
      assert.equal(result.doc,width,`${name} ${where} is wider than its viewport`);
      assert.equal(result.dir,lang==='ar'?'rtl':'ltr');
      assert.equal(result.theme,theme);
      return result;
    }
    const start = await layout('home');
    if(name==='desktop'||name==='mobile'||name==='tablet') {
      await page.screenshot({path:join(out, `home-${name}.jpg`),quality:87,animations:'disabled'});
      // Programmatic contrast/name/landmark checks in the actual browser.
      await page.addScriptTag({path:axePath});
      const axe = await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations
        .map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>[n.target,n.failureSummary])})));
      fs.writeFileSync(join(out, `axe-${name}.json`), JSON.stringify(axe,null,2));
      console.log(JSON.stringify({axe:name, findings:axe.map(v=>[v.id,v.nodes.length])}));
      assert.deepEqual(axe, [], `${name}: home accessibility rules`);
    }
    await page.keyboard.press('Tab');
    assert.match(await page.evaluate(()=>document.activeElement.textContent),/Skip to content|تخطَّ إلى المحتوى/);
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'insco-main');
    await hero.getByRole('link',{name:/explore our services|استكشف خدماتنا/i}).click();
    await page.locator('#ndt-methods-catalog').waitFor();
    assert.match(page.url(),/#services$/);
    await layout('services');
    await page.goBack();
    await hero.waitFor();
    await hero.scrollIntoViewIfNeeded();
    await page.locator('a.corporate-service-card[href="#services/ndt/rt"]').click();
    await page.locator('#service-method-rt').waitFor();
    assert.match(page.url(),/#services\/ndt\/rt$/);
    await page.getByRole('button',{name:/quote for this service|اطلب عرض سعر لهذه الخدمة/i}).click();
    await page.locator('#rfq select').waitFor();
    assert.equal(await page.locator('#rfq select').inputValue(),'rt_gamma');
    assert.equal(await page.locator('#rfq form button[type=submit]').count(),0);
    assert.ok(await page.getByRole('button',{ name:/Copy request draft|نسخ مسودة الطلب/i }).isVisible());
    await layout('rfq');
    await page.goto(root+'#capabilities',{waitUntil:'networkidle'});
    await page.locator('#fleet-inspector').waitFor();
    await layout('fleet');
    await page.goto(root+'#inspector-qr-access',{waitUntil:'networkidle'});
    await page.locator('#inspector-qr-access').waitFor();
    await layout('field');
    await page.goto(root+'#services-regional-map',{waitUntil:'networkidle'});
    const deep = page.locator('#services-regional-map');
    await deep.waitFor();
    await page.waitForFunction(()=> {
      const el=document.querySelector('#services-regional-map'), chrome=document.querySelector('#site-chrome');
      return el && chrome && el.getBoundingClientRect().top>=chrome.getBoundingClientRect().bottom-1 && el.getBoundingClientRect().top < innerHeight;
    },{},{timeout:5000});
    const diagnostics={responseErrors,pageErrors,consoleErrors,offOrigin:[...offOrigin]};
    console.log(JSON.stringify({name,...start,rawJSBytes,scripts:skr,diagnostics}));
    assert.deepEqual(responseErrors,[]);
    assert.deepEqual(pageErrors,[]);
    assert.deepEqual(consoleErrors,[]);
    assert.deepEqual([...offOrigin],[]);
  } finally {await browser.close();}
}
