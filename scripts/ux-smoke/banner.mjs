import assert from 'node:assert/strict';
import { join } from 'node:path';
import { axePath, launch, out, root } from './harness.mjs';

for (const [name, width, height, lang, disableWebGL] of [
  ['rtl-desktop', 1440, 960, 'ar', false],
  ['ltr-phone', 390, 844, 'en', false],
  ['no-webgl', 1024, 820, 'en', true],
]) {
  const browser = await launch({ disableWebGL });
  try {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route('**/*', route => route.request().url().startsWith(root) ? route.continue() : route.abort());
    await context.addInitScript(lang => {
      localStorage.setItem('insco_language_v1', lang);
      // Count actual GPU draws from the homepage canvas, not requestAnimationFrame
      // calls from the header or from other elements on the page.
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
    }, lang);
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(root);
    const hero = page.getByTestId('corporate-landing-hero');
    const backdrop = hero.getByTestId('corporate-hero-backdrop');
    const canvas = backdrop.locator('canvas');
    const photo = hero.getByRole('img');
    const draws = () => page.evaluate(() => window.bannerDraws);
    const drawingResumes = async () => {
      await page.waitForFunction(previous => window.bannerDraws > previous, await draws(), { timeout: 12000 });
    };
    const verifyStill = async () => {
      await page.waitForTimeout(400); // allow an in-flight frame to finish
      const count = await draws();
      await page.waitForTimeout(400);
      assert.equal(await draws(), count, 'the backdrop must stop drawing when paused');
    };

    if (disableWebGL) {
      await page.waitForLoadState('networkidle');
      await photo.waitFor();
      await photo.evaluate(img => img.decode());
      assert.equal(await hero.locator('canvas').count(), 0);
      assert.equal(await hero.getByRole('button', { name: 'Pause motion' }).count(), 0);
      await hero.getByRole('link', { name: 'Explore our services' }).click();
      await page.locator('#ndt-methods-catalog').waitFor();
    } else {
      await hero.locator('.corporate-hero-stage').scrollIntoViewIfNeeded();
      const pause = hero.getByRole('button', { name: lang === 'ar' ? 'أوقف الحركة' : 'Pause motion' });
      const resume = hero.getByRole('button', { name: lang === 'ar' ? 'شغّل الحركة' : 'Play motion' });
      await pause.waitFor({ timeout: 24000 });
      await drawingResumes();
      assert.equal(await backdrop.getAttribute('aria-hidden'), 'true');
      assert.equal(await backdrop.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

      const before = await canvas.screenshot();
      await page.waitForTimeout(550);
      assert.notDeepEqual(await canvas.screenshot(), before, 'the rendered scene must move');
      await pause.press('Space');
      await resume.waitFor();
      assert.ok(await resume.evaluate(el => el === document.activeElement));
      await verifyStill();
      await resume.press('Space');
      await drawingResumes();
      await page.screenshot({ path: join(out, `banner-${name}.jpg`), quality: 88 });
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await window.axe.run('[data-testid="corporate-landing-hero"]', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
      assert.deepEqual(violations, []);

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.corporate-hero-stage').getBoundingClientRect().bottom < 0);
      await verifyStill();
      await hero.locator('.corporate-hero-stage').scrollIntoViewIfNeeded();
      await drawingResumes();

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await backdrop.waitFor({ state: 'detached' });
      await photo.waitFor();
      await hero.getByRole('button', { name: lang === 'ar' ? 'الأكاديمية الهندسية' : 'Engineering Academy' }).click();
      await page.getByTestId('academy-hub').waitFor();
      assert.equal(await backdrop.count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ name, width, height, lang, disableWebGL, passed: true }));
  } finally {
    await browser.close();
  }
}
