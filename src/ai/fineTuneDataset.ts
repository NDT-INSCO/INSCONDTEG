import { createHash } from 'node:crypto';
import { ACADEMY_SOURCES, KNOWLEDGE_LESSONS } from '../data/academyKnowledge';

export interface VertexTuneContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface VertexTuneExample {
  systemInstruction: { role: 'system'; parts: Array<{ text: string }> };
  contents: [VertexTuneContent, VertexTuneContent];
}

export interface FineTuneRecord {
  lessonId: string;
  language: 'ar' | 'en';
  task: 'quiz' | 'principle' | 'application' | 'limitations';
  sources: string[];
  example: VertexTuneExample;
}

const INSTRUCTIONS = {
  ar: [
    'أجب بلغة السؤال، مباشرة وبوضوح، وبالاعتماد على الملاحظات التعليمية المرفقة فقط.',
    'هذه ملاحظات تعليمية من INSCO وليست نص كود أو إجراء مشروع معتمداً. لا تستنتج منها حدود قبول حالية أو أرقام بنود أو متطلبات إلزامية غير مذكورة.',
    'إذا سأل المستخدم عن قبول/رفض أو قيمة كودية أو إصدار نافذ، اطلب الكود والإصدار والإجراء الحاكم أو تحقّق من مصدر رسمي قبل الجزم. لا تختلق مصادر أو روابط أو أرقاماً.',
    'ميّز بين المبدأ التعليمي والقرار الهندسي للموقع، ولا تعرض التفكير الداخلي الخاص. استخدم إجابة موجزة منظمة.',
  ].join('\n'),
  en: [
    'Answer in the language of the question, directly and clearly, using only the supplied educational notes.',
    'These are INSCO study notes, not an approved code text or project procedure. Do not infer current acceptance limits, clause numbers, or mandatory requirements that are not explicitly supplied.',
    'For accept/reject decisions, code values, or effective editions, ask for the governing code, edition, and procedure or verify an official source before asserting. Never invent sources, URLs, or numbers.',
    'Separate educational principles from site engineering decisions, do not expose private reasoning, and keep the answer concise and structured.',
  ].join('\n'),
} as const;

const n = (lesson: (typeof KNOWLEDGE_LESSONS)[number], lang: 'ar' | 'en') => ({
  title: lesson.title[lang],
  summary: lesson.summary[lang],
  principle: lesson.sections[0]?.body[lang] ?? '',
  practice: lesson.sections[1]?.body[lang] ?? '',
  limitations: lesson.sections[2]?.body[lang] ?? '',
  question: lesson.question[lang],
  options: lesson.options.map(option => option[lang]),
  answer: lesson.answer,
  explanation: lesson.explanation[lang],
  example: lesson.example[lang],
});

function sourceLabel(ids: string[]): string {
  const sources = new Map(ACADEMY_SOURCES.map(source => [source.id, source]));
  const labels = ids.map(id => {
    const source = sources.get(id);
    if (!source) throw new Error(`Unknown academy source "${id}" in AI training lesson.`);
    return `${source.publisher}: ${source.title} (${id})`;
  });
  return labels.join('; ');
}

function lessonBucket(id: string): number {
  const digest = createHash('sha256').update(id).digest();
  return digest.readUInt32BE(0) % 5;
}

function makeRecord(
  lesson: (typeof KNOWLEDGE_LESSONS)[number],
  language: 'ar' | 'en',
  task: FineTuneRecord['task'],
  reference: string,
  prompt: string,
  target: string
): FineTuneRecord {
  const details = n(lesson, language);
  const context = [
    `INSCO lesson: ${details.title} [${lesson.id}]`,
    `Study-note source metadata: ${sourceLabel(lesson.sources)}`,
    reference,
  ].join('\n');
  const userText = `${language === 'ar' ? 'ملاحظات مرجعية تعليمية:' : 'Educational reference notes:'}\n${context}\n\n${prompt}`;
  return {
    lessonId: lesson.id,
    language,
    task,
    sources: [...lesson.sources],
    example: {
      systemInstruction: { role: 'system', parts: [{ text: INSTRUCTIONS[language] }] },
      contents: [
        { role: 'user', parts: [{ text: userText }] },
        { role: 'model', parts: [{ text: target }] },
      ],
    },
  };
}

