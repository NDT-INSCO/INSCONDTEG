import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Bot,
  Brain,
  Check,
  Code2,
  Compass,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileCode2,
  FileText,
  Globe,
  Image as ImageIcon,
  Layers,
  Maximize2,
  MessageSquarePlus,
  Mic,
  MicOff,
  Minimize2,
  PanelLeft,
  PanelRight,
  Paperclip,
  Pin,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  AgentApiError,
  streamChatGptAgent,
} from '../../ai/agentsClient';
import type {
  ChatGptAttachment,
  ChatGptCanvasArtifact,
  ChatGptFewShotExample,
  ChatGptMemoryProfile,
  ChatGptPlatformAction,
  ChatGptReasoningArchitecture,
  ChatGptResponseStyle,
  ChatGptTaskMode,
  ChatGptThinkingEffort,
  ChatGptTrainingPack,
  UserCopilotContext,
} from '../../ai/agentsContract';
import {
  ChatGptThread,
  ChatGptTurn,
  createEmptyThread,
  DEFAULT_TRAINING_PACKS,
  deriveThreadTitle,
  loadChatGptThreads,
  loadMemoryProfile,
  saveChatGptThreads,
  saveMemoryProfile,
} from '../../ai/chatgptStore';
import { MarkdownCanvasRenderer } from './MarkdownCanvasRenderer';

export interface InscoChatGptWorkspaceProps {
  language: Language;
  context?: UserCopilotContext;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onExecuteAction: (action: ChatGptPlatformAction) => void;
  initialPrompt?: string | null;
}

const MODE_OPTIONS: Array<{
  id: ChatGptTaskMode;
  ar: string;
  en: string;
}> = [
  { id: 'auto', ar: 'تلقائي شامل', en: 'Auto' },
  { id: 'thinking', ar: 'تفكير عميق', en: 'Deep Think' },
  { id: 'web_search', ar: 'بحث الويب', en: 'Web Search' },
  { id: 'deep_research', ar: 'بحث وتقرير', en: 'Deep Research' },
  { id: 'canvas', ar: 'محرر Canvas', en: 'Canvas' },
  { id: 'code_analyst', ar: 'كود وبيانات', en: 'Code & Data' },
  { id: 'vision_ndt', ar: 'صور وملفات', en: 'Vision & Files' },
];

const ARCH_OPTIONS: Array<{
  id: ChatGptReasoningArchitecture;
  ar: string;
  en: string;
  badgeAr: string;
  badgeEn: string;
}> = [
  { id: 'auto', ar: 'هيكل: تلقائي ذكي', en: 'Arch: Adaptive Auto', badgeAr: 'تلقائي', badgeEn: 'Adaptive' },
  { id: 'first_principles', ar: 'هيكل: المبادئ الأولى', en: 'Arch: First-Principles', badgeAr: 'مبادئ أولى', badgeEn: 'First-Principles' },
  { id: 'chain_of_verification', ar: 'هيكل: التحقق المتسلسل CoVe', en: 'Arch: Chain-of-Verification', badgeAr: 'تحقق CoVe', badgeEn: 'CoVe Verified' },
  { id: 'tree_of_thoughts', ar: 'هيكل: شجرة الأفكار ToT', en: 'Arch: Tree-of-Thoughts', badgeAr: 'شجرة أفكار', badgeEn: 'Tree-of-Thoughts' },
  { id: 'react_planner', ar: 'هيكل: التخطيط ReAct', en: 'Arch: ReAct Planner', badgeAr: 'تخطيط ReAct', badgeEn: 'ReAct Plan' },
  { id: 'socratic_tutor', ar: 'هيكل: المعلم التشخيصي', en: 'Arch: Socratic Tutor', badgeAr: 'معلم تشخيصي', badgeEn: 'Socratic' },
];

const TRAINING_PACK_OPTIONS: Array<{
  id: ChatGptTrainingPack;
  ar: string;
  en: string;
  descAr: string;
  descEn: string;
}> = [
  {
    id: 'ndt_codes',
    ar: 'أكواد NDT والحسابات القياسية',
    en: 'NDT Codes & Quantitative Formulas',
    descAr: 'معادلات ASME Sec. V/VIII وISO وSnell وUg وتصحيح الانتقال.',
    descEn: 'ASME Sec. V/VIII & ISO Ug, Snell ray paths, IQI & illuminance envelopes.',
  },
  {
    id: 'film_diagnostics',
    ar: 'تشخيص أفلام الأشعة RT والعيوب',
    en: 'RT Film Reading & Defect Logic',
    descAr: 'بروتوكول استبعاد الشوائب والتحميض وتفريق LOF/IP/Slag/Porosity.',
    descEn: '4-step artifact elimination and planar vs volumetric defect acceptance.',
  },
  {
    id: 'pwht_thermal',
    ar: 'المعالجة الحرارية 65kW PWHT',
    en: 'PWHT 65kW Thermal Engineering',
    descAr: 'حساب معدلات التسخين والتبريد، سبائك P91، وتوزيع المزدوجات.',
    descEn: 'Heating/cooling thickness rates, P91 AC1 boundaries, and TC zoning.',
  },
  {
    id: 'software_architecture',
    ar: 'هندسة البرمجيات وأنظمة الذكاء',
    en: 'Software & AI System Architecture',
    descAr: 'المعمارية المعيارية، الأمان الافتراضي، التحقق، وتعقيد Big-O.',
    descEn: 'Modular TypeScript contracts, security-by-default, edge-case & Big-O rigor.',
  },
  {
    id: 'executive_reports',
    ar: 'كتابة التقارير التنفيذية المعتمدة',
    en: 'Executive Decision Reports',
    descAr: 'صياغة BLUF ومصفوفة المخاطر وخطط الإجراءات التصحيحية.',
    descEn: 'BLUF summaries, quantified risk matrices, and corrective action plans.',
  },
];

