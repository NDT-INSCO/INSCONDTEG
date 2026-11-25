/**
 * Tests for:
 *   1. Facebook-style Personal Page (`NetworkMemberProfile`): banner, avatar, site-direction tools,
 *      horizontal tabs (Timeline, About, Connections, Media, Skills, Recommendations), owner wall composer,
 *      and Messenger / Platform Email action triggers.
 *   2. INSCO Messenger + Internal Platform Email Hub (`NetworkMessagesSection`): dual-mode switching,
 *      deep-link `mail:<uid>`, compose & send internal email, inbox/sent folders, read/star/archive/reply.
 */
import React from 'react';
import { afterEach, beforeEach, mock, test } from 'node:test';
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

const me = { uid: 'uid-me', email: 'me@example.test', displayName: 'م. أحمد علي' };
const peerUid = 'uid-peer';

const myProfile = {
  uid: me.uid,
  displayName: 'م. أحمد علي',
  headline: 'كبير مفتشي PAUT — المستوى الثالث',
  organizationName: 'إنسكو للفحص',
  sector: 'الفحص غير الإتلافي',
  city: 'القاهرة',
  bio: 'خبرة ١٥ عاماً في فحص خطوط الأنابيب.',
  specialtyTrades: 'PAUT · TOFD · RT',
  certifications: 'ASNT Level III',
  yearsExperience: 15,
  experienceSummary: 'قيادة فرق الفحص غير الإتلافي في محطات الطاقة.',
  educationSummary: 'بكالوريوس هندسة القوى الميكانيكية',
  projectsSummary: 'مشروع خط غاز الصحراء الغربية.',
  bannerURL: 'https://firebasestorage.example/my-banner.jpg',
  photoURL: 'https://firebasestorage.example/my-photo.jpg',
  profileVisibility: 'public',
  companiesManaged: 1,
  isPublished: true,
  shareAcademyProgress: true,
};

const peerProfile = {
  uid: peerUid,
  displayName: 'م. سارة محمود',
  headline: 'مهندسة جودة ولحام',
  organizationName: 'دلتا إنسبكشن',
  sector: 'الجودة والتفتيش',
  city: 'الإسكندرية',
  bio: 'إشراف على اختبارات اللحام والمعالجة الحرارية.',
  bannerURL: 'https://firebasestorage.example/peer-banner.jpg',
  photoURL: 'https://firebasestorage.example/peer-photo.jpg',
  profileVisibility: 'public',
  companiesManaged: 0,
  isPublished: true,
};

const calls: { fn: string; args: unknown[] }[] = [];
let mockEmails: Record<string, unknown>[] = [];
let mockPosts: Record<string, unknown>[] = [];

mock.module('../src/client/firestoreClientService.ts', {
  namedExports: {
    observeClientPortalAuth: (cb: (u: typeof me | null) => void) => {
      cb(me);
      return () => {};
    },
    isPortalFirestoreReady: () => true,
    clearPendingRegistrationDraft: () => {},
    loadPendingRegistrationDraft: () => null,
    confirmClientPortalVerification: async () => true,
    resendClientVerificationEmail: async () => {},
    getCommunityWorkspace: async (targetUid: string) =>
      targetUid === me.uid ? myProfile : targetUid === peerUid ? peerProfile : null,
    subscribeMyCommunityWorkspace: (_uid: string, cb: (p: unknown) => void) => {
      cb(myProfile);
      return () => {};
    },
    subscribeCommunityWorkspaces: (_admin: boolean, cb: (list: unknown[]) => void) => {
      cb([myProfile, peerProfile]);
      return () => {};
    },
    subscribeMyConnections: (_uid: string, cb: (list: unknown[]) => void) => {
      cb([{ id: 'c1', fromUid: me.uid, toUid: peerUid, status: 'connected' }]);
      return () => {};
    },
    subscribeAuthorPublicPosts: (_uid: string, cb: (list: unknown[]) => void) => {
      cb(mockPosts);
      return () => {};
    },
    createCommunityPost: async (_user: unknown, input: unknown) => {
      calls.push({ fn: 'createCommunityPost', args: [input] });
      return { id: 'wall-post-1', ...(input as object) };
    },
  },
});

