import { BookPage, NdtTextbook } from '../data/ndeTextbooksData';
import { NdeEdCourse, NdeEdLesson, NdeEdSource, NdeEdText } from '../data/ndeEd/types';
import {
  EDB_FORMAT,
  EDB_GENERATOR,
  EDB_VERSION,
  EdbBlock,
  EdbDocument,
  EdbPage,
  EdbTheme,
} from './types';
import { mergeBilingualBlocks } from './paragraphs';

const LOCAL = (ar: string, en: string): NdeEdText => ({ ar, en });

const DISCIPLINE_LABEL: Record<string, NdeEdText> = {
  VT: LOCAL('الفحص البصري', 'Visual Testing'),
  PT: LOCAL('السوائل النافذة', 'Penetrant Testing'),
  MT: LOCAL('الجسيمات المغناطيسية', 'Magnetic Particle Testing'),
  UT: LOCAL('الموجات فوق الصوتية', 'Ultrasonic Testing'),
  RT: LOCAL('التصوير الإشعاعي', 'Radiographic Testing'),
  ET: LOCAL('التيارات الدوامية', 'Eddy Current Testing'),
  MATERIALS: LOCAL('علم المواد', 'Materials Science'),
  INTRO: LOCAL('مدخل NDT', 'NDT Foundations'),
  PAUT_TOFD: LOCAL('الموجات المتقدمة', 'Advanced Ultrasonics'),
  WELDING_CODES: LOCAL('اللحام والأكواد', 'Welding & Codes'),
  AE_LT: LOCAL('الانبعاث الصوتي والتسريب', 'Acoustic Emission & Leak Testing'),
};

const PALETTE: Record<string, { accent: string; accentSoft: string; ink: string; paper: string }> = {
  VT: { accent: '#38bdf8', accentSoft: '#0b2740', ink: '#e8f4ff', paper: '#081420' },
  PT: { accent: '#f472b6', accentSoft: '#3a1029', ink: '#fff0f8', paper: '#1a0712' },
  MT: { accent: '#f59e0b', accentSoft: '#3b2504', ink: '#fff8e8', paper: '#1a1204' },
  UT: { accent: '#22d3ee', accentSoft: '#08313a', ink: '#e8fdff', paper: '#06171c' },
  RT: { accent: '#a78bfa', accentSoft: '#241a46', ink: '#f2eeff', paper: '#0d0a1c' },
  ET: { accent: '#34d399', accentSoft: '#0a2e22', ink: '#e9fff6', paper: '#061912' },
  MATERIALS: { accent: '#fb923c', accentSoft: '#3b1c06', ink: '#fff4e8', paper: '#1c0e05' },
  INTRO: { accent: '#e2c275', accentSoft: '#332a12', ink: '#fff9e8', paper: '#141105' },
  PAUT_TOFD: { accent: '#60a5fa', accentSoft: '#10254a', ink: '#eef5ff', paper: '#081225' },
  WELDING_CODES: { accent: '#f87171', accentSoft: '#3a1212', ink: '#fff0f0', paper: '#1a0808' },
  AE_LT: { accent: '#2dd4bf', accentSoft: '#08312c', ink: '#e9fffc', paper: '#051917' },
};

const DEFAULT_PALETTE = PALETTE.INTRO;

function coverBlocks(
  summary: NdeEdText,
  standards: string[],
  notice: NdeEdText,
  chapters: NdeEdText[]
): EdbBlock[] {
  const blocks: EdbBlock[] = [
    { type: 'paragraph', text: summary },
    { type: 'callout', tone: 'warning', title: LOCAL('حدود الاستخدام', 'Scope of use'), text: notice },
  ];
  if (standards.length) {
    blocks.push({
      type: 'list',
      ordered: false,
      items: standards.map(code => LOCAL(`مرجع مرتبط: ${code}`, `Related reference: ${code}`)),
    });
  }
  blocks.push({
    type: 'list',
    ordered: true,
    items: chapters.map(chapter => LOCAL(chapter.ar, chapter.en)),
  });
  return blocks;
}

export interface EdbBuildOptions {
  createdAt?: string;
  updatedAt?: string;
}

