import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookmarkCheck,
  Bot,
  Brain,
  Check,
  Compass,
  Copy,
  Edit3,
  FileCheck2,
  History,
  MessageSquare,
  PlusCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import { useEscapeKey, useModalFocus } from '../../utils/a11y';
import { isStaticPages } from '../../utils/staticPages';
import { gatewayBase } from '../../ai/client';
import type { ClientSectionId, PortalId } from '../../utils/portalRoutes';
import type { AcademyTab } from '../../academyTabs';
import {
  askUserCopilot,
  runSiteManagerAgent,
  AgentApiError,
} from '../../ai/agentsClient';
import type {
  ChatGptPlatformAction,
  SiteManagerMode,
  SiteManagerResponse,
  SiteTelemetrySnapshot,
  UserCopilotAction,
  UserCopilotMessage,
  UserCopilotMode,
  UserCopilotResponse,
} from '../../ai/agentsContract';
import {
  dispatchApplyPostDraft,
  getSiteTelemetrySnapshot,
  INSCO_OPEN_AI_DOCK_EVENT,
  subscribeSiteTelemetry,
  type OpenAiDockDetail,
} from '../../ai/telemetryStore';
import { InscoChatGptWorkspace } from './InscoChatGptWorkspace';
import {
  type CopilotChatTurn,
  type CopilotConversationThread,
  type CopilotHistoryState,
  createCopilotThreadId,
  deleteCopilotThread,
  deriveCopilotThreadTitle,
  loadCopilotHistoryState,
  renameCopilotThread,
  saveCopilotHistoryState,
  upsertCopilotThread,
} from '../../ai/copilotHistoryStore';

interface InscoDualAiDockProps {
  language: Language;
  portal: PortalId;
  section?: string;
  onOpenCompany: (sectionId?: string) => void;
  onOpenClient: (section?: ClientSectionId) => void;
  onOpenAcademy: (tab?: AcademyTab) => void;
}