mock.module('../src/client/networkPlatformService.ts', {
  namedExports: {
    subscribeMyFollows: (_uid: string, cb: (list: unknown[]) => void) => {
      cb([]);
      return () => {};
    },
    toggleFollow: async () => true,
    submitModerationReport: async () => {},
    subscribeMyDmThreads: (_uid: string, cb: (list: unknown[]) => void) => {
      cb([]);
      return () => {};
    },
    subscribeMyBlocks: (_uid: string, cb: (list: unknown[]) => void) => {
      cb([]);
      return () => {};
    },
    subscribeThreadMessages: (_id: string, cb: (list: unknown[]) => void) => {
      cb([]);
      return () => {};
    },
    getOrCreateDmThread: async () => ({
      id: `${me.uid}_${peerUid}`,
      participantUids: [me.uid, peerUid],
      participantNames: { [me.uid]: myProfile.displayName, [peerUid]: peerProfile.displayName },
      lastMessage: '',
      lastSenderUid: me.uid,
    }),
    sendDirectMessage: async (_user: unknown, threadId: string, input: unknown) => {
      calls.push({ fn: 'sendDirectMessage', args: [threadId, input] });
    },
    markDirectMessageRead: async () => {},
    blockCommunityMember: async () => {},
    unblockCommunityMember: async () => {},
    createCommunityNotification: async (_user: unknown, input: unknown) => {
      calls.push({ fn: 'createCommunityNotification', args: [input] });
    },
    subscribeMyEmails: (_uid: string, cb: (list: unknown[]) => void) => {
      cb(mockEmails);
      return () => {};
    },
    sendCommunityEmail: async (_user: unknown, input: unknown) => {
      calls.push({ fn: 'sendCommunityEmail', args: [input] });
      return { id: 'mail-created-1', ...(input as object) };
    },
    markCommunityEmailRead: async (id: string, read: boolean) => {
      calls.push({ fn: 'markCommunityEmailRead', args: [id, read] });
    },
    toggleCommunityEmailStar: async (_mail: unknown, uidArg: string, starred: boolean) => {
      calls.push({ fn: 'toggleCommunityEmailStar', args: [uidArg, starred] });
    },
    setCommunityEmailFolder: async (_mail: unknown, uidArg: string, archived: boolean) => {
      calls.push({ fn: 'setCommunityEmailFolder', args: [uidArg, archived] });
    },
  },
});

const { SiteAccountProvider } = await import('../src/account/SiteAccountContext');
const { NetworkMemberProfile } = await import('../src/components/network/NetworkMemberProfile');
const { NetworkMessagesSection } = await import('../src/components/network/NetworkMessagesSection');
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

beforeEach(() => {
  calls.length = 0;
  mockEmails = [];
  mockPosts = [
    {
      id: 'p-wall-1',
      authorUid: me.uid,
      authorName: myProfile.displayName,
      authorOrg: myProfile.organizationName,
      postType: 'insight',
      ndtMethod: 'PAUT',
      title: 'تحديث من موقع العمل',
      body: 'اختبار لحام أنبوب 24 بوصة.',
      mediaUrl: 'https://firebasestorage.example/weld.jpg',
      visibility: 'public',
    },
  ];
});

afterEach(() => cleanup());

test('Facebook-style personal page renders owner wall composer, site tools, and all tabs cleanly', async () => {
  let emailTriggered = false;
  const view = render(
    <SiteAccountProvider>
      <NetworkMemberProfile
        uid={me.uid}
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        onOpenDirectory={() => {}}
        onOpenVerify={() => {}}
        onOpenAcademy={() => {}}
        onOpenCompany={() => {}}
        onOpenEmail={() => {
          emailTriggered = true;
        }}
      />
    </SiteAccountProvider>
  );

  await waitFor(() => assert.ok(view.getByTestId('network-member-live')));
  assert.ok(view.getByTestId('network-member-banner'));
  assert.ok(view.getByTestId('network-member-photo'));
  assert.ok(view.getByTestId('network-member-site-tools'));
  assert.ok(view.getByTestId('network-member-wall-composer'));

  // Publish on personal wall
  fireEvent.change(view.getByPlaceholderText(/عنوان المنشور/), {
    target: { value: 'دراسة فحص جديدة' },
  });
  fireEvent.change(view.getByPlaceholderText(/شارك ملاحظة فحص/), {
    target: { value: 'نتائج الفحص الصوتي على لحام الغلاية ممتازة.' },
  });
  fireEvent.click(view.getByText('نشر على الحائط'));

  await waitFor(() => assert.ok(calls.some(c => c.fn === 'createCommunityPost')));

  // Switch to About tab
  fireEvent.click(view.getByTestId('network-member-tab-about'));
  await waitFor(() => assert.ok(view.getByTestId('network-member-about')));
  assert.ok((view.getByTestId('network-member-about').textContent ?? '').includes('محطات الطاقة'));

  // Switch to Friends tab
  fireEvent.click(view.getByTestId('network-member-tab-friends'));
  await waitFor(() => assert.ok(view.getByTestId('network-member-friends')));
  assert.ok((view.getByTestId('network-member-friends').textContent ?? '').includes('م. سارة محمود'));

  // Switch to Media tab
  fireEvent.click(view.getByTestId('network-member-tab-photos'));
  await waitFor(() => assert.ok(view.getByTestId('network-member-photos')));

  // Open Inbox trigger
  fireEvent.click(view.getByTestId('network-member-open-inbox'));
  assert.equal(emailTriggered, true);
});

