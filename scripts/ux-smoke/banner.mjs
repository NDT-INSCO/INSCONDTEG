import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { axePath, launch, out, root } from './harness.mjs';

const scenarios = [
  ['rtl-desktop', 1440, 960, 'ar', 'dark', false],
  ['rtl-reference', 980, 1315, 'ar', 'dark', false],
  ['ltr-phone', 390, 844, 'en', 'light', false],
  ['no-webgl', 1024, 820, 'en', 'light', true],
];
const names = process.argv.slice(2);
for (const name of names) assert.ok(scenarios.some(([id]) => id === name), `Unknown banner scenario: ${name}`);

for (const [name, width, height, lang, theme, disableWebGL] of scenarios.filter(([id]) => !names.length || names.includes(id))) {
  const browser = await launch({ disableWebGL });
  try {
    const ar = lang === 'ar';
    const phone = width < 640;
    const text = (arabic, english) => ar ? arabic : english;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: phone });
    await context.route('**/*', route => route.request().url().startsWith(root) ? route.continue() : route.abort());
    await context.addInitScript(({ lang, theme }) => {
      localStorage.setItem('insco_language_v1', lang);
      localStorage.setItem('insco_theme_v1', theme);
      // Measure actual WebGL draws, not the app's requested motion state.
      window.bannerDraws = 0;
      if (!window.WebGL2RenderingContext) return;
      const proto = WebGL2RenderingContext.prototype;
      for (const method of ['drawElements', 'drawElementsInstanced', 'drawArrays', 'drawArraysInstanced']) {
        const original = proto[method];
        proto[method] = function (...args) {
          if (this.canvas.closest?.('[data-testid="corporate-hero-backdrop"]')) window.bannerDraws++;
          return original.apply(this, args);
        };
      }
    }, { lang, theme });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(root);
    const chrome = page.locator('#site-chrome');
    const hero = page.getByTestId('corporate-landing-hero');
    const backdrop = hero.getByTestId('corporate-hero-backdrop');
    const canvas = backdrop.locator('canvas');
    const poster = hero.getByTestId('corporate-hero-poster');
    const dock = hero.getByTestId('hero-3d-control-dock');
    const button = (ar, en) => hero.getByRole('button', { name: text(ar, en), exact: true });
    const pause = button('أوقف الحركة', 'Pause motion');
    const resume = button('شغّل الحركة', 'Play motion');
    const banner = button('بانر 3D حي', '3D Banner');

    await hero.waitFor();
    const [box, header, stage, h1] = await Promise.all([
      hero.boundingBox(), chrome.boundingBox(), backdrop.boundingBox(), hero.getByRole('heading', { level: 1 }).boundingBox(),
    ]);
    assert.ok(box && header && stage && h1);
    assert.ok(Math.abs(box.y - header.y - header.height) < 1, 'the banner starts immediately below the sticky navigation');
    assert.ok(stage.x === box.x && stage.width === box.width && Math.abs(stage.height - box.height) <= 1 && stage.y <= h1.y,
      'the scene spans the full content banner behind the title, not a separate frame');
    assert.equal(await chrome.getAttribute('data-masthead-in-view'), null);
    assert.equal(await hero.getByTestId('corporate-hero-metrics').locator(':scope > div').count(), 4);
    assert.equal(await hero.locator('figure').count(), 0);
    assert.equal(await banner.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

    const draws = () => page.evaluate(() => window.bannerDraws);
    const drawingResumes = async (previous = undefined) => {
      try {
        await page.waitForFunction(count => window.bannerDraws > count, previous ?? await draws(), { timeout: 12000 });
      } catch (error) {
        console.error(name, await page.evaluate(() => ({
          draws: window.bannerDraws, hidden: document.hidden, scrollY,
          dock: document.querySelector('[data-testid="hero-3d-control-dock"]')?.textContent,
        })), { canvasVisible: await canvas.isVisible() });
        throw error;
      }
    };
    const verifyStill = async () => {
      await page.waitForTimeout(380); // let an in-flight frame finish
      const count = await draws();
      await page.waitForTimeout(420);
      assert.equal(await draws(), count, 'a paused, hidden or off-screen scene must stop drawing');
    };
    const verifyPoster = async () => {
      await poster.waitFor();
      await poster.locator('img').evaluate(img => img.decode());
      assert.equal(await canvas.count(), 0);
      assert.ok(await button('موجات PAUT', 'PAUT Ultrasonic').isDisabled());
    };

    if (disableWebGL) {
      await page.waitForLoadState('networkidle');
      await verifyPoster();
      await hero.getByRole('link', { name: 'Explore our services' }).click();
      await page.locator('#ndt-methods-catalog').waitFor();
    } else {
      await canvas.waitFor({ timeout: 24000 });
      assert.equal(await pause.count(), 1);
      await drawingResumes();
      const navClip = { x: 0, y: 0, width, height: Math.floor(header.height) };
      const pipeClip = { x: 0, y: Math.ceil(h1.y), width, height: Math.min(height - Math.ceil(h1.y) - 60, 410) };
      const navBefore = await page.screenshot({ clip: navClip });
      const pipeBefore = await page.screenshot({ clip: pipeClip });
      await page.waitForTimeout(600);
      await drawingResumes();
      assert.ok((await page.screenshot({ clip: navClip })).equals(navBefore), 'the nav pixels are independent of the animating pipe');
      assert.ok(!(await page.screenshot({ clip: pipeClip })).equals(pipeBefore), 'the visible scene under the title moves');
      await page.screenshot({ path: join(out, `banner-${name}.jpg`), quality: 88 });

      const menu = chrome.getByRole('button', { name: text('فتح قائمة التنقل', 'Open navigation menu') });
      await menu.click();
      const drawer = page.getByRole('dialog', { name: text('قائمة التنقل', 'Navigation menu') });
      await drawer.waitFor();
      await page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
      assert.ok(await menu.evaluate(el => el === document.activeElement));

      await pause.press('Space');
      await resume.waitFor();
      assert.ok(await resume.evaluate(el => el === document.activeElement));
      await verifyStill();
      for (const [control, status] of [
        [button('أشعة جاما RT', 'Gamma RT'), /Ir-192 \/ Se-75/],
        [button('معالجة PWHT', 'PWHT 65 kW'), text('دورة توضيحية · تسخين ومكوث وتبريد', 'Illustrative ramp, soak and cooling cycle')],
        [button('درزة اللحام', 'Weld Root'), null],
        [button('بانوراما', 'Overview'), null],
      ]) {
        const before = await draws();
        await control.press('Space');
        assert.equal(await control.getAttribute('aria-pressed'), 'true');
        if (status) await hero.getByText(status).waitFor();
        await drawingResumes(before); // still mode and camera changes draw on demand
      }

      // The open banner responds to an actual pointer drag, even while paused.
      await page.evaluate(() => {
        const dock = document.querySelector('[data-testid="hero-3d-control-dock"]').getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + dock.top - innerHeight * 0.68, behavior: 'instant' });
      });
      const start = await canvas.evaluate(el => {
        const navBottom = document.getElementById('site-chrome').getBoundingClientRect().bottom;
        const { top, bottom, right, left } = el.getBoundingClientRect();
        for (let y = Math.ceil(Math.max(top + 12, navBottom + 12)); y < Math.min(bottom, innerHeight - 95); y += 18) {
          for (let x = Math.ceil(Math.max(left, 18)); x < Math.min(right, innerWidth) - 100; x += 20) {
            if (document.elementFromPoint(x, y) === el && document.elementFromPoint(x + 85, y) === el) return { x, y };
          }
        }
        return null;
      });
      assert.ok(start, 'no open drag surface above the control dock');
      const beforeDrag = await draws();
      if (phone) {
        assert.equal(await canvas.evaluate(el => getComputedStyle(el).touchAction), 'pan-y', 'vertical scrolling stays enabled');
        const touch = await context.newCDPSession(page);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        for (const dx of [25, 52, 85]) await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x + dx, y: start.y }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await touch.detach();
      } else {
        await page.mouse.move(start.x, start.y);
        await page.mouse.down();
        await page.mouse.move(start.x + 85, start.y, { steps: 8 });
        await page.mouse.up();
      }
      await drawingResumes(beforeDrag);
      await verifyStill();

      const collapse = button('إخفاء أدوات التحكم', 'Hide Controls');
      const expand = button('إظهار أدوات 3D', 'Show 3D Controls');
      await collapse.press('Enter');
      assert.equal(await expand.getAttribute('aria-expanded'), 'false');
      assert.equal(await dock.getByRole('group').count(), 0);
      await expand.press('Enter');
      assert.equal(await collapse.getAttribute('aria-expanded'), 'true');

      await resume.press('Space');
      await drawingResumes();
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await window.axe.run({ include: ['#site-chrome', '[data-testid="corporate-landing-hero"]'] }, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => [n.target, n.failureSummary]) })));
      assert.deepEqual(violations, []);

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('[data-testid="corporate-landing-hero"]').getBoundingClientRect().bottom < 0);
      assert.equal(await chrome.evaluate(el => el.getBoundingClientRect().top), 0, 'navigation remains sticky');
      await verifyStill();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await drawingResumes();

      if (name === 'rtl-desktop') {
        // Simulate a visibility change and measure the real renderer's response.
        await page.evaluate(() => {
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await verifyStill();
        await page.evaluate(() => {
          delete document.hidden;
          document.dispatchEvent(new Event('visibilitychange'));
        });
        await drawingResumes();
      }

      const field = button('المشهد الميداني', 'Field View');
      await field.click();
      assert.equal(await field.getAttribute('aria-pressed'), 'true');
      await poster.waitFor();
      assert.equal(await canvas.count(), 0);
      if (name === 'ltr-phone') {
        await button('محاكي A-Scan', 'A-Scan Lab').click();
        await hero.getByRole('heading', { name: 'Interactive 3D Pipeline Weld Ultrasonic & Radiography Scanner' }).waitFor();
        assert.equal(await button('محاكي A-Scan', 'A-Scan Lab').getAttribute('aria-pressed'), 'true');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
      }
      await banner.click();
      await canvas.waitFor({ timeout: 24000 });
      await drawingResumes();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await verifyPoster();
      await verifyStill();

      if (name === 'ltr-phone') {
        // Reduced motion defaults to the poster but permits a still 3D view by choice.
        await banner.click();
        await canvas.waitFor({ timeout: 24000 });
        assert.ok(await button('تقليل الحركة', 'Reduced motion').isDisabled());
        await verifyStill();
        await field.click();
        await poster.waitFor();

        // All primary journeys still work with motion switched off.
        const pdf = hero.getByRole('link', { name: /Company profile \(PDF\)/ });
        assert.equal(await pdf.getAttribute('target'), '_blank');
        const response = await context.request.get(new URL(await pdf.getAttribute('href'), root).href);
        assert.ok(response.ok());
        assert.match(response.headers()['content-type'], /application\/pdf/);
        assert.equal(createHash('sha256').update(await response.body()).digest('hex'), 'ccbfdffbc2b8c5dfdf9e8ca9146c77b118e9afea58597f2a3a07d3e4b4ab926e');
        for (const [cta, hash, destination] of [
          [button('اطلب عرض سعر', 'Request a quote'), '#rfq', page.locator('#rfq')],
          [button('بوابة العملاء والملفات', 'Clients & dossiers'), '#client', page.getByTestId('client-portal-root')],
          [button('شاهد العرض الفني', 'Technical demo'), '#demo', page.locator('#inspection-showcase > summary')],
          [button('أكاديمية إنسكو', 'INSCO Academy'), '#academy', page.getByTestId('academy-hub')],
        ]) {
          await cta.click();
          await destination.waitFor({ timeout: 15000 });
          assert.equal(new URL(page.url()).hash, hash);
          assert.equal(await hero.count(), 0);
          assert.equal(await page.getByTestId('company-hero-banner').count(), 0, 'the showcase remains opt-in on the demo index');
          await page.goBack();
          await hero.waitFor();
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ name, width, height, lang, theme, disableWebGL, passed: true }));
  } finally {
    await browser.close();
  }
}
