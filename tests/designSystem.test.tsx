/**
 * P6 guard: the corporate pages share one heading and one set of button ranks.
 *
 * The point is not the exact Tailwind string, it is that the rules survive:
 * amber marks the single primary action, the focus ring is always present, and
 * a section cannot quietly re-introduce a hand-written heading.
 */
import React from 'react';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.org/' });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  IS_REACT_ACT_ENVIRONMENT: true,
});

const { SectionHeading } = await import('../src/components/ui/SectionHeading');
const { CtaButton, ctaClassName } = await import('../src/components/ui/CtaButton');
const { render, cleanup } = await import('@testing-library/react');

const ROOT = path.resolve(import.meta.dirname, '..');

test('SectionHeading renders the eyebrow, the right heading level and the description', () => {
  const ui = render(
    <SectionHeading eyebrow="Accreditations" title="Triple ISO" description="Valid to 2028" />
  );
  assert.ok(ui.getByText('Accreditations'));
  assert.ok(ui.getByText('Valid to 2028'));
  const heading = ui.getByRole('heading', { level: 2 });
  assert.equal(heading.textContent, 'Triple ISO');
  assert.match(heading.className, /font-black/);
  cleanup();

  const h1 = render(<SectionHeading as="h1" eyebrow="Eyebrow" title="Hero title" />);
  assert.equal(h1.getByRole('heading', { level: 1 }).textContent, 'Hero title');
  cleanup();
});

test('SectionHeading supports an icon in the eyebrow and a centred variant', () => {
  const ui = render(
    <SectionHeading
      align="center"
      eyebrow="Centered"
      eyebrowIcon={<span data-testid="eyebrow-icon">*</span>}
      title="Title"
    />
  );
  assert.ok(ui.getByTestId('eyebrow-icon'));
  assert.match(ui.container.firstElementChild!.className, /mx-auto/);
  cleanup();
});

test('CtaButton keeps one primary rank and always shows a focus ring', () => {
  const primary = ctaClassName('primary');
  const secondary = ctaClassName('secondary');
  const ghost = ctaClassName('ghost');

  for (const classes of [primary, secondary, ghost]) {
    assert.match(classes, /focus-visible:ring-2/, 'every rank must be keyboard visible');
  }
  assert.match(primary, /bg-amber-500/);
  assert.doesNotMatch(secondary, /bg-amber-500/);
  assert.doesNotMatch(ghost, /bg-amber-500/);
  assert.match(secondary, /border-slate-700/);
});

test('CtaButton renders a button by default and a safe anchor when given an href', () => {
  const ui = render(
    <>
      <CtaButton onClick={() => {}}>Book a call</CtaButton>
      <CtaButton href="/dossier.pdf" external variant="secondary">
        Dossier
      </CtaButton>
    </>
  );

  assert.equal(ui.getByRole('button', { name: 'Book a call' }).getAttribute('type'), 'button');
  const link = ui.getByRole('link', { name: 'Dossier' });
  assert.equal(link.getAttribute('target'), '_blank');
  assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  assert.match(link.className, /border-slate-700/);
  cleanup();
});

test('the corporate sections use the shared heading instead of hand-written markup', () => {
  const sections = [
    'CompanyServicesSection.tsx',
    'CompanyCertificationsSection.tsx',
    'CompanyFleetInspector.tsx',
    'CompanyProjectsSection.tsx',
    'CompanyTestimonialsSection.tsx',
    'CompanyVendorVaultSection.tsx',
    'CompanyContactSection.tsx',
  ];

  for (const file of sections) {
    const source = fs.readFileSync(path.join(ROOT, 'src/components/company', file), 'utf8');
    assert.match(source, /<SectionHeading/, `${file} must render the shared SectionHeading`);
    assert.doesNotMatch(
      source,
      /<h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">/,
      `${file} still hand-writes the section title`
    );
  }
});
