import React from 'react';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://ndt-insco.github.io/INSCONDTEG/', pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement, CustomEvent: dom.window.CustomEvent, Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
const target = process.argv[2];
const { render } = await import('@testing-library/react');
let element: React.ReactElement;
if (target === 'qr') {
  const { CompanyQrQuickAccessSection } = await import('../src/components/company/CompanyQrQuickAccessSection');
  element = <CompanyQrQuickAccessSection language="ar" />;
} else if (target === 'attendance') {
  const { CompanyAttendanceTimelineSection } = await import('../src/components/company/CompanyAttendanceTimelineSection');
  element = <CompanyAttendanceTimelineSection language="ar" />;
} else {
  const { App } = await import('../src/App');
  element = <App />;
}
const t0 = Date.now();
const ui = render(element);
await new Promise(r => setTimeout(r, 1500));
const mb = process.memoryUsage().heapUsed / 1048576;
console.log(`${target}: rendered in ${Date.now() - t0}ms, heap ${mb.toFixed(0)} MB, nodes ${ui.container.querySelectorAll('*').length}`);
process.exit(0);
