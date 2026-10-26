import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FlaskConical,
  Layers,
  Library,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react';
import { Language } from '../../types';
import { ENGINEERING_DISCIPLINES } from '../../data/academyCurriculum';
import { EdbDocument, EdbIndex, EdbIndexEntry } from '../../edb/types';
import { parseEdb } from '../../edb/validate';
import {
  epubAssetUrl,
  epubCatalogUrl,
  getEdbProgress,
  loadEdbDocument,
  loadEdbIndex,
  readEdbProgress,
  textOf,
} from '../../utils/edbLibrary';
import { EdbFlipbook } from './EdbFlipbook';

interface EdbLibraryViewProps {
  language: Language;
  initialBookId?: string;
  /** 1-based page inside `initialBookId`. */
  initialPage?: number;
  onOpenCourse?: (courseId: string) => void;
  onOpenLab?: (labId: string) => void;
}

const DISCIPLINE_LABELS: Record<string, { ar: string; en: string }> = {
  VT: { ar: 'الفحص البصري', en: 'Visual testing' },
  PT: { ar: 'السوائل النافذة', en: 'Penetrant testing' },
  MT: { ar: 'الجسيمات المغناطيسية', en: 'Magnetic particle' },
  UT: { ar: 'الموجات فوق الصوتية', en: 'Ultrasonic testing' },
  RT: { ar: 'التصوير الإشعاعي', en: 'Radiography' },
  ET: { ar: 'التيارات الدوامية', en: 'Eddy current' },
  MATERIALS: { ar: 'علم المواد', en: 'Materials' },
  INTRO: { ar: 'مدخل NDT', en: 'NDT foundations' },
  PAUT_TOFD: { ar: 'الموجات المتقدمة', en: 'Advanced UT' },
  WELDING_CODES: { ar: 'اللحام والأكواد', en: 'Welding & codes' },
  AE_LT: { ar: 'الانبعاث والتسريب', en: 'AE & leak testing' },
};

function disciplineLabel(code: string, language: Language): string {
  const direct = DISCIPLINE_LABELS[code];
  if (direct) return direct[language];
  const discipline = ENGINEERING_DISCIPLINES.find(item => item.id === code);
  if (discipline) return language === 'ar' ? discipline.titleAr : discipline.titleEn;
  return code;
}

const BookCover: React.FC<{ entry: EdbIndexEntry; language: Language }> = ({ entry, language }) => (
  <div
    className="relative overflow-hidden rounded-2xl border p-4 min-h-[142px] flex flex-col justify-between"
    style={{
      borderColor: `${entry.accent}55`,
      background: `linear-gradient(145deg, ${entry.accent}22 0%, #0a0d1e 62%, #060812 100%)`,
    }}
  >
    <div className="absolute top-0 bottom-0 start-0 w-2" style={{ backgroundColor: `${entry.accent}88` }} />
    <div className="flex items-start justify-between gap-2">
      <span className="rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider" style={{ borderColor: `${entry.accent}66`, color: entry.accent }}>
        {entry.kind === 'course' ? (language === 'ar' ? 'مقرر NDE-Ed' : 'NDE-Ed course') : 'EDB textbook'}
      </span>
      <span className="text-[9px] font-mono text-slate-500">.{entry.file.split('.').pop()}</span>
    </div>
    <div>
      <p className="text-sm font-black text-white leading-snug line-clamp-2">{textOf(entry.title, language)}</p>
      <p className="mt-1 text-[10px] text-slate-400 line-clamp-2">{textOf(entry.subtitle, language)}</p>
    </div>
    <div className="flex items-center justify-between text-[9px] text-slate-400">
      <span className="font-mono">{entry.pages} {language === 'ar' ? 'صفحة' : 'pp'}</span>
      <span className="font-mono">{Math.round(entry.estimatedMinutes / 60 * 10) / 10}h</span>
    </div>
  </div>
);