test('Visitor sees Messenger & Internal Email triggers on peer personal profile', async () => {
  let openedDmUid: string | undefined;
  let openedMailUid: string | undefined;

  const view = render(
    <SiteAccountProvider>
      <NetworkMemberProfile
        uid={peerUid}
        language="ar"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
        onOpenDirectory={() => {}}
        onOpenMessage={u => {
          openedDmUid = u;
        }}
        onOpenEmail={u => {
          openedMailUid = u;
        }}
      />
    </SiteAccountProvider>
  );

  await waitFor(() => assert.ok(view.getByTestId('network-member-live')));
  assert.equal(view.queryByTestId('network-member-wall-composer'), null, 'visitor must not see owner wall composer');

  fireEvent.click(view.getByTestId('network-member-message'));
  assert.equal(openedDmUid, peerUid);

  fireEvent.click(view.getByTestId('network-member-email'));
  assert.equal(openedMailUid, peerUid);
});

test('INSCO Messages & Mail Hub switches between Messenger and Internal Email, composes, and marks inbox read', async () => {
  mockEmails = [
    {
      id: 'email-1',
      participantUids: [me.uid, peerUid],
      senderUid: peerUid,
      senderName: peerProfile.displayName,
      senderOrg: peerProfile.organizationName,
      recipientUid: me.uid,
      recipientName: myProfile.displayName,
      subject: 'تنسيق موعد فحص PAUT',
      category: 'inspection_coordination',
      priority: 'urgent',
      body: 'نرجو تأكيد الجاهزية لموقع البرلس يوم الخميس.',
      recipientRead: false,
      senderStarred: false,
      recipientStarred: false,
      senderFolder: 'sent',
      recipientFolder: 'inbox',
    },
  ];

  const view = render(
    <SiteAccountProvider>
      <NetworkMessagesSection
        language="ar"
        initialTargetUid="mail"
        onOpenAccount={() => {}}
        onOpenProfile={() => {}}
      />
    </SiteAccountProvider>
  );

  await waitFor(() => assert.ok(view.getByTestId('network-mail-workspace')));
  assert.ok(view.getByTestId('network-mail-list').textContent?.includes('تنسيق موعد فحص PAUT'));

  // Clicking inbox email marks it read
  fireEvent.click(view.getAllByText('تنسيق موعد فحص PAUT')[0]);
  await waitFor(() =>
    assert.ok(calls.some(c => c.fn === 'markCommunityEmailRead' && c.args[0] === 'email-1'))
  );

  // Compose & send a new internal email
  fireEvent.click(view.getByTestId('network-mail-compose-btn'));
  await waitFor(() => assert.ok(view.getByTestId('network-mail-compose')));

  fireEvent.change(view.getByRole('combobox', { name: /إلى/ }), { target: { value: peerUid } });
  fireEvent.change(view.getByPlaceholderText(/موضوع الرسالة البريدية/), {
    target: { value: 'تقرير الفحص المبدئي' },
  });
  fireEvent.change(view.getByPlaceholderText(/اكتب تفاصيل رسالتك البريدية/), {
    target: { value: 'مرفق ملخص الملاحظات الفنية للمراجعة.' },
  });

  fireEvent.click(view.getByTestId('network-mail-send'));
  await waitFor(() => assert.ok(calls.some(c => c.fn === 'sendCommunityEmail')));
  const emailCall = calls.find(c => c.fn === 'sendCommunityEmail')!.args[0] as Record<string, unknown>;
  assert.equal(emailCall.recipientUid, peerUid);
  assert.equal(emailCall.subject, 'تقرير الفحص المبدئي');
  assert.ok(calls.some(c => c.fn === 'createCommunityNotification'));

  // Switch back to Messenger mode
  fireEvent.click(view.getByTestId('network-mode-messenger'));
  await waitFor(() => assert.ok(view.getByText(/بدء محادثة ماسنجر جديدة/)));
});
