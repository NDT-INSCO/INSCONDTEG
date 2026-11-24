/**
 * The three agents, without a model.
 *
 * Each one used to be "send a prompt to Gemini and parse its JSON". That put the agents'
 * competence outside the repository: when the quota ran out the product stopped thinking.
 * Here the competence is the code — a deterministic reading of the same telemetry, the
 * same library and the same request the model used to receive — so the answer is
 * reproducible, auditable, and works with the network unplugged.
 *
 * What is lost is invention, which is the point: an operations report must not invent a
 * number, and a community post must not invent an inspection result.
 */
import type { SearchHit } from '../search.js';
import { tokenize } from '../search.js';
import type {
  CommunityAssistAction,
  CommunityAssistRequest,
  CommunityAssistResponse,
  CopilotDraftPost,
  SiteManagerMode,
  SiteManagerPriorityAction,
  SiteManagerResponse,
  SiteTelemetrySnapshot,
  UserCopilotAction,
  UserCopilotContext,
  UserCopilotMode,
  UserCopilotResponse,
} from '../agentsContract.js';
import { detectIntent, topicLabel, type NdtMethod } from './intent.js';
import { composeTutorAnswer } from './compose.js';
import { cleanSentence, joinList, pickSentences, quote, sentencesOf, similarity } from './text.js';

const AR = 'ar';
const EN = 'en';

type Lang = 'ar' | 'en';

/* ------------------------------------------------------------------ */
/* 1. Universal user copilot                                           */
/* ------------------------------------------------------------------ */

export interface LocalCopilotInput {
  message: string;
  mode: UserCopilotMode;
  language: Lang;
  context?: UserCopilotContext;
  /** Retrieval for the message, supplied by the caller that owns the library. */
  hits: SearchHit[];
}

export type LocalCopilotAnswer = Pick<UserCopilotResponse, 'reply' | 'suggestedActions' | 'draftPost'>;

function navigate(label: string, target: string): UserCopilotAction {
  return { label, actionType: 'navigate', target };
}

function methodList(methods: NdtMethod[], language: Lang): string {
  return joinList(
    methods.map(method => (language === AR ? method.ar : method.en)),
    language
  );
}

/** Where the readers actually go: real anchors in this site, not invented routes. */
const SECTIONS: Array<{ key: string; ar: string; en: string; target: string; words: string[] }> = [
  { key: 'services', ar: 'الخدمات الفنية', en: 'Technical services', target: '#services', words: ['خدمه', 'خدمات', 'service', 'method', 'طريقه'] },
  { key: 'projects', ar: 'سابقة الأعمال', en: 'Projects', target: '#projects', words: ['مشروع', 'مشاريع', 'project', 'references'] },
  { key: 'rfq', ar: 'طلب عرض سعر', en: 'Request a quote', target: '#rfq', words: ['سعر', 'عرض', 'quote', 'rfq', 'تسعير'] },
  { key: 'community', ar: 'مجتمع إنسكو', en: 'INSCO community', target: '#community', words: ['مجتمع', 'منشور', 'community', 'post'] },
  { key: 'academy', ar: 'الأكاديمية', en: 'Academy', target: '#academy', words: ['اكاديميه', 'دوره', 'كورس', 'academy', 'course', 'training'] },
  { key: 'certifications', ar: 'الشهادات', en: 'Certifications', target: '#certifications', words: ['شهاده', 'شهادات', 'iso', 'certificate', 'certification'] },
  { key: 'vault', ar: 'ملف التأهيل', en: 'Qualification dossier', target: '#vault', words: ['ملف', 'تاهيل', 'dossier', 'vault', 'profile'] },
];