export function textbookToEdb(book: NdtTextbook, options: EdbBuildOptions = {}): EdbDocument {
  const now = new Date().toISOString();
  const palette = PALETTE[book.discipline] || DEFAULT_PALETTE;
  const discipline = DISCIPLINE_LABEL[book.discipline] || LOCAL(book.discipline, book.discipline);
  const chapters: { id: string; title: NdeEdText; pageIds: string[] }[] = [];
  const pages: EdbPage[] = [];

  const coverId = `${book.id}-cover`;
  const coverTitle = book.titleAr && book.titleEn ? LOCAL(book.titleAr, book.titleEn) : LOCAL(book.titleAr, book.titleEn);

  pages.push({
    id: coverId,
    number: 1,
    chapterId: `${book.id}-front`,
    kind: 'cover',
    title: coverTitle,
    estimatedMinutes: 2,
    blocks: coverBlocks(
      LOCAL(book.coverSummaryAr, book.coverSummaryEn),
      book.applicableStandards,
      LOCAL(
        'هذه نسخة قراءة ذاتية بصيغة EDB. المحاكاة والأمثلة ليست إجراء تشغيل ولا قرار قبول. راجع إصدار الكود المرخص للعقد قبل أي حكم فني.',
        'This is a self-study EDB edition. Simulations and examples are not operating procedures or acceptance decisions. Consult the licensed contract edition before any technical judgement.'
      ),
      [LOCAL('الفصول', 'Chapters')]
    ),
  });

  const chapterKey = (page: BookPage) => `${page.chapterTitleAr}|||${page.chapterTitleEn}`;
  const chapterMap = new Map<string, { id: string; title: NdeEdText; pageIds: string[] }>();

  book.pages.forEach((page, index) => {
    const key = chapterKey(page);
    let chapter = chapterMap.get(key);
    if (!chapter) {
      chapter = {
        id: `${book.id}-ch${chapterMap.size + 1}`,
        title: LOCAL(page.chapterTitleAr, page.chapterTitleEn),
        pageIds: [],
      };
      chapterMap.set(key, chapter);
      chapters.push(chapter);
    }

    const pageId = `${book.id}-p${index + 2}`;
    const blocks: EdbBlock[] = [];
    blocks.push(...mergeBilingualBlocks(page.contentAr, page.contentEn));

    if (page.keyPointsAr?.length || page.keyPointsEn?.length) {
      const count = Math.max(page.keyPointsAr?.length || 0, page.keyPointsEn?.length || 0);
      blocks.push({ type: 'heading', level: 3, text: LOCAL('النقاط الرئيسية', 'Key points') });
      blocks.push({
        type: 'list',
        ordered: false,
        items: Array.from({ length: count }, (_, i) => LOCAL(page.keyPointsAr?.[i] || '', page.keyPointsEn?.[i] || '')).filter(item => item.ar || item.en),
      });
    }

    if (page.formula) {
      blocks.push({ type: 'heading', level: 3, text: LOCAL('المعادلة الحاكمة', 'Governing formula') });
      blocks.push({
        type: 'formula',
        expression: page.formula.latex,
        caption: LOCAL(page.formula.descriptionAr, page.formula.descriptionEn),
      });
    }

    if (page.experimentId) {
      blocks.push({ type: 'experiment', experimentId: page.experimentId, label: LOCAL('افتح التجربة التفاعلية المرتبطة', 'Open the linked interactive experiment') });
    }

    if (page.quizQuestion) {
      blocks.push({
        type: 'quiz',
        id: `${book.id}-q${page.pageNumber}`,
        question: LOCAL(page.quizQuestion.questionAr, page.quizQuestion.questionEn),
        options: page.quizQuestion.optionsAr.map((ar, i) => LOCAL(ar, page.quizQuestion!.optionsEn[i] || '')),
        answer: page.quizQuestion.correctIndex,
        explanation: LOCAL(page.quizQuestion.explanationAr, page.quizQuestion.explanationEn),
      });
    }

    blocks.push({
      type: 'callout',
      tone: 'info',
      title: LOCAL('تذكير بالمصدر', 'Source reminder'),
      text: LOCAL(
        'هذه الصفحة صياغة تعليمية أصلية لإنسكو. لا تعاد طباعة نصوص الأكواد المحمية؛ استخدم نسخة مرخصة من الإصدار المطلوب في العقد.',
        'This page is original INSCO teaching material. Do not reproduce protected code text; use a licensed copy of the edition required by the contract.'
      ),
    });

    const edbPage: EdbPage = {
      id: pageId,
      number: pages.length + 1,
      chapterId: chapter.id,
      kind: 'content',
      title: LOCAL(page.pageTitleAr, page.pageTitleEn),
      estimatedMinutes: Math.max(2, Math.round((book.estimatedHours * 60) / book.pages.length)),
      blocks,
    };
    channelPage(chapter, edbPage, pages);
  });

  // The cover points at a synthetic "front" chapter that must exist.
  chapters.unshift({ id: `${book.id}-front`, title: LOCAL('الغلاف والمقدمة', 'Cover & introduction'), pageIds: [coverId] });

  // The table of contents is only known after the chapters have been grouped.
  pages[0].blocks = coverBlocks(
    LOCAL(book.coverSummaryAr, book.coverSummaryEn),
    book.applicableStandards,
    LOCAL(
      'هذه نسخة قراءة ذاتية بصيغة EDB. المحاكاة والأمثلة ليست إجراء تشغيل ولا قرار قبول. راجع إصدار الكود المرخص للعقد قبل أي حكم فني.',
      'This is a self-study EDB edition. Simulations and examples are not operating procedures or acceptance decisions. Consult the licensed contract edition before any technical judgement.'
    ),
    chapters.filter(chapter => chapter.id !== `${book.id}-front`).map(chapter => chapter.title)
  );

  return {
    format: EDB_FORMAT,
    version: EDB_VERSION,
    id: `edb-${book.id}`,
    metadata: {
      title: coverTitle,
      subtitle: LOCAL(book.subtitleAr, book.subtitleEn),
      author: LOCAL(book.authorAr, book.authorEn),
      publisher: 'INSCO — International Services & Contracting',
      edition: book.edition,
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now,
      languages: ['ar', 'en'],
      readingDirection: 'auto',
      estimatedMinutes: Math.round(book.estimatedHours * 60),
      keywords: [
        discipline,
        LOCAL('فحص غير إتلافي', 'Non-destructive testing'),
        LOCAL('كتاب هندسي', 'Engineering textbook'),
      ],
      rights: {
        holder: 'INSCO International Services & Contracting',
        license: 'Educational use — all rights reserved',
        notice: LOCAL(
          'محتوى تعليمي أصلي. يُسمح بالقراءة والاستخدام التدريبي الداخلي. لا يجوز إعادة النشر أو البيع أو ادعاء الاعتماد الرسمي.',
          'Original educational content. Reading and internal training use are permitted. Redistribution, sale or claims of official accreditation are not.'
        ),
      },
      sourceNote: LOCAL(
        'الكتاب الأصلي جزء من مكتبة إنسكو. الاستشهادات والمعايير المذكورة للتعريف فقط، ولا تعني شراكة أو اعتماداً.',
        'The original textbook is part of the INSCO library. Cited standards are for orientation only and do not imply partnership or accreditation.'
      ),
      standards: book.applicableStandards,
      relatedDiscipline: book.discipline,
    },
    theme: { ...palette, label: LOCAL('INSCO • EDB', 'INSCO • EDB') },
    chapters,
    pages,
    generator: EDB_GENERATOR,
  };
}

