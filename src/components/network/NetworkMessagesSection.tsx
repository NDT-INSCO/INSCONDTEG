import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Ban,
  Check,
  CheckCheck,
  CircleAlert,
  ExternalLink,
  Flag,
  Inbox,
  Loader2,
  Lock,
  Mail,
  MailOpen,
  MessageSquare,
  Paperclip,
  PenSquare,
  Reply,
  Search,
  Send,
  SendHorizontal,
  ShieldCheck,
  Star,
  Unlock,
  UserPlus,
  UserRound,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityBlock,
  CommunityConnection,
  CommunityDirectMessage,
  CommunityEmail,
  CommunityEmailCategory,
  CommunityEmailPriority,
  CommunityMessageThread,
  CommunityWorkspaceProfile,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { initialsOf } from '../../network/networkIdentity';

interface NetworkMessagesSectionProps {
  language: Language;
  /** Supports `<uid>`, `'mail'`, or `'mail:<uid>'` */
  initialTargetUid?: string;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
  onOpenMember?: (uid: string) => void;
}

type CommsMode = 'messenger' | 'mail';
type MailFolder = 'inbox' | 'sent' | 'starred' | 'archive';

const MAIL_CATEGORIES: { id: CommunityEmailCategory; ar: string; en: string }[] = [
  { id: 'general', ar: 'رسالة عامة', en: 'General' },
  { id: 'technical_inquiry', ar: 'استفسار فني / هندسي', en: 'Technical Inquiry' },
  { id: 'inspection_coordination', ar: 'تنسيق فحص ميداني', en: 'Inspection Coordination' },
  { id: 'job_inquiry', ar: 'فرصة عمل / توظيف', en: 'Career / Job Inquiry' },
  { id: 'academy', ar: 'أكاديمية إنسكو', en: 'INSCO Academy' },
];

function categoryLabel(cat: CommunityEmailCategory, isAr: boolean): string {
  const found = MAIL_CATEGORIES.find(c => c.id === cat);
  return found ? (isAr ? found.ar : found.en) : cat;
}