function draftPost(input: LocalCopilotInput, methods: NdtMethod[]): CopilotDraftPost {
  const { message, language } = input;
  const intent = detectIntent(message);
  const method = methods[0]?.code ?? (input.context?.feedPreview?.[0]?.ndtMethod || 'GENERAL');
  const topic = topicLabel(message, methods, language);
  const excerpt = input.hits.length
    ? pickSentences(
        [{ id: input.hits[0].document.id, text: input.hits[0].snippet[language] || input.hits[0].snippet.ar, score: input.hits[0].score }],
        { terms: tokenize(message), limit: 1 }
      )[0]
    : undefined;

  const postType: CopilotDraftPost['postType'] = /(تجربه|حاله|case|field experience|result)/i.test(message)
    ? 'technical_case'
    : intent.comparing
      ? 'discussion'
      : 'technical_case';

  if (language === AR) {
    const title = `${topic}: ملاحظة فنية من الميدان`;
    const body = [
      `نتيجة عمل ميداني في ${topic}:`,
      '',
      excerpt ? `${quote(excerpt.sentence, 280)} (المصدر: مكتبة إنسكو — ${excerpt.sourceId})` : message,
      '',
      'السؤال للمجتمع: مَن واجه حالة مشابهة، وأي طريقة تحقّق استخدمتم للتحقق من النتيجة؟',
      '',
      'ملاحظة: المسودة صياغة آلية من نصّك ومن مقتطف المكتبة — راجع الأرقام والصور قبل النشر.',
    ].join('\n');
    return { postType, ndtMethod: method, title, body, tags: ['NDT', method, 'INSCO', 'فحص', 'تجربة ميدانية'] };
  }

  const title = `${topic}: a field note`;
  const body = [
    `Field result on ${topic}:`,
    '',
    excerpt ? `${quote(excerpt.sentence, 280)} (Source: INSCO library — ${excerpt.sourceId})` : message,
    '',
    'Question for the community: who has met a similar case, and which verification method did you use?',
    '',
    'Note: this draft was composed mechanically from your text and a library excerpt — check the figures and photos before publishing.',
  ].join('\n');
  return { postType, ndtMethod: method, title, body, tags: ['NDT', method, 'INSCO', 'inspection', 'field note'] };
}

function summariseFeed(input: LocalCopilotInput): string {
  const posts = input.context?.feedPreview ?? [];
  if (posts.length === 0) {
    return input.language === AR
      ? 'لا توجد منشورات في المعاينة الحالية لألخصها. افتح المجتمع أولاً ثم أعد الطلب.'
      : 'There are no posts in the current preview to summarise. Open the community and ask again.';
  }
  const methods = [...new Set(posts.map(post => post.ndtMethod).filter(Boolean))];
  const lines = posts.map(post => `- ${post.title}${post.ndtMethod ? ` (${post.ndtMethod})` : ''}`);
  return input.language === AR
    ? [`${posts.length} منشورات في المعاينة، وطرقها: ${joinList(methods, AR) || 'غير محددة'}.`, '', ...lines].join('\n')
    : [`${posts.length} posts in the preview, methods: ${joinList(methods, EN) || 'unspecified'}.`, '', ...lines].join('\n');
}

/** The method-selection table: physical access decides more than preference. */
const SELECTION_RULES: Array<{ when: string[]; methods: string[]; whyAr: string; whyEn: string }> = [
  {
    when: ['سطح', 'سطحيه', 'surface', 'surface breaking', 'paint'],
    methods: ['PT', 'MT'],
    whyAr: 'العيوب المفتوحة على السطح يكشفها PT، والمغناطيسية MT للقطع الحديدية.',
    whyEn: 'Open surface defects are found by PT; MT covers ferromagnetic parts.',
  },
  {
    when: ['داخلي', 'حجمي', 'internal', 'volumetric', 'body', 'سماكه', 'thickness'],
    methods: ['UT', 'RT'],
    whyAr: 'العيوب الداخلية تحتاج حجماً صوتياً (UT) أو تصويراً إشعاعياً (RT) حسب السماكة والتعاقد.',
    whyEn: 'Internal defects need ultrasonic (UT) or radiographic (RT) examination depending on thickness and contract.',
  },
  {
    when: ['لحام', 'وصلات', 'weld', 'seam', 'haz'],
    methods: ['PAUT', 'TOFD'],
    whyAr: 'لحامات الجدار السميك تُقاس بـPAUT، وتقدير ارتفاع العيب أدق بـTOFD.',
    whyEn: 'Thick-wall welds are covered by PAUT; TOFD gives the most accurate flaw height.',
  },
  {
    when: ['معالجه', 'حراريه', 'pwht', 'stress relief', 'hardness'],
    methods: ['PWHT', 'PMI'],
    whyAr: 'التحقق من المعالجة الحرارية يحتاج توثيق الدورة، وتأكيد المادة يحتاج PMI.',
    whyEn: 'Heat-treatment verification needs the cycle record; material confirmation needs PMI.',
  },
];

