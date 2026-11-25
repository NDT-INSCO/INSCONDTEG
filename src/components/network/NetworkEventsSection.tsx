import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityEvent,
  CommunityEventKind,
  CommunityEventRegistration,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { ACADEMY_LINKABLE_COURSES } from '../../network/networkTaxonomy';

interface NetworkEventsSectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenAcademy: () => void;
}

const EVENT_TYPES: Array<{ id: CommunityEventKind; ar: string; en: string }> = [
  { id: 'webinar', ar: 'ندوة عبر الإنترنت', en: 'Webinar' },
  { id: 'workshop', ar: 'ورشة تطبيقية', en: 'Workshop' },
  { id: 'conference', ar: 'مؤتمر فني', en: 'Conference' },
  { id: 'seminar', ar: 'سمينار تخصصي', en: 'Seminar' },
  { id: 'training', ar: 'جلسة تدريبية', en: 'Training Session' },
  { id: 'career_fair', ar: 'ملتقى توظيف', en: 'Career Fair' },
  { id: 'networking', ar: 'تواصل مهني', en: 'Networking Meetup' },
];

export const NetworkEventsSection: React.FC<NetworkEventsSectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRegs, setMyRegs] = useState<Record<string, CommunityEventRegistration['status']>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<CommunityEventKind>('webinar');
  const [dateIso, setDateIso] = useState('');
  const [venueOrLink, setVenueOrLink] = useState('');
  const [capacity, setCapacity] = useState('120');
  const [speakers, setSpeakers] = useState('');
  const [description, setDescription] = useState('');
  const [academyCourseId, setAcademyCourseId] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    let stopEvents: (() => void) | undefined;
    let stopCard: (() => void) | undefined;

    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      stopEvents = api.subscribeCommunityEvents(
        list => {
          if (!active) return;
          setEvents(list);
          setLoading(false);
        },
        err => {
          if (!active) return;
          setError(err.message);
          setLoading(false);
        }
      );
    });

    if (uid) {
      void import('../../client/firestoreClientService').then(api => {
        if (!active) return;
        stopCard = api.subscribeMyCommunityWorkspace(
          uid,
          next => {
            if (active) setCard(next);
          },
          () => {}
        );
      });
    }

    return () => {
      active = false;
      stopEvents?.();
      stopCard?.();
    };
  }, [serviceReady, uid]);

  useEffect(() => {
    if (!serviceReady || !uid || events.length === 0) return;
    let active = true;
    const unsubs: Array<() => void> = [];
    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      for (const ev of events.slice(0, 20)) {
        unsubs.push(
          api.subscribeEventRegistrations(
            ev.id,
            regs => {
              if (!active) return;
              const mine = regs.find(r => r.uid === uid);
              setMyRegs(prev => ({
                ...prev,
                [ev.id]: mine?.status ?? 'cancelled',
              }));
            },
            () => {}
          )
        );
      }
    });
    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [events, serviceReady, uid]);

  const createEvent = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || title.trim().length < 3 || description.trim().length < 5) return;
      setCreating(true);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        await api.createCommunityEvent(user, {
          organizerName: card.displayName,
          organizerOrg: card.organizationName,
          eventType,
          title: title.trim(),
          description: description.trim(),
          speakers: speakers
            .split(/[,،\n]+/)
            .map(v => v.trim())
            .filter(Boolean),
          dateIso: dateIso.trim() || new Date().toISOString().slice(0, 16),
          venueOrLink: venueOrLink.trim() || 'Online / INSCO Live',
          capacity: Number.parseInt(capacity, 10) || 100,
          academyCourseId: academyCourseId || undefined,
        });
        setTitle('');
        setDescription('');
        setVenueOrLink('');
        setSpeakers('');
        setDateIso('');
        setCreateOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setCreating(false);
      }
    },
    [academyCourseId, account?.user, capacity, card, dateIso, description, eventType, speakers, title, venueOrLink]
  );

  const toggleRsvp = useCallback(
    async (ev: CommunityEvent) => {
      const user = account?.user;
      if (!user || !card) return;
      setBusyId(ev.id);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        const currentlyRegistered = myRegs[ev.id] === 'registered';
        await api.rsvpCommunityEvent(user, ev.id, card.displayName, !currentlyRegistered);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusyId(null);
      }
    },
    [account?.user, card, myRegs]
  );

  const canOrganize = Boolean(uid && verified && card);
  const upcomingCount = useMemo(() => events.filter(e => e.status === 'upcoming').length, [events]);

  return (
    <div data-testid="network-section-events" className="min-w-0 space-y-3">
      <div className={`${s.card} p-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className={`flex items-center gap-2 text-base font-bold ${s.heading}`}>
              <CalendarDays className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'الفعاليات والندوات والورش' : 'Engineering Events, Webinars & Workshops'}
            </h2>
            <p className={`mt-0.5 text-[11px] ${s.subtext}`}>
              {isAr
                ? `فعاليات حية بسعة مسجلة وتأكيد حضور مباشر (${upcomingCount} قادمة).`
                : `Live engineering webinars, code seminars, and site workshops (${upcomingCount} upcoming).`}
            </p>
          </div>
          {canOrganize ? (
            <button
              type="button"
              onClick={() => setCreateOpen(v => !v)}
              data-testid="network-event-create-toggle"
              className={s.buttonPrimary}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {createOpen
                ? isAr ? 'إلغاء' : 'Cancel'
                : isAr ? 'إضافة فعالية' : 'Host an event'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (uid ? onOpenProfile() : onOpenAccount('signin'))}
              className={s.buttonSecondary}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {uid
                ? isAr ? 'أنشئ بطاقتك لتنظيم فعالية' : 'Complete profile to host'
                : isAr ? 'سجّل الدخول لتنظيم فعالية' : 'Sign in to host'}
            </button>
          )}
        </div>
      </div>

      {createOpen && canOrganize ? (
        <form onSubmit={createEvent} className={`${s.card} space-y-2.5 p-3`}>
          <h3 className={`text-xs font-bold ${s.heading}`}>
            {isAr ? 'إنشاء فعالية هندسية جديدة' : 'Create Engineering Event'}
          </h3>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={eventType}
              onChange={e => setEventType(e.target.value as CommunityEventKind)}
              className={s.input}
              aria-label={isAr ? 'نوع الفعالية' : 'Event type'}
            >
              {EVENT_TYPES.map(t => (
                <option key={t.id} value={t.id}>
                  {isAr ? t.ar : t.en}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={dateIso}
              onChange={e => setDateIso(e.target.value)}
              className={s.input}
              aria-label={isAr ? 'تاريخ الفعالية' : 'Date & time'}
            />
            <input
              type="number"
              min={1}
              max={5000}
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
              placeholder={isAr ? 'السعة القصوى' : 'Max capacity'}
              className={s.input}
            />
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={180}
            required
            placeholder={isAr ? 'عنوان الندوة أو الورشة…' : 'Event title…'}
            className={s.input}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={venueOrLink}
              onChange={e => setVenueOrLink(e.target.value)}
              maxLength={300}
              placeholder={isAr ? 'المكان أو رابط الحضور…' : 'Venue or online meeting link…'}
              className={s.input}
            />
            <input
              value={speakers}
              onChange={e => setSpeakers(e.target.value)}
              placeholder={isAr ? 'المتحدثون (مفصول بفاصلة)…' : 'Speakers (comma separated)…'}
              className={s.input}
            />
          </div>
          <select
            value={academyCourseId}
            onChange={e => setAcademyCourseId(e.target.value)}
            className={s.input}
            aria-label={isAr ? 'ربط بدورة أكاديمية' : 'Link Academy course'}
          >
            <option value="">{isAr ? 'ربط بدورة أكاديمية (اختياري)' : 'Link Academy course (optional)'}</option>
            {ACADEMY_LINKABLE_COURSES.map(c => (
              <option key={c.id} value={c.id}>
                {isAr ? c.ar : c.en}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={2000}
            required
            placeholder={isAr ? 'محاور الفعالية والجمهور المستهدف…' : 'Agenda, topics covered, and target engineers…'}
            className={`${s.input} resize-y`}
          />
          <div className="flex justify-end">
            <button type="submit" disabled={creating} className={s.buttonPrimary}>
              {creating ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Plus className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {isAr ? 'نشر الفعالية' : 'Publish event'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-400">
          {error}
        </p>
      ) : null}

      {!serviceReady || loading ? (
        <div className={`${s.card} p-4 text-xs ${s.subtext}`}>
          {loading && serviceReady ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              {isAr ? 'جارٍ تحميل الفعاليات…' : 'Loading events…'}
            </span>
          ) : isAr ? (
            'سجل الفعاليات يتفعل مع قاعدة البيانات الحية.'
          ) : (
            'Live events require Firestore configuration.'
          )}
        </div>
      ) : events.length === 0 ? (
        <div data-testid="network-events-empty" className={`${s.card} p-6 text-center`}>
          <CalendarDays className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
          <p className={`mt-2 text-xs font-bold ${s.heading}`}>
            {isAr ? 'لا توجد فعاليات مجدولة حالياً' : 'No scheduled events yet'}
          </p>
          <p className={`mt-1 text-[11px] ${s.subtext}`}>
            {isAr
              ? 'يمكن لأي مهندس أو مؤسسة مؤكدة إضافة ندوة تقنية أو ورشة فحص غير إتلافي هنا.'
              : 'Verified members and companies can organize workshops, webinars, or site clinics here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {events.map(ev => {
            const typeMeta = EVENT_TYPES.find(t => t.id === ev.eventType);
            const registered = myRegs[ev.id] === 'registered';
            const full = ev.attendeesCount >= ev.capacity && !registered;
            return (
              <article key={ev.id} data-testid="network-event-card" className={`${s.card} flex flex-col justify-between p-3`}>
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={s.chip}>{typeMeta ? (isAr ? typeMeta.ar : typeMeta.en) : ev.eventType}</span>
                    <span className={s.chip}>{ev.dateIso.replace('T', ' ')}</span>
                    <span className={s.chip}>
                      <Users className="me-1 inline h-3 w-3 shrink-0" aria-hidden="true" />
                      {ev.attendeesCount}/{ev.capacity}
                    </span>
                  </div>
                  <h3 className={`text-sm font-bold ${s.heading}`}>{ev.title}</h3>
                  <p className={`text-[10px] ${s.subtext}`}>
                    {ev.organizerName} · {ev.organizerOrg}
                  </p>
                  <p className={`flex items-center gap-1 text-[10px] ${s.subtext}`}>
                    <MapPin className="h-3 w-3 shrink-0 text-violet-400" aria-hidden="true" />
                    {ev.venueOrLink}
                  </p>
                  {ev.speakers && ev.speakers.length > 0 ? (
                    <p className={`text-[10px] ${s.subtext}`}>
                      {isAr ? 'المتحدثون: ' : 'Speakers: '}
                      {ev.speakers.join(' · ')}
                    </p>
                  ) : null}
                  <p className={`whitespace-pre-wrap text-[11px] leading-relaxed ${s.subtext}`}>
                    {ev.description}
                  </p>
                </div>

                <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2 ${s.divider}`}>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {canOrganize ? (
                      <button
                        type="button"
                        disabled={busyId === ev.id || full || ev.status !== 'upcoming'}
                        onClick={() => void toggleRsvp(ev)}
                        data-testid="network-event-rsvp"
                        className={registered ? s.buttonSecondary : s.buttonPrimary}
                      >
                        {busyId === ev.id ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                        ) : registered ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                        ) : null}
                        {registered
                          ? isAr ? 'مسجَّل — إلغاء الحضور' : 'Registered — Cancel'
                          : full
                            ? isAr ? 'اكتمل العدد' : 'Full capacity'
                            : isAr ? 'تأكيد الحضور' : 'Register RSVP'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => (uid ? onOpenProfile() : onOpenAccount('signin'))}
                        className={s.buttonSecondary}
                      >
                        {uid
                          ? isAr ? 'أكمل بطاقتك للتسجيل' : 'Complete profile to RSVP'
                          : isAr ? 'سجّل الدخول للتسجيل' : 'Sign in to RSVP'}
                      </button>
                    )}
                  </div>
                  {ev.academyCourseId ? (
                    <button
                      type="button"
                      onClick={onOpenAcademy}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {isAr ? 'مادة الأكاديمية المرتبطة' : 'Related Academy lesson'}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NetworkEventsSection;