function recordsForLesson(lesson: (typeof KNOWLEDGE_LESSONS)[number], language: 'ar' | 'en'): FineTuneRecord[] {
  const d = n(lesson, language);
  const isAr = language === 'ar';
  const correctAnswer = d.options[d.answer];
  if (!correctAnswer || !d.explanation || !d.principle || !d.practice || !d.limitations) return [];
  const label = (name: string, value: string) => `${name}: ${value}`;
  const quizReference = [
    label(isAr ? 'الملخص' : 'Summary', d.summary),
    label(isAr ? 'المبدأ' : 'Principle', d.principle),
    label(isAr ? 'التطبيق' : 'Application', d.practice),
    label(isAr ? 'القيود' : 'Limitations', d.limitations),
    label(isAr ? 'مثال' : 'Example', d.example),
    label(isAr ? 'سؤال' : 'Question', d.question),
    label(isAr ? 'الاختيارات' : 'Options', d.options.map((option, index) => `${index + 1}. ${option}`).join(' | ')),
  ].join('\\n');
  return [
    makeRecord(
      lesson, language, 'quiz', quizReference,
      isAr
        ? `أجب عن سؤال التحقق، واختر إجابة واحدة ثم فسّرها بجملة. السؤال: ${d.question}`
        : `Answer the knowledge check with one choice and a brief explanation. Question: ${d.question}`,
      isAr
        ? `الإجابة: ${correctAnswer}.\\nالتفسير: ${d.explanation}`
        : `Answer: ${correctAnswer}.\\nExplanation: ${d.explanation}`
    ),
    makeRecord(
      lesson, language, 'principle',
      [label(isAr ? 'الملخص' : 'Summary', d.summary), label(isAr ? 'التطبيق' : 'Application', d.practice), label(isAr ? 'القيود' : 'Limitations', d.limitations)].join('\\n'),
      isAr ? `اشرح المبدأ الأساسي في درس «${d.title}» باختصار.` : `Briefly explain the core principle in the lesson “${d.title}”.`,
      d.principle
    ),
    makeRecord(
      lesson, language, 'application',
      [label(isAr ? 'الملخص' : 'Summary', d.summary), label(isAr ? 'المبدأ' : 'Principle', d.principle), label(isAr ? 'القيود' : 'Limitations', d.limitations)].join('\\n'),
      isAr ? `ما خطوات التطبيق العملي التعليمية في درس «${d.title}»؟` : `What educational application steps does the lesson “${d.title}” describe?`,
      d.practice
    ),
    makeRecord(
      lesson, language, 'limitations',
      [label(isAr ? 'الملخص' : 'Summary', d.summary), label(isAr ? 'المبدأ' : 'Principle', d.principle), label(isAr ? 'التطبيق' : 'Application', d.practice)].join('\\n'),
      isAr ? `ما أهم القيود أو الأخطاء الشائعة المذكورة في درس «${d.title}»؟` : `What key limitations or common mistakes does the lesson “${d.title}” identify?`,
      d.limitations
    ),
  ];
}

/**
 * Builds context-conditioned SFT examples only from authored bilingual Academy lessons.
 * Train/validation splitting is by lesson ID so translated and related examples never leak
 * across the split. No API, cloud upload, paid job, or credentials are used here.
 */
export function buildFineTuneDataset(): { train: FineTuneRecord[]; validation: FineTuneRecord[]; skipped: string[] } {
  const train: FineTuneRecord[] = [];
  const validation: FineTuneRecord[] = [];
  const skipped: string[] = [];

  for (const lesson of KNOWLEDGE_LESSONS) {
    if (!lesson.sources.length || lesson.sources.some(id => !ACADEMY_SOURCES.some(source => source.id === id))) {
      throw new Error(`Lesson "${lesson.id}" has missing or unknown source metadata.`);
    }
    const generated = (['ar', 'en'] as const).flatMap(language => recordsForLesson(lesson, language));
    if (generated.length !== 8) {
      skipped.push(lesson.id);
      continue;
    }
    (lessonBucket(lesson.id) === 0 ? validation : train).push(...generated);
  }

  if (train.length < 100 || validation.length < 16) {
    throw new Error(`Insufficient authored lesson data: ${train.length} train / ${validation.length} validation examples.`);
  }
  return { train, validation, skipped };
}

export function toVertexJsonl(records: FineTuneRecord[]): string {
  return records.map(record => JSON.stringify(record.example)).join('\n') + '\n';
}

/** Chat messages JSONL for Kaggle notebooks using Hugging Face Datasets/TRL/Unsloth. */
export function toChatMessagesJsonl(records: FineTuneRecord[]): string {
  return records.map(({ example, lessonId, language, task }) => {
    const [user, assistant] = example.contents;
    return JSON.stringify({
      lesson_id: lessonId,
      language,
      task,
      messages: [
        { role: 'system', content: example.systemInstruction.parts.map(part => part.text).join('\n') },
        { role: 'user', content: user.parts.map(part => part.text).join('\n') },
        { role: 'assistant', content: assistant.parts.map(part => part.text).join('\n') },
      ],
    });
  }).join('\n') + '\n';
}