function recommendMethods(input: LocalCopilotInput, methods: NdtMethod[]): string {
  const question = input.message.toLowerCase();
  const rule = SELECTION_RULES.find(entry => entry.when.some(word => question.includes(word)));
  const suggestions = rule ? rule.methods : methods.map(method => method.code);
  const why = rule
    ? input.language === AR
      ? rule.whyAr
      : rule.whyEn
    : input.language === AR
      ? 'حدد مكان العيب (سطح/داخلي) والسماكة والمادة، وسأحدد الطريقة من جدول الاختيار.'
      : 'Tell me where the defect is (surface/internal), the thickness and the material, and I will pick from the selection table.';

  const composed = composeTutorAnswer({
    question: input.message,
    hits: input.hits,
    language: input.language,
    mode: 'explain',
  });

  const head =
    input.language === AR
      ? `المرشح من جدول الاختيار: ${joinList(suggestions, AR)}.`
      : `Candidates from the selection table: ${joinList(suggestions, EN)}.`;
  return [head, why, composed ? '' : '', composed?.text ?? ''].filter(Boolean).join('\n\n');
}

export function draftCopilotAnswer(input: LocalCopilotInput): LocalCopilotAnswer {
  const { message, language, mode } = input;
  const intent = detectIntent(message);
  const methods = intent.methods;

  // The mode is chosen by the interface, so it wins over anything inferred from the text:
  // "summarise the posts" mentions posts without asking for one. The intent only decides
  // when the reader is in the free-form assistant.
  const explicitMode = mode !== 'assistant';
  const wantsPost =
    mode === 'draft_post' || mode === 'improve_post' || (!explicitMode && (intent.intent === 'post' || intent.posting));

  const actions: UserCopilotAction[] = [];

  if (intent.intent === 'greeting' && !wantsPost) {
    const reply =
      language === AR
        ? 'أهلاً بك في منصة إنسكو. أنا المحرّك المحلي للمنصة: أجيب من مكتبة إنسكو وملفات الشركة دون أي خدمة خارجية.\nاسألني عن طريقة فحص، أو اطلب صياغة منشور، أو اطلب مسودة عرض سعر.'
        : 'Welcome to the INSCO platform. I am the platform’s local engine: I answer from the INSCO library and company files with no external service.\nAsk about an inspection method, request a post draft, or ask for a quote draft.';
    actions.push(navigate(language === AR ? 'الخدمات الفنية' : 'Technical services', '#services'));
    actions.push(navigate(language === AR ? 'الأكاديمية' : 'Academy', '#academy'));
    return { reply, suggestedActions: actions };
  }

  if (wantsPost) {
    const draftPost = draftPostFrom(input, methods);
    const reply =
      language === AR
        ? `جهّزت مسودة منشور (${draftPost.ndtMethod}) من نصّك ومن مقتطف المكتبة. راجع الأرقام قبل النشر، ثم اضغط «تطبيق المسودة».`
        : `I prepared a post draft (${draftPost.ndtMethod}) from your text and a library excerpt. Check the figures, then press “apply draft”.`;
    actions.push({ label: language === AR ? 'تطبيق المسودة على المجتمع' : 'Apply draft to community', actionType: 'apply_post_draft' });
    actions.push({ label: language === AR ? 'فتح المجتمع' : 'Open community', actionType: 'open_community', target: '#community' });
    return { reply, suggestedActions: actions, draftPost };
  }

  if (mode === 'summarize_feed' || intent.intent === 'summarize') {
    if (mode === 'summarize_feed') {
      return {
        reply: summariseFeed(input),
        suggestedActions: [{ label: language === AR ? 'فتح المجتمع' : 'Open community', actionType: 'open_community', target: '#community' }],
      };
    }
    const composed = composeTutorAnswer({ question: message, hits: input.hits, language, mode: 'explain' });
    return {
      reply: composed?.text ?? noMatch(message, language, input.hits.length),
      suggestedActions: [navigate(language === AR ? 'البحث في المكتبة' : 'Search the library', '#services')],
    };
  }

  if (mode === 'rfq_draft' || intent.intent === 'rfq') {
    const checklist =
      language === AR
        ? [
            'مسودة طلب عرض سعر — العناصر التي يحتاجها الفريق الفني:',
            `- الطريقة المطلوبة: ${methods.length ? methodList(methods, AR) : 'تُحدد مع نطاق العمل'}`,
            '- نطاق العمل: عدد الوصلات/القطع، المقاسات، المادة، السماكة.',
            '- المرجع: الكود أو المواصفة أو إجراء العميل.',
            '- الموقع والتوقيت: مكان العمل، تاريخ البدء، مدة التواجد.',
            '- التسليم: تقارير، شهادات معايرة، تأهيل المفتشين، لغة التقرير.',
            '',
            'املأ هذه العناصر في نموذج طلب العرض ليصل الطلب كاملاً للفريق.',
          ].join('\n')
        : [
            'Quote request draft — what the technical team needs:',
            `- Required method: ${methods.length ? methodList(methods, EN) : 'decided with the scope'}`,
            '- Scope: number of welds/parts, dimensions, material, thickness.',
            '- Reference: the code, standard or client procedure.',
            '- Site and timing: location, start date, duration.',
            '- Deliverables: reports, calibration certificates, inspector qualifications, report language.',
            '',
            'Fill these into the quote form so the request reaches the team complete.',
          ].join('\n');
    return {
      reply: checklist,
      suggestedActions: [{ label: language === AR ? 'فتح طلب عرض سعر' : 'Open the quote form', actionType: 'open_rfq', target: '#rfq' }],
    };
  }

  if (mode === 'navigate' || intent.intent === 'navigate') {
    const normalised = message.toLowerCase();
    const matches = SECTIONS.filter(section => section.words.some(word => normalised.includes(word)));
    const chosen = (matches.length > 0 ? matches : SECTIONS.slice(0, 3)).slice(0, 4);
    const reply =
      language === AR
        ? ['الأقسام المتاحة:', ...chosen.map(section => `- ${section.ar} (${section.target})`)].join('\n')
        : ['Available sections:', ...chosen.map(section => `- ${section.en} (${section.target})`)].join('\n');
    return {
      reply,
      suggestedActions: chosen.map(section => navigate(language === AR ? section.ar : section.en, section.target)),
    };
  }

  if (mode === 'ndt_selector' || intent.intent === 'selector') {
    return {
      reply: recommendMethods(input, methods),
      suggestedActions: [
        { label: language === AR ? 'طلب عرض سعر' : 'Request a quote', actionType: 'open_rfq', target: '#rfq' },
        navigate(language === AR ? 'الخدمات الفنية' : 'Technical services', '#services'),
      ],
    };
  }

  // The default path: a library-grounded answer, with the two actions a reader needs next.
  const composed = composeTutorAnswer({ question: message, hits: input.hits, language, mode: 'explain' });
  if (!composed) {
    return {
      reply: noMatch(message, language, input.hits.length),
      suggestedActions: [
        navigate(language === AR ? 'الخدمات الفنية' : 'Technical services', '#services'),
        { label: language === AR ? 'فتح المجتمع' : 'Open community', actionType: 'open_community', target: '#community' },
      ],
    };
  }

  return {
    reply: composed.text,
    suggestedActions: [
      { label: language === AR ? 'طلب عرض سعر لهذا العمل' : 'Request a quote for this work', actionType: 'open_rfq', target: '#rfq' },
      navigate(language === AR ? 'الخدمات الفنية' : 'Technical services', '#services'),
    ],
  };
}

