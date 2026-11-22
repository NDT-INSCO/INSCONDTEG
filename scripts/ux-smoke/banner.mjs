import assert from 'node:assert/strict';
import { join } from 'node:path';
import { axePath, launch, out, root } from './harness.mjs';

for (const [name, width, height, lang, theme, disableWebGL] of [
  ['rtl-desktop', 1440, 960, 'ar', 'dark', false],
  ['ltr-phone', 390, 844, 'en', 'light', false],
  ['no-webgl', 1024, 820, 'en', 'light', true],
]) {
  const browser = await launch({ disableWebGL });
  try {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route('**/*', route => route.request().url().startsWith(root) ? route.continue() : route.abort());
    await context.addInitScript(({ lang, theme }) => {
      localStorage.setItem('insco_language_v1', lang);
      localStorage.setItem('insco_theme_v1', theme);
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
    }, { lang, theme });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(root);
    const chrome = page.locator('#site-chrome');
    const hero = page.getByTestId('corporate-landing-hero');
    const stage = hero.getByTestId('corporate-masthead-backdrop');
    const backdrop = stage.getByTestId('corporate-hero-backdrop');
    const canvas = backdrop.locator('canvas');
    const photo = stage.locator('img');
    await stage.waitFor();
    await chrome.and(page.locator('[data-masthead-in-view]')).waitFor();
    const box = await stage.boundingBox();
    const header = await chrome.boundingBox();
    assert.ok(box && header && Math.abs(box.y - header.y) < 1 && box.width === header.width && box.height > header.height,
      'one backdrop must span the actual navigation and the opening copy');
    assert.equal(await hero.locator('figure').count(), 0);
    assert.equal(await stage.getAttribute('aria-hidden'), 'true');
    assert.equal(await stage.evaluate(el => getComputedStyle(el).pointerEvents), 'none');
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
      const pause = hero.getByRole('button', { name: lang === 'ar' ? 'أوقف الحركة' : 'Pause motion' });
      const resume = hero.getByRole('button', { name: lang === 'ar' ? 'شغّل الحركة' : 'Play motion' });
      await pause.waitFor({ timeout: 24000 });
      await drawingResumes();
      await canvas.waitFor();
      assert.equal(await canvas.count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);

      // Compare the actual navigation pixels, not a crop from the canvas below it.
      const clip = await chrome.locator(':scope > header > div:first-child').boundingBox();
      assert.ok(clip, 'the main toolbar is visible');
      const before = await page.screenshot({ clip });
      await page.waitForTimeout(550);
      await drawingResumes();
      assert.ok(!(await page.screenshot({ clip })).equals(before), 'the background must move behind the main toolbar');

      const menu = chrome.getByRole('button', { name: lang === 'ar' ? 'فتح قائمة التنقل' : 'Open navigation menu' });
      await menu.click();
      const drawer = page.getByRole('dialog', { name: lang === 'ar' ? 'قائمة التنقل' : 'Navigation menu' });
      await drawer.waitFor();
      await page.keyboard.press('Escape');
      await drawer.waitFor({ state: 'hidden' });
      assert.ok(await menu.evaluate(el => el === document.activeElement));
      await pause.press('Space');
      await resume.waitFor();
      assert.ok(await resume.evaluate(el => el === document.activeElement));
      await verifyStill();
      await resume.press('Space');
      await drawingResumes();
      await page.screenshot({ path: join(out, `banner-${name}.jpg`), quality: 88 });
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await window.axe.run({ include: ['#site-chrome', '[data-testid="corporate-landing-hero"]'] }, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
      assert.deepEqual(violations, []);

      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
      await chrome.and(page.locator('[data-masthead-in-view]')).waitFor({ state: 'detached' });
      assert.equal(await chrome.evaluate(el => el.getBoundingClientRect().top), 0, 'the normal navigation stays sticky');
      await verifyStill();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await chrome.and(page.locator('[data-masthead-in-view]')).waitFor();
      await drawingResumes();

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await backdrop.waitFor({ state: 'detached' });
      await photo.waitFor();
      assert.equal(await chrome.getAttribute('data-masthead-in-view'), 'true', 'the static fallback also covers the header');
      await hero.getByRole('button', { name: lang === 'ar' ? 'الأكاديمية الهندسية' : 'Engineering Academy' }).click();
      await page.getByTestId('academy-hub').waitFor();
      assert.equal(await stage.count(), 0);
    }
    assert.equal(await chrome.getAttribute('data-masthead-in-view'), null, 'other routes must keep their normal chrome');
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ name, width, height, lang, theme, disableWebGL, passed: true }));
  } finally {
    await browser.close();
  }
}
