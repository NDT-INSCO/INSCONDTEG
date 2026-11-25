import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CircleAlert,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import type { Language } from '../../types';
import type { NetworkSectionId } from '../../utils/portalRoutes';
import type { CommunityNotification, CommunityNotificationPrefs } from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { isNetworkSectionId } from '../../utils/portalRoutes';

interface NetworkNotificationsSectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenSection: (section: NetworkSectionId, entryId?: string) => void;
}

const PREF_LABELS: Array<{ key: keyof Omit<CommunityNotificationPrefs, 'uid' | 'updatedAt'>; ar: string; en: string }> = [
  { key: 'connections', ar: 'طلبات الاتصال والمتابعة', en: 'Connections & followers' },
  { key: 'comments', ar: 'التعليقات والردود والإجابات', en: 'Comments, replies & Q&A answers' },
  { key: 'groups', ar: 'نشاط المجموعات الهندسية', en: 'Engineering groups activity' },
  { key: 'jobs', ar: 'تحديثات الوظائف وطلبات التقديم', en: 'Jobs & application updates' },
  { key: 'messages', ar: 'الرسائل المباشرة الجديدة', en: 'Incoming direct messages' },
  { key: 'events', ar: 'الفعاليات وتذكير الحضور', en: 'Events & registration updates' },
  { key: 'academy', ar: 'ربط الأكاديمية والتوصيات', en: 'Academy course links & updates' },
  { key: 'weeklyDigest', ar: 'ملخص أسبوعي لأهم النقاشات', en: 'Weekly technical digest' },
];