export const InscoDualAiDock: React.FC<InscoDualAiDockProps> = ({
  language,
  portal,
  section,
  onOpenCompany,
  onOpenClient,
  onOpenAcademy,
}) => {
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState<'copilot' | 'chatgpt' | 'manager'>('copilot');
  const [chatGptExpanded, setChatGptExpanded] = useState(true);
  const [chatGptInitialPrompt, setChatGptInitialPrompt] = useState<string | null>(null);

  // User Copilot State + LocalStorage Thread History
  const [historyState, setHistoryState] = useState<CopilotHistoryState>(() =>
    loadCopilotHistoryState()
  );
  const initialActiveThread = historyState.activeThreadId
    ? historyState.threads.find((t) => t.id === historyState.activeThreadId)
    : undefined;
  const [activeThreadId, setActiveThreadId] = useState<string>(
    () => initialActiveThread?.id || createCopilotThreadId()
  );
  const [copilotMode, setCopilotMode] = useState<UserCopilotMode>(
    () => initialActiveThread?.mode || 'assistant'
  );
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);
  /**
   * A Manus task that outlived the failed request. Shown as a link rather than folded
   * into the error text, because the work continues and the reader can still collect it.
   */
  const [copilotManusUrl, setCopilotManusUrl] = useState<string | null>(null);
  const [turns, setTurns] = useState<CopilotChatTurn[]>(
    () => initialActiveThread?.turns || []
  );
  const [showCopilotHistory, setShowCopilotHistory] = useState(false);
  const [threadSavedNotice, setThreadSavedNotice] = useState(false);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  // Site Manager AI State
  const [telemetry, setTelemetry] = useState<SiteTelemetrySnapshot>(() =>
    getSiteTelemetrySnapshot()
  );
  const [managerMode, setManagerMode] = useState<SiteManagerMode>('executive_audit');
  const [managerInstruction, setManagerInstruction] = useState('');
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerResult, setManagerResult] = useState<SiteManagerResponse | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const drawer = useRef<HTMLDivElement>(null);
  useEscapeKey(open, () => setOpen(false));
  useModalFocus(open, drawer);

  useEffect(() => {
    const unsub = subscribeSiteTelemetry(setTelemetry);
    return unsub;
  }, []);

  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent<OpenAiDockDetail>;
      setOpen(true);
      if (custom.detail?.agent) {
        setActiveAgent(custom.detail.agent);
        if (custom.detail.agent === 'chatgpt') {
          setChatGptExpanded(true);
        }
      }
      if (custom.detail?.prompt) {
        if (custom.detail?.agent === 'chatgpt') {
          setChatGptInitialPrompt(custom.detail.prompt);
        } else {
          setCopilotInput(custom.detail.prompt);
        }
      }
      setTelemetry(getSiteTelemetrySnapshot());
    };
    window.addEventListener(INSCO_OPEN_AI_DOCK_EVENT, handler);
    return () => window.removeEventListener(INSCO_OPEN_AI_DOCK_EVENT, handler);
  }, []);

  const navigateTarget = (rawTarget?: string) => {
    const t = (rawTarget || '').toLowerCase();
    if (t.includes('community')) onOpenClient('community');
    else if (t.includes('timeclock')) onOpenClient('timeclock');
    else if (t.includes('companies')) onOpenClient('companies');
    else if (t.includes('requests')) onOpenClient('requests');
    else if (t.includes('sim_labs_ar') || t.includes('ar')) onOpenAcademy('sim_labs_ar');
    else if (t.includes('sim_labs_rt') || t.includes('workshop') || t.includes('rt')) {
      onOpenAcademy('sim_labs_rt');
    } else if (t.includes('academy')) onOpenAcademy();
    else if (t.includes('rfq')) onOpenCompany('rfq');
    else onOpenCompany();
  };

  const executeCopilotAction = (
    action: UserCopilotAction,
    draft?: UserCopilotResponse['draftPost']
  ) => {
    if (action.actionType === 'apply_post_draft' && draft) {
      dispatchApplyPostDraft({
        postType: draft.postType,
        ndtMethod: draft.ndtMethod,
        title: draft.title,
        body: draft.body,
        tags: draft.tags,
      });
      onOpenClient('community');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_community') {
      onOpenClient('community');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_rfq') {
      onOpenCompany('rfq');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_ar_lab') {
      onOpenAcademy('sim_labs_ar');
      setOpen(false);
      return;
    }
    if (action.actionType === 'navigate' && action.target) {
      navigateTarget(action.target);
      setOpen(false);
    }
  };

  const executeChatGptAction = (action: ChatGptPlatformAction) => {
    if (action.actionType === 'apply_post_draft' && action.draftPost) {
      dispatchApplyPostDraft({
        postType: action.draftPost.postType,
        ndtMethod: action.draftPost.ndtMethod,
        title: action.draftPost.title,
        body: action.draftPost.body,
        tags: action.draftPost.tags,
      });
      onOpenClient('community');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_community') {
      onOpenClient('community');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_rfq') {
      onOpenCompany('rfq');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_ar_lab') {
      onOpenAcademy('sim_labs_ar');
      setOpen(false);
      return;
    }
    if (action.actionType === 'open_workshop') {
      onOpenAcademy('sim_labs_rt');
      setOpen(false);
      return;
    }
    if (action.actionType === 'navigate' && action.target) {
      navigateTarget(action.target);
      setOpen(false);
    }
  };

  const persistCopilotTurns = (
    nextTurns: CopilotChatTurn[],
    modeUsed: UserCopilotMode,
    targetId: string
  ) => {
    if (nextTurns.length === 0) return;
    setHistoryState((prev) =>
      upsertCopilotThread(prev, {
        id: targetId,
        mode: modeUsed,
        turns: nextTurns,
      })
    );
  };

  const handleSaveCurrentCopilotThread = () => {
    if (turns.length === 0) return;
    setHistoryState((prev) =>
      upsertCopilotThread(prev, {
        id: activeThreadId,
        mode: copilotMode,
        turns,
      })
    );
    setThreadSavedNotice(true);
    window.setTimeout(() => setThreadSavedNotice(false), 1800);
  };

  const handleStartNewCopilotThread = () => {
    if (turns.length > 0) {
      persistCopilotTurns(turns, copilotMode, activeThreadId);
    }
    const freshId = createCopilotThreadId();
    setActiveThreadId(freshId);
    setTurns([]);
    setCopilotError(null);
    setCopilotInput('');
    setShowCopilotHistory(false);
    setHistoryState((prev) => {
      const next = { ...prev, activeThreadId: null };
      saveCopilotHistoryState(next);
      return next;
    });
  };

  const handleLoadCopilotThread = (thread: CopilotConversationThread) => {
    if (turns.length > 0 && activeThreadId !== thread.id) {
      persistCopilotTurns(turns, copilotMode, activeThreadId);
    }
    setActiveThreadId(thread.id);
    setTurns(thread.turns);
    setCopilotMode(thread.mode);
    setCopilotError(null);
    setShowCopilotHistory(false);
    setHistoryState((prev) => {
      const next = { ...prev, activeThreadId: thread.id };
      saveCopilotHistoryState(next);
      return next;
    });
  };

  const handleDeleteCopilotThread = (threadId: string) => {
    setHistoryState((prev) => deleteCopilotThread(prev, threadId));
    if (threadId === activeThreadId) {
      const freshId = createCopilotThreadId();
      setActiveThreadId(freshId);
      setTurns([]);
      setCopilotError(null);
    }
  };

  const sendCopilotPrompt = async (overrideMsg?: string, overrideMode?: UserCopilotMode) => {
    const text = (overrideMsg ?? copilotInput).trim();
    const modeToUse = overrideMode ?? copilotMode;
    if (text.length < 2 || copilotLoading) return;

    const currentThreadId = activeThreadId;
    setCopilotError(null);
    setCopilotManusUrl(null);
    const nextHistory: UserCopilotMessage[] = turns.slice(-8).map(t => ({
      role: t.role,
      content: t.content,
    }));
    const withUserTurn: CopilotChatTurn[] = [...turns, { role: 'user', content: text, createdAt: new Date().toISOString() }];
    setTurns(withUserTurn);
    persistCopilotTurns(withUserTurn, modeToUse, currentThreadId);
    if (!overrideMsg) setCopilotInput('');

    setCopilotLoading(true);
    try {
      const res = await askUserCopilot({
        message: text,
        history: nextHistory,
        language,
        mode: modeToUse,
        context: {
          portal,
          section,
          feedPreview: telemetry.recentPosts.slice(0, 5).map(p => ({
            id: p.id,
            title: p.title,
            ndtMethod: p.ndtMethod,
            excerpt: p.excerpt,
          })),
        },
      });
      const completedTurns: CopilotChatTurn[] = [
        ...withUserTurn,
        {
          role: 'assistant',
          content: res.reply,
          createdAt: new Date().toISOString(),
          actions: res.suggestedActions,
          draftPost: res.draftPost,
          kind: res.kind,
          citations: res.citations,
          reasoningSteps: res.reasoningSteps,
        },
      ];
      setTurns(completedTurns);
      persistCopilotTurns(completedTurns, modeToUse, currentThreadId);
    } catch (err) {
      const msg =
        err instanceof AgentApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      setCopilotError(msg);
      setCopilotManusUrl(err instanceof AgentApiError && err.manusTaskUrl ? err.manusTaskUrl : null);
    } finally {
      setCopilotLoading(false);
    }
  };

  const triggerSiteManager = async (overrideMode?: SiteManagerMode, customText?: string) => {
    if (managerLoading) return;
    const modeToRun = overrideMode ?? managerMode;
    const latestTelemetry = getSiteTelemetrySnapshot();
    setTelemetry(latestTelemetry);
    setManagerMode(modeToRun);
    setManagerError(null);
    setManagerLoading(true);
    try {
      const defaultInstructions: Record<SiteManagerMode, { ar: string; en: string }> = {
        executive_audit: {
          ar: 'أجرِ مراجعة شاملة لأداء الموقع، طلبات العملاء، تنبيهات الجيوفينس الميدانية، ونشاط مجتمع INSCO.',
          en: 'Perform a full operational audit across site telemetry, client requests, geofence alerts, and INSCO Community.',
        },
        moderate_community: {
          ar: 'راجع منشورات مجتمع INSCO المرفقة وحدد المنشورات التي تستحق التثبيت أو تحتاج مراجعة إدارية.',
          en: 'Moderate INSCO Community posts, flagging any off-topic/low-quality posts or highlighting valuable technical cases.',
        },
        geofence_brief: {
          ar: 'حلل تنبيهات الدخول خارج نطاق المشروع (Geofencing Alerts) وقدّم توصيات للمشرفين.',
          en: 'Analyze recent outside_geofence attendance alerts and recommend field supervisor actions.',
        },
        triage_requests: {
          ar: 'رتّب أولويات طلبات العملاء الجديدة والعاجلة واقترح خطوات التعيين والتنفيذ.',
          en: 'Triage new and urgent client requests and recommend assignment steps.',
        },
        draft_announcement: {
          ar: 'اكتب مسودة إعلان رسمي احترافي من إدارة INSCO للمجتمع الهندسي.',
          en: 'Draft an official INSCO Management announcement for the engineering community.',
        },
        custom: {
          ar: managerInstruction.trim() || 'قدم ملخصاً تنفيذياً لإدارة الموقع.',
          en: managerInstruction.trim() || 'Provide an executive operations brief.',
        },
      };

      const instr = (customText ?? managerInstruction).trim() || defaultInstructions[modeToRun][isAr ? 'ar' : 'en'];

      const res = await runSiteManagerAgent({
        instruction: instr,
        language,
        mode: modeToRun,
        telemetry: latestTelemetry,
      });
      setManagerResult(res);
    } catch (err) {
      const msg =
        err instanceof AgentApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err);
      setManagerError(msg);
    } finally {
      setManagerLoading(false);
    }
  };

  const isFullChatGpt = activeAgent === 'chatgpt' && chatGptExpanded;

  return (
    <>
      {/* Bottom-End Floating AI Launchers */}
      <div className="fixed bottom-16 xl:bottom-5 end-4 sm:end-6 z-40 flex items-center gap-2">
        <button
          type="button"
          data-testid="insco-chatgpt-launcher"
          aria-label={isAr ? 'وكيل INSCO AI (ChatGPT)' : 'INSCO AI (ChatGPT)'}
          aria-haspopup="dialog"
          onClick={() => {
            setTelemetry(getSiteTelemetrySnapshot());
            setActiveAgent('chatgpt');
            setChatGptExpanded(true);
            setOpen(true);
          }}
          className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-2.5 py-2 sm:px-3.5 text-xs font-black text-white shadow-xl backdrop-blur cursor-pointer"
        >
          <Brain className="w-4 h-4 shrink-0 text-white" aria-hidden="true" />
          <span className="hidden sm:inline">{isAr ? 'وكيل INSCO AI' : 'INSCO ChatGPT'}</span>
        </button>

        <button
          type="button"
          data-testid="insco-dual-ai-launcher"
          aria-label={isAr ? 'وكلاء INSCO الذكية (AI)' : 'INSCO AI Agents'}
          aria-haspopup="dialog"
          onClick={() => {
            setTelemetry(getSiteTelemetrySnapshot());
            setOpen(true);
          }}
          className="inline-flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/50 bg-slate-900/95 hover:bg-slate-800 px-2.5 py-2 sm:px-3.5 text-xs font-black text-white shadow-xl backdrop-blur cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden="true" />
          <span className="hidden sm:inline">{isAr ? 'وكلاء INSCO الذكية (AI)' : 'INSCO AI Agents'}</span>
        </button>
      </div>

      {open && (
        <div
          className={`fixed inset-0 z-[85] flex ${
            isFullChatGpt ? 'items-center justify-center p-2 sm:p-4' : 'justify-end'
          }`}
          role="presentation"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={isAr ? 'إغلاق لوحة الوكلاء الذكية' : 'Close AI Agents panel'}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm cursor-default"
          />

          <div
            ref={drawer}
            role="dialog"
            aria-modal="true"
            aria-label={isAr ? 'وكلاء الذكاء الاصطناعي لإدارة الموقع ومساعدة المستخدمين' : 'INSCO Dual Professional AI Agents'}
            dir={isAr ? 'rtl' : 'ltr'}
            data-testid="insco-dual-ai-drawer"
            className={`relative z-10 w-full bg-slate-950 shadow-2xl flex flex-col overflow-hidden ${
              isFullChatGpt
                ? 'max-w-7xl h-[94vh] rounded-2xl border border-slate-800'
                : 'max-w-xl h-full border-s border-slate-800'
            }`}
          >
            {/* A static Pages build ships no gateway at all: say so instead of letting
                every request fail with a network error the reader cannot act on. */}
            {!gatewayBase() && isStaticPages() && (
              <p
                data-testid="ai-gateway-unavailable"
                className="m-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-300"
              >
                {isAr
                  ? 'هذا البناء ثابت (static) ولا يحتوي بوابة الذكاء الاصطناعي. الوكلاء يعملون على نسخة Vercel المستضافة.'
                  : 'This static build has no AI gateway. The agents need the hosted INSCO AI gateway.'}
              </p>
            )}

            {isStaticPages() && (
              <p
                data-testid="ai-local-brain"
                className="mx-3 mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/5 px-3 py-2 text-[11px] text-cyan-100"
              >
                {isAr
                  ? 'المساعد والوكلاء التشغيليون يعملون من مكتبة الموقع وقواعده دون مفتاح نموذج؛ مساحة ChatGPT تستخدم البوابة المستضافة عند تهيئتها.'
                  : 'The copilot and operational agents use the site library and rules without a key or model call. ChatGPT workspace uses the hosted gateway when configured.'}
              </p>
            )}

            {/* Drawer Header & Agent Tabs */}
            <div className="p-3 sm:p-4 border-b border-slate-800 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Bot className="w-5 h-5 shrink-0 text-cyan-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="text-sm font-black text-white truncate">
                      {isAr ? 'مركز وكلاء INSCO الذكية (Gemini AI)' : 'INSCO AI Command & ChatGPT Studio'}
                    </h2>
                    <p className="text-[11px] text-slate-400 truncate">
                      {isAr
                        ? 'وكيل INSCO الشامل (ChatGPT) · المساعد السريع · وكيل إدارة الموقع'
                        : 'Autonomous ChatGPT Studio · User Copilot · Site Manager Director'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={isAr ? 'إغلاق' : 'Close'}
                  className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  data-testid="ai-tab-chatgpt"
                  onClick={() => {
                    setTelemetry(getSiteTelemetrySnapshot());
                    setActiveAgent('chatgpt');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black transition cursor-pointer ${
                    activeAgent === 'chatgpt'
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'INSCO AI (ChatGPT)' : 'INSCO AI (ChatGPT)'}</span>
                </button>
                <button
                  type="button"
                  data-testid="ai-tab-copilot"
                  onClick={() => setActiveAgent('copilot')}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black transition cursor-pointer ${
                    activeAgent === 'copilot'
                      ? 'bg-cyan-600 text-white'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'المساعد الشامل للمستخدم' : 'User Copilot AI'}</span>
                </button>
                <button
                  type="button"
                  data-testid="ai-tab-manager"
                  onClick={() => {
                    setTelemetry(getSiteTelemetrySnapshot());
                    setActiveAgent('manager');
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black transition cursor-pointer ${
                    activeAgent === 'manager'
                      ? 'bg-amber-500 text-slate-950'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'وكيل إدارة الموقع' : 'Site Manager AI'}</span>
                </button>
              </div>
            </div>

            {/* AGENT 0: FULL CHATGPT-CLASS INSCO AI STUDIO */}
            {activeAgent === 'chatgpt' && (
              <div className="flex-1 flex flex-col min-h-0">
                <InscoChatGptWorkspace
                  language={language}
                  context={{
                    portal,
                    section,
                    feedPreview: telemetry.recentPosts.slice(0, 5).map(p => ({
                      id: p.id,
                      title: p.title,
                      ndtMethod: p.ndtMethod,
                      excerpt: p.excerpt,
                    })),
                  }}
                  isExpanded={chatGptExpanded}
                  onToggleExpand={() => setChatGptExpanded(prev => !prev)}
                  onExecuteAction={executeChatGptAction}
                  initialPrompt={chatGptInitialPrompt}
                />
              </div>
            )}

            {/* AGENT 1: UNIVERSAL USER COPILOT */}
            {activeAgent === 'copilot' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* 1-Click Switch Banner to Full ChatGPT Studio */}
                <div className="px-4 py-2 border-b border-slate-800/80 bg-emerald-950/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-200 min-w-0">
                    <Brain className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span className="truncate">
                      {isAr
                        ? 'هل تريد التجربة الكاملة مثل ChatGPT (بث مباشر + بحث ويب + ملفات + Canvas)؟'
                        : 'Need the full ChatGPT experience (streaming, web search, files, Canvas)?'}
                    </span>
                  </div>
                  <button
                    type="button"
                    data-testid="copilot-upgrade-chatgpt-btn"
                    onClick={() => {
                      setActiveAgent('chatgpt');
                      setChatGptExpanded(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-black text-white shrink-0 cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'فتح ChatGPT Studio' : 'Open ChatGPT Studio'}</span>
                  </button>
                </div>

                {/* Copilot LocalStorage Thread History Toolbar */}
                <div
                  data-testid="copilot-history-toolbar"
                  className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid="copilot-history-toggle"
                      aria-expanded={showCopilotHistory}
                      onClick={() => setShowCopilotHistory((v) => !v)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                        showCopilotHistory
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-400'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {isAr
                          ? `سجل المحادثات (${historyState.threads.length})`
                          : `History (${historyState.threads.length})`}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid="copilot-save-thread-btn"
                      disabled={turns.length === 0}
                      onClick={handleSaveCurrentCopilotThread}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:border-emerald-400 disabled:opacity-40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 cursor-pointer"
                    >
                      {threadSavedNotice ? (
                        <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <BookmarkCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {threadSavedNotice
                          ? isAr
                            ? 'تم الحفظ'
                            : 'Saved!'
                          : isAr
                          ? 'حفظ المحادثة'
                          : 'Save Thread'}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid="copilot-new-chat-btn"
                    onClick={handleStartNewCopilotThread}
                    className="inline-flex items-center gap-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 border border-cyan-500/40 px-2.5 py-1 text-[11px] font-bold text-cyan-200 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
                  </button>
                </div>

                {/* Collapsible Saved Conversation Threads List */}
                {showCopilotHistory && (
                  <div
                    data-testid="copilot-history-panel"
                    className="max-h-56 overflow-y-auto border-b border-slate-800 bg-slate-900/95 p-3 space-y-1.5"
                  >
                    {historyState.threads.length === 0 ? (
                      <div className="text-[11px] text-slate-400 text-center py-2">
                        {isAr
                          ? 'لا توجد محادثات محفوظة بعد. ابدأ الدردشة ليتم حفظها تلقائياً في المتصفح.'
                          : 'No saved threads yet. Start chatting to auto-save conversations in LocalStorage.'}
                      </div>
                    ) : (
                      historyState.threads.map((thread) => {
                        const isActive = thread.id === activeThreadId;
                        return (
                          <div
                            key={thread.id}
                            className={`rounded-lg border px-2.5 py-2 flex items-center justify-between gap-2 text-xs ${
                              isActive
                                ? 'border-cyan-500/50 bg-cyan-500/15 text-white'
                                : 'border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {renamingThreadId === thread.id ? (
                              <form
                                className="flex-1 flex items-center gap-1.5"
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  setHistoryState((prev) =>
                                    renameCopilotThread(prev, thread.id, renameDraft)
                                  );
                                  setRenamingThreadId(null);
                                }}
                              >
                                <input
                                  type="text"
                                  data-testid={`copilot-thread-rename-input-${thread.id}`}
                                  value={renameDraft}
                                  onChange={(e) => setRenameDraft(e.target.value)}
                                  className="flex-1 rounded border border-cyan-500 bg-slate-900 px-2 py-0.5 text-[11px] text-white"
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  className="px-2 py-0.5 rounded bg-cyan-600 text-[10px] font-bold text-white cursor-pointer"
                                >
                                  {isAr ? 'حفظ' : 'OK'}
                                </button>
                              </form>
                            ) : (
                              <button
                                type="button"
                                data-testid={`copilot-thread-load-${thread.id}`}
                                onClick={() => handleLoadCopilotThread(thread)}
                                className="flex-1 text-start min-w-0 cursor-pointer space-y-0.5"
                              >
                                <div className="font-bold truncate">
                                  {thread.title || deriveCopilotThreadTitle(thread.turns)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {thread.mode} · {thread.turns.length}{' '}
                                  {isAr ? 'رسالة' : 'msgs'}
                                </div>
                              </button>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                data-testid={`copilot-thread-rename-${thread.id}`}
                                aria-label={isAr ? 'تسمية المحادثة' : 'Rename thread'}
                                onClick={() => {
                                  setRenamingThreadId(thread.id);
                                  setRenameDraft(thread.title);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                data-testid={`copilot-thread-delete-${thread.id}`}
                                aria-label={isAr ? 'حذف المحادثة' : 'Delete thread'}
                                onClick={() => handleDeleteCopilotThread(thread.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                <div className="px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap gap-1.5">
                  {(
                    [
                      {
                        mode: 'draft_post',
                        ar: 'مسودة منشور مجتمع',
                        en: 'Draft Community Post',
                        promptAr: 'اكتب مسودة منشور تقني احترافي لمجتمع INSCO حول فحص وصلات الضغط العالي بـ PAUT و RT.',
                        promptEn: 'Draft a professional technical post for INSCO Community on PAUT & RT high-pressure weld inspection.',
                      },
                      {
                        mode: 'ndt_selector',
                        ar: 'اختيار طريقة NDT',
                        en: 'Select NDT Method',
                        promptAr: 'ما أنسب تقنية فحص NDT (RT مقابل UT مقابل PAUT) لمواسير سماكة 24 مم كربون ستيل؟',
                        promptEn: 'Recommend the best NDT method (RT vs UT vs PAUT) for 24mm carbon steel process piping.',
                      },
                      {
                        mode: 'rfq_draft',
                        ar: 'تجهيز طلب عرض سعر',
                        en: 'Prepare RFQ Scope',
                        promptAr: 'ساعدني في صياغة نطاق عمل RFQ واضح لفحص خطوط أنابيب ومعالجة حرارية PWHT.',
                        promptEn: 'Help me prepare a clear RFQ scope for pipeline NDT and 65kW PWHT services.',
                      },
                      {
                        mode: 'navigate',
                        ar: 'شرح معامل AR وتوجيهي',
                        en: 'Explain AR & Navigate',
                        promptAr: 'اشرح لي كيفية استخدام محاكي الواقع المعزز AR لتصوير RT وفحص UT ووجهني إليه.',
                        promptEn: 'Explain how to use the Live Camera AR RT & UT simulator and take me there.',
                      },
                    ] as const
                  ).map(q => (
                    <button
                      key={q.mode}
                      type="button"
                      onClick={() => {
                        setCopilotMode(q.mode);
                        void sendCopilotPrompt(isAr ? q.promptAr : q.promptEn, q.mode);
                      }}
                      className="rounded-lg border border-slate-800 bg-slate-900 hover:border-cyan-400 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 cursor-pointer"
                    >
                      {isAr ? q.ar : q.en}
                    </button>
                  ))}
                </div>

                {/* Chat Transcript */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {turns.length === 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs text-slate-300">
                      <div className="font-black text-white flex items-center gap-1.5">
                        <Compass className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden="true" />
                        <span>
                          {isAr
                            ? 'أهلاً بك! أنا مساعد INSCO الذكي الشامل'
                            : 'Welcome! I am the INSCO Universal Copilot'}
                        </span>
                      </div>
                      <p className="leading-relaxed text-slate-400">
                        {isAr
                          ? 'اسألني عن أي شيء: صياغة منشورات مجتمع INSCO، اختيار تكنيكات الفحص RT/UT/PAUT/PWHT، تجهيز طلبات عروض الأسعار، فهم محاكي AR، أو التنقل السريع داخل الموقع.'
                          : 'Ask anything: craft INSCO Community posts, pick RT/UT/PAUT/PWHT codes, prepare RFQs, interpret AR overlays, or jump directly to any module.'}
                      </p>
                    </div>
                  )}

                  {turns.map((turn, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-3 text-xs space-y-2 ${
                        turn.role === 'user'
                          ? 'bg-cyan-950/50 border border-cyan-500/30 text-white ms-6'
                          : 'bg-slate-900/85 border border-slate-800 text-slate-200 me-4'
                      }`}
                    >
                      <div className="whitespace-pre-line leading-relaxed">{turn.content}</div>

                      {!!turn.citations?.length && (
                        <div className="space-y-1 border-t border-slate-700 pt-2" aria-label={isAr ? 'المصادر' : 'Sources'}>
                          {turn.citations.map(citation => (
                            <div key={citation.id} className="text-[10px] text-cyan-300">
                              {citation.url ? (
                                <a href={citation.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                                  {citation.title}{citation.page ? ` · ${isAr ? 'ص' : 'p.'}${citation.page}` : ''}{citation.sourceType === 'private-drive' ? ` · ${isAr ? 'Drive خاص' : 'private Drive'}` : ''}
                                </a>
                              ) : (
                                <>{citation.title}{citation.page ? ` · ${isAr ? 'ص' : 'p.'}${citation.page}` : ''}</>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {turn.draftPost && (
                        <div className="rounded-lg border border-emerald-500/35 bg-slate-950/85 p-3 space-y-1.5">
                          <div className="text-[11px] font-mono text-emerald-400 font-bold">
                            {turn.draftPost.postType} · {turn.draftPost.ndtMethod}
                          </div>
                          <div className="font-black text-white">{turn.draftPost.title}</div>
                          <p className="text-[11px] text-slate-300 line-clamp-3">
                            {turn.draftPost.body}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              dispatchApplyPostDraft({
                                postType: turn.draftPost!.postType,
                                ndtMethod: turn.draftPost!.ndtMethod,
                                title: turn.draftPost!.title,
                                body: turn.draftPost!.body,
                                tags: turn.draftPost!.tags,
                              });
                              onOpenClient('community');
                              setOpen(false);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>
                              {isAr
                                ? 'إدراج المسودة في مجتمع INSCO'
                                : 'Insert Draft into Community'}
                            </span>
                          </button>
                        </div>
                      )}

                      {turn.actions && turn.actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {turn.actions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => executeCopilotAction(act, turn.draftPost)}
                              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1 text-[11px] font-bold text-cyan-300 cursor-pointer"
                            >
                              {act.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {copilotError && (
                    <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        {copilotError}
                        {copilotManusUrl && (
                          <>
                            {' '}
                            <a
                              href={copilotManusUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              data-testid="copilot-manus-task"
                              className="underline font-bold text-cyan-300 hover:text-cyan-200"
                            >
                              {isAr ? 'متابعة المهمة في مانوس' : 'Follow the Manus task'}
                            </a>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    void sendCopilotPrompt();
                  }}
                  className="p-3 border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={copilotInput}
                    onChange={e => setCopilotInput(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اسأل المساعد الذكي أو اطلب صياغة منشور / فحص...'
                        : 'Ask User Copilot anything across INSCO...'
                    }
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={copilotLoading || copilotInput.trim().length < 2}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-45 px-3.5 py-2 text-xs font-black text-white cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {copilotLoading
                        ? isAr
                          ? 'جاري...'
                          : 'Wait...'
                        : isAr
                          ? 'إرسال'
                          : 'Send'}
                    </span>
                  </button>
                </form>
              </div>
            )}

            {/* AGENT 2: SITE MANAGER & OPERATIONS DIRECTOR */}
            {activeAgent === 'manager' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
                {/* Live Telemetry Strip */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-sm font-black text-white font-mono tabular-nums">
                      {telemetry.totalRequests}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'الطلبات' : 'Requests'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-sm font-black text-cyan-400 font-mono tabular-nums">
                      {telemetry.totalCompanies}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'الشركات' : 'Companies'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-sm font-black text-rose-400 font-mono tabular-nums">
                      {telemetry.geofenceAlertCount}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'تنبيه نطاق' : 'Geofence'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                    <div className="text-sm font-black text-emerald-400 font-mono tabular-nums">
                      {telemetry.communityPostsCount}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {isAr ? 'المنشورات' : 'Posts'}
                    </div>
                  </div>
                </div>

                {/* Operations Modes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'executive_audit', ar: 'مراجعة شاملة للموقع', en: 'Full Site Audit' },
                      { id: 'moderate_community', ar: 'مراجعة وإشراف المجتمع', en: 'Moderate Community' },
                      { id: 'geofence_brief', ar: 'تحليل تنبيهات الجيوفينس', en: 'Geofence Brief' },
                      { id: 'triage_requests', ar: 'فرز طلبات العملاء', en: 'Triage Requests' },
                      { id: 'draft_announcement', ar: 'صياغة إعلان رسمي', en: 'Draft Announcement' },
                    ] as Array<{ id: SiteManagerMode; ar: string; en: string }>
                  ).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={managerLoading}
                      onClick={() => void triggerSiteManager(m.id)}
                      className={`rounded-lg border px-2.5 py-2 text-[11px] font-bold transition cursor-pointer ${
                        managerMode === m.id
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-amber-400/60'
                      }`}
                    >
                      {isAr ? m.ar : m.en}
                    </button>
                  ))}
                </div>

                {/* Custom Manager Directive */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    void triggerSiteManager('custom', managerInstruction);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={managerInstruction}
                    onChange={e => setManagerInstruction(e.target.value)}
                    placeholder={
                      isAr
                        ? 'توجيه مخصص لوكيل إدارة الموقع...'
                        : 'Custom executive directive for Site Manager AI...'
                    }
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="submit"
                    disabled={managerLoading}
                    className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-3.5 py-2 text-xs font-black text-slate-950 cursor-pointer shrink-0"
                  >
                    {managerLoading
                      ? isAr
                        ? 'جاري التحليل...'
                        : 'Analyzing...'
                      : isAr
                        ? 'تنفيذ'
                        : 'Run'}
                  </button>
                </form>

                {managerError && (
                  <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{managerError}</span>
                  </div>
                )}

                {managerResult && (
                  <div data-testid="site-manager-result" className="space-y-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-black text-amber-300">
                          {isAr ? 'التقرير التنفيذي' : 'Executive Brief'}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-emerald-400">
                          {managerResult.healthStatus} · {managerResult.model}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                        {managerResult.summary}
                      </p>
                    </div>

                    {managerResult.priorityActions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-black text-white">
                          {isAr ? 'الإجراءات ذات الأولوية' : 'Priority Actions'}
                        </div>
                        {managerResult.priorityActions.map((act, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-white">{act.title}</span>
                              <span className="font-mono text-[10px] uppercase text-amber-400">
                                {act.severity}
                              </span>
                            </div>
                            <p className="text-slate-300 text-[11px]">{act.detail}</p>
                            <button
                              type="button"
                              onClick={() => {
                                if (act.actionType === 'open_requests') onOpenClient('requests');
                                else if (act.actionType === 'open_timeclock') onOpenClient('timeclock');
                                else if (
                                  act.actionType === 'open_community' ||
                                  act.actionType === 'publish_announcement'
                                ) {
                                  onOpenClient('community');
                                }
                                setOpen(false);
                              }}
                              className="text-[11px] font-bold text-cyan-400 hover:underline cursor-pointer"
                            >
                              {isAr ? 'الانتقال للقسم المعني ←' : 'Go to target section →'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {managerResult.flaggedPostIds.length > 0 && (
                      <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
                        <span className="font-bold">
                          {isAr ? 'منشورات مرشحة للمراجعة الإدارية: ' : 'Flagged Post IDs: '}
                        </span>
                        <span className="font-mono">{managerResult.flaggedPostIds.join(', ')}</span>
                      </div>
                    )}

                    {managerResult.announcementDraft && (
                      <div className="rounded-xl border border-emerald-500/40 bg-slate-900 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-emerald-300">
                            {managerResult.announcementDraft.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const draftText = `${managerResult.announcementDraft!.title}\n\n${managerResult.announcementDraft!.body}`;
                              void navigator.clipboard?.writeText(draftText);
                              setCopiedNotice(true);
                              window.setTimeout(() => setCopiedNotice(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-200 cursor-pointer"
                          >
                            <Copy className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{copiedNotice ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-slate-300 whitespace-pre-line text-[11px]">
                          {managerResult.announcementDraft.body}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            dispatchApplyPostDraft({
                              postType: 'discussion',
                              ndtMethod: managerResult.announcementDraft!.ndtMethod || 'GENERAL',
                              title: managerResult.announcementDraft!.title,
                              body: managerResult.announcementDraft!.body,
                              tags: ['INSCO', 'Management'],
                            });
                            onOpenClient('community');
                            setOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>
                            {isAr ? 'فتح في محرر منشورات المجتمع' : 'Open in Community Composer'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