const STARTER_PROMPTS: Array<{
  mode: ChatGptTaskMode;
  icon: 'brain' | 'globe' | 'code' | 'file' | 'layers' | 'sparkles';
  titleAr: string;
  titleEn: string;
  promptAr: string;
  promptEn: string;
}> = [
  {
    mode: 'deep_research',
    icon: 'globe',
    titleAr: 'بحث ويب وتقرير موثق بالمصادر',
    titleEn: 'Web Research Report with Citations',
    promptAr: 'ابحث في أحدث معايير ASME Sec. V Art. 4 لعام 2025 ولخّص الفروقات الأساسية في جدول مع المصادر.',
    promptEn: 'Research the latest ASME Sec. V Art. 4 phased array requirements and summarize key rules in a cited table.',
  },
  {
    mode: 'canvas',
    icon: 'file',
    titleAr: 'كتابة مستند أو إجراء رسمي في Canvas',
    titleEn: 'Draft Procedure or Report in Canvas',
    promptAr: 'اكتب إجراء فحص لحام أنابيب ضغط عالي بالـ PAUT وTOFD مع جدول معاملات القبول وافتحه في Canvas.',
    promptEn: 'Draft a complete PAUT & TOFD weld inspection procedure with acceptance criteria table and open it in Canvas.',
  },
  {
    mode: 'code_analyst',
    icon: 'code',
    titleAr: 'برمجة، أتمتة وتحليل بيانات CSV/JSON',
    titleEn: 'Code Generation & Data Analysis',
    promptAr: 'اكتب دالة TypeScript دقيقة لحساب عمر التعب والسمك المتبقي وفق API 510 مع اختبارات وحدة كاملة.',
    promptEn: 'Write clean TypeScript logic to calculate API 510 corrosion rate, remaining life, and next inspection interval with unit tests.',
  },
  {
    mode: 'thinking',
    icon: 'brain',
    titleAr: 'حل مسألة هندسية أو رياضيات بتفكير عميق',
    titleEn: 'Deep Step-by-Step Reasoning',
    promptAr: 'اشرح خطوة بخطوة حساب زاوية الانكسار ونصف المسار الكامل Full Skip على أنبوب كيرف قطر 12 بوصة وسماكة 18 مم.',
    promptEn: 'Solve step-by-step curved pipe UT trigonometry and full-skip ray path for a 12-inch OD, 18mm wall pipe.',
  },
  {
    mode: 'vision_ndt',
    icon: 'layers',
    titleAr: 'تحليل الصور والأفلام والمستندات المرفقة',
    titleEn: 'Analyze Uploaded Images, Radiographs & PDFs',
    promptAr: 'سأرفق لك صورة/ملف (فيلم RT أو شاشة UT أو جدول بيانات) — لخص الملاحظات والعيوب المحتملة وإجراءات التحقق.',
    promptEn: 'Analyze my uploaded image, chart, or document systematically with key findings, potential defects, and action items.',
  },
  {
    mode: 'auto',
    icon: 'sparkles',
    titleAr: 'إنجاز مهام منصة INSCO والمجتمع',
    titleEn: 'Draft Community Post or RFQ Scope',
    promptAr: 'ساعدني في صياغة منشور هندسي متكامل لمجتمع INSCO عن تحديات الفحص بالـ TOFD وجهز لي زر إدراجه مباشرة.',
    promptEn: 'Write an authoritative INSCO Community technical case study on TOFD inspection and prepare the community draft action.',
  },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = typeof reader.result === 'string' ? reader.result : '';
      const comma = res.indexOf(',');
      resolve(comma !== -1 ? res.slice(comma + 1) : res);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const InscoChatGptWorkspace: React.FC<InscoChatGptWorkspaceProps> = ({
  language,
  context,
  isExpanded,
  onToggleExpand,
  onExecuteAction,
  initialPrompt,
}) => {
  const isAr = language === 'ar';

  const [threads, setThreads] = useState<ChatGptThread[]>(() => loadChatGptThreads(isAr));
  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    const initial = loadChatGptThreads(isAr);
    return initial[0].id;
  });

  const [memoryProfile, setMemoryProfile] = useState<ChatGptMemoryProfile>(() => loadMemoryProfile());
  const [showSidebar, setShowSidebar] = useState<boolean>(isExpanded);
  const [showCanvas, setShowCanvas] = useState<boolean>(false);
  const [canvasEditMode, setCanvasEditMode] = useState<'preview' | 'edit'>('preview');
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'memory' | 'training'>('memory');
  const [newMemoryText, setNewMemoryText] = useState<string>('');
  const [newTrainPattern, setNewTrainPattern] = useState<string>('');
  const [newTrainStructure, setNewTrainStructure] = useState<string>('');
  const [threadSearch, setThreadSearch] = useState<string>('');

  const [promptInput, setPromptInput] = useState<string>('');
  const [attachments, setAttachments] = useState<ChatGptAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamStatus, setStreamStatus] = useState<string>('');
  const [streamError, setStreamError] = useState<string | null>(null);
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const [speakingTurnId, setSpeakingTurnId] = useState<string | null>(null);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const speechRecRef = useRef<{ stop: () => void } | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
    [threads, activeThreadId]
  );

  useEffect(() => {
    saveChatGptThreads(threads);
  }, [threads]);

  useEffect(() => {
    saveMemoryProfile(memoryProfile);
  }, [memoryProfile]);

  useEffect(() => {
    if (isExpanded) {
      setShowSidebar(true);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setPromptInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (activeThread?.activeCanvas && !showCanvas && isExpanded) {
      setShowCanvas(true);
    }
  }, [activeThread?.activeCanvas, isExpanded, showCanvas]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [activeThread?.turns.length, streamStatus]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      speechRecRef.current?.stop();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const updateActiveThread = (updater: (thread: ChatGptThread) => ChatGptThread) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === activeThread.id ? updater(t) : t))
    );
  };

  const handleNewThread = () => {
    if (isStreaming) abortControllerRef.current?.abort();
    const fresh = createEmptyThread(isAr);
    fresh.reasoningArchitecture = memoryProfile.defaultArchitecture ?? 'auto';
    fresh.selfVerifyPass = memoryProfile.selfVerifyDefault ?? true;
    setThreads((prev) => [fresh, ...prev]);
    setActiveThreadId(fresh.id);
    setStreamError(null);
    setAttachments([]);
    setPromptInput('');
    setShowCanvas(false);
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const remaining = prev.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fresh = createEmptyThread(isAr);
        setActiveThreadId(fresh.id);
        return [fresh];
      }
      if (activeThreadId === id) {
        setActiveThreadId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const next: ChatGptAttachment[] = [];
    for (const file of Array.from(fileList).slice(0, 4 - attachments.length)) {
      if (file.size > 2_500_000) {
        setStreamError(
          isAr
            ? `الملف "${file.name}" يتجاوز الحد المسموح (2.5 MB).`
            : `File "${file.name}" exceeds the 2.5 MB attachment limit.`
        );
        continue;
      }
      const lowerName = file.name.toLowerCase();
      const mime =
        file.type ||
        (lowerName.endsWith('.csv')
          ? 'text/csv'
          : lowerName.endsWith('.json')
          ? 'application/json'
          : lowerName.endsWith('.md')
          ? 'text/markdown'
          : 'text/plain');

      if (mime.startsWith('image/') || mime === 'application/pdf') {
        const b64 = await fileToBase64(file);
        next.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: mime,
          kind: mime === 'application/pdf' ? 'pdf' : 'image',
          sizeBytes: file.size,
          dataBase64: b64,
        });
      } else {
        const text = await file.text();
        next.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          mimeType: mime,
          kind: 'text',
          sizeBytes: file.size,
          textContent: text.slice(0, 30_000),
        });
      }
    }
    if (next.length > 0) {
      setAttachments((prev) => [...prev, ...next].slice(0, 4));
      setStreamError(null);
    }
  };

  const handleToggleVoice = () => {
    if (typeof window === 'undefined') return;
    if (isListeningVoice) {
      speechRecRef.current?.stop();
      setIsListeningVoice(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        continuous: boolean;
        onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    };

    const Rec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Rec) {
      setStreamError(
        isAr
          ? 'الإدخال الصوتي غير مدعوم في هذا المتصفح.'
          : 'Speech recognition is not supported in this browser.'
      );
      return;
    }

    const rec = new Rec();
    rec.lang = isAr ? 'ar-EG' : 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (ev) => {
      const parts: string[] = [];
      for (let i = 0; i < ev.results.length; i++) {
        const res = ev.results[i][0];
        if (res?.transcript) parts.push(res.transcript);
      }
      if (parts.length > 0) {
        setPromptInput((prev) => (prev ? `${prev} ${parts.join(' ')}` : parts.join(' ')));
      }
    };
    rec.onerror = () => setIsListeningVoice(false);
    rec.onend = () => setIsListeningVoice(false);
    speechRecRef.current = rec;
    setIsListeningVoice(true);
    rec.start();
  };

  const handleReadAloud = (turn: ChatGptTurn) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingTurnId === turn.id) {
      window.speechSynthesis.cancel();
      setSpeakingTurnId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(turn.content.replace(/[`#*]/g, ''));
    utter.lang = isAr ? 'ar-SA' : 'en-US';
    utter.onend = () => setSpeakingTurnId(null);
    utter.onerror = () => setSpeakingTurnId(null);
    setSpeakingTurnId(turn.id);
    window.speechSynthesis.speak(utter);
  };

  const runPrompt = async (opts: {
    text: string;
    overrideMode?: ChatGptTaskMode;
    truncateFromTurnIndex?: number;
    includeCanvasContext?: boolean;
    verifyTargetTurn?: { question: string; draftAnswer: string };
  }) => {
    const cleanText = opts.text.trim();
    if ((!cleanText && attachments.length === 0 && !opts.verifyTargetTurn) || isStreaming) return;

    const targetThreadId = activeThread.id;
    const modeToUse = opts.overrideMode ?? activeThread.mode;
    const baseTurns =
      typeof opts.truncateFromTurnIndex === 'number'
        ? activeThread.turns.slice(0, opts.truncateFromTurnIndex)
        : activeThread.turns;

    const userTurnId = `u-${Date.now()}`;
    const assistantTurnId = `a-${Date.now() + 1}`;
    const currentAttachments = [...attachments];

    const userTurn: ChatGptTurn = {
      id: userTurnId,
      role: 'user',
      content:
        cleanText ||
        (opts.verifyTargetTurn
          ? isAr
            ? 'دقّق هذا الرد منطقياً وهندسياً (CoVe)'
            : 'Verify logic & standards accuracy (CoVe)'
          : isAr
          ? 'حلل المرفقات'
          : 'Analyze attached files'),
      attachments: currentAttachments.map((a) => ({
        id: a.id,
        name: a.name,
        mimeType: a.mimeType,
        kind: a.kind,
        sizeBytes: a.sizeBytes,
      })),
      createdAt: new Date().toISOString(),
    };

    const placeholderAssistant: ChatGptTurn = {
      id: assistantTurnId,
      role: 'assistant',
      content: '',
      thought: '',
      sources: [],
      actions: [],
      artifacts: [],
      createdAt: new Date().toISOString(),
    };

    const nextTitle =
      baseTurns.length === 0
        ? deriveThreadTitle(userTurn.content, activeThread.title)
        : activeThread.title;

    setThreads((prev) =>
      prev.map((t) =>
        t.id === targetThreadId
          ? {
              ...t,
              title: nextTitle,
              mode: modeToUse,
              turns: [...baseTurns, userTurn, placeholderAssistant],
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );

    setPromptInput('');
    setAttachments([]);
    setEditingTurnId(null);
    setStreamError(null);
    setIsStreaming(true);
    setStreamStatus(isAr ? 'جاري تفعيل هياكل التفكير والتدريب...' : 'Activating cognitive architecture...');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const historyPayload = baseTurns.slice(-18).map((t) => ({
      role: t.role,
      content: t.content,
    }));

    try {
      await streamChatGptAgent(
        {
          message: userTurn.content,
          history: historyPayload,
          language,
          mode: modeToUse,
          thinkingEffort: opts.verifyTargetTurn ? 'high' : activeThread.thinkingEffort,
          reasoningArchitecture: opts.verifyTargetTurn
            ? 'chain_of_verification'
            : activeThread.reasoningArchitecture,
          trainingPacks: memoryProfile.activeTrainingPacks ?? DEFAULT_TRAINING_PACKS,
          selfVerifyPass: activeThread.selfVerifyPass,
          verifyTargetTurn: opts.verifyTargetTurn,
          webSearchEnabled:
            activeThread.webSearchEnabled ||
            modeToUse === 'web_search' ||
            modeToUse === 'deep_research',
          attachments: currentAttachments,
          memoryProfile,
          canvasDocument:
            opts.includeCanvasContext && activeThread.activeCanvas
              ? {
                  title: activeThread.activeCanvas.title,
                  kind: activeThread.activeCanvas.kind,
                  content: activeThread.activeCanvas.content,
                }
              : undefined,
          context,
        },
        {
          onEvent: (ev) => {
            if (ev.type === 'status') {
              setStreamStatus(ev.label);
            } else if (ev.type === 'thought') {
              // Kept in the stream contract for older servers, but private chain-of-thought
              // is deliberately not stored or shown to the reader.
            } else if (ev.type === 'token') {
              setStreamStatus('');
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === targetThreadId
                    ? {
                        ...t,
                        turns: t.turns.map((turn) =>
                          turn.id === assistantTurnId
                            ? { ...turn, content: `${turn.content}${ev.delta}` }
                            : turn
                        ),
                      }
                    : t
                )
              );
            } else if (ev.type === 'sources') {
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === targetThreadId
                    ? {
                        ...t,
                        turns: t.turns.map((turn) =>
                          turn.id === assistantTurnId
                            ? { ...turn, sources: ev.sources }
                            : turn
                        ),
                      }
                    : t
                )
              );
            } else if (ev.type === 'tool_action') {
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === targetThreadId
                    ? {
                        ...t,
                        turns: t.turns.map((turn) =>
                          turn.id === assistantTurnId
                            ? {
                                ...turn,
                                actions: [...(turn.actions || []), ev.action],
                              }
                            : turn
                        ),
                      }
                    : t
                )
              );
            } else if (ev.type === 'artifact') {
              setShowCanvas(true);
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === targetThreadId
                    ? {
                        ...t,
                        activeCanvas: ev.artifact,
                        turns: t.turns.map((turn) =>
                          turn.id === assistantTurnId
                            ? {
                                ...turn,
                                artifacts: [...(turn.artifacts || []), ev.artifact],
                              }
                            : turn
                        ),
                      }
                    : t
                )
              );
            } else if (ev.type === 'memory_saved') {
              setMemoryProfile((prev) =>
                prev.savedMemories.includes(ev.memory)
                  ? prev
                  : {
                      ...prev,
                      savedMemories: [ev.memory, ...prev.savedMemories].slice(0, 20),
                    }
              );
            } else if (ev.type === 'done') {
              setThreads((prev) =>
                prev.map((t) =>
                  t.id === targetThreadId
                    ? {
                        ...t,
                        turns: t.turns.map((turn) =>
                          turn.id === assistantTurnId
                            ? {
                                ...turn,
                                model: ev.model,
                                elapsedMs: ev.elapsedMs,
                                architectureUsed: ev.architectureUsed,
                                libraryHitsCount: ev.libraryHitsCount,
                              }
                            : turn
                        ),
                      }
                    : t
                )
              );
            } else if (ev.type === 'error') {
              setStreamError(ev.message);
            }
          },
        },
        controller.signal
      );
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        setStreamStatus(isAr ? 'تم إيقاف التوليد' : 'Generation stopped');
      } else {
        const msg =
          err instanceof AgentApiError
            ? err.message
            : err instanceof Error
            ? err.message
            : String(err);
        setStreamError(msg);
      }
    } finally {
      setIsStreaming(false);
      setStreamStatus('');
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
  };

  const handleRegenerateTurn = (assistantIndex: number) => {
    if (isStreaming) return;
    const precedingUser = [...activeThread.turns]
      .slice(0, assistantIndex)
      .reverse()
      .find((t) => t.role === 'user');
    if (!precedingUser) return;
    const userIndex = activeThread.turns.findIndex((t) => t.id === precedingUser.id);
    if (userIndex === -1) return;
    void runPrompt({
      text: precedingUser.content,
      truncateFromTurnIndex: userIndex,
    });
  };

  const handleCanvasTransform = (instructionAr: string, instructionEn: string) => {
    if (!activeThread.activeCanvas) return;
    void runPrompt({
      text: isAr
        ? `${instructionAr} على وثيقة Canvas الحالية وحدثها عبر open_canvas_document.`
        : `${instructionEn} on the active Canvas document and update it via open_canvas_document.`,
      overrideMode: 'canvas',
      includeCanvasContext: true,
    });
  };

  const handleVerifyLogicTurn = (assistantIndex: number) => {
    if (isStreaming) return;
    const draftTurn = activeThread.turns[assistantIndex];
    if (!draftTurn || draftTurn.role !== 'assistant' || !draftTurn.content.trim()) return;
    const precedingUser = [...activeThread.turns]
      .slice(0, assistantIndex)
      .reverse()
      .find((t) => t.role === 'user');
    void runPrompt({
      text: isAr
        ? 'تدقيق التحقق المتسلسل (CoVe) لمنطق الرد وحساباته ومعايير الكود'
        : 'Chain-of-Verification (CoVe) audit of response logic, math, and standards',
      verifyTargetTurn: {
        question: precedingUser?.content || activeThread.title,
        draftAnswer: draftTurn.content,
      },
    });
  };

  const handleSeedTrainingFromTurn = (assistantIndex: number) => {
    const draftTurn = activeThread.turns[assistantIndex];
    const precedingUser = [...activeThread.turns]
      .slice(0, assistantIndex)
      .reverse()
      .find((t) => t.role === 'user');
    setNewTrainPattern(precedingUser?.content.slice(0, 220) || '');
    setNewTrainStructure(draftTurn?.content.slice(0, 500) || '');
    setModalTab('training');
    setShowMemoryModal(true);
  };

  const filteredThreads = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    const sorted = [...threads].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    if (!q) return sorted;
    return sorted.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.turns.some((turn) => turn.content.toLowerCase().includes(q))
    );
  }, [threads, threadSearch]);

  const activeCanvas = activeThread?.activeCanvas ?? null;

  return (
    <div
      data-testid="insco-chatgpt-workspace"
      className="flex-1 flex min-h-0 bg-slate-950 text-slate-100 relative overflow-hidden"
    >
      {/* Left/Start Conversations Sidebar */}
      {showSidebar && (
        <aside
          data-testid="chatgpt-threads-sidebar"
          className="w-64 shrink-0 border-e border-slate-800 bg-slate-900/60 flex flex-col min-h-0"
        >
          <div className="p-3 border-b border-slate-800 space-y-2">
            <button
              type="button"
              data-testid="chatgpt-new-thread-btn"
              onClick={handleNewThread}
              className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2"
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'محادثة جديدة' : 'New Chat'}</span>
            </button>

            <div className="relative">
              <Search
                className="w-3.5 h-3.5 shrink-0 text-slate-400 absolute top-2.5 start-2.5"
                aria-hidden="true"
              />
              <input
                type="text"
                value={threadSearch}
                onChange={(e) => setThreadSearch(e.target.value)}
                placeholder={isAr ? 'بحث في المحادثات...' : 'Search chats...'}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 ps-8 pe-2.5 py-1.5 text-[11px] text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredThreads.map((thread) => {
              const isSelected = thread.id === activeThread.id;
              return (
                <div
                  key={thread.id}
                  data-testid={`chatgpt-thread-item-${thread.id}`}
                  className={`group rounded-lg border px-2.5 py-2 text-xs transition flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                      : 'border-transparent hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  {renamingThreadId === thread.id ? (
                    <form
                      className="flex-1 flex items-center gap-1"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const nextTitle = renameDraft.trim() || thread.title;
                        setThreads((prev) =>
                          prev.map((t) => (t.id === thread.id ? { ...t, title: nextTitle } : t))
                        );
                        setRenamingThreadId(null);
                      }}
                    >
                      <input
                        type="text"
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        className="w-full rounded bg-slate-950 border border-cyan-500 px-1.5 py-0.5 text-[11px] text-white"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveThreadId(thread.id);
                        setStreamError(null);
                      }}
                      className="flex-1 text-start truncate font-semibold cursor-pointer"
                    >
                      {thread.title}
                    </button>
                  )}

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setThreads((prev) =>
                          prev.map((t) =>
                            t.id === thread.id ? { ...t, pinned: !t.pinned } : t
                          )
                        )
                      }
                      aria-label={isAr ? 'تثبيت' : 'Pin'}
                      className={`p-1 rounded hover:bg-slate-700 cursor-pointer ${
                        thread.pinned ? 'text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      <Pin className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingThreadId(thread.id);
                        setRenameDraft(thread.title);
                      }}
                      aria-label={isAr ? 'تسمية' : 'Rename'}
                      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteThread(thread.id)}
                      aria-label={isAr ? 'حذف' : 'Delete'}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-slate-800">
            <button
              type="button"
              data-testid="chatgpt-open-memory-btn"
              onClick={() => setShowMemoryModal(true)}
              className="w-full py-2 px-3 rounded-xl border border-slate-700 bg-slate-950 hover:border-cyan-400 text-xs font-bold text-slate-200 transition cursor-pointer flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>{isAr ? 'التعليمات والذاكرة' : 'Instructions & Memory'}</span>
              </span>
              <span className="font-mono text-[10px] text-amber-300 tabular-nums">
                {memoryProfile.savedMemories.length}
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Center: Main ChatGPT Stream & Composer */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top Mode, Web Search, Thinking Effort & Workspace Toggles */}
        <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="chatgpt-toggle-sidebar-btn"
              onClick={() => setShowSidebar((v) => !v)}
              aria-label={isAr ? 'سجل المحادثات' : 'Chat history sidebar'}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                showSidebar
                  ? 'border-cyan-500/50 bg-cyan-500/15 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <PanelLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleNewThread}
              aria-label={isAr ? 'محادثة جديدة' : 'New chat'}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-300 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <select
              data-testid="chatgpt-mode-select"
              aria-label={isAr ? 'وضع الذكاء الاصطناعي' : 'AI Task Mode'}
              value={activeThread.mode}
              onChange={(e) =>
                updateActiveThread((t) => ({
                  ...t,
                  mode: e.target.value as ChatGptTaskMode,
                  webSearchEnabled:
                    e.target.value === 'web_search' || e.target.value === 'deep_research'
                      ? true
                      : t.webSearchEnabled,
                  thinkingEffort:
                    e.target.value === 'thinking' || e.target.value === 'deep_research'
                      ? 'high'
                      : t.thinkingEffort,
                }))
              }
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-cyan-300 cursor-pointer"
            >
              {MODE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {isAr ? m.ar : m.en}
                </option>
              ))}
            </select>

            <button
              type="button"
              data-testid="chatgpt-web-search-toggle"
              aria-pressed={activeThread.webSearchEnabled}
              onClick={() =>
                updateActiveThread((t) => ({ ...t, webSearchEnabled: !t.webSearchEnabled }))
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold cursor-pointer ${
                activeThread.webSearchEnabled
                  ? 'border-emerald-400/60 bg-emerald-500/20 text-emerald-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'بحث ويب' : 'Search'}</span>
            </button>

            <div
              role="group"
              aria-label={isAr ? 'مستوى التفكير' : 'Thinking Effort'}
              className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-[10px] font-mono"
            >
              {(['low', 'medium', 'high'] as ChatGptThinkingEffort[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  data-testid={`chatgpt-think-${lvl}`}
                  aria-pressed={activeThread.thinkingEffort === lvl}
                  onClick={() =>
                    updateActiveThread((t) => ({ ...t, thinkingEffort: lvl }))
                  }
                  className={`px-1.5 py-0.5 rounded uppercase font-bold cursor-pointer ${
                    activeThread.thinkingEffort === lvl
                      ? 'bg-violet-500/25 text-violet-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <select
              data-testid="chatgpt-arch-select"
              aria-label={isAr ? 'هيكل التفكير والبناء' : 'Reasoning Architecture'}
              value={activeThread.reasoningArchitecture}
              onChange={(e) =>
                updateActiveThread((t) => ({
                  ...t,
                  reasoningArchitecture: e.target.value as ChatGptReasoningArchitecture,
                }))
              }
              className="rounded-lg border border-violet-500/40 bg-slate-900 px-2 py-1 text-[11px] font-bold text-violet-300 cursor-pointer"
            >
              {ARCH_OPTIONS.map((a) => (
                <option key={a.id} value={a.id}>
                  {isAr ? a.ar : a.en}
                </option>
              ))}
            </select>

            <button
              type="button"
              data-testid="chatgpt-verify-toggle"
              aria-pressed={activeThread.selfVerifyPass}
              onClick={() =>
                updateActiveThread((t) => ({ ...t, selfVerifyPass: !t.selfVerifyPass }))
              }
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold cursor-pointer ${
                activeThread.selfVerifyPass
                  ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'تدقيق المنطق' : 'Self-Verify'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="chatgpt-toggle-memory-quick-btn"
              onClick={() => {
                setModalTab('training');
                setShowMemoryModal(true);
              }}
              aria-label={isAr ? 'التدريب والهياكل والذاكرة' : 'Training, Architecture & Memory'}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-800 bg-slate-900 text-[11px] font-bold text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'التدريب والذاكرة' : 'Train & Memory'}</span>
            </button>
            <button
              type="button"
              data-testid="chatgpt-toggle-canvas-btn"
              onClick={() => setShowCanvas((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold cursor-pointer ${
                showCanvas
                  ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
              }`}
            >
              <PanelRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Canvas</span>
            </button>
            <button
              type="button"
              data-testid="chatgpt-toggle-expand-btn"
              onClick={onToggleExpand}
              aria-label={isAr ? 'توسيع ملء الشاشة' : 'Toggle fullscreen workspace'}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-cyan-300 cursor-pointer"
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Conversation Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {activeThread.turns.length === 0 ? (
            <div className="max-w-3xl mx-auto py-4 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center mx-auto text-cyan-300">
                  <Sparkles className="w-5 h-5 shrink-0" aria-hidden="true" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {isAr
                    ? 'أهلاً بك في INSCO AI Agent — وكيل الذكاء المتكامل'
                    : 'INSCO AI Agent — ChatGPT-Class Workspace'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
                  {isAr
                    ? 'تفكير عميق متدرج، بحث ويب حي بالمصادر، قراءة الصور والملفات (PDF/CSV/أفلام RT)، برمجة، محرر Canvas للمستندات والتقارير، وذاكرة مخصصة — بالإضافة لتكامل مباشر مع مجتمع INSCO ومعامل الفحص.'
                    : 'Real-time streaming, adjustable Deep Think reasoning, live Web Search citations, Vision & File analysis (Images/PDF/CSV), interactive Canvas documents, persistent Memory, and direct INSCO platform actions.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {STARTER_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    data-testid={`chatgpt-starter-${idx}`}
                    onClick={() => {
                      updateActiveThread((t) => ({
                        ...t,
                        mode: sp.mode,
                        webSearchEnabled: sp.mode === 'web_search' || sp.mode === 'deep_research',
                      }));
                      setPromptInput(isAr ? sp.promptAr : sp.promptEn);
                    }}
                    className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/60 hover:bg-slate-900 text-start transition cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-black">
                      {sp.icon === 'brain' ? (
                        <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : sp.icon === 'globe' ? (
                        <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : sp.icon === 'code' ? (
                        <Code2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : sp.icon === 'file' ? (
                        <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : sp.icon === 'layers' ? (
                        <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                      ) : (
                        <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                      )}
                      <span>{isAr ? sp.titleAr : sp.titleEn}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                      {isAr ? sp.promptAr : sp.promptEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {activeThread.turns.map((turn, idx) => {
                const isUser = turn.role === 'user';

                return (
                  <div
                    key={turn.id}
                    data-testid={`chatgpt-turn-${turn.role}-${idx}`}
                    className={`rounded-2xl p-3.5 space-y-2.5 ${
                      isUser
                        ? 'bg-cyan-950/45 border border-cyan-500/30 ms-8 sm:ms-16'
                        : 'bg-slate-900/75 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 font-bold text-slate-300">
                        {isUser ? (
                          <span>{isAr ? 'أنت' : 'You'}</span>
                        ) : (
                          <>
                            <Bot className="w-3.5 h-3.5 shrink-0 text-cyan-400" aria-hidden="true" />
                            <span>INSCO AI Agent</span>
                          </>
                        )}
                      </span>
                      {turn.model && (
                        <div className="flex flex-wrap items-center gap-1.5 text-slate-500 tabular-nums">
                          {turn.architectureUsed && (
                            <span
                              data-testid={`chatgpt-turn-arch-${turn.id}`}
                              className="px-1.5 py-0.5 rounded bg-violet-500/15 border border-violet-500/30 text-violet-300 font-bold"
                            >
                              {(() => {
                                const found = ARCH_OPTIONS.find((a) => a.id === turn.architectureUsed);
                                return found ? (isAr ? found.badgeAr : found.badgeEn) : turn.architectureUsed;
                              })()}
                            </span>
                          )}
                          {typeof turn.libraryHitsCount === 'number' && turn.libraryHitsCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                              {turn.libraryHitsCount} {isAr ? 'مراجع INSCO' : 'INSCO refs'}
                            </span>
                          )}
                          {turn.model.startsWith('insco-local') && (
                            // Says out loud what the answer already is: composed here, from
                            // this site's own library, with no provider and no network.
                            <span
                              data-testid={`chatgpt-turn-local-${turn.id}`}
                              className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold"
                            >
                              {isAr ? 'محرّك إنسكو المحلي · بلا مزوّد خارجي' : 'INSCO local engine · no provider'}
                            </span>
                          )}
                          <span>
                            {turn.model} {turn.elapsedMs ? `· ${(turn.elapsedMs / 1000).toFixed(1)}s` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Uploaded attachment chips on user message */}
                    {turn.attachments && turn.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {turn.attachments.map((att) => (
                          <span
                            key={att.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-mono text-cyan-300"
                          >
                            {att.kind === 'image' ? (
                              <ImageIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                            ) : (
                              <FileCode2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            )}
                            <span>{att.name}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Message Body */}
                    {isUser ? (
                      <div className="text-xs sm:text-[13px] text-white whitespace-pre-line leading-relaxed">
                        {turn.content}
                      </div>
                    ) : (
                      <MarkdownCanvasRenderer
                        content={turn.content}
                        isAr={isAr}
                        onOpenInCanvas={(art) => {
                          updateActiveThread((t) => ({ ...t, activeCanvas: art }));
                          setShowCanvas(true);
                        }}
                      />
                    )}

                    {/* Canvas Artifact Cards created in this turn */}
                    {turn.artifacts && turn.artifacts.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {turn.artifacts.map((art) => (
                          <button
                            key={art.id}
                            type="button"
                            data-testid={`chatgpt-open-artifact-${art.id}`}
                            onClick={() => {
                              updateActiveThread((t) => ({ ...t, activeCanvas: art }));
                              setShowCanvas(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1.5 text-xs font-bold text-amber-200 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{art.title}</span>
                            <span className="text-[10px] font-mono uppercase text-amber-400">
                              {art.kind}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Web Grounding Citations */}
                    {turn.sources && turn.sources.length > 0 && (
                      <div
                        data-testid={`chatgpt-sources-${turn.id}`}
                        className="pt-2 border-t border-slate-800/80 space-y-1.5"
                      >
                        <div className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                          <Globe className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>{isAr ? 'المصادر المرجعية من الويب' : 'Verified Web Sources'}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {turn.sources.map((src, sIdx) => (
                            <a
                              key={sIdx}
                              href={src.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 px-2 py-1 text-[10px] text-cyan-300"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span className="truncate max-w-[180px]">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* INSCO Platform Action Buttons */}
                    {turn.actions && turn.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {turn.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => onExecuteAction(act)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 px-2.5 py-1 text-[11px] font-bold text-cyan-200 cursor-pointer"
                          >
                            <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>{act.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Turn Actions Toolbar */}
                    {(!isStreaming || idx < activeThread.turns.length - 1) && (
                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/50 text-[10px] text-slate-400">
                        {isUser ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTurnId(turn.id);
                              setPromptInput(turn.content);
                            }}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-white cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 shrink-0" aria-hidden="true" />
                            <span>{isAr ? 'تعديل وإعادة إرسال' : 'Edit & Branch'}</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                void navigator.clipboard?.writeText(turn.content);
                                setCopiedTurnId(turn.id);
                                window.setTimeout(() => setCopiedTurnId(null), 1800);
                              }}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-white cursor-pointer"
                            >
                              {copiedTurnId === turn.id ? (
                                <Check className="w-3 h-3 shrink-0 text-emerald-400" aria-hidden="true" />
                              ) : (
                                <Copy className="w-3 h-3 shrink-0" aria-hidden="true" />
                              )}
                              <span>{copiedTurnId === turn.id ? (isAr ? 'نُسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReadAloud(turn)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-white cursor-pointer"
                            >
                              {speakingTurnId === turn.id ? (
                                <VolumeX className="w-3 h-3 shrink-0 text-amber-400" aria-hidden="true" />
                              ) : (
                                <Volume2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                              )}
                              <span>{speakingTurnId === turn.id ? (isAr ? 'إيقاف الصوت' : 'Stop Audio') : isAr ? 'قراءة صوتية' : 'Read Aloud'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                updateActiveThread((t) => ({
                                  ...t,
                                  activeCanvas: {
                                    id: `canvas-${turn.id}`,
                                    title: deriveThreadTitle(turn.content, 'Canvas Note'),
                                    kind: 'markdown',
                                    content: turn.content,
                                  },
                                }));
                                setShowCanvas(true);
                              }}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-amber-300 cursor-pointer"
                            >
                              <PanelRight className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'تحرير في Canvas' : 'Open in Canvas'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRegenerateTurn(idx)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-cyan-300 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'إعادة التوليد' : 'Regenerate'}</span>
                            </button>

                            <button
                              type="button"
                              data-testid={`chatgpt-verify-turn-btn-${idx}`}
                              onClick={() => handleVerifyLogicTurn(idx)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-emerald-300 cursor-pointer"
                            >
                              <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'تدقيق المنطق (CoVe)' : 'Verify Logic (CoVe)'}</span>
                            </button>

                            <button
                              type="button"
                              data-testid={`chatgpt-train-turn-btn-${idx}`}
                              onClick={() => handleSeedTrainingFromTurn(idx)}
                              className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-800 hover:text-amber-300 cursor-pointer"
                            >
                              <BookOpen className="w-3 h-3 shrink-0" aria-hidden="true" />
                              <span>{isAr ? 'تدريب كقاعدة' : 'Train Rule'}</span>
                            </button>

                            <button
                              type="button"
                              aria-label={isAr ? 'مفيد' : 'Helpful'}
                              onClick={() =>
                                updateActiveThread((t) => ({
                                  ...t,
                                  turns: t.turns.map((item) =>
                                    item.id === turn.id
                                      ? { ...item, feedback: item.feedback === 'up' ? null : 'up' }
                                      : item
                                  ),
                                }))
                              }
                              className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                                turn.feedback === 'up' ? 'text-emerald-400' : ''
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3 shrink-0" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={isAr ? 'غير دقيق' : 'Not helpful'}
                              onClick={() =>
                                updateActiveThread((t) => ({
                                  ...t,
                                  turns: t.turns.map((item) =>
                                    item.id === turn.id
                                      ? { ...item, feedback: item.feedback === 'down' ? null : 'down' }
                                      : item
                                  ),
                                }))
                              }
                              className={`p-1 rounded hover:bg-slate-800 cursor-pointer ${
                                turn.feedback === 'down' ? 'text-rose-400' : ''
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3 shrink-0" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {streamStatus && (
            <div className="max-w-3xl mx-auto text-xs font-mono text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{streamStatus}</span>
            </div>
          )}

          {streamError && (
            <div
              role="alert"
              data-testid="chatgpt-stream-error"
              className="max-w-3xl mx-auto rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300"
            >
              {streamError}
            </div>
          )}

          <div ref={transcriptEndRef} />
        </div>

        {/* Multimodal Composer Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const editIdx = editingTurnId
              ? activeThread.turns.findIndex((t) => t.id === editingTurnId)
              : undefined;
            void runPrompt({
              text: promptInput,
              truncateFromTurnIndex: editIdx !== undefined && editIdx !== -1 ? editIdx : undefined,
            });
          }}
          className="p-3 border-t border-slate-800 bg-slate-900/40 space-y-2"
        >
          {/* Attachment Preview Chips */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-mono text-cyan-200"
                >
                  <span>{att.name}</span>
                  <button
                    type="button"
                    aria-label={isAr ? 'إزالة الملف' : 'Remove attachment'}
                    onClick={() =>
                      setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                    }
                    className="text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <X className="w-3 h-3 shrink-0" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-slate-700 bg-slate-900 p-2 focus-within:border-cyan-400">
            <input
              ref={fileInputRef}
              type="file"
              data-testid="chatgpt-file-input"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,.txt,.csv,.json,.md,.ts,.tsx,.py,.sql"
              onChange={(e) => {
                void handleFilesSelected(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
            <button
              type="button"
              data-testid="chatgpt-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label={isAr ? 'إرفاق صورة أو ملف' : 'Attach image, PDF, CSV, or code file'}
              className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800 cursor-pointer"
            >
              <Paperclip className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              data-testid="chatgpt-voice-btn"
              onClick={handleToggleVoice}
              aria-label={isAr ? 'إملاء صوتي' : 'Voice dictation'}
              className={`p-2 rounded-xl cursor-pointer ${
                isListeningVoice
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
              }`}
            >
              {isListeningVoice ? (
                <MicOff className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
            </button>

            <textarea
              data-testid="chatgpt-composer-input"
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const editIdx = editingTurnId
                    ? activeThread.turns.findIndex((t) => t.id === editingTurnId)
                    : undefined;
                  void runPrompt({
                    text: promptInput,
                    truncateFromTurnIndex:
                      editIdx !== undefined && editIdx !== -1 ? editIdx : undefined,
                  });
                }
              }}
              placeholder={
                isAr
                  ? 'اسأل INSCO AI (مثل ChatGPT تماماً): بحث ويب، كود، تقارير Canvas، تحليل صور وملفات، أو مهام INSCO...'
                  : 'Message INSCO AI (ChatGPT Agent): ask anything, search web, write code, draft Canvas docs, or analyze images/files...'
              }
              className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 resize-none focus:outline-none py-1.5"
            />

            {isStreaming ? (
              <button
                type="button"
                data-testid="chatgpt-stop-btn"
                onClick={handleStopStreaming}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 px-3 py-2 text-xs font-black text-white cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'إيقاف' : 'Stop'}</span>
              </button>
            ) : (
              <button
                type="submit"
                data-testid="chatgpt-send-btn"
                disabled={promptInput.trim().length === 0 && attachments.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 px-3.5 py-2 text-xs font-black text-slate-950 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{isAr ? 'إرسال' : 'Send'}</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right/End Side-by-Side Canvas Studio */}
      {showCanvas && (
        <aside
          data-testid="chatgpt-canvas-panel"
          className="w-full md:w-[44%] border-s border-slate-800 bg-slate-900/80 flex flex-col min-h-0"
        >
          <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-bold text-amber-400">
                CANVAS STUDIO · {activeCanvas?.kind?.toUpperCase() || 'EMPTY'}
              </div>
              <div className="text-xs font-black text-white truncate">
                {activeCanvas?.title || (isAr ? 'مساحة تحرير الوثائق والكود' : 'Document & Code Canvas')}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setCanvasEditMode((m) => (m === 'preview' ? 'edit' : 'preview'))
                }
                className="px-2 py-1 rounded-lg border border-slate-700 text-[11px] font-bold text-slate-200 hover:border-cyan-400 cursor-pointer"
              >
                {canvasEditMode === 'preview'
                  ? isAr
                    ? 'تعديل'
                    : 'Edit'
                  : isAr
                  ? 'معاينة'
                  : 'Preview'}
              </button>
              <button
                type="button"
                onClick={() => setShowCanvas(false)}
                aria-label={isAr ? 'إغلاق Canvas' : 'Close Canvas'}
                className="p-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {activeCanvas ? (
            <>
              {/* Quick ChatGPT Canvas Transform Bar */}
              <div className="px-3 py-2 border-b border-slate-800/70 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={() => handleCanvasTransform('حسّن الصياغة واجعلها أكثر احترافية', 'Polish and formalize the writing')}
                  className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 text-[10px] font-bold text-cyan-300 cursor-pointer"
                >
                  {isAr ? 'تحسين الصياغة' : 'Polish'}
                </button>
                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={() => handleCanvasTransform('اختصر المحتوى في نقاط مركزة', 'Make this concise with bullet points')}
                  className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 text-[10px] font-bold text-slate-200 cursor-pointer"
                >
                  {isAr ? 'اختصار' : 'Shorter'}
                </button>
                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={() => handleCanvasTransform('أضف جداول ومعايير الأكواد ASME وAPI وISO', 'Expand with ASME/API/ISO clauses and tables')}
                  className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 text-[10px] font-bold text-amber-300 cursor-pointer"
                >
                  {isAr ? '+ مراجع الأكواد' : '+ Code Clauses'}
                </button>
                <button
                  type="button"
                  disabled={isStreaming}
                  onClick={() =>
                    handleCanvasTransform(
                      'ترجم الوثيقة بالكامل إلى الإنجليزية مع الحفاظ على التنسيق',
                      'Translate the full document cleanly into Arabic keeping structure'
                    )
                  }
                  className="px-2 py-1 rounded-lg border border-slate-700 bg-slate-950 hover:border-cyan-400 text-[10px] font-bold text-emerald-300 cursor-pointer"
                >
                  {isAr ? 'ترجمة EN ↔ AR' : 'Translate AR ↔ EN'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {canvasEditMode === 'edit' ? (
                  <textarea
                    value={activeCanvas.content}
                    onChange={(e) => {
                      const nextText = e.target.value;
                      updateActiveThread((t) => ({
                        ...t,
                        activeCanvas: t.activeCanvas
                          ? { ...t.activeCanvas, content: nextText }
                          : null,
                      }));
                    }}
                    className="w-full h-full min-h-[320px] rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                ) : activeCanvas.kind === 'code' || activeCanvas.kind === 'html' || activeCanvas.kind === 'svg' ? (
                  <MarkdownCanvasRenderer
                    content={`\`\`\`${activeCanvas.language || activeCanvas.kind}\n${activeCanvas.content}\n\`\`\``}
                    isAr={isAr}
                  />
                ) : (
                  <MarkdownCanvasRenderer content={activeCanvas.content} isAr={isAr} />
                )}
              </div>

              <div className="p-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(activeCanvas.content);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-cyan-400 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'نسخ' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([activeCanvas.content], {
                        type: 'text/plain;charset=utf-8',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${activeCanvas.title.replace(/[^\w\u0600-\u06FF-]+/g, '_')}.${
                        activeCanvas.kind === 'code' ? activeCanvas.language || 'txt' : 'md'
                      }`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 hover:border-cyan-400 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{isAr ? 'تنزيل' : 'Export'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onExecuteAction({
                      label: isAr ? 'نشر في المجتمع' : 'Post to Community',
                      actionType: 'apply_post_draft',
                      draftPost: {
                        postType: 'technical_case',
                        ndtMethod: 'GENERAL',
                        title: activeCanvas.title,
                        body: activeCanvas.content,
                        tags: ['INSCO', 'Canvas'],
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white cursor-pointer"
                >
                  <span>{isAr ? 'إدراج في مجتمع INSCO' : 'Send to Community'}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 space-y-2">
              <FileText className="w-8 h-8 shrink-0 text-slate-600" aria-hidden="true" />
              <p>
                {isAr
                  ? 'اطلب من الوكيل إنشاء تقرير أو كود أو اضغط "تحرير في Canvas" على أي رد لفتحه هنا.'
                  : 'Ask INSCO AI to draft a report/code or click "Open in Canvas" on any message.'}
              </p>
            </div>
          )}
        </aside>
      )}

      {/* Custom Instructions, Training Studio & Persistent Memory Modal */}
      {showMemoryModal && (
        <div
          data-testid="chatgpt-memory-modal"
          className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4 max-h-full overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Settings2 className="w-4 h-4 shrink-0 text-cyan-400" aria-hidden="true" />
                <span>
                  {isAr
                    ? 'استوديو تدريب INSCO AI، هياكل التفكير، والذاكرة الدائمة'
                    : 'INSCO AI Training Studio, Reasoning Architecture & Memory'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMemoryModal(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="p-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="chatgpt-modal-tab-memory"
                onClick={() => setModalTab('memory')}
                className={`py-2 px-3 rounded-xl text-xs font-black cursor-pointer transition ${
                  modalTab === 'memory'
                    ? 'bg-cyan-500 text-slate-950'
                    : 'border border-slate-800 bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'التعليمات والذاكرة الدائمة' : 'Instructions & Memory'}
              </button>
              <button
                type="button"
                data-testid="chatgpt-modal-tab-training"
                onClick={() => setModalTab('training')}
                className={`py-2 px-3 rounded-xl text-xs font-black cursor-pointer transition ${
                  modalTab === 'training'
                    ? 'bg-violet-500 text-white'
                    : 'border border-slate-800 bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                {isAr ? 'التدريب وهياكل التفكير (Playbooks)' : 'Training Packs & Reasoning'}
              </button>
            </div>

            {modalTab === 'memory' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">
                    {isAr ? 'التعليمات الدائمة للوكيل (Custom Instructions)' : 'Custom Instructions'}
                  </label>
                  <textarea
                    rows={3}
                    data-testid="chatgpt-custom-instructions-input"
                    value={memoryProfile.customInstructions}
                    onChange={(e) =>
                      setMemoryProfile((prev) => ({ ...prev, customInstructions: e.target.value }))
                    }
                    placeholder={
                      isAr
                        ? 'مثال: أنا مهندس NDT Level III متخصص في ASME Sec. V و API 653، خاطبني بأسلوب هندسي مباشر مع جداول.'
                        : 'e.g. I am an ASNT Level III engineer working with ASME Sec. V & API 653. Use engineering tables.'
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">
                    {isAr ? 'أسلوب الإجابة الافتراضي' : 'Preferred Response Style'}
                  </label>
                  <select
                    value={memoryProfile.responseStyle}
                    onChange={(e) =>
                      setMemoryProfile((prev) => ({
                        ...prev,
                        responseStyle: e.target.value as ChatGptResponseStyle,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  >
                    <option value="balanced">{isAr ? 'متوازن ومنظم (Balanced)' : 'Balanced'}</option>
                    <option value="concise">{isAr ? 'موجز ومباشر (Concise)' : 'Concise'}</option>
                    <option value="detailed">{isAr ? 'مفصل وشامل (Detailed)' : 'Detailed'}</option>
                    <option value="step_by_step">{isAr ? 'خطوة بخطوة (Step by Step)' : 'Step by Step'}</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-200">
                    {isAr ? 'الذاكرة المحفوظة (Saved Memories)' : 'Saved Memories'}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      data-testid="chatgpt-new-memory-input"
                      value={newMemoryText}
                      onChange={(e) => setNewMemoryText(e.target.value)}
                      placeholder={isAr ? 'أضف معلومة يتذكرها الوكيل دائماً...' : 'Add persistent fact for AI to remember...'}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      data-testid="chatgpt-add-memory-btn"
                      onClick={() => {
                        const clean = newMemoryText.trim();
                        if (!clean) return;
                        setMemoryProfile((prev) => ({
                          ...prev,
                          savedMemories: [clean, ...prev.savedMemories].slice(0, 20),
                        }));
                        setNewMemoryText('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      {isAr ? 'حفظ' : 'Save'}
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {memoryProfile.savedMemories.map((mem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[11px] text-slate-300"
                      >
                        <span>{mem}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setMemoryProfile((prev) => ({
                              ...prev,
                              savedMemories: prev.savedMemories.filter((_, i) => i !== idx),
                            }))
                          }
                          aria-label={isAr ? 'حذف الذاكرة' : 'Delete memory'}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-200">
                    {isAr
                      ? 'حزم التدريب الهندسي والمعرفي النشطة (Trained Domain Playbooks)'
                      : 'Active Domain Training Playbooks'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TRAINING_PACK_OPTIONS.map((pack) => {
                      const activePacks = memoryProfile.activeTrainingPacks ?? DEFAULT_TRAINING_PACKS;
                      const isOn = activePacks.includes(pack.id);
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          data-testid={`chatgpt-pack-${pack.id}`}
                          aria-pressed={isOn}
                          onClick={() =>
                            setMemoryProfile((prev) => {
                              const curr = prev.activeTrainingPacks ?? DEFAULT_TRAINING_PACKS;
                              const nextPacks = curr.includes(pack.id)
                                ? curr.filter((p) => p !== pack.id)
                                : [...curr, pack.id];
                              return { ...prev, activeTrainingPacks: nextPacks };
                            })
                          }
                          className={`p-2.5 rounded-xl border text-start transition cursor-pointer space-y-1 ${
                            isOn
                              ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs font-black">
                            <span>{isAr ? pack.ar : pack.en}</span>
                            {isOn && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden="true" />}
                          </div>
                          <p className="text-[10px] opacity-80 leading-snug">
                            {isAr ? pack.descAr : pack.descEn}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      {isAr ? 'هيكل التفكير الافتراضي للمحادثات الجديدة' : 'Default Reasoning Architecture'}
                    </label>
                    <select
                      value={memoryProfile.defaultArchitecture ?? 'auto'}
                      onChange={(e) => {
                        const val = e.target.value as ChatGptReasoningArchitecture;
                        setMemoryProfile((prev) => ({ ...prev, defaultArchitecture: val }));
                        updateActiveThread((t) => ({ ...t, reasoningArchitecture: val }));
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                    >
                      {ARCH_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {isAr ? a.ar : a.en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() =>
                        setMemoryProfile((prev) => ({
                          ...prev,
                          selfVerifyDefault: !(prev.selfVerifyDefault ?? true),
                        }))
                      }
                      className={`w-full py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                        memoryProfile.selfVerifyDefault ?? true
                          ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-200'
                          : 'border-slate-700 bg-slate-950 text-slate-400'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {(memoryProfile.selfVerifyDefault ?? true)
                          ? isAr
                            ? 'تدقيق المنطق التلقائي: مفعّل'
                            : 'Auto Logic Self-Verify: ON'
                          : isAr
                          ? 'تدقيق المنطق التلقائي: معطّل'
                          : 'Auto Logic Self-Verify: OFF'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="text-xs font-bold text-slate-200">
                    {isAr
                      ? 'قواعد وأمثلة تدريب مخصصة (Custom Few-Shot Training Rules)'
                      : 'Custom Few-Shot Training Rules'}
                  </div>
                  <input
                    type="text"
                    data-testid="chatgpt-train-pattern-input"
                    value={newTrainPattern}
                    onChange={(e) => setNewTrainPattern(e.target.value)}
                    placeholder={
                      isAr
                        ? 'عندما أسأل عن: (مثال: تقييم عيوب فيلم أشعة RT أو إعداد تقرير فحص)...'
                        : 'When query asks about: (e.g. RT film defect check or inspection memo)...'
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    data-testid="chatgpt-train-structure-input"
                    value={newTrainStructure}
                    onChange={(e) => setNewTrainStructure(e.target.value)}
                    placeholder={
                      isAr
                        ? 'اتبع هذا البناء المنطقي بدقة: (مثال: ابدأ بجدول المعطيات -> الفحص البصري -> المعادلة -> قرار الكود)...'
                        : 'Follow this exact output logic: (e.g. Parameters table -> Step-by-step math -> Code verdict)...'
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    data-testid="chatgpt-add-training-btn"
                    onClick={() => {
                      const pat = newTrainPattern.trim();
                      const str = newTrainStructure.trim();
                      if (!pat || !str) return;
                      const nextRule: ChatGptFewShotExample = {
                        id: `fs-${Date.now()}`,
                        inputPattern: pat,
                        expectedStructure: str,
                      };
                      setMemoryProfile((prev) => ({
                        ...prev,
                        fewShotExamples: [nextRule, ...(prev.fewShotExamples ?? [])].slice(0, 12),
                      }));
                      setNewTrainPattern('');
                      setNewTrainStructure('');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-black text-xs cursor-pointer"
                  >
                    {isAr ? 'إضافة قاعدة تدريب' : 'Add Training Rule'}
                  </button>

                  {(memoryProfile.fewShotExamples ?? []).length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                      {(memoryProfile.fewShotExamples ?? []).map((ex) => (
                        <div
                          key={ex.id}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-[11px] flex items-start justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-violet-300 truncate">{ex.inputPattern}</div>
                            <div className="text-slate-400 line-clamp-2">{ex.expectedStructure}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setMemoryProfile((prev) => ({
                                ...prev,
                                fewShotExamples: (prev.fewShotExamples ?? []).filter(
                                  (item) => item.id !== ex.id
                                ),
                              }))
                            }
                            aria-label={isAr ? 'حذف القاعدة' : 'Delete training rule'}
                            className="text-slate-500 hover:text-rose-400 cursor-pointer shrink-0"
                          >
                            <Trash2 className="w-3 h-3 shrink-0" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