function formatStamp(ts: unknown, isAr: boolean): string {
  if (
    ts &&
    typeof ts === 'object' &&
    'toMillis' in ts &&
    typeof (ts as { toMillis?: () => number }).toMillis === 'function'
  ) {
    try {
      const ms = (ts as { toMillis: () => number }).toMillis();
      return new Date(ms).toLocaleString(isAr ? 'ar-EG' : 'en-GB', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
  return isAr ? 'الآن' : 'Now';
}

function canMessageTarget(
  target: CommunityWorkspaceProfile,
  myUid: string,
  connectedUids: Set<string>,
  blockedUids: Set<string>
): { allowed: boolean; reasonAr: string; reasonEn: string } {
  if (target.uid === myUid) {
    return { allowed: false, reasonAr: 'لا يمكنك مراسلة نفسك', reasonEn: 'You cannot message yourself' };
  }
  if (blockedUids.has(target.uid)) {
    return { allowed: false, reasonAr: 'العضو محظور حالياً', reasonEn: 'Member is currently blocked' };
  }
  const policy = target.messagePolicy ?? 'everyone';
  if (policy === 'none') {
    return {
      allowed: false,
      reasonAr: 'هذا العضو أغلق استقبال الرسائل المباشرة',
      reasonEn: 'This member disabled incoming direct messages',
    };
  }
  if (policy === 'connections' && !connectedUids.has(target.uid)) {
    return {
      allowed: false,
      reasonAr: 'يستقبل الرسائل من أعضاء شبكته فقط',
      reasonEn: 'Only accepts direct messages from connections',
    };
  }
  return { allowed: true, reasonAr: '', reasonEn: '' };
}

export const NetworkMessagesSection: React.FC<NetworkMessagesSectionProps> = ({
  language,
  initialTargetUid,
  onOpenAccount,
  onOpenProfile,
  onOpenMember,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verified = account?.verified ?? false;

  const initialMode: CommsMode =
    initialTargetUid === 'mail' || initialTargetUid?.startsWith('mail:') ? 'mail' : 'messenger';
  const initialMailRecipient = initialTargetUid?.startsWith('mail:')
    ? initialTargetUid.slice(5)
    : undefined;
  const initialDmTarget =
    initialTargetUid && initialTargetUid !== 'mail' && !initialTargetUid.startsWith('mail:')
      ? initialTargetUid
      : undefined;

  const [mode, setMode] = useState<CommsMode>(initialMode);

  // Sync mode when route deep-link changes
  useEffect(() => {
    if (!initialTargetUid) return;
    if (initialTargetUid === 'mail' || initialTargetUid.startsWith('mail:')) {
      setMode('mail');
      if (initialTargetUid.startsWith('mail:')) {
        const target = initialTargetUid.slice(5);
        if (target) {
          setMailRecipientUid(target);
          setMailComposeOpen(true);
        }
      }
    } else {
      setMode('messenger');
    }
  }, [initialTargetUid]);

  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [directory, setDirectory] = useState<CommunityWorkspaceProfile[]>([]);
  const [connections, setConnections] = useState<CommunityConnection[]>([]);
  const [threads, setThreads] = useState<CommunityMessageThread[]>([]);
  const [blocks, setBlocks] = useState<CommunityBlock[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CommunityDirectMessage[]>([]);
  const [emails, setEmails] = useState<CommunityEmail[]>([]);

  // Messenger states
  const [loading, setLoading] = useState(true);
  const [dmSearch, setDmSearch] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [dmAttachmentUrl, setDmAttachmentUrl] = useState('');
  const [showDmAttachment, setShowDmAttachment] = useState(false);
  const [sending, setSending] = useState(false);
  const [startingWith, setStartingWith] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSaved, setReportSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Internal Email states
  const [mailFolder, setMailFolder] = useState<MailFolder>('inbox');
  const [mailSearch, setMailSearch] = useState('');
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
  const [mailComposeOpen, setMailComposeOpen] = useState(Boolean(initialMailRecipient));
  const [mailRecipientUid, setMailRecipientUid] = useState(initialMailRecipient ?? '');
  const [mailSubject, setMailSubject] = useState('');
  const [mailCategory, setMailCategory] = useState<CommunityEmailCategory>('technical_inquiry');
  const [mailPriority, setMailPriority] = useState<CommunityEmailPriority>('normal');
  const [mailBody, setMailBody] = useState('');
  const [mailAttachmentUrl, setMailAttachmentUrl] = useState('');
  const [mailReplyToId, setMailReplyToId] = useState<string | undefined>(undefined);
  const [mailSending, setMailSending] = useState(false);
  const [mailFeedback, setMailFeedback] = useState<string | null>(null);

  const connectedUids = useMemo(() => {
    const set = new Set<string>();
    for (const c of connections) {
      if (c.status === 'connected') {
        set.add(c.fromUid === uid ? c.toUid : c.fromUid);
      }
    }
    return set;
  }, [connections, uid]);

  const blockedUids = useMemo(() => new Set(blocks.map(b => b.blockedUid)), [blocks]);

  useEffect(() => {
    if (!serviceReady) {
      setLoading(false);
      return;
    }
    let active = true;
    const unsubs: Array<() => void> = [];

    void import('../../client/firestoreClientService').then(api => {
      if (!active) return;
      unsubs.push(
        api.subscribeCommunityWorkspaces(
          false,
          list => {
            if (active) setDirectory(list);
          },
          () => {}
        )
      );
      if (uid) {
        unsubs.push(
          api.subscribeMyCommunityWorkspace(
            uid,
            next => {
              if (active) setCard(next);
            },
            () => {}
          )
        );
        unsubs.push(
          api.subscribeMyConnections(
            uid,
            list => {
              if (active) setConnections(list);
            },
            () => {}
          )
        );
      }
    });

    if (uid) {
      void import('../../client/networkPlatformService').then(api => {
        if (!active) return;
        unsubs.push(
          api.subscribeMyDmThreads(
            uid,
            list => {
              if (!active) return;
              setThreads(list);
              setLoading(false);
              if (!selectedThreadId && list.length > 0 && !initialDmTarget) {
                setSelectedThreadId(list[0].id);
              }
            },
            err => {
              if (active) {
                setError(err.message);
                setLoading(false);
              }
            }
          )
        );
        unsubs.push(
          api.subscribeMyBlocks(
            uid,
            list => {
              if (active) setBlocks(list);
            },
            () => {}
          )
        );
        if (typeof api.subscribeMyEmails === 'function') {
          unsubs.push(
            api.subscribeMyEmails(
              uid,
              list => {
                if (!active) return;
                setEmails(list);
              },
              () => {}
            )
          );
        }
      });
    } else {
      setLoading(false);
    }

    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [serviceReady, uid]);

  // Open deep-linked DM target if provided
  useEffect(() => {
    if (!serviceReady || !uid || !verified || !card || !initialDmTarget || initialDmTarget === uid) return;
    const target = directory.find(m => m.uid === initialDmTarget);
    if (!target) return;
    const policy = canMessageTarget(target, uid, connectedUids, blockedUids);
    if (!policy.allowed) {
      setError(isAr ? policy.reasonAr : policy.reasonEn);
      return;
    }
    let active = true;
    void import('../../client/networkPlatformService').then(async api => {
      try {
        const thread = await api.getOrCreateDmThread(account!.user!, card.displayName, target.uid, target.displayName);
        if (active) setSelectedThreadId(thread.id);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      }
    });
    return () => {
      active = false;
    };
  }, [account, blockedUids, card, connectedUids, directory, initialDmTarget, isAr, serviceReady, uid, verified]);

  // Subscribe messages for selected thread
  useEffect(() => {
    if (!serviceReady || !uid || !selectedThreadId) {
      setMessages([]);
      return;
    }
    let active = true;
    let stop: (() => void) | undefined;
    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      stop = api.subscribeThreadMessages(
        selectedThreadId,
        list => {
          if (!active) return;
          setMessages(list);
          for (const msg of list) {
            if (!msg.isRead && msg.recipientUid === uid) {
              void api.markDirectMessageRead(selectedThreadId, msg.id).catch(() => {});
            }
          }
        },
        err => {
          if (active) setError(err.message);
        }
      );
    });
    return () => {
      active = false;
      stop?.();
    };
  }, [selectedThreadId, serviceReady, uid]);

  const activeThread = useMemo(
    () => threads.find(t => t.id === selectedThreadId) ?? null,
    [selectedThreadId, threads]
  );

  const activePartnerUid = useMemo(() => {
    if (!activeThread || !uid) return null;
    return activeThread.participantUids.find(p => p !== uid) ?? null;
  }, [activeThread, uid]);

  const activePartnerName = useMemo(() => {
    if (!activeThread || !activePartnerUid) return '';
    return activeThread.participantNames?.[activePartnerUid] || activePartnerUid;
  }, [activePartnerUid, activeThread]);

  const activePartnerProfile = useMemo(
    () => (activePartnerUid ? directory.find(d => d.uid === activePartnerUid) ?? null : null),
    [activePartnerUid, directory]
  );

  const filteredThreads = useMemo(() => {
    const q = dmSearch.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(thread => {
      const partnerUid = thread.participantUids.find(p => p !== uid) ?? '';
      const partnerName = thread.participantNames?.[partnerUid] || partnerUid;
      return `${partnerName} ${thread.lastMessage}`.toLowerCase().includes(q);
    });
  }, [dmSearch, threads, uid]);

  const filteredContacts = useMemo(() => {
    const q = dmSearch.trim().toLowerCase();
    return directory
      .filter(m => m.uid !== uid)
      .filter(m => !q || `${m.displayName} ${m.organizationName} ${m.headline ?? ''}`.toLowerCase().includes(q))
      .slice(0, 20);
  }, [directory, dmSearch, uid]);

  const startThreadWith = useCallback(
    async (target: CommunityWorkspaceProfile) => {
      const user = account?.user;
      if (!user || !card || !uid) return;
      const check = canMessageTarget(target, uid, connectedUids, blockedUids);
      if (!check.allowed) {
        setError(isAr ? check.reasonAr : check.reasonEn);
        return;
      }
      setStartingWith(target.uid);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        const thread = await api.getOrCreateDmThread(user, card.displayName, target.uid, target.displayName);
        setSelectedThreadId(thread.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setStartingWith(null);
      }
    },
    [account?.user, blockedUids, card, connectedUids, isAr, uid]
  );

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || !selectedThreadId || !activePartnerUid || draftBody.trim().length === 0) return;
      if (blockedUids.has(activePartnerUid)) return;
      setSending(true);
      setError(null);
      try {
        const api = await import('../../client/networkPlatformService');
        const text = draftBody.trim();
        await api.sendDirectMessage(user, selectedThreadId, {
          senderName: card.displayName,
          recipientUid: activePartnerUid,
          body: text,
          attachmentUrl: dmAttachmentUrl.trim() || undefined,
        });
        await api.createCommunityNotification(user, {
          recipientUid: activePartnerUid,
          actorName: card.displayName,
          category: 'message',
          title: isAr ? `رسالة ماسنجر من ${card.displayName}` : `New Messenger message from ${card.displayName}`,
          body: text.slice(0, 140),
          linkSection: 'messages',
          linkEntryId: user.uid,
        });
        setDraftBody('');
        setDmAttachmentUrl('');
        setShowDmAttachment(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSending(false);
      }
    },
    [account?.user, activePartnerUid, blockedUids, card, dmAttachmentUrl, draftBody, isAr, selectedThreadId]
  );

  const toggleBlock = useCallback(
    async (partnerUid: string) => {
      const user = account?.user;
      if (!user) return;
      try {
        const api = await import('../../client/networkPlatformService');
        if (blockedUids.has(partnerUid)) {
          await api.unblockCommunityMember(user, partnerUid);
        } else {
          await api.blockCommunityMember(user, partnerUid, 'Blocked by member in DM');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [account?.user, blockedUids]
  );

  const submitReport = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || !activePartnerUid || reportReason.trim().length < 5) return;
      try {
        const api = await import('../../client/networkPlatformService');
        await api.submitModerationReport(user, {
          reporterName: card.displayName,
          targetType: 'message',
          targetId: selectedThreadId || activePartnerUid,
          targetTitle: activePartnerName || activePartnerUid,
          reason: reportReason.trim(),
        });
        setReportReason('');
        setReportOpen(false);
        setReportSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [account?.user, activePartnerName, activePartnerUid, card, reportReason, selectedThreadId]
  );

  /* -------------------------- Internal Email Logic ------------------------- */

  const unreadInboxCount = useMemo(
    () => emails.filter(e => e.recipientUid === uid && e.recipientFolder === 'inbox' && !e.recipientRead).length,
    [emails, uid]
  );

  const folderEmails = useMemo(() => {
    if (!uid) return [];
    const q = mailSearch.trim().toLowerCase();
    return emails.filter(mail => {
      const isSender = mail.senderUid === uid;
      const isRecipient = mail.recipientUid === uid;
      const starred = isSender ? mail.senderStarred : mail.recipientStarred;
      const archived = isSender ? mail.senderFolder === 'archive' : mail.recipientFolder === 'archive';

      if (mailFolder === 'inbox' && !(isRecipient && !archived)) return false;
      if (mailFolder === 'sent' && !(isSender && !archived)) return false;
      if (mailFolder === 'starred' && !starred) return false;
      if (mailFolder === 'archive' && !archived) return false;

      if (!q) return true;
      return `${mail.subject} ${mail.senderName} ${mail.recipientName} ${mail.body}`.toLowerCase().includes(q);
    });
  }, [emails, mailFolder, mailSearch, uid]);

  const activeMail = useMemo(
    () => emails.find(e => e.id === selectedMailId) ?? folderEmails[0] ?? null,
    [emails, folderEmails, selectedMailId]
  );

  const openMailItem = useCallback(
    async (mail: CommunityEmail) => {
      setSelectedMailId(mail.id);
      setMailComposeOpen(false);
      if (mail.recipientUid === uid && !mail.recipientRead) {
        try {
          const api = await import('../../client/networkPlatformService');
          await api.markCommunityEmailRead(mail.id, true);
        } catch {
          /* ignore */
        }
      }
    },
    [uid]
  );

  const openComposeFor = useCallback((recipientUid = '', replyTo?: CommunityEmail) => {
    setMailRecipientUid(recipientUid);
    if (replyTo) {
      setMailSubject(replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`);
      setMailCategory(replyTo.category);
      setMailPriority(replyTo.priority);
      setMailReplyToId(replyTo.id);
    } else {
      setMailSubject('');
      setMailCategory('technical_inquiry');
      setMailPriority('normal');
      setMailReplyToId(undefined);
    }
    setMailBody('');
    setMailAttachmentUrl('');
    setMailFeedback(null);
    setMailComposeOpen(true);
  }, []);

  const handleSendMail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || !mailRecipientUid || mailSubject.trim().length < 2 || mailBody.trim().length < 1) return;
      const recipient = directory.find(d => d.uid === mailRecipientUid);
      if (!recipient) {
        setError(isAr ? 'اختر مستلماً صحيحاً من أعضاء المنصة.' : 'Select a valid member recipient.');
        return;
      }
      if (blockedUids.has(recipient.uid)) {
        setError(isAr ? 'لا يمكن مراسلة عضو محظور.' : 'Cannot send email to a blocked member.');
        return;
      }
      setMailSending(true);
      setError(null);
      setMailFeedback(null);
      try {
        const api = await import('../../client/networkPlatformService');
        const created = await api.sendCommunityEmail(user, {
          senderName: card.displayName,
          senderOrg: card.organizationName,
          recipientUid: recipient.uid,
          recipientName: recipient.displayName,
          subject: mailSubject.trim(),
          category: mailCategory,
          priority: mailPriority,
          body: mailBody.trim(),
          attachmentUrl: mailAttachmentUrl.trim() || undefined,
          replyToEmailId: mailReplyToId,
        });
        await api.createCommunityNotification(user, {
          recipientUid: recipient.uid,
          actorName: card.displayName,
          category: 'message',
          title: isAr ? `بريد إلكتروني داخلي: ${mailSubject.trim()}` : `Internal Email: ${mailSubject.trim()}`,
          body: mailBody.trim().slice(0, 140),
          linkSection: 'messages',
          linkEntryId: `mail:${user.uid}`,
        });
        setMailComposeOpen(false);
        setMailSubject('');
        setMailBody('');
        setMailAttachmentUrl('');
        setMailReplyToId(undefined);
        setSelectedMailId(created.id);
        setMailFolder('sent');
        setMailFeedback(isAr ? 'تم إرسال البريد الداخلي بنجاح.' : 'Internal email delivered.');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setMailSending(false);
      }
    },
    [
      account?.user,
      blockedUids,
      card,
      directory,
      isAr,
      mailAttachmentUrl,
      mailBody,
      mailCategory,
      mailPriority,
      mailRecipientUid,
      mailReplyToId,
      mailSubject,
    ]
  );

  const handleToggleMailStar = useCallback(
    async (mail: CommunityEmail) => {
      if (!uid) return;
      const isSender = mail.senderUid === uid;
      const current = isSender ? mail.senderStarred : mail.recipientStarred;
      try {
        const api = await import('../../client/networkPlatformService');
        await api.toggleCommunityEmailStar(mail, uid, !current);
      } catch {
        /* ignore */
      }
    },
    [uid]
  );

  const handleToggleMailArchive = useCallback(
    async (mail: CommunityEmail) => {
      if (!uid) return;
      const isSender = mail.senderUid === uid;
      const currentArchived = isSender ? mail.senderFolder === 'archive' : mail.recipientFolder === 'archive';
      try {
        const api = await import('../../client/networkPlatformService');
        await api.setCommunityEmailFolder(mail, uid, !currentArchived);
      } catch {
        /* ignore */
      }
    },
    [uid]
  );

  const isPartnerBlocked = Boolean(activePartnerUid && blockedUids.has(activePartnerUid));
  const partnerPolicyCheck =
    activePartnerProfile && uid
      ? canMessageTarget(activePartnerProfile, uid, connectedUids, blockedUids)
      : { allowed: !isPartnerBlocked, reasonAr: '', reasonEn: '' };

  const internalHandle = uid ? `${uid.slice(0, 10)}@insco.network` : 'guest@insco.network';

  return (
    <div data-testid="network-section-messages" className="min-w-0 space-y-3">
      {/* Header + Mode Tabs: Messenger vs Internal Platform Email */}
      <div className={`${s.card} p-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className={`flex items-center gap-2 text-base font-black ${s.heading}`}>
              {mode === 'messenger' ? (
                <MessageSquare className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
              ) : (
                <Mail className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
              )}
              {isAr ? 'مركز التواصل الداخلي — الماسنجر والبريد الهندسي' : 'INSCO Communication Hub — Messenger & Internal Mail'}
            </h2>
            <p className={`mt-0.5 text-[11px] ${s.subtext}`}>
              {isAr
                ? 'تواصل فوري بالماسنجر أو مراسلات رسمية بالبريد الإلكتروني الداخلي داخل المنصة بدون كشف بريدك الشخصي.'
                : 'Real-time Messenger chat plus structured internal platform email across INSCO members without exposing personal email addresses.'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden="true" />
            {isAr ? 'قناة خاصة محمية بالقواعد' : 'Rules-isolated channel'}
          </span>
        </div>

        <div data-testid="network-comms-mode-tabs" role="tablist" className={`mt-3 flex flex-wrap gap-2 border-t pt-2.5 ${s.divider}`}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'messenger'}
            data-testid="network-mode-messenger"
            onClick={() => setMode('messenger')}
            className={mode === 'messenger' ? s.buttonPrimary : s.buttonSecondary}
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'ماسنجر المنصة (محادثة فورية)' : 'INSCO Messenger (Live Chat)'}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'mail'}
            data-testid="network-mode-mail"
            onClick={() => setMode('mail')}
            className={mode === 'mail' ? s.buttonPrimary : s.buttonSecondary}
          >
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {isAr ? 'البريد الإلكتروني الداخلي' : 'Internal Platform Email'}
            {unreadInboxCount > 0 ? (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.2 font-mono text-[9px] font-bold text-white tabular-nums">
                {unreadInboxCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {!serviceReady ? (
        <div data-testid="network-messages-unavailable" className={`${s.card} p-4 text-xs ${s.subtext}`}>
          <CircleAlert className="mb-1 inline h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />{' '}
          {isAr ? 'الماسنجر والبريد الداخلي يتطلبان تفعيل اتصال قاعدة البيانات.' : 'Messenger and internal mail require active database setup.'}
        </div>
      ) : !uid || !verified || !card ? (
        <div data-testid="network-messages-gate" className={`${s.card} p-4`}>
          <div className={`flex items-center gap-2 text-xs font-bold ${s.heading}`}>
            <Lock className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
            {!uid
              ? isAr
                ? 'سجّل الدخول لاستخدام الماسنجر والبريد الداخلي'
                : 'Sign in to use Messenger and internal mail'
              : !verified
                ? isAr
                  ? 'أكّد بريدك أولاً لتفعيل المحادثات والبريد'
                  : 'Confirm your email to enable messaging & internal mail'
                : isAr
                  ? 'أنشئ بطاقتك المهنية أولاً لإظهار اسمك في المراسلات'
                  : 'Create your professional card before messaging'}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {!uid ? (
              <button type="button" onClick={() => onOpenAccount('signin')} className={s.buttonPrimary}>
                {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </button>
            ) : !verified ? (
              <button type="button" onClick={() => onOpenAccount('account')} className={s.buttonPrimary}>
                {isAr ? 'تأكيد البريد الإلكتروني' : 'Confirm email'}
              </button>
            ) : (
              <button type="button" onClick={onOpenProfile} className={s.buttonPrimary}>
                {isAr ? 'إنشاء بطاقتي' : 'Create my card'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <p role="alert" className="rounded border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-400">
              {error}
            </p>
          ) : null}
          {reportSaved ? (
            <p role="status" className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-400">
              {isAr ? 'تم إرسال البلاغ للمراجعة.' : 'Report submitted for moderation review.'}
            </p>
          ) : null}
          {mailFeedback ? (
            <p role="status" className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-400">
              {mailFeedback}
            </p>
          ) : null}

          {/* ===================== MODE 1: INSCO MESSENGER ===================== */}
          {mode === 'messenger' ? (
            <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,295px)_minmax(0,1fr)]">
              <aside className="min-w-0 space-y-3">
                <div className={`${s.card} space-y-2 p-3`}>
                  <div className={`flex items-center gap-1.5 ${s.subCard} px-2 py-1.5`}>
                    <Search className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    <input
                      value={dmSearch}
                      onChange={e => setDmSearch(e.target.value)}
                      placeholder={isAr ? 'ابحث في المحادثات والأعضاء…' : 'Search chats & members…'}
                      className={`min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none ${s.heading}`}
                    />
                  </div>

                  <h3 className={`text-xs font-bold ${s.heading}`}>
                    {isAr ? `المحادثات النشطة (${filteredThreads.length})` : `Active Chats (${filteredThreads.length})`}
                  </h3>

                  {loading ? (
                    <p className={`mt-2 flex items-center gap-1.5 text-[11px] ${s.subtext}`}>
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                      {isAr ? 'جارٍ التحميل…' : 'Loading…'}
                    </p>
                  ) : filteredThreads.length === 0 ? (
                    <p className={`text-[11px] ${s.subtext}`}>
                      {isAr ? 'لا توجد محادثات مطابقة. اختر زميلاً أدناه.' : 'No matching chats. Pick a colleague below.'}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {filteredThreads.map(thread => {
                        const partnerUid = thread.participantUids.find(p => p !== uid) ?? '';
                        const partnerName = thread.participantNames?.[partnerUid] || partnerUid;
                        const partnerCard = directory.find(d => d.uid === partnerUid);
                        const active = thread.id === selectedThreadId;
                        return (
                          <li key={thread.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedThreadId(thread.id)}
                              className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-start transition cursor-pointer ${
                                active
                                  ? 'border-violet-500 bg-violet-500/15'
                                  : `${s.subCard} hover:border-violet-400/50`
                              }`}
                            >
                              {partnerCard?.photoURL ? (
                                <img src={partnerCard.photoURL} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                              ) : (
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-400">
                                  {initialsOf(partnerName)}
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`truncate text-xs font-bold ${s.heading}`}>{partnerName}</span>
                                  {blockedUids.has(partnerUid) ? (
                                    <span className="rounded bg-rose-500/15 px-1 text-[9px] text-rose-400">
                                      {isAr ? 'محظور' : 'Blocked'}
                                    </span>
                                  ) : null}
                                </div>
                                <p className={`mt-0.5 truncate text-[10px] ${s.subtext}`}>
                                  {thread.lastMessage || (isAr ? 'ابدأ المحادثة…' : 'Say hello…')}
                                </p>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className={`${s.card} p-3`}>
                  <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                    <UserPlus className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                    {isAr ? 'بدء محادثة ماسنجر جديدة' : 'Start a new Messenger chat'}
                  </h3>
                  <ul className="mt-2 max-h-60 space-y-1.5 overflow-y-auto">
                    {filteredContacts.map(member => {
                      const check = canMessageTarget(member, uid, connectedUids, blockedUids);
                      return (
                        <li key={member.uid} className={`${s.subCard} flex items-center justify-between gap-2 p-2`}>
                          <div className="flex min-w-0 items-center gap-2">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-[9px] font-bold text-violet-400">
                                {initialsOf(member.displayName)}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className={`truncate text-[11px] font-bold ${s.heading}`}>{member.displayName}</p>
                              <p className={`truncate text-[9px] ${s.subtext}`}>{member.organizationName}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!check.allowed || startingWith === member.uid}
                            title={!check.allowed ? (isAr ? check.reasonAr : check.reasonEn) : undefined}
                            onClick={() => void startThreadWith(member)}
                            className={s.buttonSecondary}
                          >
                            {startingWith === member.uid ? (
                              <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" />
                            ) : (
                              <MessageSquare className="h-3 w-3 shrink-0" aria-hidden="true" />
                            )}
                            {isAr ? 'محادثة' : 'Chat'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>

              {/* Messenger Thread Stage */}
              <section className={`${s.card} flex min-h-[440px] min-w-0 flex-col justify-between p-3`}>
                {!activeThread ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                    <MessageSquare className={`h-9 w-9 shrink-0 ${s.muted}`} aria-hidden="true" />
                    <p className={`mt-2 text-xs font-bold ${s.heading}`}>
                      {isAr ? 'اختر محادثة أو ابدأ محادثة ماسنجر جديدة' : 'Select or start a Messenger chat'}
                    </p>
                    <p className={`mt-1 max-w-sm text-[11px] ${s.subtext}`}>
                      {isAr
                        ? 'أو انتقل إلى تبويب «البريد الإلكتروني الداخلي» لإرسال خطابات ومراسلات فنية مصنّفة.'
                        : 'Or switch to Internal Platform Email to send structured engineering correspondence.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 ${s.divider}`}>
                      <div className="flex min-w-0 items-center gap-2.5">
                        {activePartnerProfile?.photoURL ? (
                          <img src={activePartnerProfile.photoURL} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-400">
                            {initialsOf(activePartnerName)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <h3 className={`truncate text-sm font-bold ${s.heading}`}>{activePartnerName}</h3>
                          {activePartnerProfile ? (
                            <p className={`truncate text-[10px] ${s.subtext}`}>
                              {activePartnerProfile.headline || activePartnerProfile.organizationName}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {activePartnerUid && onOpenMember ? (
                          <button
                            type="button"
                            onClick={() => onOpenMember(activePartnerUid)}
                            className={s.buttonSecondary}
                          >
                            <UserRound className="h-3 w-3 shrink-0 text-violet-400" aria-hidden="true" />
                            {isAr ? 'صفحة العضو' : 'Profile'}
                          </button>
                        ) : null}
                        {activePartnerUid ? (
                          <button
                            type="button"
                            onClick={() => {
                              setMode('mail');
                              openComposeFor(activePartnerUid);
                            }}
                            className={s.buttonSecondary}
                          >
                            <Mail className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
                            {isAr ? 'بريد داخلي' : 'Email'}
                          </button>
                        ) : null}
                        {activePartnerUid ? (
                          <button
                            type="button"
                            onClick={() => void toggleBlock(activePartnerUid)}
                            className={s.buttonSecondary}
                          >
                            {isPartnerBlocked ? (
                              <Unlock className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                            ) : (
                              <Ban className="h-3 w-3 shrink-0 text-rose-400" aria-hidden="true" />
                            )}
                            {isPartnerBlocked ? (isAr ? 'إلغاء الحظر' : 'Unblock') : isAr ? 'حظر' : 'Block'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setReportOpen(v => !v)}
                          className={s.buttonSecondary}
                        >
                          <Flag className="h-3 w-3 shrink-0 text-amber-400" aria-hidden="true" />
                          {isAr ? 'إبلاغ' : 'Report'}
                        </button>
                      </div>
                    </div>

                    {reportOpen ? (
                      <form onSubmit={submitReport} className={`${s.subCard} mt-2 space-y-2 p-2`}>
                        <input
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          required
                          minLength={5}
                          placeholder={isAr ? 'اذكر سبب البلاغ…' : 'Describe why you are reporting this conversation…'}
                          className={s.input}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setReportOpen(false)} className={s.buttonSecondary}>
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button type="submit" className={s.buttonPrimary}>
                            {isAr ? 'إرسال البلاغ' : 'Submit report'}
                          </button>
                        </div>
                      </form>
                    ) : null}

                    <div className="my-3 flex-1 space-y-2 overflow-y-auto">
                      {messages.length === 0 ? (
                        <p className={`py-8 text-center text-[11px] ${s.subtext}`}>
                          {isAr ? 'لا رسائل بعد في هذه المحادثة.' : 'No messages yet in this conversation.'}
                        </p>
                      ) : (
                        messages.map(msg => {
                          const mine = msg.senderUid === uid;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11px] leading-relaxed ${
                                  mine
                                    ? 'bg-violet-600 text-white'
                                    : isLight
                                      ? 'bg-slate-100 text-slate-900'
                                      : 'bg-[#171732] text-slate-200'
                                }`}
                              >
                                <p className="whitespace-pre-wrap">{msg.body}</p>
                                {msg.attachmentUrl ? (
                                  <a
                                    href={msg.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className={`mt-1 inline-flex items-center gap-1 underline ${
                                      mine ? 'text-violet-100' : 'text-violet-400'
                                    }`}
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    {isAr ? 'مرفق خارجي' : 'Attachment'}
                                  </a>
                                ) : null}
                              </div>
                              <div className={`mt-0.5 flex items-center gap-1 px-1 text-[9px] ${s.muted}`}>
                                <span>{formatStamp(msg.createdAt, isAr)}</span>
                                {mine ? (
                                  msg.isRead ? (
                                    <CheckCheck className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                                  ) : (
                                    <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  )
                                ) : null}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {isPartnerBlocked ? (
                      <p className="rounded border border-rose-500/40 bg-rose-500/10 p-2 text-center text-[11px] text-rose-400">
                        {isAr ? 'تم حظر هذا العضو. ألغِ الحظر لاستئناف المراسلة.' : 'You blocked this member. Unblock to resume messaging.'}
                      </p>
                    ) : !partnerPolicyCheck.allowed ? (
                      <p className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-center text-[11px] text-amber-400">
                        {isAr ? partnerPolicyCheck.reasonAr : partnerPolicyCheck.reasonEn}
                      </p>
                    ) : (
                      <form onSubmit={sendMessage} className="space-y-1.5 pt-2">
                        {showDmAttachment ? (
                          <input
                            value={dmAttachmentUrl}
                            onChange={e => setDmAttachmentUrl(e.target.value)}
                            dir="ltr"
                            maxLength={500}
                            placeholder={isAr ? 'رابط مرفق (https://…)' : 'Attachment link (https://…)'}
                            className={s.input}
                          />
                        ) : null}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDmAttachment(v => !v)}
                            title={isAr ? 'إرفاق رابط' : 'Attach HTTPS link'}
                            className={s.buttonSecondary}
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </button>
                          <input
                            value={draftBody}
                            onChange={e => setDraftBody(e.target.value)}
                            maxLength={2000}
                            placeholder={isAr ? 'اكتب رسالتك هنا…' : 'Write your message…'}
                            aria-label={isAr ? 'نص الرسالة' : 'Message text'}
                            className={s.input}
                          />
                          <button
                            type="submit"
                            disabled={sending || draftBody.trim().length === 0}
                            data-testid="network-dm-send"
                            className={s.buttonPrimary}
                          >
                            {sending ? (
                              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                            ) : (
                              <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            )}
                            {isAr ? 'إرسال' : 'Send'}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </section>
            </div>
          ) : (
            /* ===================== MODE 2: INSCO INTERNAL EMAIL ===================== */
            <div data-testid="network-mail-workspace" className="min-w-0 space-y-3">
              {/* Top Mail Toolbar */}
              <div className={`${s.card} flex flex-wrap items-center justify-between gap-2 p-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="network-mail-compose-btn"
                    onClick={() => openComposeFor()}
                    className={s.buttonPrimary}
                  >
                    <PenSquare className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {isAr ? 'إنشاء رسالة بريد' : 'Compose Email'}
                  </button>
                  <span className={`rounded border px-2 py-1 font-mono text-[10px] ${s.subCard} ${s.subtext}`} dir="ltr">
                    {internalHandle}
                  </span>
                </div>

                <div className={`flex min-w-[200px] items-center gap-1.5 ${s.subCard} px-2.5 py-1.5`}>
                  <Search className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                  <input
                    value={mailSearch}
                    onChange={e => setMailSearch(e.target.value)}
                    placeholder={isAr ? 'بحث في الموضوع أو المرسل…' : 'Search subject or sender…'}
                    className={`min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none ${s.heading}`}
                  />
                </div>
              </div>

              <div className="grid min-w-0 gap-3 lg:grid-cols-[190px_minmax(0,300px)_minmax(0,1fr)]">
                {/* Mail Folder Rail */}
                <aside className={`${s.card} space-y-1 p-2.5`}>
                  {(
                    [
                      { id: 'inbox', ar: 'الوارد', en: 'Inbox', icon: Inbox, count: unreadInboxCount },
                      { id: 'sent', ar: 'الصادر', en: 'Sent', icon: SendHorizontal, count: 0 },
                      { id: 'starred', ar: 'المميزة بنجمة', en: 'Starred', icon: Star, count: 0 },
                      { id: 'archive', ar: 'الأرشيف', en: 'Archive', icon: Archive, count: 0 },
                    ] as const
                  ).map(folder => {
                    const Icon = folder.icon;
                    const active = mailFolder === folder.id && !mailComposeOpen;
                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => {
                          setMailFolder(folder.id);
                          setMailComposeOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-[11px] font-bold transition cursor-pointer ${
                          active
                            ? 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/40'
                            : `${s.subtext} hover:bg-sky-500/10`
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{isAr ? folder.ar : folder.en}</span>
                        </span>
                        {folder.count > 0 ? (
                          <span className="rounded-full bg-rose-500 px-1.5 font-mono text-[9px] text-white tabular-nums">
                            {folder.count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </aside>

                {/* Mail List Column */}
                <div data-testid="network-mail-list" className={`${s.card} max-h-[500px] space-y-1.5 overflow-y-auto p-2.5`}>
                  {folderEmails.length === 0 ? (
                    <div className="p-6 text-center">
                      <MailOpen className={`mx-auto h-7 w-7 shrink-0 ${s.muted}`} aria-hidden="true" />
                      <p className={`mt-2 text-xs font-bold ${s.heading}`}>
                        {isAr ? 'هذا المجلد فارغ حالياً' : 'This folder is empty'}
                      </p>
                      <p className={`mt-1 text-[10px] ${s.subtext}`}>
                        {isAr ? 'اضغط «إنشاء رسالة بريد» لمراسلة أي عضو بالمنصة.' : 'Click Compose Email to write to any member.'}
                      </p>
                    </div>
                  ) : (
                    folderEmails.map(mail => {
                      const isIncoming = mail.recipientUid === uid;
                      const unread = isIncoming && !mail.recipientRead;
                      const starred = mail.senderUid === uid ? mail.senderStarred : mail.recipientStarred;
                      const selected = activeMail?.id === mail.id && !mailComposeOpen;
                      return (
                        <button
                          key={mail.id}
                          type="button"
                          onClick={() => void openMailItem(mail)}
                          className={`w-full rounded-lg border p-2.5 text-start transition cursor-pointer ${
                            selected
                              ? 'border-sky-500 bg-sky-500/15'
                              : `${s.subCard} hover:border-sky-400/50`
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`truncate text-[11px] ${unread ? 'font-black' : 'font-bold'} ${s.heading}`}>
                              {isIncoming ? mail.senderName : `${isAr ? 'إلى:' : 'To:'} ${mail.recipientName}`}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              {unread ? (
                                <span className="h-2 w-2 rounded-full bg-sky-400" aria-label={isAr ? 'غير مقروء' : 'Unread'} />
                              ) : null}
                              {starred ? (
                                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
                              ) : null}
                            </div>
                          </div>
                          <p className={`mt-0.5 truncate text-[11px] ${unread ? 'font-bold' : ''} ${s.subtext}`}>
                            {mail.subject}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center justify-between gap-1">
                            <span className={s.chip}>{categoryLabel(mail.category, isAr)}</span>
                            <span className={`text-[9px] ${s.muted}`}>{formatStamp(mail.createdAt, isAr)}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Compose OR Reader Pane */}
                <section className={`${s.card} min-h-[420px] min-w-0 p-4`}>
                  {mailComposeOpen ? (
                    <form
                      onSubmit={handleSendMail}
                      data-testid="network-mail-compose"
                      className="space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`flex items-center gap-1.5 text-sm font-black ${s.heading}`}>
                          <PenSquare className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                          {mailReplyToId
                            ? isAr
                              ? 'رد على البريد الداخلي'
                              : 'Reply to Internal Email'
                            : isAr
                              ? 'رسالة بريد إلكتروني جديدة بالمنصة'
                              : 'New Platform Internal Email'}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setMailComposeOpen(false)}
                          className={s.buttonSecondary}
                        >
                          {isAr ? 'إغلاق' : 'Close'}
                        </button>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="min-w-0 sm:col-span-2">
                          <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'إلى (عضو المنصة)' : 'To (Member)'}</span>
                          <select
                            value={mailRecipientUid}
                            onChange={e => setMailRecipientUid(e.target.value)}
                            required
                            className={`${s.input} mt-0.5`}
                          >
                            <option value="">{isAr ? 'اختر مستلماً من أعضاء المنصة…' : 'Select recipient…'}</option>
                            {directory
                              .filter(m => m.uid !== uid)
                              .map(member => (
                                <option key={member.uid} value={member.uid}>
                                  {member.displayName} — {member.organizationName}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label className="min-w-0">
                          <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'تصنيف البريد' : 'Category'}</span>
                          <select
                            value={mailCategory}
                            onChange={e => setMailCategory(e.target.value as CommunityEmailCategory)}
                            className={`${s.input} mt-0.5`}
                          >
                            {MAIL_CATEGORIES.map(c => (
                              <option key={c.id} value={c.id}>
                                {isAr ? c.ar : c.en}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="min-w-0">
                          <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'الأولوية' : 'Priority'}</span>
                          <select
                            value={mailPriority}
                            onChange={e => setMailPriority(e.target.value as CommunityEmailPriority)}
                            className={`${s.input} mt-0.5`}
                          >
                            <option value="normal">{isAr ? 'عادي' : 'Normal'}</option>
                            <option value="urgent">{isAr ? 'عاجل' : 'Urgent'}</option>
                          </select>
                        </label>
                      </div>

                      <label className="block">
                        <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'الموضوع' : 'Subject'}</span>
                        <input
                          value={mailSubject}
                          onChange={e => setMailSubject(e.target.value)}
                          required
                          minLength={2}
                          maxLength={180}
                          placeholder={isAr ? 'موضوع الرسالة البريدية…' : 'Email subject…'}
                          className={`${s.input} mt-0.5`}
                        />
                      </label>

                      <label className="block">
                        <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'نص الرسالة' : 'Body'}</span>
                        <textarea
                          value={mailBody}
                          onChange={e => setMailBody(e.target.value)}
                          rows={6}
                          required
                          maxLength={5000}
                          placeholder={isAr ? 'اكتب تفاصيل رسالتك البريدية هنا…' : 'Write your engineering message here…'}
                          className={`${s.input} mt-0.5 resize-none`}
                        />
                      </label>

                      <label className="block">
                        <span className={`block text-[10px] font-bold ${s.subtext}`}>
                          {isAr ? 'رابط مرفق أو ملف PDF (اختياري HTTPS)' : 'Attachment URL (optional HTTPS)'}
                        </span>
                        <input
                          value={mailAttachmentUrl}
                          onChange={e => setMailAttachmentUrl(e.target.value)}
                          dir="ltr"
                          maxLength={500}
                          placeholder="https://…"
                          className={`${s.input} mt-0.5`}
                        />
                      </label>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={mailSending || !mailRecipientUid || mailSubject.trim().length < 2 || !mailBody.trim()}
                          data-testid="network-mail-send"
                          className={s.buttonPrimary}
                        >
                          {mailSending ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" />
                          ) : (
                            <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          )}
                          {isAr ? 'إرسال البريد' : 'Send Email'}
                        </button>
                      </div>
                    </form>
                  ) : !activeMail ? (
                    <div className="flex h-full min-h-[340px] flex-col items-center justify-center p-6 text-center">
                      <Mail className={`h-9 w-9 shrink-0 ${s.muted}`} aria-hidden="true" />
                      <p className={`mt-2 text-xs font-bold ${s.heading}`}>
                        {isAr ? 'اختر رسالة لقراءتها أو أنشئ بريداً جديداً' : 'Select an email to read or compose a new one'}
                      </p>
                    </div>
                  ) : (
                    <div data-testid="network-mail-reader" className="space-y-3">
                      <div className={`flex flex-wrap items-start justify-between gap-2 border-b pb-3 ${s.divider}`}>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={s.chip}>{categoryLabel(activeMail.category, isAr)}</span>
                            {activeMail.priority === 'urgent' ? (
                              <span className="rounded border border-rose-500/50 bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-bold text-rose-400">
                                {isAr ? 'عاجل' : 'Urgent'}
                              </span>
                            ) : null}
                          </div>
                          <h3 className={`text-base font-black ${s.heading}`}>{activeMail.subject}</h3>
                          <p className={`text-[11px] ${s.subtext}`}>
                            <span className="font-bold">{isAr ? 'من:' : 'From:'}</span> {activeMail.senderName}
                            {activeMail.senderOrg ? ` (${activeMail.senderOrg})` : ''} ·{' '}
                            <span className="font-bold">{isAr ? 'إلى:' : 'To:'}</span> {activeMail.recipientName}
                          </p>
                          <p className={`text-[10px] ${s.muted}`}>{formatStamp(activeMail.createdAt, isAr)}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const replyTarget =
                                activeMail.senderUid === uid ? activeMail.recipientUid : activeMail.senderUid;
                              openComposeFor(replyTarget, activeMail);
                            }}
                            className={s.buttonPrimary}
                          >
                            <Reply className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            {isAr ? 'رد' : 'Reply'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const partner =
                                activeMail.senderUid === uid ? activeMail.recipientUid : activeMail.senderUid;
                              const target = directory.find(d => d.uid === partner);
                              setMode('messenger');
                              if (target) void startThreadWith(target);
                            }}
                            className={s.buttonSecondary}
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
                            {isAr ? 'ماسنجر' : 'Chat'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleMailStar(activeMail)}
                            className={s.buttonSecondary}
                            title={isAr ? 'تمييز بنجمة' : 'Toggle star'}
                          >
                            <Star
                              className={`h-3.5 w-3.5 shrink-0 ${
                                (activeMail.senderUid === uid ? activeMail.senderStarred : activeMail.recipientStarred)
                                  ? 'fill-amber-400 text-amber-400'
                                  : ''
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleMailArchive(activeMail)}
                            className={s.buttonSecondary}
                          >
                            {(activeMail.senderUid === uid
                              ? activeMail.senderFolder === 'archive'
                              : activeMail.recipientFolder === 'archive') ? (
                              <>
                                <ArchiveRestore className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                {isAr ? 'استعادة' : 'Restore'}
                              </>
                            ) : (
                              <>
                                <Archive className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                                {isAr ? 'أرشفة' : 'Archive'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className={`${s.subCard} whitespace-pre-wrap p-3 text-xs leading-relaxed ${s.heading}`}>
                        {activeMail.body}
                      </div>

                      {activeMail.attachmentUrl ? (
                        <a
                          href={activeMail.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className={`${s.buttonSecondary} inline-flex`}
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-hidden="true" />
                          {isAr ? 'فتح المرفق المرسل' : 'Open email attachment'}
                        </a>
                      ) : null}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NetworkMessagesSection;