export const EdbLibraryView: React.FC<EdbLibraryViewProps> = ({ language, initialBookId, initialPage, onOpenCourse, onOpenLab }) => {
  const isAr = language === 'ar';
  const [index, setIndex] = useState<EdbIndex | null>(null);
  const [source, setSource] = useState<'files' | 'runtime' | 'loading'>('loading');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'textbook' | 'course'>('all');
  const [openEntry, setOpenEntry] = useState<EdbIndexEntry | null>(null);
  const [book, setBook] = useState<EdbDocument | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [error, setError] = useState('');
  const [importError, setImportError] = useState('');
  const [progress, setProgress] = useState<Record<string, ReturnType<typeof getEdbProgress>>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    loadEdbIndex()
      .then(result => {
        if (!active) return;
        setIndex(result.index);
        setSource(result.source);
      })
      .catch(() => {
        if (!active) return;
        setSource('runtime');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!book) setProgress(readEdbProgress());
  }, [book]);

  const filtered = useMemo(() => {
    if (!index) return [];
    const q = query.trim().toLowerCase();
    return index.books.filter(entry => {
      if (filter !== 'all' && entry.kind !== filter) return false;
      if (!q) return true;
      return `${entry.title.ar} ${entry.title.en} ${entry.subtitle.ar} ${entry.subtitle.en} ${entry.discipline}`.toLowerCase().includes(q);
    });
  }, [filter, index, query]);

  const courseEntries = filtered.filter(entry => entry.kind === 'course');
  const textbookEntries = filtered.filter(entry => entry.kind === 'textbook');

  const openBook = async (entry: EdbIndexEntry) => {
    setOpenEntry(entry);
    setLoadingBook(true);
    setError('');
    const result = await loadEdbDocument(entry);
    setLoadingBook(false);
    if (result.document) {
      setBook(result.document);
    } else {
      setError(result.error || (isAr ? 'تعذر تحميل ملف EDB.' : 'Could not load the EDB file.'));
    }
  };

  useEffect(() => {
    if (!initialBookId || !index) return;
    const entry = index.books.find(item => item.id === initialBookId);
    if (entry) void openBook(entry);
    // Keyed to the requested book, page and the loaded index: a second search
    // for a different page of the same book must reopen it, not stay put.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBookId, initialPage, index]);

  const openImported = async (file: File) => {
    setImportError('');
    try {
      const raw = await file.text();
      const parsed = parseEdb(raw);
      if (!parsed.document) {
        setImportError(parsed.result.errors.slice(0, 3).join(' • '));
        return;
      }
      setBook(parsed.document);
      setOpenEntry({
        id: parsed.document.id,
        file: file.name,
        kind: parsed.document.metadata.relatedLevel ? 'course' : 'textbook',
        title: parsed.document.metadata.title,
        subtitle: parsed.document.metadata.subtitle,
        discipline: parsed.document.metadata.relatedDiscipline || 'imported',
        pages: parsed.document.pages.length,
        estimatedMinutes: parsed.document.metadata.estimatedMinutes,
        accent: parsed.document.theme.accent,
        edition: parsed.document.metadata.edition,
        standards: parsed.document.metadata.standards || [],
        checksum: 'imported',
        bytes: file.size,
      });
    } catch (e) {
      setImportError(e instanceof Error ? e.message : String(e));
    }
  };

  if (book) {
    return (
      <div className="space-y-3" dir={isAr ? 'rtl' : 'ltr'}>
        <EdbFlipbook
          language={language}
          book={book}
          initialPageNumber={initialPage}
          onClose={() => { setBook(null); setOpenEntry(null); setProgress(readEdbProgress()); }}
          onOpenLab={onOpenLab}
        />
        {openEntry && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#29315b] bg-[#10132b] px-4 py-3 text-xs text-slate-300">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" />{openEntry.file} • {textOf(openEntry.title, language)}</span>
            <div className="flex gap-2">
              {openEntry.kind === 'course' && onOpenCourse && (
                <button type="button" onClick={() => onOpenCourse(openEntry.id.replace(/^edb-course-/, ''))} className="rounded-lg bg-amber-500 px-3 py-1.5 font-bold text-slate-950">
                  {isAr ? 'فتح المقرر التفاعلي' : 'Open interactive course'}
                </button>
              )}
              <button type="button" onClick={() => fileInput.current?.click()} className="rounded-lg border border-[#343d65] px-3 py-1.5">
                {isAr ? 'استيراد ملف آخر' : 'Import another file'}
              </button>
              <input ref={fileInput} type="file" accept=".edb,application/json" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void openImported(file); }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <section className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-[#171c3c] via-[#0d1028] to-[#060812] p-5 sm:p-8">
        <div className="absolute -top-24 -end-16 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">
            <Layers className="w-4 h-4" /> INSCO • EDB DIGITAL LIBRARY
          </div>
          <h2 className="mt-4 text-2xl sm:text-4xl font-black text-white">
            {isAr ? 'كتب تقلب صفحاتها فعلاً — بصيغة EDB مفتوحة' : 'Books that actually turn — in an open EDB format'}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            {isAr
              ? 'كل كتاب هو ملف .EDB مستقل: JSON قابل للتحقق، صفحات ثنائية اللغة، معادلات، أسئلة فهم، وروابط مصادر. يقرأه قارئ ثلاثي الأبعاد مع فهرس وبحث وإشارات مرجعية وتصدير، ويُحفظ تقدم القراءة محلياً فقط.'
              : 'Every book is a standalone .EDB file: verifiable JSON with bilingual pages, formulas, knowledge checks and source links. A 3D reader provides contents, search, bookmarks and export; reading progress is stored locally only.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] text-slate-200">
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{index?.books.length ?? 0} {isAr ? 'كتاباً' : 'books'}</span>
            <span className="rounded-lg border border-[#303961] px-3 py-1.5">{index?.books.reduce((sum, entry) => sum + entry.pages, 0) ?? 0} {isAr ? 'صفحة' : 'pages'}</span>
            <a href={epubCatalogUrl()} className="rounded-lg border border-emerald-400/40 px-3 py-1.5 font-bold text-emerald-300 hover:bg-emerald-400/10">
              {isAr ? 'نسخة EPUB للقراء الإلكترونيين' : 'EPUB edition for e-readers'}
            </a>
            <span className={`rounded-lg border px-3 py-1.5 ${source === 'files' ? 'border-emerald-400/40 text-emerald-300' : 'border-amber-400/40 text-amber-300'}`}>
              {source === 'loading' ? (isAr ? 'جارٍ تحميل الفهرس…' : 'Loading index…') : source === 'files' ? (isAr ? 'ملفات EDB محمّلة' : 'EDB files loaded') : (isAr ? 'وضع احتياطي داخل التطبيق' : 'In-app fallback')}
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: BookOpen, ar: 'تقليب ثلاثي الأبعاد', en: '3D page flip', descAr: 'حركة صفحة حقيقية مع اتجاه RTL/LTR', descEn: 'Real page rotation with RTL/LTR direction' },
          { icon: Search, ar: 'بحث داخل الكتاب', en: 'In-book search', descAr: 'يبحث في العناوين والنصوص', descEn: 'Searches titles and body text' },
          { icon: Download, ar: 'تصدير واستيراد', en: 'Export & import', descAr: 'ملف واحد يعمل دون خادم', descEn: 'One file that works without a server' },
          { icon: CheckCircle2, ar: 'تحقق من الصحة', en: 'Validated', descAr: 'بنية EDB v1.0 وتحققات بناء', descEn: 'EDB v1.0 schema and build checks' },
        ].map(item => (
          <div key={item.en} className="rounded-2xl border border-[#29315b] bg-[#0d1028] p-4">
            <item.icon className="w-5 h-5 text-amber-400" aria-hidden="true" />
            <p className="mt-2 text-sm font-bold text-white">{isAr ? item.ar : item.en}</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-400">{isAr ? item.descAr : item.descEn}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <span className="sr-only">{isAr ? 'ابحث في مكتبة EDB' : 'Search the EDB library'}</span>
          <Search className="absolute top-3 start-3 w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={isAr ? 'ابحث باسم الكتاب أو التخصص…' : 'Search by book or discipline…'}
            className="w-full rounded-xl border border-[#29315b] bg-[#0b0d1e] py-2.5 ps-9 pe-3 text-sm text-white"
          />
        </label>
        {(['all', 'course', 'textbook'] as const).map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
            className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? 'bg-amber-500 text-slate-950' : 'bg-[#151a38] text-slate-200'}`}
          >
            {item === 'all' ? (isAr ? 'الكل' : 'All') : item === 'course' ? (isAr ? 'المقررات' : 'Courses') : (isAr ? 'الكتب' : 'Textbooks')}
          </button>
        ))}
        <button type="button" onClick={() => fileInput.current?.click()} className="flex items-center gap-2 rounded-lg border border-[#343d65] px-3 py-2 text-xs font-bold text-slate-200 hover:border-amber-400">
          <Upload className="w-4 h-4" />{isAr ? 'استيراد .EDB' : 'Import .EDB'}
        </button>
        <input ref={fileInput} type="file" accept=".edb,application/json" className="hidden" onChange={event => { const file = event.target.files?.[0]; if (file) void openImported(file); }} />
      </div>

      {importError && (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">
          {isAr ? 'ملف EDB غير صالح: ' : 'Invalid EDB file: '}{importError}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-xs text-rose-200">{error}</p>
      )}

      {loadingBook && (
        <div className="rounded-2xl border border-[#29315b] bg-[#10132b] p-8 text-center text-sm text-slate-300">
          <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2 animate-pulse" />
          {isAr ? 'جارٍ فتح ملف .EDB والتحقق من بنيته…' : 'Opening the .EDB file and validating its structure…'}
        </div>
      )}

      {courseEntries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-2"><BookOpen className="w-4 h-4" />{isAr ? 'مقررات NDE-Ed ككتب EDB' : 'NDE-Ed courses as EDB books'}</h3>
            <span className="text-[10px] text-slate-500">{courseEntries.length} {isAr ? 'مقرراً' : 'courses'}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courseEntries.map(entry => {
              const p = progress[entry.id] || getEdbProgress(entry.id);
              const pct = Math.round((p.readPages.length / entry.pages) * 100);
              return (
                <article key={entry.id} className="rounded-2xl border border-[#29315b] bg-[#10132b] p-3 space-y-3">
                  <BookCover entry={entry} language={language} />
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{entry.estimatedMinutes} {isAr ? 'دقيقة' : 'min'}</span>
                    <span className="font-mono">{disciplineLabel(entry.discipline, language)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden"><div className="h-full" style={{ width: `${pct}%`, backgroundColor: entry.accent }} /></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void openBook(entry)} className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950">
                      {isAr ? 'اقرأ بالتقليب' : 'Open flipbook'}
                    </button>
                    {onOpenCourse && (
                      <button type="button" onClick={() => onOpenCourse(entry.id.replace(/^edb-course-/, ''))} className="rounded-lg border border-[#343d65] px-3 py-2 text-xs text-slate-200">
                        {isAr ? 'المقرر' : 'Course'}
                      </button>
                    )}
                    <a href={epubAssetUrl(entry.id)} download className="flex items-center justify-center rounded-lg border border-emerald-400/40 px-2 py-2 text-emerald-300 hover:bg-emerald-400/10" aria-label={isAr ? `تنزيل ${textOf(entry.title, 'ar')} بصيغة EPUB` : `Download ${textOf(entry.title, 'en')} as EPUB`} title="EPUB">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {textbookEntries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-sky-300 flex items-center gap-2"><Library className="w-4 h-4" />{isAr ? 'الكتب الدراسية المحوّلة إلى EDB' : 'Textbooks converted to EDB'}</h3>
            <span className="text-[10px] text-slate-500">{textbookEntries.length} {isAr ? 'كتاباً' : 'books'}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {textbookEntries.map(entry => {
              const p = progress[entry.id] || getEdbProgress(entry.id);
              const pct = Math.round((p.readPages.length / entry.pages) * 100);
              return (
                <article key={entry.id} className="rounded-2xl border border-[#29315b] bg-[#10132b] p-3 space-y-3">
                  <BookCover entry={entry} language={language} />
                  <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round(entry.estimatedMinutes / 60)}h</span>
                    <span className="font-mono">{entry.standards[0] || disciplineLabel(entry.discipline, language)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden"><div className="h-full" style={{ width: `${pct}%`, backgroundColor: entry.accent }} /></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void openBook(entry)} className="flex-1 rounded-lg bg-amber-500 px-3 py-2 text-xs font-black text-slate-950">
                      {isAr ? 'اقرأ بالتقليب' : 'Open flipbook'}
                    </button>
                    <a href={epubAssetUrl(entry.id)} download className="flex items-center justify-center rounded-lg border border-emerald-400/40 px-2 py-2 text-emerald-300 hover:bg-emerald-400/10" aria-label={isAr ? `تنزيل ${textOf(entry.title, 'ar')} بصيغة EPUB` : `Download ${textOf(entry.title, 'en')} as EPUB`} title="EPUB">
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!loadingBook && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#343d65] p-8 text-center text-sm text-slate-300">
          <p>{isAr ? 'لا توجد كتب مطابقة. جرّب كلمة أخرى أو أعد ضبط الفلاتر.' : 'No matching books. Try another term or reset the filters.'}</p>
          <button type="button" onClick={() => { setQuery(''); setFilter('all'); }} className="mt-3 text-amber-400 underline">{isAr ? 'إعادة ضبط' : 'Reset'}</button>
        </div>
      )}

      <section className="rounded-2xl border border-[#29315b] bg-[#0b0d1e] p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><FileText className="w-4 h-4 text-amber-400" />{isAr ? 'ما هي صيغة .EDB؟' : 'What is the .EDB format?'}</h3>
        <p className="text-xs leading-6 text-slate-300">
          {isAr
            ? 'EDB = Engineering Digital Book، حاوية JSON مفتوحة الإصدار 1.0 طوّرتها إنسكو لهذه المكتبة. الملف يحمل بيانات وصفية وفصولاً وصفحات وكتل محتوى (نص، قائمة، معادلة، تنبيه، سؤال، مصدر، تجربة). لا يحتوي على JavaScript ولا يحمّل سكربتات خارجية. يمكن التحقق منه بأداة npm run edb:check، وتنزيله واستيراده في قارئ آخر يدعم الإصدار 1.0.'
            : 'EDB means Engineering Digital Book: an open JSON container (v1.0) built by INSCO for this library. A file carries metadata, chapters, pages and content blocks (paragraph, list, formula, callout, quiz, source, experiment). It contains no JavaScript and loads no external scripts. Validate it with npm run edb:check and import it into any v1.0-compatible reader.'}
        </p>
        <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
          <span className="rounded border border-[#303961] px-2 py-1 font-mono">format: &quot;EDB&quot;</span>
          <span className="rounded border border-[#303961] px-2 py-1 font-mono">version: &quot;1.0&quot;</span>
          <span className="rounded border border-[#303961] px-2 py-1 font-mono">UTF-8 JSON</span>
          <span className="rounded border border-[#303961] px-2 py-1 font-mono">no scripts</span>
          <span className="rounded border border-[#303961] px-2 py-1 font-mono">bilingual pages</span>
        </div>
        <p className="text-xs leading-6 text-slate-300">
          {isAr
            ? 'إلى جانب EDB تُنشر كل الكتب بصيغة EPUB 3 قياسية: ملف واحد يعمل على Kindle وKobo وApple Books وCalibre دون اتصال، بالعربية والإنجليزية مع فهرس وأسئلة فهم. النسختان تُبنيان من المصدر نفسه، فالمحتوى واحد.'
            : 'Besides EDB, every book ships as a standard EPUB 3 file: one download that works offline on Kindle, Kobo, Apple Books and Calibre, in Arabic and English with a table of contents and knowledge checks. Both editions are built from the same source, so the content is identical.'}
        </p>
        <p className="text-[10px] leading-5 text-slate-500">
          {isAr ? 'المصادر الأصلية للكتب هي مكتبة إنسكو. مقررات NDE-Ed تستخدم هيكل موضوعات nde-ed.org مع إسناد؛ الصياغة والأمثلة أصلية. تنزيل الملف لا يمنح حقوق إعادة نشر المحتوى.' : 'Textbook sources are the INSCO library. NDE-Ed courses use the nde-ed.org topic structure with attribution; wording and examples are original. Downloading a file does not grant redistribution rights.'}
        </p>
      </section>

      {openEntry && !book && !loadingBook && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-100">
          <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{isAr ? 'فشل فتح الكتاب. جرّب إعادة التحميل أو استيراد ملف .EDB.' : 'Could not open the book. Retry or import an .EDB file.'}</span>
          <button type="button" onClick={() => void openBook(openEntry)} className="rounded-lg bg-amber-500 px-3 py-1.5 font-black text-slate-950">{isAr ? 'إعادة المحاولة' : 'Retry'}</button>
        </div>
      )}
    </div>
  );
};
