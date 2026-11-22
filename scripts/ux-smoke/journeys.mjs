import assert from 'node:assert/strict';
import fs from 'node:fs';
import { join } from 'node:path';
import { axePath, launch, out, root } from './harness.mjs';
for (const [name, width, height, language, theme] of [['rtl-phone',390,844,'ar','dark'], ['ltr-desktop',1440,1000,'en','light']]) {
  const browser = await launch({ disableWebGL: width > 1000 });
  try {
    const ctx = await browser.newContext({viewport:{width,height}, reducedMotion:'reduce'});
    await ctx.addInitScript(({language,theme})=>{
      if(!localStorage.getItem('insco_language_v1')) localStorage.setItem('insco_language_v1',language);
      if(!localStorage.getItem('insco_theme_v1')) localStorage.setItem('insco_theme_v1',theme);
    },{language,theme});
    await ctx.route('**/*',r=>r.request().url().startsWith(root) ? r.continue() : r.abort());
    const p = await ctx.newPage();
    const ar = language === 'ar';
    const localErrors = [], pageErrors = [], requested = [];
    p.on('response', r=>{if(r.url().startsWith(root)&&r.status()>=400) localErrors.push([r.status(),r.url()]);});
    p.on('pageerror',e=>pageErrors.push(e.message));
    p.on('request',r=>requested.push(r.url()));
    const marks = [];
    const loaded = async fragment => { await p.goto(root+fragment,{waitUntil:'domcontentloaded'}); };
    const focused = async target => assert.equal(await target.evaluate(el=>document.activeElement===el),true, `focus not restored to ${await target.getAttribute('aria-label') ?? await target.textContent()}`);
    const atAnchor = async id => {
      await p.locator(`[id="${id}"]`).waitFor({timeout:9000});
      await p.waitForFunction(target=>{
        const section=document.getElementById(target), chrome=document.getElementById('site-chrome');
        return !!section && section.getBoundingClientRect().top >= (chrome?.getBoundingClientRect().bottom ?? 0)-1 && section.getBoundingClientRect().top < innerHeight;
      },id,{timeout:8000});
    };
    const fit = async where => {
      const rect = await p.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      assert.equal(rect.scrollWidth,rect.width,`${name}: ${where} overflow ${rect.scrollWidth} at ${rect.width}`);
    };
    const axe = async where => {
      if (!await p.evaluate(()=>Boolean(window.axe))) await p.addScriptTag({path:axePath});
      const violations = await p.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,failure:n.failureSummary}))})));
      fs.writeFileSync(join(out, `axe-${name}-${where}.json`),JSON.stringify(violations,null,2));
      console.log(JSON.stringify({axe:name,where,findings:violations.map(v=>[v.id,v.nodes.length])}));
      assert.deepEqual(violations, [], `${name}: ${where} accessibility rules`);
    };
    async function keyboardDialog(trigger, title) {
      const dialog = title ? p.getByRole('dialog',{name:title}) : p.getByRole('dialog');
      await trigger.focus(); await p.keyboard.press('Enter'); await dialog.waitFor({timeout:10000});
      await dialog.evaluate(el=>{if(!el.contains(document.activeElement)) throw new Error('Dialog did not receive focus')});
      for (const key of ['Shift+Tab','Tab','Tab','Shift+Tab']) {
        await p.keyboard.press(key);
        await dialog.evaluate(el=>{if(!el.contains(document.activeElement)) throw new Error('Dialog leaked focus')});
      }
      await p.keyboard.press('Escape'); await dialog.waitFor({state:'hidden'}); await focused(trigger);
    }

    await loaded(''); await p.getByTestId('corporate-landing-hero').waitFor();
    const menu = p.getByRole('button',{name:ar?'فتح قائمة التنقل':'Open navigation menu'});
    await keyboardDialog(menu,ar?'قائمة التنقل':'Navigation menu');
    await keyboardDialog(p.getByRole('button',{name:ar?'دليل البوابات':'Portal guide'}));
    const accountBar = p.getByTestId('site-account-actions');
    const signIn = () => accountBar.getByRole('button',{name:ar?'تسجيل الدخول':'Sign in',exact:true});
    await keyboardDialog(signIn());
    await keyboardDialog(accountBar.getByRole('button',{name:ar?'إنشاء حساب':'Create account',exact:true}));
    await keyboardDialog(p.getByTestId('insco-dual-ai-launcher'));
    marks.push('drawer/guide/account/AI dock: Enter, Tab, Shift+Tab, Escape, return focus');

    const settings = p.getByTestId('global-app-config-toggle');
    await settings.focus(); await p.keyboard.press('Space');
    const settingsPanel = p.getByTestId('global-app-config-panel');
    await settingsPanel.waitFor();
    const bounds=await settingsPanel.boundingBox();
    assert.ok(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+1,'settings are fully visible');
    await settingsPanel.getByRole('button',{name:ar?'إغلاق الإعدادات':'Close settings'}).focus();
    await p.keyboard.press('Escape'); await settingsPanel.waitFor({state:'hidden'}); await focused(settings);
    await fit('settings dismissed');
    marks.push('settings stay in viewport and Escape restores focus');

    if (!ar) {
      await p.keyboard.press('/');
      const input=p.getByRole('searchbox'); await focused(input);
      await input.fill('ISO 9001'); await p.getByRole('search').getByText('ISO 9001:2015 — Quality Management System',{exact:false}).first().waitFor({timeout:5000});
      await fit('open global search'); await axe('search');
      await p.keyboard.press('Escape');
      await p.locator('#global-header-search-results').waitFor({state:'detached'});
      await focused(input);
      marks.push('search opens, resolves ISO, keyboard-dismisses without losing focus');
    }

    await loaded('#services-regional-map'); await atAnchor('services-regional-map');
    await loaded('#standards-matrix'); await atAnchor('standards-matrix');
    await p.goBack(); await atAnchor('services-regional-map');
    await p.goForward(); await atAnchor('standards-matrix');
    marks.push('lazy route anchors clear the header during direct and history navigation');

    await loaded('#demo'); await p.locator('#inspection-showcase > summary').waitFor();
    await p.waitForLoadState('networkidle');
    assert.equal(await p.locator('details[open]').count(),0);
    assert.equal(requested.some(u=>/\/(InscoHero3dBanner|three(?:[.-])|OrbitControls|CompanyHero-)/.test(u)),false);
    const summary = p.locator('#inspection-showcase > summary');
    await summary.press('Enter');
    await p.locator('#inspection-showcase[open]').waitFor({timeout:9000});
    const showcase=p.getByTestId('company-hero-banner');
    await showcase.waitFor({state:'attached',timeout:18000}).catch(async error=>{
      console.log(JSON.stringify({failedDemo:name,requested:requested.filter(u=>/demo|hero|three|orbit/i.test(u)),localErrors,pageErrors,details:await p.locator('#inspection-showcase').evaluate(e=>e.outerHTML.slice(0,1300)),focus:await p.evaluate(()=>document.activeElement?.outerHTML.slice(0,300)),href:p.url()}));
      throw error;
    });
    const visual = p.getByTestId(ar?'insco-3d-banner-canvas-host':'insco-3d-banner-fallback');
    await (ar ? visual.locator('canvas') : visual).waitFor({state:'attached',timeout:18000});
    assert.ok(requested.some(u=>u.includes('InscoHero3dBanner-')));
    const controls = p.getByTestId('hero-3d-control-dock'); await controls.waitFor();
    assert.ok(await controls.getByRole('button',{name:ar?'تقليل الحركة':'Reduced motion'}).isDisabled());
    const technique=controls.getByRole('button',{name:ar?'معالجة PWHT':'PWHT 65 kW'});
    await technique.focus(); await p.keyboard.press('Space'); assert.equal(await technique.getAttribute('aria-pressed'),'true');
    await fit('open 3D');
    if (ar) await p.screenshot({path:join(out, 'demo-controls.jpg'),quality:81,animations:'disabled'});
    // Close the large canvas before loading other labs in the same browser.
    await p.locator('#inspection-showcase > summary').click(); await showcase.waitFor({state:'detached'});
    await loaded('#pwht-simulator'); await atAnchor('pwht-simulator');
    await p.locator('[data-demonstration="pwht-simulator"]').waitFor({timeout:10000});
    assert.equal(await p.locator('details[open]').count(),1);
    assert.equal(await showcase.count(),0);
    await loaded('#demo/pwht-simulator'); await atAnchor('pwht-simulator');
    await p.locator('#pwht-simulator > summary').press('Space');
    await p.locator('#pwht-simulator[open]').waitFor({state:'detached'});
    await p.locator('a[href="#demo/pwht-simulator"]').click();
    await p.locator('[data-demonstration="pwht-simulator"]').waitFor();
    await loaded('#demo/inspection-showcase'); await atAnchor('inspection-showcase'); await showcase.waitFor({state:'attached',timeout:18000});
    for (const lab of ['radiography-viewer', 'ultrasonic-lab', 'hologram-lab']) {
      await loaded(`#${lab}`); await atAnchor(lab);
      await p.locator(`[data-demonstration="${lab}"]`).waitFor({timeout:18000});
      assert.equal(await p.locator('details[open]').count(),1);
      assert.equal(await showcase.count(),0);
    }
    const galleryPhoto = p.locator('[data-demonstration="hologram-lab"] button[aria-haspopup="dialog"]').first();
    await keyboardDialog(galleryPhoto);
    marks.push('no demo/Three request before opt-in; all five anchors, same-link reopen, canvas / no-WebGL fallback, reduced motion, gallery Escape');

    await loaded('#academy'); await p.getByTestId('academy-hub').waitFor({timeout:15000});
    await fit('academy hub');
    assert.equal(await p.locator('[data-company-detail]').count(),0);
    await keyboardDialog(signIn());
    await loaded('#academy/disciplines'); await p.getByTestId('academy-discipline-index').waitFor();
    await fit('disciplines');
    await loaded('#client/companies'); await p.getByTestId('client-portal-root').waitFor();
    await fit('client companies'); await keyboardDialog(signIn());
    await loaded('#network/jobs'); await p.locator('[data-portal="network"]').waitFor();
    await accountBar.waitFor(); await fit('network jobs'); await keyboardDialog(signIn());
    marks.push('academy hub, disciplines, client companies, Network jobs and shared guest account');

    if (!ar) {
      await loaded('#courses');
      const start=p.getByRole('button',{name:'Start course',exact:true}).first();
      await start.click({timeout:15000}); await p.getByRole('heading',{name:'Learning outcomes'}).waitFor();
      const firstLesson=p.getByRole('heading',{name:'Lessons',exact:true}).locator('../..').getByRole('button').first();
      await firstLesson.click(); await p.getByRole('button',{name:'Mark complete',exact:true}).click();
      await p.getByRole('button',{name:/Complete ✓/}).waitFor();
      await loaded('#academy/progress'); await p.getByText(/NDE-Ed self-study progress/i).first().waitFor({timeout:9000});
      await fit('academy progress');
      marks.push('course → lesson → mark complete → progress');
    }

    await loaded('#certification_center'); await fit('academy practice');
    const plan=p.getByRole('button',{name:ar?'خطّط للمذاكرة':'Plan study session',exact:true}).first();
    await plan.click({timeout:10000});
    const form=p.getByRole('dialog'); await form.waitFor();
    const studyOn = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0,10);
    const date=form.locator('input[type=date]'); await date.fill(studyOn);
    assert.equal(await form.locator('input:not([type=date])').count(),0);
    await form.getByRole('button',{name:ar?'احفظ خطة المذاكرة':'Save study plan',exact:true}).click();
    await p.getByRole('dialog').getByText(studyOn,{exact:true}).waitFor();
    assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('insco_exam_practice_plans_v1')).length),1);
    await p.keyboard.press('Escape'); await p.getByRole('dialog').waitFor({state:'hidden'});
    await loaded('#ask_ai');
    const notice=ar?'المستشار الذكي غير مُهيّأ على هذه النسخة':'The tutor is not configured on this deployment';
    await p.getByText(notice,{exact:true}).waitFor({timeout:12000});
    assert.ok(await p.getByRole('button',{name:ar?'ابحث في المكتبة بدلاً من ذلك':'Search the library instead'}).isVisible());
    marks.push('practice plan only; static tutor library fallback');

    await p.getByTestId('global-theme-toggle').click();
    const switched=theme==='light'?'dark':'light';
    assert.equal(await p.locator('html').getAttribute('data-theme'),switched);
    await p.getByRole('button',{name:ar?'English':'العربية',exact:true}).click();
    assert.equal(await p.locator('html').getAttribute('dir'),ar?'ltr':'rtl');
    await p.reload(); await p.getByTestId('site-account-actions').waitFor();
    assert.equal(await p.locator('html').getAttribute('data-theme'),switched);
    assert.equal(await p.locator('html').getAttribute('dir'),ar?'ltr':'rtl');
    marks.push('theme and direction controls persist on reload');
    assert.deepEqual(localErrors,[]);
    assert.deepEqual(pageErrors,[]);
    console.log(JSON.stringify({name,marks,localErrors,pageErrors}));
  } finally { await browser.close(); }
}
