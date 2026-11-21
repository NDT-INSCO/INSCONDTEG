import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import React from 'react';
import { JSDOM } from 'jsdom';
import type { User } from 'firebase/auth';
import type { ClientAccount, ClientRegistrationDraftInput } from '../src/client/types';

const dom = new JSDOM('<!doctype html><html lang="ar" dir="rtl"><body></body></html>', {
  url: 'https://client.example.test/INSCONDTEG/#client',
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  history: dom.window.history,
  sessionStorage: dom.window.sessionStorage,
  FormData: dom.window.FormData,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const fault = (code: string) => Object.assign(new Error(`private Firebase diagnostic: ${code}`), { code });
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

const draft: ClientRegistrationDraftInput = {
  fullName: 'Ahmed QA', phone: '+201012345678', organizationName: 'Delta Test Company',
  commercialRegNo: 'CR-456', activeScope: 'UT and MT', requestedCompanyCode: 'INS-CO-0900',
};
const email = 'client@example.test';
const shortPassword = ' ع! ';
const newPassword = '  انتخاب-QA!9 ';
const auth = { currentUser: null as User | null };
const events: string[] = [];
const observers = new Set<(user: User | null) => void>();
const documents = new Map<string, Record<string, unknown>>();
let signUpResult: Promise<void> | undefined;
let signUpError: Error | undefined;
let tokenResult: Promise<void> | undefined;
let tokenError: Error | undefined;
let deliveryError: Error | undefined;
let resetError: Error | undefined;
let profileReadError: Error | undefined;
let transmitError: Error | undefined;
let commitResult: Promise<void> | undefined;
let companyError: Error | undefined;
let accountSnapshotsReady: boolean;
let verifiedInFirebase: boolean;
let nextCompanyId: number;
let profileAttempts: number;
let verificationEmails: number;
let lastLogin: { email: string; password: string } | undefined;
let lastPasswordReset: string | undefined;

function changeUser(user: User | null) {
  auth.currentUser = user;
  for (const notify of observers) notify(user);
}

function makeUser(uid: string, verified = false, provider = 'password'): User {
  const isPhone = provider === 'phone';
  const user = {
    uid,
    email: isPhone ? null : email,
    phoneNumber: isPhone ? draft.phone : null,
    emailVerified: verified,
    providerData: [{ providerId: provider }],
    reload: async () => { user.emailVerified = verifiedInFirebase; events.push('reload'); },
    getIdTokenResult: async (force?: boolean) => {
      events.push(force ? 'force-token' : 'read-token');
      if (force) {
        await tokenResult;
        if (tokenError) throw tokenError;
      }
      return {
        signInProvider: provider,
        claims: { email_verified: user.emailVerified, phone_number: user.phoneNumber },
      };
    },
  };
  return user as unknown as User;
}

mock.module('firebase/auth', { namedExports: {
  ...await import('firebase/auth'),
  getAuth: () => auth,
  browserLocalPersistence: { type: 'LOCAL' },
  browserSessionPersistence: { type: 'SESSION' },
  setPersistence: async (_auth: unknown, persistence: { type: string }) => { events.push(persistence.type); },
  onAuthStateChanged: (_auth: unknown, notify: (user: User | null) => void) => {
    observers.add(notify);
    queueMicrotask(() => { if (observers.has(notify)) notify(auth.currentUser); });
    return () => observers.delete(notify);
  },
  signInWithEmailAndPassword: async (_auth: unknown, username: string, password: string) => {
    events.push('login');
    lastLogin = { email: username, password };
    if (username !== email || password !== shortPassword) throw fault('auth/invalid-credential');
    const user = makeUser('client-a', true);
    changeUser(user);
    return { user };
  },
  createUserWithEmailAndPassword: async (_auth: unknown, username: string, password: string) => {
    events.push('create');
    lastLogin = { email: username, password };
    if (signUpError) throw signUpError;
    const user = makeUser('client-a');
    changeUser(user);
    // Let the auth observer replace the sign-up form before the caller receives the credential.
    await signUpResult;
    return { user };
  },
  signInWithPopup: async () => {
    const user = makeUser('google-client', true, 'google.com');
    changeUser(user);
    return { user };
  },
  RecaptchaVerifier: class { clear() {} },
  signInWithPhoneNumber: async (_auth: unknown, phone: string) => {
    assert.equal(phone, draft.phone);
    return { confirm: async (code: string) => {
      if (code !== '654321') throw fault('auth/invalid-verification-code');
      const user = makeUser('phone-client', false, 'phone');
      changeUser(user);
      return { user };
    } };
  },
  sendEmailVerification: async (user: User) => {
    verificationEmails++;
    assert.ok(documents.has(`client_accounts/${user.uid}`) || service.loadPendingRegistrationDraft(user.uid) || signUpResult === undefined);
    if (deliveryError) throw deliveryError;
  },
  sendPasswordResetEmail: async (_auth: unknown, username: string) => {
    lastPasswordReset = username;
    if (resetError) throw resetError;
  },
  signOut: async () => changeUser(null),
} });

type DocRef = { path: string; id: string; progressUid?: string };
const ref = (path: string) => ({ path, id: path.split('/').at(-1)! });
const snapshot = (path: string, fromCache = false) => {
  const data = documents.get(path);
  return { exists: () => Boolean(data), data: () => data, metadata: { fromCache, hasPendingWrites: false } };
};
const accountListeners = new Map<string, (snap: ReturnType<typeof snapshot>) => void>();
const notifyAccount = (path: string) => accountListeners.get(path)?.(snapshot(path));

mock.module('firebase/firestore', { namedExports: {
  ...await import('firebase/firestore'),
  getFirestore: () => ({}),
  collection: (_db: unknown, ...parts: string[]) => ref(parts.join('/')),
  doc: (parent: Partial<DocRef>, ...parts: string[]) => parts.length
    ? ref(parts.join('/')) : ref(`${parent.path}/newCompany${++nextCompanyId}`),
  query: (collection: DocRef, ...filters: Array<{ field?: string; value?: string }>) => collection.path === 'user_module_progress'
    ? { ...collection, progressUid: filters.find(filter => filter.field === 'userId')?.value }
    : collection,
  orderBy: () => ({}),
  where: (field: string, _operator: string, value: string) => ({ field, value }),
  limit: () => ({}),
  serverTimestamp: () => 'SERVER_TIMESTAMP',
  getDocFromServer: async (target: DocRef) => { events.push(`get:${target.path}`); return snapshot(target.path); },
  getDocsFromServer: async () => ({ docs: [] }),
  onSnapshot: (target: DocRef, ...args: unknown[]) => {
    if (target.path.startsWith('client_accounts/')) {
      const [options, notify, onError] = args as [
        { includeMetadataChanges: boolean }, (snap: ReturnType<typeof snapshot>) => void, (err: Error) => void,
      ];
      assert.equal(options.includeMetadataChanges, true);
      events.push(`listen:${target.path}`);
      accountListeners.set(target.path, notify);
      if (profileReadError) {
        onError(profileReadError);
      } else {
        notify(snapshot(target.path, !accountSnapshotsReady));
      }
      return () => accountListeners.delete(target.path);
    }
    const notify = args.find(arg => typeof arg === 'function') as (result: unknown) => void;
    const rows = target.path === 'user_module_progress' && target.progressUid
      ? [...documents.entries()].filter(([path, row]) => path.startsWith('user_module_progress/') && row.userId === target.progressUid)
      : [];
    if (target.progressUid) events.push(`progress:${target.progressUid}`);
    notify({ docs: rows.map(([path, row]) => ({ id: ref(path).id, data: () => row })), exists: () => false, metadata: { fromCache: false, hasPendingWrites: false } });
    return () => {};
  },
  runTransaction: async (db: unknown, run: (tx: object) => Promise<unknown>) => {
    assert.ok(db);
    profileAttempts++;
    const writes = new Map<string, Record<string, unknown>>();
    const result = await run({
      get: async (doc: DocRef) => snapshot(doc.path),
      set: (doc: DocRef, data: Record<string, unknown>) => writes.set(doc.path, data),
      update: (doc: DocRef, data: Record<string, unknown>) => {
        for (const name of ['role', 'approvalStatus', 'assignedCompanyId', 'assignedCompanyCode', 'createdAt', 'authMethod']) {
          assert.equal(name in data, false, `profile update attempted to write ${name}`);
        }
        writes.set(doc.path, { ...documents.get(doc.path), ...data });
      },
    });
    await commitResult;
    if (transmitError) throw transmitError;
    for (const [path, data] of writes) {
      assert.equal(path, `client_accounts/${auth.currentUser?.uid}`, 'write must target the authenticated UID');
      documents.set(path, data);
      notifyAccount(path);
    }
    return result;
  },
  writeBatch: () => {
    const writes = new Map<string, Record<string, unknown>>();
    return {
      set: (doc: DocRef, data: Record<string, unknown>) => writes.set(doc.path, data),
      commit: async () => {
        if (companyError) throw companyError;
        for (const [path, data] of writes) {
          assert.equal(documents.has(path), false, `attempted to reuse ${path}`);
          documents.set(path, data);
          events.push(`commit:${path}`);
        }
      },
    };
  },
} });

const { ClientPortal } = await import('../src/components/client/ClientPortal');
const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { App } = await import('../src/App');
const curriculum = await import('../src/utils/curriculumProgress');
const { academyActivityStorage, readAccountAcademyProgress } = await import('../src/account/academyAccountProgress');
const service = await import('../src/client/firestoreClientService');
const { render, fireEvent, cleanup, configure, act, waitFor, within } = await import('@testing-library/react');
configure({ asyncUtilTimeout: 3000 });
const props = { onNavigateSection: () => {}, onOpenCompanyPortal: () => {} };
const profilePath = 'client_accounts/client-a';

beforeEach(() => {
  localStorage.clear();
  for (const uid of ['client-a', 'client-b', 'google-client', 'phone-client']) service.clearPendingRegistrationDraft(uid);
  auth.currentUser = null;
  events.length = 0;
  documents.clear();
  accountSnapshotsReady = true;
  verifiedInFirebase = false;
  nextCompanyId = verificationEmails = profileAttempts = 0;
  signUpResult = tokenResult = commitResult = undefined;
  signUpError = tokenError = deliveryError = resetError = profileReadError = transmitError = companyError = undefined;
  lastLogin = lastPasswordReset = undefined;
});
afterEach(() => cleanup());

function app(section: 'overview' | 'register' = 'register', language: 'ar' | 'en' = 'en') {
  return <SiteAccountProvider><ClientPortal section={section} language={language} {...props} /></SiteAccountProvider>;
}

async function enterRegistration(ui: ReturnType<typeof render>, companyCode = draft.requestedCompanyCode) {
  const username = await ui.findByLabelText('Account Email *') as HTMLInputElement;
  assert.equal(ui.queryByLabelText('Personal Email'), null, 'one address for email registration and verification');
  username.value = 'typo@example.test';
  username.value = email;
  const password = ui.getByLabelText('Password *', { exact: true }) as HTMLInputElement;
  assert.equal(password.autocomplete, 'new-password');
  password.value = newPassword;
  (ui.getByLabelText('Confirm Password *') as HTMLInputElement).value = newPassword;
  for (const [label, value] of [
    [/Full Name \*/, draft.fullName], [/Primary Phone/, draft.phone], [/Company Official Name/, draft.organizationName],
    [/Commercial Reg No/, draft.commercialRegNo], [/Primary Engineering Activities/, draft.activeScope],
    [/Existing Company Code/, companyCode ?? ''],
  ] as const) {
    fireEvent.change(ui.getByLabelText(label), { target: { value } });
  }
  fireEvent.submit(username.form!);
}

test('email login uses native autofill and the verbatim existing password; remember choice precedes auth', async () => {
  const ui = render(app('overview', 'ar'));
  const username = await ui.findByLabelText('البريد الإلكتروني للحساب *') as HTMLInputElement;
  const password = ui.getByLabelText('كلمة المرور *') as HTMLInputElement;
  assert.equal(username.autocomplete, 'username');
  assert.equal(password.autocomplete, 'current-password');
  assert.equal(password.getAttribute('minlength'), null);
  assert.equal(username.form, password.form);
  assert.equal(ui.queryByLabelText('تأكيد كلمة المرور *'), null);
  assert.equal((ui.getByRole('checkbox') as HTMLInputElement).checked, false);

  username.value = ` ${email} `;
  password.value = 'incorrect';
  fireEvent.submit(username.form!);
  await ui.findByText(/البريد الإلكتروني أو كلمة المرور غير صحيحة/);
  assert.deepEqual(events, ['SESSION', 'login']);
  assert.doesNotMatch(ui.getByRole('alert').textContent!, /diagnostic/);

  fireEvent.click(ui.getByRole('checkbox'));
  password.value = shortPassword;
  fireEvent.submit(username.form!);
  await ui.findByRole('button', { name: 'تسجيل الخروج' });
  assert.deepEqual(lastLogin, { email, password: shortPassword });
  assert.deepEqual(events.slice(2, 4), ['LOCAL', 'login']);
  assert.equal(service.loadPendingRegistrationDraft('client-a'), null);
  fireEvent.click(ui.getByRole('button', { name: 'تسجيل الخروج' }));
  const signedOutPassword = await ui.findByLabelText('كلمة المرور *') as HTMLInputElement;
  assert.equal(signedOutPassword.value, '');
});

test('password reset uses the live email field and keeps a generic receipt for unknown accounts', async () => {
  const ui = render(app('overview', 'ar'));
  const reset = await ui.findByRole('button', { name: 'نسيت كلمة المرور؟' });
  fireEvent.click(reset);
  await ui.findByText(/اكتب بريد الحساب بشكل صحيح/);
  assert.equal(lastPasswordReset, undefined);
  (ui.getByLabelText('البريد الإلكتروني للحساب *') as HTMLInputElement).value = email;
  resetError = fault('auth/too-many-requests');
  fireEvent.click(reset);
  await ui.findByText(/محاولات كثيرة/);
  assert.equal(ui.queryByText(/إذا كان البريد مرتبطاً بحساب/), null);
  resetError = fault('auth/user-not-found');
  fireEvent.click(reset);
  await ui.findByText(/إذا كان البريد مرتبطاً بحساب/);
  assert.equal(lastPasswordReset, email);
});

test('signup submit diagnoses invalid fields next to the button and accepts browser autofill and a bare company website', async () => {
  const ui = render(app('register', 'ar'));
  const username = await ui.findByLabelText('البريد الإلكتروني للحساب *') as HTMLInputElement;
  const form = username.form!;
  assert.equal(form.noValidate, true, 'browser constraint popups must not prevent the localized signup handler');
  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement;
  const submit = ui.getByRole('button', { name: 'إنشاء الحساب وإرسال رابط التفعيل', exact: true });
  username.value = email;
  field('password').value = newPassword;
  field('confirm-password').value = newPassword;
  // Simulate autofill without change events, even for business details.
  field('fullName').value = 'عميل تجريبي';
  field('organizationName').value = 'شركة الاختبار';
  field('requestedCompanyCode').value = 'INS-CO-0900';
  field('website').value = 'www.company.test';
  fireEvent.click(submit);
  await ui.findByText(/اكتب رقم الهاتف الأساسي بالأرقام/);
  assert.ok(form.contains(ui.getByRole('alert')));
  fireEvent.click(ui.getByRole('button', { name: 'راجع الحقل' }));
  assert.equal(document.activeElement, field('phone'));
  assert.equal(field('fullName').value, 'عميل تجريبي');
  assert.equal(field('website').value, 'www.company.test');
  assert.equal(events.includes('create'), false);

  field('phone').value = '٠١٠ ١٢٣٤٥٦٧٨';
  field('companyEmail').value = 'invalid-address';
  fireEvent.click(submit);
  await ui.findByText(/صحّح بريد الشركة أو اترك الحقل الاختياري/);
  assert.equal(events.includes('create'), false);
  field('companyEmail').value = '';
  field('website').value = 'javascript:alert(1)';
  fireEvent.click(submit);
  await ui.findByText(/اكتب موقع الشركة بشكل صحيح/);
  assert.equal(events.includes('create'), false);

  field('website').value = 'www.company.test';
  fireEvent.click(submit);
  await ui.findByText('أكد حسابك قبل استخدام بوابة العملاء');
  const pending = service.loadPendingRegistrationDraft('client-a');
  assert.equal(pending?.fullName, 'عميل تجريبي');
  assert.equal(pending?.phone, '010 12345678');
  assert.equal(pending?.website, 'https://www.company.test/');
  assert.deepEqual(lastLogin, { email, password: newPassword });
  assert.doesNotMatch(JSON.stringify(pending), /password|انتخاب/);
  verifiedInFirebase = true;
  fireEvent.click(ui.getByRole('button', { name: 'تحقق من التفعيل' }));
  await ui.findByText('تم حفظ بياناتك الشخصية وبيانات الشركة في حسابك.');
  assert.equal(documents.get(profilePath)?.website, 'https://www.company.test/');
});

test('signup provider errors and duplicate-account recovery appear next to the create action', async () => {
  signUpError = fault('auth/operation-not-allowed');
  const ui = render(app());
  await enterRegistration(ui);
  await ui.findByText(/Could not create the account. This sign-in method is not enabled/);
  assert.equal(auth.currentUser, null);
  assert.equal(verificationEmails, 0);
  assert.equal(profileAttempts, 0);
  signUpError = fault('auth/email-already-in-use');
  const submit = ui.getByRole('button', { name: 'Create Account & Send Verification Link' });
  fireEvent.click(submit);
  const recovery = await ui.findByRole('button', { name: 'Sign in with this email' });
  assert.ok(submit.closest('form')?.contains(recovery));
  fireEvent.click(recovery);
  const username = ui.getByLabelText('Account Email *') as HTMLInputElement;
  const password = ui.getByLabelText('Password *', { exact: true }) as HTMLInputElement;
  assert.equal(username.value, email);
  assert.equal(password.value, '');
  assert.ok(ui.getByRole('button', { name: 'Forgot password?' }));
});

test('verification failures are recoverable; one failed profile save retains the draft and retry saves to the server', async () => {
  const signup = deferred();
  signUpResult = signup.promise;
  deliveryError = fault('auth/network-request-failed');
  accountSnapshotsReady = false;
  const ui = render(app());
  await enterRegistration(ui);
  await ui.findByText('Verify your account to use the Client Portal');
  assert.equal(verificationEmails, 0);
  assert.equal(profileAttempts, 0);
  assert.equal(ui.queryByLabelText('Password *', { exact: true }), null);
  await act(async () => signup.resolve());
  await ui.findByText(/Verification email was not sent/);
  assert.deepEqual(lastLogin, { email, password: newPassword });
  assert.equal(service.loadPendingRegistrationDraft('client-a')?.commercialRegNo, draft.commercialRegNo);
  assert.equal(localStorage.getItem('insco_pending_client_reg_v1_client-a'), null);
  assert.doesNotMatch(JSON.stringify(service.loadPendingRegistrationDraft('client-a')), /password|انتخاب/);

  deliveryError = undefined;
  fireEvent.click(ui.getByRole('button', { name: 'Resend verification email' }));
  await ui.findByText(/Verification link sent\. Check your inbox/);
  assert.equal(verificationEmails, 2);
  fireEvent.click(ui.getByRole('button', { name: 'Check verification' }));
  await ui.findByText(/activation has not completed/);
  assert.equal(profileAttempts, 0);

  verifiedInFirebase = true;
  tokenError = fault('auth/network-request-failed');
  fireEvent.click(ui.getByRole('button', { name: 'Check verification' }));
  await ui.findByText(/Could not reach the sign-in service/);
  assert.equal(events.includes(`listen:${profilePath}`), false);
  tokenError = undefined;
  const token = deferred();
  tokenResult = token.promise;
  fireEvent.click(ui.getByRole('button', { name: 'Check verification' }));
  await waitFor(() => assert.equal(events.at(-1), 'force-token'));
  assert.equal(profileAttempts, 0);
  await act(async () => token.resolve());
  await ui.findByText(/Waiting for your account data/);
  assert.equal(profileAttempts, 0, 'a cache-only missing snapshot is not an empty profile');
  assert.equal(ui.queryByTestId('client-registration-section'), null);
  transmitError = fault('permission-denied');
  await act(async () => notifyAccount(profilePath));
  await ui.findByText(/Your details have not been saved to your account/);
  assert.equal(profileAttempts, 1, 'no automatic retry loop');
  assert.equal(documents.has(profilePath), false);
  assert.ok(service.loadPendingRegistrationDraft('client-a'));
  assert.equal((ui.getByLabelText(/Commercial Reg No/) as HTMLInputElement).value, 'CR-456');

  fireEvent.change(ui.getByLabelText(/Commercial Reg No/), { target: { value: 'CR-789' } });
  const ack = deferred();
  commitResult = ack.promise;
  transmitError = undefined;
  fireEvent.click(ui.getByRole('button', { name: 'Complete & Save Registration' }));
  await ui.findByRole('button', { name: 'Saving...' });
  assert.equal(ui.queryByText(/Your personal and company details were saved/), null);
  assert.equal(service.loadPendingRegistrationDraft('client-a')?.commercialRegNo, 'CR-789');
  await act(async () => ack.resolve());
  await ui.findByText(/Your personal and company details were saved/);
  assert.equal(documents.get(profilePath)?.requestedCompanyCode, draft.requestedCompanyCode);
  assert.equal(documents.size, 1, 'known company code is for linking, not creation');
  assert.equal(service.loadPendingRegistrationDraft('client-a'), null);
  ui.unmount();

  accountSnapshotsReady = true;
  const reopened = render(app());
  const storedCompany = await reopened.findByLabelText(/Company Official Name/) as HTMLInputElement;
  assert.equal(storedCompany.value, draft.organizationName);
  assert.equal((reopened.getByLabelText(/Commercial Reg No/) as HTMLInputElement).value, 'CR-789');
  assert.equal(profileAttempts, 2);
});

test('existing profiles and protected fields survive a pending draft and subsequent manual edits', async () => {
  const account: ClientAccount = {
    uid: 'client-a', fullName: 'Saved client', email, phone: draft.phone, organizationName: 'Saved company',
    assignedCompanyId: 'assigned-id', assignedCompanyCode: 'INS-CO-1234', createdAt: 'ORIGINAL',
    role: 'engineer', approvalStatus: 'approved', authMethod: 'email',
  };
  documents.set(profilePath, { ...account });
  auth.currentUser = makeUser('client-a', true);
  assert.equal(service.savePendingRegistrationDraft('client-a', { ...draft, password: newPassword } as ClientRegistrationDraftInput), true);
  assert.equal(service.loadPendingRegistrationDraft('client-b'), null);
  assert.equal(localStorage.getItem('insco_pending_client_reg_v1_client-a'), null);
  assert.doesNotMatch(JSON.stringify(service.loadPendingRegistrationDraft('client-a')), /password|انتخاب/);
  const ui = render(app());
  await ui.findByText(/was not replaced with the registration draft/);
  assert.deepEqual(documents.get(profilePath), account);
  assert.equal(profileAttempts, 0);
  assert.equal(service.loadPendingRegistrationDraft('client-a'), null);

  const org = ui.getByLabelText(/Company Official Name/) as HTMLInputElement;
  fireEvent.change(org, { target: { value: 'Edited company' } });
  documents.set(profilePath, { ...account, assignedCompanyCode: 'INS-CO-5678' });
  await act(async () => notifyAccount(profilePath));
  assert.equal(org.value, 'Edited company');
  transmitError = fault('unavailable');
  fireEvent.click(ui.getByRole('button', { name: 'Update Complete Profile' }));
  await ui.findByText(/Changes were not saved/);
  assert.equal(org.value, 'Edited company');
  assert.equal(documents.get(profilePath)?.organizationName, 'Saved company');
  transmitError = undefined;
  fireEvent.click(ui.getByRole('button', { name: 'Update Complete Profile' }));
  await ui.findByText(/registration profile has been saved/);
  assert.deepEqual(documents.get(profilePath), {
    ...documents.get(profilePath), organizationName: 'Edited company',
    role: 'engineer', approvalStatus: 'approved', authMethod: 'email',
    assignedCompanyCode: 'INS-CO-5678', assignedCompanyId: 'assigned-id', createdAt: 'ORIGINAL',
  });
  await act(async () => changeUser(makeUser('client-b', true)));
  const other = await ui.findByLabelText(/Company Official Name/) as HTMLInputElement;
  assert.equal(other.value, '');
  assert.equal(ui.queryByText('INS-CO-5678'), null);
});

test('profile read rejection stays recoverable, and create-only save protects a server record that appeared after the listener', async () => {
  auth.currentUser = makeUser('client-a', true);
  service.savePendingRegistrationDraft('client-a', draft);
  profileReadError = fault('permission-denied');
  accountSnapshotsReady = false;
  const ui = render(app());
  await ui.findByText(/Could not load your account/);
  assert.equal(profileAttempts, 0);
  assert.ok(service.loadPendingRegistrationDraft('client-a'));
  profileReadError = undefined;
  fireEvent.click(ui.getByRole('button', { name: 'Retry loading account' }));
  await ui.findByText(/Waiting for your account data/);
  const missing = snapshot(profilePath);
  const existing = {
    ...draft, uid: 'client-a', email, role: 'engineer', approvalStatus: 'suspended', assignedCompanyId: 'pre-existing',
  };
  documents.set(profilePath, existing);
  await act(async () => accountListeners.get(profilePath)!(missing));
  await ui.findByText(/was not replaced with the registration draft/);
  assert.equal(profileAttempts, 1);
  assert.deepEqual(documents.get(profilePath), existing);
});

test('private draft stays in memory and survives verification without browser storage', async t => {
  const setItem = dom.window.Storage.prototype.setItem;
  t.mock.method(dom.window.Storage.prototype, 'setItem', function (this: Storage, key: string, value: string) {
    if (key.startsWith('insco_pending_client_reg_v1_')) throw new dom.window.DOMException('Blocked', 'QuotaExceededError');
    setItem.call(this, key, value);
  });
  const ui = render(app());
  await enterRegistration(ui);
  await ui.findByText(/draft stays in this tab’s memory/);
  assert.equal(localStorage.getItem('insco_pending_client_reg_v1_client-a'), null);
  assert.ok(service.loadPendingRegistrationDraft('client-a'));
  assert.equal(service.loadPendingRegistrationDraft('client-b'), null);
  verifiedInFirebase = true;
  fireEvent.click(ui.getByRole('button', { name: 'Check verification' }));
  await ui.findByText(/Your personal and company details were saved/);
  assert.equal(documents.get(profilePath)?.organizationName, draft.organizationName);
});

test('optional new dossiers use distinct reserved codes and a dossier failure is not reported as a profile failure', async t => {
  t.mock.method(console, 'error', () => {});
  const a = makeUser('client-a', true);
  const b = makeUser('client-b', true);
  auth.currentUser = a;
  const first = await service.createInitialCompanyFromRegistration(a, draft);
  auth.currentUser = b;
  const next = await service.createInitialCompanyFromRegistration(b, draft);
  assert.notEqual(first.companyCode, next.companyCode);
  assert.equal(documents.get(`company_codes/${first.companyCode}`)?.companyId, first.id);
  assert.equal(next.assignedClientUid, 'client-b');
  assert.equal(next.contactEmail ?? '', '', 'new dossier must not copy the personal email');
  assert.equal(next.contactPhone ?? '', '', 'new dossier must not copy the personal phone');
  await assert.rejects(() => service.saveClientRegistration(a, draft), { code: 'unauthenticated' });

  service.savePendingRegistrationDraft('client-b', { ...draft, requestedCompanyCode: '', autoCreateCompanyWorkspace: true });
  companyError = fault('permission-denied');
  const ui = render(app());
  await ui.findByText(/The separate company dossier could not be created/);
  assert.ok(ui.getByText(/Your personal and company details were saved/));
  assert.equal(documents.get('client_accounts/client-b')?.organizationName, draft.organizationName);
  assert.equal(service.loadPendingRegistrationDraft('client-b'), null);
});

test('Google and SMS remain usable sign-in alternatives', async () => {
  const ui = render(app('overview'));
  await ui.findByLabelText('Account Email *');
  fireEvent.click(ui.getByTestId('auth-method-tab-google'));
  fireEvent.click(ui.getByTestId('client-portal-google-signin'));
  await ui.findByRole('button', { name: 'Sign Out' });
  assert.equal(auth.currentUser?.uid, 'google-client');
  fireEvent.click(ui.getByRole('button', { name: 'Sign Out' }));
  await ui.findByLabelText('Account Email *');
  fireEvent.click(ui.getByTestId('auth-method-tab-phone'));
  fireEvent.change(ui.getByLabelText(/International Mobile Number/), { target: { value: '٠١٠ ١٢٣٤٥٦٧٨' } });
  fireEvent.click(ui.getByRole('button', { name: 'Send SMS Verification Code' }));
  fireEvent.change(await ui.findByLabelText('Enter 6-digit SMS Code'), { target: { value: '٦٥٤٣٢١' } });
  fireEvent.click(ui.getByRole('button', { name: 'Verify & Sign In' }));
  await ui.findByRole('button', { name: 'Sign Out' });
  assert.equal(auth.currentUser?.uid, 'phone-client');
  await waitFor(() => assert.ok(events.includes('listen:client_accounts/phone-client')));
});

test('the global form creates a shared account from the academy without leaving the page', async () => {
  localStorage.setItem('insco_language_v1', 'en');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#academy');
  const ui = render(<App />);
  const header = within(ui.getByTestId('site-account-actions'));
  fireEvent.click(header.getByRole('button', { name: 'Create account' }));
  const panel = within(await ui.findByRole('dialog', { name: 'Your INSCO account' }));
  assert.equal(dom.window.location.hash, '#academy');
  assert.equal(panel.queryByLabelText(/Company Official Name/), null);
  fireEvent.change(await panel.findByLabelText('Account Email *'), { target: { value: email } });
  fireEvent.change(panel.getByLabelText(/^Password \*$/), { target: { value: newPassword } });
  fireEvent.change(panel.getByLabelText('Confirm Password *'), { target: { value: 'not matching' } });
  fireEvent.click(panel.getByRole('button', { name: 'Create Account & Send Verification Link' }));
  assert.match(panel.getByRole('alert').textContent!, /Passwords do not match/);
  assert.equal(events.includes('create'), false);
  fireEvent.change(panel.getByLabelText('Confirm Password *'), { target: { value: newPassword } });
  fireEvent.click(panel.getByRole('button', { name: 'Create Account & Send Verification Link' }));
  await panel.findByText(/Verification link sent/);
  assert.equal(dom.window.location.hash, '#academy');
  assert.equal(verificationEmails, 1);
  assert.equal(documents.size, 0, 'no private data write before verification or without profile details');
  verifiedInFirebase = true;
  fireEvent.click(panel.getByRole('button', { name: 'Check verification' }));
  await panel.findByText('Signed in across all sections');
  assert.ok(panel.getByText('client-a'));
  fireEvent.click(panel.getByRole('button', { name: 'My private profile' }));
  assert.equal(dom.window.location.hash, '#client/register');
  fireEvent.change(await ui.findByLabelText('Full Name *'), { target: { value: 'Academy Tester' } });
  fireEvent.click(ui.getByRole('button', { name: 'Complete & Save Registration' }));
  await ui.findByText(/registration profile has been saved/);
  assert.equal(documents.get(profilePath)?.fullName, 'Academy Tester');
  assert.equal(documents.get(profilePath)?.organizationName, '', 'private personal profile does not require a company');
  assert.equal(events.filter(event => event === 'create').length, 1);

  for (const hash of ['#services', '#demo', '#academy/disciplines', '#network/jobs', '#client/community']) {
    await act(async () => {
      dom.window.history.pushState(null, '', `/INSCONDTEG/${hash}`);
      dom.window.dispatchEvent(new dom.window.Event('hashchange'));
    });
    const current = within(ui.getByTestId('site-account-actions'));
    assert.ok(current.getByRole('button', { name: 'My account' }), hash);
    assert.equal(current.queryByRole('button', { name: 'Create account' }), null);
  }

  const finalHeader = within(ui.getByTestId('site-account-actions'));
  fireEvent.click(finalHeader.getByRole('button', { name: 'My account' }));
  const signedIn = within(ui.getByRole('dialog', { name: 'Your INSCO account' }));
  fireEvent.click(signedIn.getByRole('button', { name: 'Sign out' }));
  await finalHeader.findByRole('button', { name: 'Sign in' });
  assert.equal(auth.currentUser, null);
  assert.equal(dom.window.location.hash, '#client/community');
  assert.equal(ui.queryByText('Academy Tester'), null);
});

test('existing email sign-in is reusable on a corporate page; #admin has no public account controls', async () => {
  localStorage.setItem('insco_language_v1', 'en');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#about');
  const ui = render(<App />);
  const header = within(ui.getByTestId('site-account-actions'));
  const opener = header.getByRole('button', { name: 'Sign in' });
  opener.focus();
  fireEvent.click(opener);
  const dialog = ui.getByRole('dialog', { name: 'Your INSCO account' });
  assert.equal(document.activeElement, within(dialog).getByRole('button', { name: 'Close account window' }));
  fireEvent(dialog, new dom.window.Event('cancel', { cancelable: true }));
  assert.equal(ui.queryByRole('dialog'), null);
  assert.equal(document.activeElement, opener);
  fireEvent.click(opener);
  const panel = within(ui.getByRole('dialog', { name: 'Your INSCO account' }));
  fireEvent.change(await panel.findByLabelText('Account Email *'), { target: { value: email } });
  fireEvent.change(panel.getByLabelText('Password *'), { target: { value: shortPassword } });
  fireEvent.click(panel.getByRole('button', { name: 'Sign In with Email' }));
  await panel.findByText('Signed in across all sections');
  assert.equal(dom.window.location.hash, '#about');
  assert.equal(events.includes('create'), false);
  await act(async () => {
    dom.window.history.pushState(null, '', '/INSCONDTEG/#admin');
    dom.window.dispatchEvent(new dom.window.Event('hashchange'));
  });
  assert.equal(ui.queryByTestId('site-account-actions'), null);
  assert.ok(ui.container.querySelector('[data-portal="admin"]'));
});

test('the academy separates verified account records and never imports guest activity', async () => {
  localStorage.setItem('insco_language_v1', 'en');
  localStorage.setItem('insco_academy_completed_modules', JSON.stringify({ demoOnly: true }));
  localStorage.setItem('insco_lesson_quiz_records_v1', 'demo-only');
  dom.window.history.replaceState(null, '', '/INSCONDTEG/#academy');
  const timestamp = { toDate: () => new Date('2025-01-01T12:00:00Z') };
  documents.set('user_module_progress/client-a_mod_a', { userId: 'client-a', moduleId: 'mod_a', completedAt: timestamp, score: 81 });
  documents.set('user_module_progress/client-b_mod_b', { userId: 'client-b', moduleId: 'mod_b', completedAt: timestamp, score: 95 });
  auth.currentUser = makeUser('client-a', true);
  const ui = render(<App />);
  await waitFor(() => assert.equal(readAccountAcademyProgress()?.state, 'ready'));
  assert.deepEqual(curriculum.getCompletedModules(), { mod_a: true });
  assert.equal(academyActivityStorage.getItem('insco_lesson_quiz_records_v1'), null);
  academyActivityStorage.setItem('insco_lesson_quiz_records_v1', 'temporary-private');
  await act(async () => changeUser(makeUser('client-b', true)));
  await waitFor(() => assert.deepEqual(curriculum.getCompletedModules(), { mod_b: true }));
  assert.equal(academyActivityStorage.getItem('insco_lesson_quiz_records_v1'), null);
  assert.equal(localStorage.getItem('insco_lesson_quiz_records_v1'), 'demo-only');
  await act(async () => changeUser(null));
  await waitFor(() => assert.deepEqual(curriculum.getCompletedModules(), { demoOnly: true }));
  assert.ok(within(ui.getByTestId('site-account-actions')).getByRole('button', { name: 'Sign in' }));
});

test('an administrative review waits for the reason and audit acknowledgement before fetching one private profile', async () => {
  auth.currentUser = makeUser('reviewer', true);
  documents.set('account_reviewers/reviewer', { enabled: true });
  documents.set(profilePath, { ...draft, uid: 'client-a', fullName: 'Private member', email, role: 'client', approvalStatus: 'pending' });
  const ui = render(app());
  const review = within(await ui.findByRole('region', { name: 'Private account review' }));
  assert.equal(events.includes(`get:${profilePath}`), false);
  fireEvent.change(review.getByLabelText('Client account ID'), { target: { value: 'client-a' } });
  fireEvent.change(review.getByLabelText('Reason for review'), { target: { value: 'account_support' } });
  fireEvent.change(review.getByLabelText(/Case reference/), { target: { value: 'CASE-502' } });
  companyError = fault('permission-denied');
  fireEvent.click(review.getByRole('button', { name: 'Record reason and open profile' }));
  await review.findByRole('alert');
  assert.equal(events.includes(`get:${profilePath}`), false);
  companyError = undefined;
  fireEvent.click(review.getByRole('button', { name: 'Record reason and open profile' }));
  await review.findByText(/Private member/);
  assert.ok(events.indexOf('commit:account_review_access/reviewer') < events.indexOf(`get:${profilePath}`));
  const audit = [...documents.entries()].find(([key]) => key.startsWith('account_review_audit/'))?.[1];
  assert.deepEqual(audit, { reviewerUid: 'reviewer', subjectUid: 'client-a', reason: 'account_support', caseReference: 'CASE-502', createdAt: 'SERVER_TIMESTAMP' });
  fireEvent.click(review.getByRole('button', { name: 'Hide profile' }));
  assert.equal(review.queryByText(/Private member/), null);
});
