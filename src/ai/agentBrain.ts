/**
 * Deterministic, keyless cognition shared by INSCO's agents.
 *
 * This is not a neural network or a claim of human-like understanding. It is an
 * inspectable pipeline: preserve conversational context, retrieve from the site's
 * bilingual corpus with the tutor's unchanged confidence gate, then compose only
 * supported answers. Operational conclusions come from telemetry fields, never guesses.
 */
import { getCorpus } from './corpus.js';
import { buildIndex, searchLibrary, type SearchHit } from './search.js';
import type {
  AgentCitation,
  AgentLanguage,
  CommunityAssistRequest,
  CommunityAssistResponse,
  SiteManagerRequest,
  SiteManagerResponse,
  UserCopilotRequest,
  UserCopilotResponse,
} from './agentsContract.js';

let corpusIndex: ReturnType<typeof buildIndex> | null = null;
function index() {
  corpusIndex ??= buildIndex(getCorpus());
  return corpusIndex;
}

function clean(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

function docCitation(hit: SearchHit, language: AgentLanguage): AgentCitation {
  const doc = hit.document;
  return {
    id: doc.id,
    title: doc.title[language] || doc.title[language === 'ar' ? 'en' : 'ar'] || doc.bookId,
    ...(doc.section[language] ? { section: doc.section[language] } : {}),
    ...(doc.pageNumber ? { page: doc.pageNumber } : {}),
  };
}

function snippet(hit: SearchHit, language: AgentLanguage, limit = 500): string {
  const text = hit.document.text[language] || hit.document.text[language === 'ar' ? 'en' : 'ar'];
  // Search snippets come from the indexed source; clip without paraphrasing.
  return (language === 'ar' ? hit.snippet.ar : hit.snippet.en || hit.snippet.ar).trim().slice(0, limit)
    || text.trim().slice(0, limit);
}

function confidentHits(query: string): SearchHit[] {
  const result = searchLibrary(query, { index: index(), limit: 5, minScore: 4.2 });
  const hasEngineeringAnchor = /\b(?:NDT|RT|UT|PAUT|TOFD|MT|PT|VT|PWHT|ASME|AWS|ISO|API|ASTM|WPS|PQR|weld|welding|inspection|radiograph|ultrasonic|code|standard|defect)\b|(?:فحص|لحام|اشعة|أشعة|موجات|كود|معيار|عيب|عيوب|معالجة حرارية|تآكل)/i.test(query);
  return result.confident && hasEngineeringAnchor ? result.hits : [];
}

function isSocialOrGreeting(message: string): boolean {
  return /^(مرحبا|اهلا|أهلا|السلام عليكم|صباح الخير|مساء الخير|شكرا|شكرًا|hello|hi|hey|thanks|thank you)(?:[!,.؟?\s]|$)/i.test(message.trim());
}

function isTechnicalQuestion(message: string): boolean {
  return /\b(?:NDT|RT|UT|PAUT|TOFD|MT|PT|VT|PWHT|ASME|AWS|ISO|API|ASTM|WPS|PQR|weld|welding|inspection|radiograph|ultrasonic|code|standard|defect|acceptance|technical|engineering|procedure|explain|define|describe)\b|what\s+is|what\s+the\s+difference|why|how\s+(?:does|do|is|to)\b/i.test(message)
    || /(?:اشرح|ما هو|ما الفرق|لماذا|كيف|فحص|لحام|اشعة|أشعة|موجات|كود|معيار|عيب|عيوب|اختراق|سمك|سماكة|معالجة حرارية|تآكل|تشقّق|شرخ|شقوق)/i.test(message);
}

function inferCopilotMode(input: UserCopilotRequest): UserCopilotRequest['mode'] {
  if (input.mode !== 'assistant') return input.mode;
  const text = input.message;
  if (/(?:draft|write|compose|اكتب|صياغة|صيغ).*(?:post|منشور|بوست)|(?:post|منشور|بوست).*(?:draft|write|اكتب|صياغة)/i.test(text)) return 'draft_post';
  if (/(?:improve|polish|enhance|حسن|حسّن|طور|طوّر).*(?:post|منشور|النص)|(?:منشور|النص).*(?:حسن|حسّن|صياغة)/i.test(text)) return 'improve_post';
  if (/(?:summarize|summary|لخص|ملخص).*(?:feed|posts|منشورات|المجتمع)|(?:feed|منشورات|المجتمع).*(?:summarize|لخص|ملخص)/i.test(text)) return 'summarize_feed';
  if (/(?:rfq|quotation|عرض سعر|طلب فحص|طلب عرض)/i.test(text)) return 'rfq_draft';
  if (/(?:choose|select|recommend).*(?:NDT|inspection method|method)|(?:which|what).*(?:NDT|inspection method)|(?:اختار|اختيار|أنسب|افضل|أفضل).*(?:فحص|طريقة)/i.test(text)) return 'ndt_selector';
  if (/(?:open|navigate|take me|افتح|اذهب|انتقل|روح).*(?:community|academy|lab|المجتمع|الأكاديمية|المعمل|المعامل)/i.test(text)) return 'navigate';
  return 'assistant';
}

function followupQuery(input: UserCopilotRequest): string {
  const msg = input.message.trim();
  const shortFollowup = msg.length < 90 && (/^(?:وده|وذلك|ده|دي|دا|هذا|هذه|يعني|ليه|ازاي|كيف ذلك|ماذا عن|طب|طيب)(?:\s|$)/i.test(msg) || /^(?:why|how about|what about|and|it|that|this|which|explain|more)\b/i.test(msg));
  const earlierUser = [...input.history].reverse().find(m => m.role === 'user')?.content;
  return [shortFollowup ? earlierUser : '', input.context?.activeTopic || '', msg].filter(Boolean).join(' ');
}

function citeText(citations: AgentCitation[], language: AgentLanguage): string {
  if (!citations.length) return '';
  return language === 'ar'
    ? `\n\nالمصدر: ${citations.map(c => `${c.title}${c.section ? ` — ${c.section}` : ''}${c.page ? `، صفحة ${c.page}` : ''}`).join('؛ ')}`
    : `\n\nSource: ${citations.map(c => `${c.title}${c.section ? ` — ${c.section}` : ''}${c.page ? `, page ${c.page}` : ''}`).join('; ')}`;
}

function navigationAction(message: string, language: AgentLanguage): UserCopilotResponse['suggestedActions'] {
  const routes: Array<[RegExp, string, string, UserCopilotResponse['suggestedActions'][number]['actionType']]> = [
    [/community|مجتمع|منشور|المجتمع/i, 'community', 'open_community', 'open_community'],
    [/rfq|quotation|عرض سعر|طلب فحص|الشركة/i, 'rfq', 'open_rfq', 'open_rfq'],
    [/simulat|lab|معمل|محاكاة|المحاكاة/i, 'sim_labs_ar', 'open_ar_lab', 'open_ar_lab'],
  ];
  const route = routes.find(([re]) => re.test(message));
  return route ? [{ label: language === 'ar' ? `افتح ${route[1] === 'community' ? 'المجتمع' : route[1] === 'rfq' ? 'طلب عرض السعر' : 'المعامل'}` : `Open ${route[1]}`, actionType: route[3], target: route[1] }] : [];
}

export function answerCopilot(input: UserCopilotRequest): UserCopilotResponse {
  const started = Date.now();
  const ar = input.language === 'ar';
  const query = followupQuery(input);
  const mode = inferCopilotMode(input);
  const citations: AgentCitation[] = [];
  const actions = navigationAction(input.message, input.language);
  let reply: string;
  let draftPost: UserCopilotResponse['draftPost'];
  let kind: UserCopilotResponse['kind'] = 'rules';
  const steps: string[] = [];

  if (isSocialOrGreeting(input.message)) {
    reply = ar
      ? 'أهلًا بك! أنا مساعد INSCO. قل لي ما الذي تريد إنجازه، أو اذكر موضوعًا هندسيًا لنبحث عنه في مكتبة الموقع.'
      : 'Hello! I’m the INSCO assistant. Tell me what you want to do, or name an engineering topic and I’ll search the site library.';
    steps.push(ar ? 'فهمت أنها تحية/رسالة اجتماعية، ولم أختلق معلومة فنية.' : 'Classified this as a greeting/social message; no technical claim was invented.');
  } else if (mode === 'draft_post' || mode === 'improve_post') {
    const title = clean(input.context?.postDraftTitle || input.message).slice(0, 120);
    const body = clean(input.context?.postDraftBody || input.message);
    draftPost = {
      postType: 'discussion',
      ndtMethod: 'GENERAL',
      title,
      body: mode === 'improve_post' ? body : `${body}\n\nما خبرتكم أو توصياتكم في هذا الموضوع؟`,
      tags: ['INSCO', 'NDT'],
    };
    reply = ar
      ? 'جهزت مسودة تحريرية من النص الذي قدمته. لم أضف نتائج أو ادعاءات فنية غير موجودة في مدخلاتك؛ راجعها قبل النشر.'
      : 'I prepared an editorial draft from your text. I did not add technical findings or claims absent from your input; review it before publishing.';
    kind = 'editorial';
    steps.push(ar ? 'استخدمت نصك لصياغة مسودة؛ لم أضف حقائق فنية.' : 'Used your text to create an editorial draft; added no technical facts.');
  } else if (mode === 'summarize_feed') {
    const feed = input.context?.feedPreview ?? [];
    reply = feed.length
      ? (ar ? `ملخص المنشورات الظاهرة (${feed.length}):\n` : `Summary of the visible posts (${feed.length}):\n`) + feed.slice(0, 5).map(p => `• ${clean(p.title)}${p.ndtMethod ? ` (${p.ndtMethod})` : ''}${p.excerpt ? ` — ${clean(p.excerpt).slice(0, 150)}` : ''}`).join('\n')
      : (ar ? 'لا توجد منشورات مرفقة لألخصها. افتح المجتمع أو أرسل نص المنشورات.' : 'No posts were supplied to summarize. Open the community feed or provide the post text.');
    kind = 'site-data';
    steps.push(ar ? 'لخصت فقط المنشورات المرسلة في سياق الصفحة.' : 'Summarized only the posts included in the page context.');
  } else if (mode === 'navigate' && actions.length) {
    reply = ar ? 'أقدر أفتح لك القسم المطلوب من زر الإجراء أدناه.' : 'I can open that section using the action below.';
    kind = 'site-data';
    steps.push(ar ? 'طابقت طلب التنقل مع مسارات INSCO المتاحة.' : 'Matched the navigation request to an available INSCO route.');
  } else if (mode === 'rfq_draft') {
    reply = ar
      ? `لإعداد طلب فحص دقيق، أحتاج: نوع المعدة/اللحام، المادة والسماكة، طريقة الفحص المطلوبة، الكمية/عدد الوصلات، الموقع، الكود أو معيار القبول، والموعد. ما لم تذكره سيبقى غير محدد.\n\nالموضوع الحالي: ${clean(input.message)}`
      : `To prepare an accurate inspection RFQ, I need: item/weld type, material and thickness, requested method, quantity/joint count, location, governing code or acceptance criteria, and target date. Missing details remain unspecified.\n\nCurrent topic: ${clean(input.message)}`;
    kind = 'rules';
    steps.push(ar ? 'استخدمت قائمة متطلبات RFQ، وحددت البيانات الناقصة بدل افتراضها.' : 'Applied an RFQ requirements checklist and left unknown details unspecified.');
  } else if (mode === 'ndt_selector') {
    reply = ar
      ? 'لا أختار طريقة فحص من اسم العيب وحده. أرسل نوع المادة والوصلة، السماكة، شكل/اتجاه العيب المتوقع، إمكانية الوصول، مرحلة الفحص، الكود ومعيار القبول، ومتطلبات التغطية؛ بعدها أبحث في مكتبة الموقع وأعرض الخيارات ومراجعها دون اعتماد القرار بدل المختص.'
      : 'I will not select an inspection method from a defect label alone. Please provide material and joint type, thickness, expected flaw geometry/orientation, access, inspection stage, governing code/acceptance criteria, and coverage requirements. Then I can search the site library and show sourced options—not replace the qualified decision-maker.';
    kind = 'rules';
    steps.push(ar ? 'جمعت المدخلات اللازمة للاختيار بدل تقديم توصية بلا سياق.' : 'Collected the inputs needed for method selection instead of recommending without context.');
  } else {
    const hits = confidentHits(query);
    if (hits.length && isTechnicalQuestion(query)) {
      const top = hits[0];
      citations.push(...hits.slice(0, 1).map(hit => docCitation(hit, input.language)));
      reply = ar
        ? `من مكتبة INSCO: «${snippet(top, input.language)}»${citeText(citations, input.language)}\n\nهذه خلاصة مقتبسة من مادة الأكاديمية وليست اعتمادًا فنيًا. عند تطبيقها، راجع النص الأصلي والكود المعتمد للمشروع.`
        : `From the INSCO library: “${snippet(top, input.language)}”${citeText(citations, input.language)}\n\nThis is an excerpt from academy material, not an approved engineering decision. Check the original source and project-governing code before applying it.`;
      kind = 'library';
      steps.push(ar ? `حللت السؤال والسياق السابق ثم بحثت في ${getCorpus().length} مادة.` : `Analysed the question and prior context, then searched ${getCorpus().length} site materials.`);
      steps.push(ar ? `استخدمت ${hits.length} مقاطع اجتازت حد الثقة الحالي.` : `Used ${hits.length} passages that met the existing confidence threshold.`);
      steps.push(ar ? 'أرفقت المصدر ولم أضف تفسيرًا غير موجود في النص.' : 'Attached the source and added no unsupported interpretation.');
    } else if (isTechnicalQuestion(query)) {
      reply = ar
        ? 'لم أجد في مكتبة الموقع مقطعًا يطابق السؤال بدرجة ثقة كافية، لذلك لن أخمّن. حدّد الطريقة/المعيار أو أرسل مرجعًا، وسأبحث مجددًا.'
        : 'I could not find a sufficiently confident match in the site library, so I will not guess. Specify the method/standard or provide a reference and I can search again.';
      kind = 'decline';
      steps.push(ar ? 'لم يتجاوز أي مقطع حد الثقة؛ امتنعت عن إنشاء إجابة فنية.' : 'No passage met the confidence threshold; declined to invent a technical answer.');
    } else if (mode === 'navigate' && actions.length === 0) {
      reply = ar ? 'لم أحدد القسم المقصود بعد. اذكر مثلًا: المجتمع، طلب عرض سعر، الأكاديمية، أو المعامل.' : 'I’m not sure which section you mean. Try: community, quotation request, academy, or labs.';
      kind = 'rules';
      steps.push(ar ? 'طلبت توضيحًا بدل التخمين في وجهة التنقل.' : 'Asked for clarification rather than guessing a destination.');
    } else {
      const contextHint = input.history.length
        ? (ar ? ' أستطيع متابعة النقاش؛ وضّح النقطة التي تريد تعميقها.' : ' I can continue the thread; tell me which point you want to explore.')
        : '';
      reply = ar
        ? `فهمت طلبك: «${clean(input.message)}».${contextHint} أستطيع البحث في محتوى الموقع عندما تذكر المصطلح أو الموضوع بدقة.`
        : `I understand your request: “${clean(input.message)}”.${contextHint} I can search the site material when you name the term or topic more precisely.`;
      kind = 'rules';
      steps.push(ar ? 'حافظت على سياق النقاش، ولم أقدّم ادعاءً بلا مصدر.' : 'Preserved the conversation context and made no unsourced claim.');
    }
  }

  return {
    reply,
    suggestedActions: actions.slice(0, 3),
    ...(draftPost ? { draftPost } : {}),
    model: null,
    kind,
    citations,
    reasoningSteps: steps,
    elapsedMs: Date.now() - started,
  };
}

export function answerSiteManager(input: SiteManagerRequest): SiteManagerResponse {
  const t = input.telemetry;
  const ar = input.language === 'ar';
  const highRisk = t.urgentRequests > 0 || t.geofenceAlertCount > 0 || t.pendingAccounts > 0;
  const healthStatus: SiteManagerResponse['healthStatus'] =
    t.urgentRequests > 0 || t.geofenceAlertCount > 2 ? 'ACTION_REQUIRED' : highRisk ? 'ATTENTION_NEEDED' : 'OPTIMAL';
  const summary = ar
    ? `ملخص مبني على البيانات المرسلة: ${t.totalRequests} طلبًا إجماليًا، ${t.newRequests} جديدًا، ${t.urgentRequests} عاجلًا؛ ${t.totalCompanies} شركة، ${t.activeTestingCompanies} نشطة؛ ${t.geofenceAlertCount} تنبيه موقع، ${t.pendingAccounts} حسابًا قيد المراجعة؛ ${t.communityPostsCount} منشورًا و${t.communityMembersCount} عضوًا.`
    : `Summary from supplied data: ${t.totalRequests} requests total, ${t.newRequests} new, ${t.urgentRequests} urgent; ${t.totalCompanies} companies, ${t.activeTestingCompanies} active; ${t.geofenceAlertCount} geofence alerts, ${t.pendingAccounts} accounts pending review; ${t.communityPostsCount} posts and ${t.communityMembersCount} members.`;
  const priorityActions: SiteManagerResponse['priorityActions'] = [];
  if (t.urgentRequests) priorityActions.push({ title: ar ? 'فرز الطلبات العاجلة' : 'Triage urgent requests', detail: ar ? `راجع ${t.urgentRequests} طلبًا عاجلًا من لوحة الطلبات.` : `Review ${t.urgentRequests} urgent request(s) in the requests dashboard.`, severity: 'high', actionType: 'open_requests', target: 'requests' });
  if (t.geofenceAlertCount) priorityActions.push({ title: ar ? 'مراجعة تنبيهات الموقع' : 'Review location alerts', detail: ar ? `تحقق من ${t.geofenceAlertCount} تنبيهًا؛ التنبيه وحده لا يثبت مخالفة.` : `Review ${t.geofenceAlertCount} alert(s); an alert alone does not establish misconduct.`, severity: t.geofenceAlertCount > 2 ? 'high' : 'medium', actionType: 'open_timeclock', target: 'timeclock' });
  if (t.pendingAccounts) priorityActions.push({ title: ar ? 'مراجعة الحسابات' : 'Review pending accounts', detail: ar ? `${t.pendingAccounts} حسابًا ينتظر المراجعة وفق سياسة التحقق.` : `${t.pendingAccounts} account(s) await review under the verification policy.`, severity: 'medium', actionType: 'navigate', target: 'accounts' });
  if (!priorityActions.length) priorityActions.push({ title: ar ? 'متابعة المؤشرات' : 'Continue monitoring', detail: ar ? 'لا توجد إشارة حرجة ضمن لقطة البيانات الحالية.' : 'No critical signal appears in the current telemetry snapshot.', severity: 'low', actionType: 'navigate', target: 'overview' });
  const announcementDraft = input.mode === 'draft_announcement'
    ? { title: ar ? 'إعلان من مجتمع INSCO' : 'INSCO Community Announcement', body: clean(input.instruction), ndtMethod: 'GENERAL' }
    : undefined;
  return {
    summary,
    healthStatus,
    priorityActions: priorityActions.slice(0, 6),
    flaggedPostIds: [],
    ...(announcementDraft ? { announcementDraft } : {}),
    model: null,
    kind: 'site-data',
    reasoningSteps: [ar ? 'تحققت من الأعداد كما وردت في لقطة الموقع؛ لم أستنتج بيانات غير مرفقة.' : 'Used the supplied telemetry counts; inferred no missing data.'],
    elapsedMs: 0,
  };
}

export function answerCommunity(input: CommunityAssistRequest): CommunityAssistResponse {
  const ar = input.language === 'ar';
  const body = clean(input.body);
  const lines = body.split(/(?<=[.!?؟])\s+|\n+/).filter(Boolean);
  let reply: string;
  let title: string | undefined;
  let outputBody: string | undefined;
  let tags: string[] | undefined;
  let technicalSnippet: string | undefined;
  let kind: CommunityAssistResponse['kind'] = 'editorial';
  const citations: AgentCitation[] = [];

  if (input.action === 'summarize_post') {
    reply = lines.slice(0, 3).join(' ').slice(0, 500) || body.slice(0, 500);
  } else if (input.action === 'suggest_reply') {
    reply = ar
      ? `شكرًا على طرح الموضوع. هل يمكنك توضيح ${input.ndtMethod !== 'GENERAL' ? `تفاصيل طريقة ${input.ndtMethod}` : 'السياق والمرجع المستخدم'} والظروف ذات الصلة حتى تكون المناقشة أدق؟`
      : `Thanks for raising this. Could you clarify ${input.ndtMethod !== 'GENERAL' ? `the ${input.ndtMethod} method details` : 'the context and reference used'} and relevant conditions so the discussion can be more precise?`;
  } else if (input.action === 'draft_from_topic') {
    title = body.slice(0, 120);
    outputBody = ar
      ? `${body}\n\nما خبراتكم أو المراجع التي توصي بها في هذا الموضوع؟`
      : `${body}\n\nWhat experience or references would you recommend on this topic?`;
    tags = ['INSCO', input.ndtMethod].filter(Boolean);
    reply = ar ? 'مسودة نقاش تحريرية؛ أضف التفاصيل العملية والمصدر قبل النشر.' : 'Editorial discussion draft; add practical details and a source before publishing.';
  } else if (input.action === 'enhance_post') {
    title = input.title || undefined;
    outputBody = body.replace(/\s*\n\s*/g, '\n\n');
    reply = ar ? 'نظمت التنسيق فقط؛ لم أتحقق من صحة الادعاءات الفنية.' : 'I adjusted formatting only; technical claims have not been verified.';
  } else {
    const hits = confidentHits(`${input.ndtMethod} ${input.title || ''} ${body}`);
    if (hits.length) {
      citations.push(docCitation(hits[0], input.language));
      technicalSnippet = snippet(hits[0], input.language);
      reply = ar
        ? `وجدت مادة ذات صلة في مكتبة INSCO، لكنها لا تكفي وحدها لإثبات مطابقة المنشور للكود. راجع المصدر الأصلي ومتطلبات المشروع.${citeText(citations, input.language)}`
        : `I found related INSCO library material, but it is not enough by itself to establish code compliance. Check the original source and project requirements.${citeText(citations, input.language)}`;
      kind = 'library';
    } else {
      reply = ar
        ? 'لا أستطيع تأكيد صحة المنشور أو مطابقته للكود من النص المتاح؛ أرسل اسم الكود ورقم الفقرة وإصدارها ومقتطفًا مرخصًا للمراجعة.'
        : 'I cannot verify the post or its code compliance from the available text; provide the code, clause, edition, and a licensed excerpt for review.';
      kind = 'decline';
    }
  }
  return { reply, ...(title ? { title } : {}), ...(outputBody ? { body: outputBody } : {}), ...(tags ? { tags } : {}), ...(technicalSnippet ? { technicalSnippet } : {}), model: null, kind, citations, elapsedMs: 0 };
}

export function resetAgentBrainForTests(): void {
  corpusIndex = null;
}