export const NetworkNotificationsSection: React.FC<NetworkNotificationsSectionProps> = ({
  language,
  onOpenAccount,
  onOpenSection,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;

  const [items, setItems] = useState<CommunityNotification[]>([]);
  const [prefs, setPrefs] = useState<CommunityNotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!serviceReady || !uid) {
      setLoading(false);
      return;
    }
    let active = true;
    const unsubs: Array<() => void> = [];

    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeMyNotifications(
          uid,
          list => {
            if (!active) return;
            setItems(list);
            setLoading(false);
          },
          () => {
            if (active) setLoading(false);
          }
        )
      );
      unsubs.push(
        api.subscribeNotificationPrefs(
          uid,
          next => {
            if (active) setPrefs(next);
          },
          () => {}
        )
      );
    });

    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [serviceReady, uid]);

  const markRead = useCallback(async (notif: CommunityNotification) => {
    const api = await import('../../client/networkPlatformService');
    if (!notif.isRead) {
      await api.markNotificationRead(notif.id, true).catch(() => {});
    }
    if (notif.linkSection && isNetworkSectionId(notif.linkSection)) {
      onOpenSection(notif.linkSection, notif.linkEntryId);
    }
  }, [onOpenSection]);

  const markAllRead = useCallback(async () => {
    const api = await import('../../client/networkPlatformService');
    await api.markAllNotificationsRead(items).catch(() => {});
  }, [items]);

  const togglePref = useCallback(
    async (key: keyof Omit<CommunityNotificationPrefs, 'uid' | 'updatedAt'>) => {
      const user = account?.user;
      if (!user || !prefs) return;
      setSavingPrefs(true);
      try {
        const next = {
          connections: prefs.connections,
          comments: prefs.comments,
          groups: prefs.groups,
          jobs: prefs.jobs,
          messages: prefs.messages,
          events: prefs.events,
          academy: prefs.academy,
          weeklyDigest: prefs.weeklyDigest,
          [key]: !prefs[key],
        };
        const api = await import('../../client/networkPlatformService');
        await api.saveNotificationPrefs(user, next);
      } finally {
        setSavingPrefs(false);
      }
    },
    [account?.user, prefs]
  );

  const unreadCount = items.filter(i => !i.isRead).length;

  return (
    <div data-testid="network-section-notifications" className="min-w-0 space-y-3">
      <div className={`${s.card} flex flex-wrap items-center justify-between gap-2 p-3`}>
        <div>
          <h2 className={`flex items-center gap-2 text-base font-bold ${s.heading}`}>
            <Bell className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
            {isAr ? 'الإشعارات والتنبيهات المهنية' : 'Notifications & Activity Alerts'}
          </h2>
          <p className={`mt-0.5 text-[11px] ${s.subtext}`}>
            {isAr
              ? `${unreadCount} غير مقروءة — تحكّم كامل في قنوات التنبيه.`
              : `${unreadCount} unread — live alerts with full preference controls.`}
          </p>
        </div>
        {uid && unreadCount > 0 ? (
          <button type="button" onClick={() => void markAllRead()} className={s.buttonSecondary}>
            <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
            {isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}
          </button>
        ) : null}
      </div>

      {!serviceReady ? (
        <div className={`${s.card} p-4 text-xs ${s.subtext}`}>
          <CircleAlert className="mb-1 inline h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />{' '}
          {isAr ? 'الإشعارات متاحة عند تفعيل قاعدة البيانات.' : 'Notifications require active database configuration.'}
        </div>
      ) : !uid ? (
        <div className={`${s.card} p-4`}>
          <p className={`text-xs ${s.subtext}`}>
            {isAr ? 'سجّل الدخول لعرض إشعاراتك وضبط تفضيلات التنبيه.' : 'Sign in to view your notifications and manage preferences.'}
          </p>
          <button type="button" onClick={() => onOpenAccount('signin')} className={`${s.buttonPrimary} mt-2.5`}>
            {isAr ? 'تسجيل الدخول' : 'Sign in'}
          </button>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
          <div className={`${s.card} p-3`}>
            {loading ? (
              <p className={`flex items-center gap-2 text-xs ${s.subtext}`}>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                {isAr ? 'جارٍ تحميل الإشعارات…' : 'Loading notifications…'}
              </p>
            ) : items.length === 0 ? (
              <div data-testid="network-notifications-empty" className="py-6 text-center">
                <Bell className={`mx-auto h-6 w-6 shrink-0 ${s.muted}`} aria-hidden="true" />
                <p className={`mt-2 text-xs font-bold ${s.heading}`}>
                  {isAr ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
                </p>
                <p className={`mt-1 text-[11px] ${s.subtext}`}>
                  {isAr
                    ? 'ستظهر هنا إشعارات التعليقات وطلبات العمل والاتصال والرسائل فوراً.'
                    : 'Comments, job application updates, connections, and DMs appear here in real time.'}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {items.map(notif => (
                  <li key={notif.id}>
                    <button
                      type="button"
                      onClick={() => void markRead(notif)}
                      className={`w-full rounded-lg border p-2.5 text-start transition cursor-pointer ${
                        notif.isRead
                          ? s.subCard
                          : 'border-violet-500/50 bg-violet-500/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className={`text-xs font-bold ${s.heading}`}>{notif.title}</span>
                        <span className={s.chip}>{notif.category}</span>
                      </div>
                      <p className={`mt-1 text-[11px] ${s.subtext}`}>{notif.body}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <aside className={`${s.card} space-y-2 p-3`}>
            <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
              <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              {isAr ? 'إعدادات الإشعارات' : 'Notification preferences'}
            </h3>
            {prefs ? (
              <div className="space-y-1.5">
                {PREF_LABELS.map(item => (
                  <label
                    key={item.key}
                    className={`${s.subCard} flex cursor-pointer items-center justify-between gap-2 px-2.5 py-2`}
                  >
                    <span className={`text-[11px] ${s.heading}`}>{isAr ? item.ar : item.en}</span>
                    <input
                      type="checkbox"
                      disabled={savingPrefs}
                      checked={Boolean(prefs[item.key])}
                      onChange={() => void togglePref(item.key)}
                      className="h-3.5 w-3.5 accent-violet-500"
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
};

export default NetworkNotificationsSection;
