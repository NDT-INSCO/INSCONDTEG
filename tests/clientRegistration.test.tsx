/**
 * Client Account Multi-Provider Onboarding & Extended Personal/Company Registration tests.
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  history: dom.window.history,
  IS_REACT_ACT_ENVIRONMENT: true,
});
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const service = await import('../src/client/firestoreClientService');
const { ClientAuthOnboardingCard } = await import(
  '../src/components/client/ClientAuthOnboardingCard'
);
const { ClientRegistrationSection } = await import(
  '../src/components/client/ClientRegistrationSection'
);
const { render, fireEvent, cleanup } = await import('@testing-library/react');

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => cleanup());

test('phone normalization and verification work; an unauthenticated draft is rejected', () => {
  assert.equal(service.normalizeE164Phone('010 1234 5678'), '+201012345678');
  assert.equal(service.normalizeE164Phone('00966501234567'), '+966501234567');
  assert.equal(service.normalizeE164Phone('+201122334455'), '+201122334455');

  const unverifiedEmailUser = {
    uid: 'u_unverified',
    email: 'test@company.com',
    emailVerified: false,
    phoneNumber: null,
    providerData: [{ providerId: 'password' }],
  } as unknown as import('firebase/auth').User;
  assert.equal(service.isVerifiedPortalUser(unverifiedEmailUser), false);

  const verifiedPhoneUser = {
    uid: 'u_phone',
    email: null,
    emailVerified: false,
    phoneNumber: '+201012345678',
    providerData: [{ providerId: 'phone' }],
  } as unknown as import('firebase/auth').User;
  assert.equal(service.isVerifiedPortalUser(verifiedPhoneUser), true);
  assert.equal(service.detectUserAuthMethod(verifiedPhoneUser), 'phone');

  assert.equal(service.savePendingRegistrationDraft('u_1', {
    fullName: 'Eng. Omar',
    phone: '+201000000001',
    organizationName: 'Delta Testing Co',
    commercialRegNo: 'CR-9988',
    taxCardNo: '100-200-300',
  }), false);
  assert.equal(service.loadPendingRegistrationDraft('u_1'), null);
});

test('ClientAuthOnboardingCard renders Email, Phone OTP, and Google registration flows with full personal & company fields', () => {
  const ui = render(
    <ClientAuthOnboardingCard
      language="en"
      firebaseReady={true}
      authReady={true}
      initialMode="register"
      onRegistrationReady={() => {}}
      onOpenCompanyPortal={() => {}}
    />
  );

  // Personal + Company fieldsets present on initial registration mode
  assert.ok(ui.getByLabelText(/Full Name \*/));
  assert.ok(ui.getByLabelText(/Job Title/));
  assert.ok(ui.getByLabelText(/Primary Phone \/ WhatsApp \*/));
  assert.ok(ui.getByLabelText(/National ID/));
  assert.ok(ui.getByLabelText(/Company Official Name \*/));
  assert.ok(ui.getByLabelText(/Commercial Reg No\./));
  assert.ok(ui.getByLabelText(/Tax Card \/ VAT No\./));
  assert.ok(ui.getByLabelText(/Company HQ \/ Plant Address/));

  // Switch to Email & Password tab
  fireEvent.click(ui.getByTestId('auth-method-tab-email'));
  assert.ok(ui.getByLabelText(/Account Email \*/));
  assert.ok(ui.getByLabelText(/^Password \*/));
  assert.ok(ui.getByLabelText(/Confirm Password \*/));

  // Switch to Phone OTP tab
  fireEvent.click(ui.getByTestId('auth-method-tab-phone'));
  assert.ok(ui.getByLabelText(/International Mobile Number \*/));
  assert.ok(ui.getByRole('button', { name: /Send SMS Verification Code/ }));

  // Switch to Google tab and check required field guard
  fireEvent.click(ui.getByTestId('auth-method-tab-google'));
  fireEvent.click(ui.getByTestId('client-portal-google-signin'));
  assert.ok(ui.getByRole('alert'));

  // Toggle to Sign In mode hides registration personal/company form cleanly
  fireEvent.click(ui.getByRole('tab', { name: /Sign In/ }));
  assert.equal(ui.queryByLabelText(/Commercial Reg No\./), null);
  assert.ok(ui.getByTestId('client-portal-google-signin'));
});

test('ClientRegistrationSection renders the owner’s personal and company profile without an account list', () => {
  const fakeUser = {
    uid: 'client_phone_1',
    email: null,
    phoneNumber: '+201099887766',
    emailVerified: false,
    providerData: [{ providerId: 'phone' }],
  } as unknown as import('firebase/auth').User;

  const account: import('../src/client/types').ClientAccount = {
    uid: 'client_phone_1',
    fullName: 'Eng. Karim Samir',
    email: 'karim@niledelta.com',
    phone: '+201099887766',
    organizationName: 'شركة دلتا النيل للصناعات',
    organizationNameEn: 'Nile Delta Industries Co.',
    jobTitle: 'QA/QC Director',
    commercialRegNo: 'CR-774411',
    taxCardNo: '405-607-809',
    cityGovernorate: 'Suez, Egypt',
    authMethod: 'phone',
    role: 'client',
    approvalStatus: 'approved',
  };

  const ui = render(
    <ClientRegistrationSection
      language="en"
      user={fakeUser}
      account={account}
    />
  );

  assert.ok(ui.getByText('Phone OTP'));
  assert.ok(ui.getByText('APPROVED'));
  assert.equal((ui.getByLabelText(/Commercial Reg No\./) as HTMLInputElement).value, 'CR-774411');
  assert.equal((ui.getByLabelText(/Tax Card \/ VAT No\./) as HTMLInputElement).value, '405-607-809');
  assert.equal(ui.queryByText(/Registered Client Accounts/), null);
  assert.ok(ui.getByText('Account privacy'));
});