function noMatch(message: string, language: Lang, indexed: number): string {
  const terms = tokenize(message).slice(0, 4).join(language === AR ? '، ' : ', ');
  if (language === AR) {
    return [
      `لم أجد في مكتبة إنسكو (${indexed} مقطعاً) ما يجيب عن هذا السؤال مباشرة.`,
      terms ? `الكلمات التي بحثت بها: ${terms}.` : '',
      'أعد الصياغة بمصطلح فني (مثل UT أو PAUT أو PWHT) أو اسأل الفريق الفني مباشرة.',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `I found nothing in the INSCO library (${indexed} passages) that answers this directly.`,
    terms ? `Terms I searched: ${terms}.` : '',
    'Rephrase with a technical term (UT, PAUT, PWHT…) or ask the technical team directly.',
  ]
    .filter(Boolean)
    .join('\n');
}

function draftPostFrom(input: LocalCopilotInput, methods: NdtMethod[]): CopilotDraftPost {
  const base = draftPost(input, methods);
  const draftBody = input.context?.postDraftBody;
  if (!draftBody || input.mode !== 'improve_post') return base;
  // "Improve" must improve the reader's own draft, not replace it with ours.
  const improved = sentencesOf(draftBody)
    .map((sentence, index) => (index === 0 ? `${cleanSentence(sentence)} ${input.language === AR ? '' : ''}`.trim() : sentence))
    .join(input.language === AR ? '\n' : ' ');
  return {
    ...base,
    title: input.context?.postDraftTitle?.trim() || base.title,
    body: `${improved}\n\n${input.language === AR ? 'راجعها قبل النشر: الأرقام والمصادر والصور.' : 'Review before publishing: figures, sources and photos.'}`,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Community assist                                                 */
/* ------------------------------------------------------------------ */

export interface LocalCommunityInput extends CommunityAssistRequest {
  hits: SearchHit[];
}

export type LocalCommunityAnswer = Pick<
  CommunityAssistResponse,
  'reply' | 'title' | 'body' | 'tags' | 'technicalSnippet'
>;

function excerpt(hits: SearchHit[], language: Lang, limit = 1): string | undefined {
  if (hits.length === 0) return undefined;
  const picks = pickSentences(
    hits.map(hit => ({
      id: hit.document.id,
      text: hit.document.text[language] || hit.document.text.ar,
      score: hit.score,
    })),
    { limit }
  );
  if (picks.length === 0) return undefined;
  return picks.map(pick => `${quote(pick.sentence, 240)} [${pick.sourceId}]`).join('\n');
}

export function draftCommunityAnswer(input: LocalCommunityInput): LocalCommunityAnswer {
  const { action, language, ndtMethod, body } = input;
  const method = ndtMethod && ndtMethod !== 'GENERAL' ? ndtMethod : 'NDT';
  const snippet = excerpt(input.hits, language);
  const actionName = action as CommunityAssistAction;

  if (actionName === 'summarize_post') {
    const sentences = sentencesOf(body);
    const ranked = pickSentences([{ id: 'draft', text: body, score: 50 }], {
      terms: tokenize(body),
      limit: 3,
      allowQuestions: true,
    });
    const summary = ranked.length ? ranked.map(pick => `- ${quote(pick.sentence, 220)}`) : sentences.slice(0, 3).map(s => `- ${quote(s, 220)}`);
    const reply =
      language === AR
        ? ['ملخص المنشور (مقتطفات من نصّك، بلا إضافات):', ...summary].join('\n')
        : ['Post summary (extracts from your text, nothing added):', ...summary].join('\n');
    return { reply };
  }

  if (actionName === 'suggest_reply') {
    const replyText = snippet
      ? language === AR
        ? `رد مقترح من مادة المكتبة:\n${snippet}\n\nولو عندك صورة أو تقرير للحالة، ارفعه ليصبح الرد أدق.`
        : `Suggested reply from the library material:\n${snippet}\n\nIf you have a photo or report for the case, attach it so the reply can be more specific.`
      : language === AR
        ? 'رد مقترح: اسأل عن المادة والسماكة وطريقة الفحص المستخدمة والنتيجة المسجلة، فهذه الأربعة تحدد إن كان الوصف كافياً لمناقشة فنية.'
        : 'Suggested reply: ask for the material, thickness, the inspection method used and the recorded result — those four decide whether the description is enough for a technical discussion.';
    return { reply: replyText };
  }

  if (actionName === 'code_check') {
    const clause = input.hits.length
      ? excerpt(
          input.hits.filter(hit => /(asme|astm|iso|api|clause|acceptance|بند|كود|معيار)/i.test(hit.document.text[language] || '')),
          language
        )
      : undefined;
    const reply =
      language === AR
        ? clause
          ? `ما ورد في المادة عن المرجع:\n${clause}\n\nهذا مقتطف تعليمي، وليس قرار قبول. القبول النهائي من الإجراء المعتمد والمفتش المؤهل.`
          : 'لا تذكر مادة المكتبة بنداً أو نسبة قبول لهذا الموضوع، ولا يجوز اختراعه. أضف المرجع المطلوب (ASME V / ISO 9712 / إجراء العميل) لمراجعته.'
        : clause
          ? `What the material states about the reference:\n${clause}\n\nThis is a study extract, not an acceptance decision. Final acceptance comes from the approved procedure and a qualified inspector.`
          : 'The library material states no clause or acceptance value for this topic, and one must not be invented. Add the required reference (ASME V / ISO 9712 / client procedure) for review.';
    return { reply, ...(clause ? { technicalSnippet: clause } : {}) };
  }

  // enhance_post / draft_from_topic
  const title =
    language === AR
      ? `${method}: ${input.title?.trim() || 'ملاحظة فنية للمناقشة'}`
      : `${method}: ${input.title?.trim() || 'a technical note for discussion'}`;
  const closing =
    language === AR
      ? 'سؤال للمجتمع: أي طريقة تحقّق استخدمتم في حالة مشابهة، وما النتيجة المسجلة؟'
      : 'Question for the community: which verification method did you use in a similar case, and what was the recorded result?';
  const note =
    language === AR
      ? 'الصياغة آلية: النصّ نصّك، والمقتطف من مكتبة إنسكو، ولم نضف أي رقم أو نتيجة.'
      : 'Mechanically composed: the text is yours, the excerpt is from the INSCO library, and no figure or result was added.';
  const bodyOut = [body.trim(), snippet ? `\n${snippet}` : '', '', closing, '', note].filter(Boolean).join('\n');
  const reply =
    language === AR
      ? `جهّزت نسخة منشورة من نصّك (${method}) بمقتطف من المكتبة وسؤال للمجتمع. لم يُضف أي رقم أو نتيجة فحص.`
      : `I prepared a publishable version of your text (${method}) with a library excerpt and a question for the community. No figure or inspection result was added.`;
  return {
    reply,
    title,
    body: bodyOut,
    tags: ['NDT', method, 'INSCO', language === AR ? 'مناقشة' : 'discussion'],
    ...(snippet ? { technicalSnippet: snippet } : {}),
  };
}

/* ------------------------------------------------------------------ */
/* 3. Site manager                                                     */
/* ------------------------------------------------------------------ */

export interface LocalSiteManagerInput {
  instruction: string;
  language: Lang;
  mode: SiteManagerMode;
  telemetry: SiteTelemetrySnapshot;
}

/**
 * The audit is arithmetic over the snapshot, not prose about it.
 *
 * Every sentence below is traceable to a number in the input, which is the rule the old
 * system prompt asked the model to follow and could not enforce.
 */
export function draftSiteManagerAnswer(input: LocalSiteManagerInput): Omit<SiteManagerResponse, 'model' | 'elapsedMs'> {
  const { telemetry: t, language, mode } = input;
  const ar = language === AR;
  const actions: SiteManagerPriorityAction[] = [];
  const flaggedPostIds = (t.recentPosts ?? [])
    .filter(post => Boolean(post.aiModerationStatus) && post.aiModerationStatus !== 'approved')
    .map(post => post.id)
    .slice(0, 10);

  if (t.urgentRequests > 0) {
    actions.push({
      title: ar ? `طلبات عاجلة: ${t.urgentRequests}` : `Urgent requests: ${t.urgentRequests}`,
      detail: ar
        ? `${t.urgentRequests} من ${t.totalRequests} طلباً مصنّف عاجلاً ويحتاج فرزاً فورياً.`
        : `${t.urgentRequests} of ${t.totalRequests} requests are marked urgent and need immediate triage.`,
      severity: 'high',
      actionType: 'open_requests',
      target: '#rfq',
    });
  }

  if (t.geofenceAlertCount > 0) {
    const first = t.recentGeofenceAlerts?.[0];
    actions.push({
      title: ar ? `تنبيهات جيوفينس: ${t.geofenceAlertCount}` : `Geofence alerts: ${t.geofenceAlertCount}`,
      detail: first
        ? ar
          ? `${first.employeeName} (${first.companyCode}) سجّل حضوراً على ${Math.round(first.distanceMeters)}م من الموقع، ونصف القطر ${Math.round(first.radiusMeters)}م.`
          : `${first.employeeName} (${first.companyCode}) clocked in ${Math.round(first.distanceMeters)}m from site, radius ${Math.round(first.radiusMeters)}m.`
        : ar
          ? 'تسجيلات خارج النطاق الجغرافي تحتاج مراجعة قبل اعتماد ساعات العمل.'
          : 'Out-of-range clock-ins need review before hours are approved.',
      severity: 'high',
      actionType: 'open_timeclock',
      target: '#timeclock',
    });
  }

  if (t.pendingAccounts > 0) {
    actions.push({
      title: ar ? `حسابات معلّقة: ${t.pendingAccounts}` : `Pending accounts: ${t.pendingAccounts}`,
      detail: ar
        ? `${t.pendingAccounts} حساباً في انتظار التحقق قبل منح صلاحية بوابة العملاء.`
        : `${t.pendingAccounts} accounts await verification before client-portal access is granted.`,
      severity: 'medium',
      actionType: 'navigate',
      target: '/admin',
    });
  }

  if (t.newRequests > 0) {
    actions.push({
      title: ar ? `طلبات جديدة: ${t.newRequests}` : `New requests: ${t.newRequests}`,
      detail: ar
        ? `${t.newRequests} طلباً جديداً لم يُفرز بعد من إجمالي ${t.totalRequests}.`
        : `${t.newRequests} new requests are untriaged out of ${t.totalRequests}.`,
      severity: t.urgentRequests > 0 ? 'medium' : 'high',
      actionType: 'open_requests',
      target: '#rfq',
    });
  }

  if (flaggedPostIds.length > 0) {
    actions.push({
      title: ar ? `منشورات تحتاج مراجعة: ${flaggedPostIds.length}` : `Posts needing review: ${flaggedPostIds.length}`,
      detail: ar
        ? `المنشورات ${flaggedPostIds.join('، ')} حالتها ليست «معتمد» في سجل الإشراف.`
        : `Posts ${flaggedPostIds.join(', ')} are not marked approved in the moderation record.`,
      severity: 'medium',
      actionType: 'flag_post',
      target: '#community',
    });
  }

  const healthStatus: SiteManagerResponse['healthStatus'] =
    t.urgentRequests > 0 || t.geofenceAlertCount > 0
      ? 'ACTION_REQUIRED'
      : t.newRequests > 0 || t.pendingAccounts > 0 || flaggedPostIds.length > 0
        ? 'ATTENTION_NEEDED'
        : 'OPTIMAL';

  const summary = ar
    ? [
        `تدقيق تشغيلي مباشر على الأرقام الحالية: ${t.totalRequests} طلباً (${t.newRequests} جديد، ${t.urgentRequests} عاجل)، ` +
          `${t.totalCompanies} شركة (${t.activeTestingCompanies} نشطة في الاختبار)، ${t.pendingAccounts} حساباً معلّقاً، ` +
          `${t.geofenceAlertCount} تنبيه جيوفينس، والمجتمع ${t.communityPostsCount} منشوراً و${t.communityMembersCount} عضواً، ${t.opportunitiesCount} فرصة.`,
        healthStatus === 'ACTION_REQUIRED'
          ? 'الحالة: مطلوب إجراء — هناك طلبات عاجلة أو تسجيلات خارج النطاق.'
          : healthStatus === 'ATTENTION_NEEDED'
            ? 'الحالة: يحتاج انتباهاً — لا إجراء عاجل، لكن هناك عناصر معلّقة.'
            : 'الحالة: مستقرة — لا طلبات عاجلة ولا تنبيهات مفتوحة.',
      ].join('\n')
    : [
        `Direct operations audit of the current numbers: ${t.totalRequests} requests (${t.newRequests} new, ${t.urgentRequests} urgent), ` +
          `${t.totalCompanies} companies (${t.activeTestingCompanies} active in testing), ${t.pendingAccounts} pending accounts, ` +
          `${t.geofenceAlertCount} geofence alerts, community ${t.communityPostsCount} posts and ${t.communityMembersCount} members, ${t.opportunitiesCount} opportunities.`,
        healthStatus === 'ACTION_REQUIRED'
          ? 'Status: action required — there are urgent requests or out-of-range clock-ins.'
          : healthStatus === 'ATTENTION_NEEDED'
            ? 'Status: attention needed — nothing urgent, but items are pending.'
            : 'Status: stable — no urgent requests and no open alerts.',
      ].join('\n');

  const announcementDraft: SiteManagerResponse['announcementDraft'] =
    mode === 'draft_announcement' || healthStatus === 'ACTION_REQUIRED'
      ? {
          title: ar ? `تحديث تشغيلي — ${new Date().toISOString().slice(0, 10)}` : `Operations update — ${new Date().toISOString().slice(0, 10)}`,
          body: ar
            ? `فريق إنسكو: ${t.newRequests} طلب جديد و${t.urgentRequests} طلب عاجل قيد الفرز. يُرجى من المفتشين تحديث سجلات المعايرة قبل بدء الأعمال، ومن قادة الفرق اعتماد ساعات العمل داخل النطاق الجغرافي فقط.`
            : `INSCO team: ${t.newRequests} new requests and ${t.urgentRequests} urgent ones are being triaged. Inspectors, update calibration records before starting; team leads, approve only within-geofence hours.`,
          ndtMethod: 'GENERAL',
        }
      : undefined;

  // The mode decides the order of the same facts, never their content.
  if (mode === 'geofence_brief') {
    actions.sort((left, right) => Number(right.actionType === 'open_timeclock') - Number(left.actionType === 'open_timeclock'));
  } else if (mode === 'moderate_community') {
    actions.sort((left, right) => Number(right.actionType === 'flag_post') - Number(left.actionType === 'flag_post'));
  }

  return {
    summary,
    healthStatus,
    priorityActions: actions.slice(0, 6),
    flaggedPostIds,
    ...(announcementDraft ? { announcementDraft } : {}),
  };
}

export { similarity };
