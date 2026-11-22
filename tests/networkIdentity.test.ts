/**
 * The identity layer of the public member page: the LinkedIn button, the photos and
 * the audience choice.
 *
 * These are the rules that matter, and all of them fail loudly in production:
 *   - the button must never become a redirect to a host that is not LinkedIn;
 *   - an `http://` image would be blocked as mixed content, so it is refused early;
 *   - a members-only card must read as *refused*, not as missing or empty;
 *   - the generated banner may only contain what the member typed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const identity = await import('../src/network/networkIdentity');
const form = await import('../src/network/networkProfileForm');

test('the LinkedIn button accepts only LinkedIn, and repairs the usual bare paste', () => {
  assert.equal(identity.inspectLinkedInUrl(''), null, 'empty is allowed — the field is optional');
  assert.equal(identity.inspectLinkedInUrl('https://www.linkedin.com/in/ahmed-mahmoud'), null);
  assert.equal(identity.inspectLinkedInUrl('https://linkedin.com/in/x'), null);
  assert.equal(identity.inspectLinkedInUrl('https://lnkd.in/abc'), null);
  assert.equal(identity.inspectLinkedInUrl('https://eg.linkedin.com/in/x'), null, 'regional subdomains are still LinkedIn');

  assert.equal(identity.inspectLinkedInUrl('https://evil.example/linkedin.com'), 'host');
  assert.equal(identity.inspectLinkedInUrl('https://linkedin.com.evil.example/in/x'), 'host');
  assert.equal(identity.inspectLinkedInUrl('http://linkedin.com/in/x'), 'scheme');
  assert.equal(identity.inspectLinkedInUrl('javascript:alert(1)'), 'scheme');
  assert.equal(identity.inspectLinkedInUrl(`https://linkedin.com/in/${'a'.repeat(600)}`), 'too_long');

  assert.equal(
    identity.normaliseLinkedInUrl('linkedin.com/in/ahmed'),
    'https://linkedin.com/in/ahmed',
    'a pasted bare domain becomes a real URL instead of a rejection message'
  );
  assert.equal(identity.normaliseLinkedInUrl('  https://www.linkedin.com/in/x  '), 'https://www.linkedin.com/in/x');
});

test('images must be https, so a promise of a picture is never a blocked one', () => {
  assert.equal(identity.isSafeImageUrl('https://cdn.example/photo.jpg'), true);
  assert.equal(identity.isSafeImageUrl('http://cdn.example/photo.jpg'), false);
  assert.equal(identity.isSafeImageUrl(''), false);
  assert.equal(identity.isSafeImageUrl('https://cdn.example/has space.jpg'), false);
  assert.equal(identity.isSafeImageUrl(`https://cdn.example/${'a'.repeat(600)}`), false);
});

test('a file is refused before any byte leaves the device, exactly as storage would', () => {
  const limit = identity.NETWORK_MEDIA_LIMITS;
  assert.equal(identity.validateMediaFile({ type: 'image/jpeg', size: 1000 }, 'photo'), null);
  assert.equal(identity.validateMediaFile({ type: 'image/gif', size: 1000 }, 'photo')?.ar.includes('JPG'), true);

  const tooBigPhoto = identity.validateMediaFile({ type: 'image/png', size: limit.photoMaxBytes + 1 }, 'photo');
  assert.ok(tooBigPhoto, 'a photo over 2 MB is refused');
  assert.ok(tooBigPhoto!.ar.includes('2'));

  // A 3 MB banner is fine for a banner and too big for a photo: the two limits differ
  // on purpose, and the message must say which one applies.
  assert.equal(identity.validateMediaFile({ type: 'image/png', size: 3 * 1024 * 1024 }, 'banner'), null);
  assert.ok(identity.validateMediaFile({ type: 'image/png', size: 3 * 1024 * 1024 }, 'photo'));

  assert.ok(identity.validateMediaFile({ type: 'image/jpeg', size: 0 }, 'photo'), 'an empty file is refused');
  assert.equal(identity.extensionForMime('image/webp'), 'webp');
  assert.equal(identity.extensionForMime('image/png'), 'png');
  assert.equal(identity.extensionForMime('image/jpeg'), 'jpg');
});

test('the storage path is under the member own uid, never someone else\'s', () => {
  const path = identity.mediaPath('uid-123', 'banner', 'jpg');
  assert.match(path, /^community_profiles\/uid-123\/banner-\d+\.jpg$/);
  assert.ok(path.startsWith('community_profiles/uid-123/'));
});

test('who may open the page mirrors the rules, and absence of the field means public', () => {
  const visitor = { signedIn: false, verified: false };
  const member = { signedIn: true, verified: true };

  assert.deepEqual(identity.publicPageAccess(null, visitor), { state: 'missing' });
  assert.deepEqual(identity.publicPageAccess({ isPublished: false }, visitor), { state: 'not-published' });
  assert.deepEqual(identity.publicPageAccess({ isPublished: true }, visitor), { state: 'ok' }, 'legacy card stays public');
  assert.deepEqual(identity.publicPageAccess({ isPublished: true, profileVisibility: 'public' }, visitor), { state: 'ok' });
  assert.deepEqual(identity.publicPageAccess({ isPublished: true, profileVisibility: 'members' }, visitor), {
    state: 'private',
  });
  assert.deepEqual(
    identity.publicPageAccess({ isPublished: true, profileVisibility: 'members' }, { signedIn: true, verified: false }),
    { state: 'private' },
    'signed in but unconfirmed is still refused'
  );
  assert.deepEqual(identity.publicPageAccess({ isPublished: true, profileVisibility: 'members' }, member), { state: 'ok' });
});

test('the generated banner is built from the card only', () => {
  const spec = identity.bannerSpecFor({
    displayName: 'أحمد محمود',
    headline: 'مفتش PAUT/TOFD — المستوى الثاني',
    organizationName: 'إنسكو',
    sector: 'الفحص غير الإتلافي',
    city: 'الجيزة',
  });

  assert.equal(spec.width, identity.NETWORK_MEDIA_LIMITS.bannerWidth);
  assert.equal(spec.height, identity.NETWORK_MEDIA_LIMITS.bannerHeight);
  assert.equal(spec.name, 'أحمد محمود');
  assert.equal(spec.metaLine, 'إنسكو · الجيزة');
  assert.equal(spec.initials, 'أم');
  assert.equal(spec.rtl, true);
  assert.ok(spec.headlineLines.length >= 1);
  assert.ok(spec.brand.includes('إنسكو'));

  // Nothing that was not typed may appear: no badge, no "verified", no certificate.
  const joined = [spec.name, spec.metaLine, ...spec.headlineLines, spec.brand].join(' ');
  assert.equal(/موثّق|verified|معتمد/i.test(joined), false);

  const empty = identity.bannerSpecFor({ displayName: 'سارة' });
  assert.equal(empty.headlineLines.length, 0);
  assert.equal(empty.metaLine, '');
  assert.equal(empty.initials, 'س');

  assert.equal(identity.canGenerateBanner({ displayName: 'أ' }), false, 'one letter is not a banner');
  assert.equal(identity.canGenerateBanner({ displayName: 'أحمد' }), true);
});

test('headline wrapping keeps words whole and stops at two lines', () => {
  assert.deepEqual(identity.wrapBannerText('مفتش PAUT و TOFD', 50, 2), ['مفتش PAUT و TOFD']);

  const long = identity.wrapBannerText('كلمة '.repeat(40), 20, 2);
  assert.equal(long.length, 2);
  for (const line of long) {
    assert.ok(line.trim().length > 0);
    assert.equal(line.includes('  '), false, 'wrapping never leaves a double space');
  }

  // An over-long single word is kept whole rather than cut in half.
  const single = identity.wrapBannerText('x'.repeat(80), 10, 1);
  assert.deepEqual(single, ['x'.repeat(80)]);
});

test('every sector gets a palette, and an unknown sector still gets one', () => {
  const known = identity.bannerPaletteFor('الفحص غير الإتلافي');
  assert.ok(known.from.startsWith('#'));
  const unknown = identity.bannerPaletteFor('قطاع لم يُسمع به');
  assert.ok(unknown.from.startsWith('#'), 'a new sector must not crash the banner');
});

test('the draft carries the new fields, validates them, and writes them', () => {
  const draft = {
    ...form.EMPTY_NETWORK_PROFILE,
    displayName: 'أحمد محمود',
    organizationName: 'إنسكو',
    sector: 'الفحص غير الإتلافي',
    photoURL: 'https://cdn.example/me.jpg',
    bannerURL: 'https://cdn.example/banner.jpg',
    linkedInUrl: 'linkedin.com/in/ahmed',
    profileVisibility: 'members' as const,
  };
  assert.deepEqual(form.validateNetworkProfileDraft(draft), []);

  const bad = form.validateNetworkProfileDraft({ ...draft, linkedInUrl: 'https://evil.example/in/ahmed' });
  assert.equal(bad.some(error => error.field === 'linkedInUrl'), true);

  const write = form.toWorkspaceWrite(draft, null);
  assert.equal(write.photoURL, 'https://cdn.example/me.jpg');
  assert.equal(write.bannerURL, 'https://cdn.example/banner.jpg');
  assert.equal(write.linkedInUrl, 'https://linkedin.com/in/ahmed', 'normalised before it reaches the rules');
  assert.equal(write.profileVisibility, 'members');

  const cleared = form.toWorkspaceWrite({ ...draft, photoURL: '', bannerURL: '', linkedInUrl: '' }, null);
  assert.equal('photoURL' in cleared, false, 'a cleared field is omitted, not sent as an empty string');
  assert.equal('bannerURL' in cleared, false);
  assert.equal('linkedInUrl' in cleared, false);
  assert.equal(cleared.profileVisibility, 'members', 'the audience choice survives clearing the images');
});

test('an existing card loads its own audience, and an old card without one reads as public', () => {
  const legacy = form.draftFromProfile({
    uid: 'u1',
    displayName: 'سارة',
    organizationName: 'مقاول',
    sector: 'فحص اللحام',
    companiesManaged: 0,
    isPublished: true,
  });
  assert.equal(legacy.profileVisibility, 'public');
  assert.equal(legacy.photoURL, '');
  assert.equal(legacy.bannerURL, '');

  const privateCard = form.draftFromProfile({
    uid: 'u2',
    displayName: 'أحمد',
    organizationName: 'إنسكو',
    sector: 'فحص اللحام',
    companiesManaged: 0,
    isPublished: true,
    profileVisibility: 'members',
    linkedInUrl: 'https://www.linkedin.com/in/x',
  });
  assert.equal(privateCard.profileVisibility, 'members');
  assert.equal(privateCard.linkedInUrl, 'https://www.linkedin.com/in/x');
  assert.equal(identity.visibilityById('nonsense'), 'public', 'an unknown value is never a lockout');
});