function channelPage(chapter: { id: string; title: NdeEdText; pageIds: string[] }, page: EdbPage, pages: EdbPage[]) {
  chapter.pageIds.push(page.id);
  pages.push(page);
}

export function courseToEdb(
  course: NdeEdCourse,
  sources: Record<string, NdeEdSource>,
  options: EdbBuildOptions = {}
): EdbDocument {
  const now = new Date().toISOString();
  const palette = PALETTE[course.code] || { accent: course.accent, accentSoft: '#1a2342', ink: '#f4f7ff', paper: '#0b1022' };
  const frontId = `${course.id}-cover`;
  const aboutId = `${course.id}-about`;
  const summaryId = `${course.id}-summary`;
  const lessonsChapter = `${course.id}-lessons`;
  const pages: EdbPage[] = [];
  const chapters = [
    { id: `${course.id}-front`, title: LOCAL('الغلاف ومعلومات المقرر', 'Cover & course information'), pageIds: [frontId, aboutId] },
    { id: lessonsChapter, title: LOCAL('الدروس', 'Lessons'), pageIds: [] as string[] },
    { id: `${course.id}-review`, title: LOCAL('المراجعة والحدود', 'Review & limits'), pageIds: [summaryId] },
  ];

  const disclaimer = LOCAL(
    'مقرر تعليمي ذاتي غير معتمد. لا يمنح تأهيلاً أو صلاحية توقيع، ولا يغني عن التدريب العملي والاختبار الرسمي.',
    'A non-accredited self-study course. It grants no qualification or signing authority and does not replace practical training or formal examination.'
  );

  pages.push({
    id: frontId,
    number: 1,
    chapterId: chapters[0].id,
    kind: 'cover',
    title: course.title,
    estimatedMinutes: 2,
    blocks: [
      { type: 'paragraph', text: course.description },
      { type: 'callout', tone: 'warning', title: LOCAL('حدود المقرر', 'Course limits'), text: course.limits },
      { type: 'list', ordered: true, items: course.outcomes.map(o => o) },
    ],
  });

  pages.push({
    id: aboutId,
    number: 2,
    chapterId: chapters[0].id,
    kind: 'chapter',
    title: LOCAL('قبل أن تبدأ', 'Before you begin'),
    estimatedMinutes: 3,
    blocks: [
      { type: 'heading', level: 2, text: LOCAL('المتطلبات السابقة', 'Prerequisites') },
      { type: 'paragraph', text: course.prerequisites },
      { type: 'heading', level: 2, text: LOCAL('مصادر القراءة', 'Reading sources') },
      ...course.lessons
        .flatMap(lesson => lesson.sources)
        .filter((id, index, list) => list.indexOf(id) === index)
        .map(id => sources[id])
        .filter(Boolean)
        .map(source => ({ type: 'source' as const, publisher: source.publisher, title: source.title, url: source.url })),
      { type: 'callout', tone: 'info', title: LOCAL('إسناد المصدر', 'Source attribution'), text: LOCAL(
        'تم بناء هيكل الموضوعات بالاستعانة بصفحات nde-ed.org التعليمية (جامعة ولاية آيوا). الصياغة والأمثلة والأسئلة أصلية لإنسكو، ولم يُنسخ نص المحاضرات.',
        'Topic structure follows the educational pages of nde-ed.org (Iowa State University). Wording, examples and questions are original INSCO work; lecture text was not copied.'
      ) },
    ],
  });

  course.lessons.forEach((lesson, index) => {
    const pageId = `${course.id}-l${index + 1}`;
    const blocks: EdbBlock[] = [
      { type: 'paragraph', text: lesson.summary },
      { type: 'heading', level: 2, text: LOCAL('أهداف التعلم', 'Learning objectives') },
      { type: 'list', ordered: true, items: lesson.objectives },
    ];

    lesson.sections.forEach(section => {
      blocks.push({ type: 'heading', level: 3, text: section.heading });
      blocks.push({ type: 'paragraph', text: section.body });
    });

    blocks.push({ type: 'heading', level: 3, text: LOCAL('مثال محلول', 'Worked example') });
    blocks.push({ type: 'paragraph', text: lesson.workedExample.prompt });
    blocks.push({ type: 'callout', tone: 'success', title: LOCAL('الحل', 'Solution'), text: lesson.workedExample.solution });

    blocks.push({ type: 'heading', level: 3, text: LOCAL('تمرين', 'Exercise') });
    blocks.push({ type: 'paragraph', text: lesson.exercise.prompt });
    blocks.push({ type: 'callout', tone: 'info', title: LOCAL('تلميح', 'Hint'), text: lesson.exercise.hint });
    blocks.push({ type: 'callout', tone: 'warning', title: LOCAL('الإجابة بعد المحاولة', 'Answer after attempting'), text: lesson.exercise.answer });

    blocks.push({
      type: 'quiz',
      id: lesson.quiz.id,
      question: lesson.quiz.question,
      options: lesson.quiz.options,
      answer: lesson.quiz.answer,
      explanation: lesson.quiz.explanation,
    });

    lesson.sources.map(id => sources[id]).filter(Boolean).forEach(source => {
      blocks.push({ type: 'source', publisher: source.publisher, title: source.title, url: source.url });
    });

    if (lesson.labId) {
      blocks.push({ type: 'experiment', experimentId: lesson.labId, label: LOCAL('افتح المعمل الافتراضي', 'Open the virtual lab') });
    }

    const page: EdbPage = {
      id: pageId,
      number: pages.length + 1,
      chapterId: lessonsChapter,
      kind: 'content',
      title: lesson.title,
      estimatedMinutes: lesson.minutes,
      blocks,
    };
    pages.push(page);
    chapters[1].pageIds.push(pageId);
  });

  pages.push({
    id: summaryId,
    number: pages.length + 1,
    chapterId: chapters[2].id,
    kind: 'summary',
    title: LOCAL('ماذا تعلمت وما لا يمنحه هذا المقرر', 'What you learned — and what this course does not grant'),
    estimatedMinutes: 5,
    blocks: [
      { type: 'heading', level: 2, text: LOCAL('مخرجات التعلم', 'Learning outcomes') },
      { type: 'list', ordered: false, items: course.outcomes },
      { type: 'callout', tone: 'warning', title: LOCAL('ليست شهادة', 'Not a certificate'), text: disclaimer },
      { type: 'paragraph', text: LOCAL(
        `الاختبار الشامل في المنصة مبني على ${course.lessons.length} درساً وهو فحص فهم ذاتي. اجتيازه لا يساوي اختبار ASNT/ISO أو تصريحاً من جهة العمل.`,
        `The platform's final assessment draws on ${course.lessons.length} lessons and is a self-check. Passing it does not equal an ASNT/ISO examination or an employer authorisation.`
      ) },
    ],
  });

  return {
    format: EDB_FORMAT,
    version: EDB_VERSION,
    id: `edb-course-${course.id}`,
    metadata: {
      title: course.title,
      subtitle: course.subtitle,
      author: LOCAL('أكاديمية إنسكو — محتوى تعليمي أصلي', 'INSCO Academy — original educational content'),
      publisher: 'INSCO — International Services & Contracting',
      edition: 'إصدار المقرر 1.0 — 2026',
      createdAt: options.createdAt || now,
      updatedAt: options.updatedAt || now,
      languages: ['ar', 'en'],
      readingDirection: 'auto',
      estimatedMinutes: course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 20),
      keywords: [
        LOCAL('مقرر', 'Course'),
        LOCAL(`مستوى ${course.level}`, `Level ${course.level}`),
        ...course.standards.slice(0, 4).map(code => LOCAL(code, code)),
      ],
      rights: {
        holder: 'INSCO International Services & Contracting',
        license: 'Educational use — all rights reserved',
        notice: LOCAL(
          'محتوى تعليمي أصلي. هيكل الموضوعات يستند إلى صفحات nde-ed.org التعليمية مع إسناد واضح. لا يُدّعى اعتماد من جامعة ولاية آيوا أو غيرها.',
          'Original educational content. Topic structure follows nde-ed.org educational pages with attribution. No endorsement by Iowa State University or others is claimed.'
        ),
      },
      sourceNote: LOCAL(
        'روابط nde-ed.org للقراءة الداعمة فقط. الصياغة والأمثلة وأسئلة الفحص أصلية لإنسكو.',
        'nde-ed.org links are supporting reading only. Wording, examples and assessment questions are original INSCO work.'
      ),
      standards: course.standards,
      relatedDiscipline: course.disciplineId,
      relatedLevel: course.level,
    },
    theme: { ...palette, label: LOCAL('NDE-ED • INSCO COURSE', 'NDE-ED • INSCO COURSE') },
    chapters,
    pages,
    generator: EDB_GENERATOR,
  };
}

/** Extract a pseudo chapter list for the course catalog UI. */
export function lessonToEdbPageId(courseId: string, lessonIndex: number): string {
  return `${courseId}-l${lessonIndex + 1}`;
}

export function courseLessonSourceCount(lesson: NdeEdLesson): number {
  return lesson.sources.length;
}
