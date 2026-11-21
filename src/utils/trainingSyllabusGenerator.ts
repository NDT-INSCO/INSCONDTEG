import { Language } from '../types';
import { ENGINEERING_DISCIPLINES } from '../data/academyCurriculum';
import { INSCO_COMPANY_DATA } from '../data/inscoCompanyData';

export interface SyllabusSummaryStats {
  disciplineCount: number;
  levelCount: number;
  moduleCount: number;
  totalTrainingHours: number;
}

export interface GeneratedSyllabusDocument {
  filename: string;
  mimeType: string;
  content: string;
  stats: SyllabusSummaryStats;
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getSyllabusSummaryStats(): SyllabusSummaryStats {
  let levelCount = 0;
  let moduleCount = 0;
  let totalTrainingHours = 0;

  for (const disc of ENGINEERING_DISCIPLINES) {
    for (const lvl of disc.levels) {
      levelCount += 1;
      moduleCount += lvl.modules.length;
      totalTrainingHours += lvl.trainingHours || 0;
    }
  }

  return {
    disciplineCount: ENGINEERING_DISCIPLINES.length,
    levelCount,
    moduleCount,
    totalTrainingHours,
  };
}

export function buildTrainingSyllabusDocument(language: Language): GeneratedSyllabusDocument {
  const isAr = language === 'ar';
  const stats = getSyllabusSummaryStats();
  const dir = isAr ? 'rtl' : 'ltr';
  const langAttr = isAr ? 'ar' : 'en';
  const filename = 'INSCO_NDT_Training_Syllabus_2026.html';

  const disciplineBlocks = ENGINEERING_DISCIPLINES.map((disc, idx) => {
    const title = isAr ? disc.titleAr : disc.titleEn;
    const overview = isAr ? disc.overviewAr : disc.overviewEn;

    const levelRows = disc.levels
      .map((lvl) => {
        const levelName = isAr ? `${lvl.nameAr} — ${lvl.academicStageAr}` : `${lvl.nameEn} — ${lvl.academicStageEn}`;
        const modulesList = lvl.modules
          .map((mod) => {
            const modTitle = isAr ? mod.titleAr : mod.titleEn;
            const topics = ((isAr ? mod.topicsAr : mod.topicsEn) ?? [])
              .map((t) => `<li>${escapeHtml(t)}</li>`)
              .join('');
            return `
              <div class="module-box">
                <div class="module-header">
                  <strong>${escapeHtml(modTitle)}</strong>
                  <span>${escapeHtml(mod.duration)}</span>
                </div>
                <ul>${topics}</ul>
              </div>
            `;
          })
          .join('');

        return `
          <div class="level-block">
            <div class="level-meta">
              <strong>${escapeHtml(levelName)}</strong>
              <span>${lvl.trainingHours}h · ${lvl.experienceMonths}m exp · ${escapeHtml(lvl.applicableCodes.join(', '))}</span>
            </div>
            ${modulesList}
          </div>
        `;
      })
      .join('');

    return `
      <section class="discipline-section">
        <h2>${idx + 1}. ${escapeHtml(title)}</h2>
        <p class="overview">${escapeHtml(overview)}</p>
        <div class="meta-line">
          <span>${isAr ? 'التقنيات:' : 'Techniques:'} ${escapeHtml(disc.keyTechniques.join(', '))}</span>
          <span> · </span>
          <span>${isAr ? 'الاعتمادات:' : 'Accreditations:'} ${escapeHtml(disc.globalAccreditations.join(', '))}</span>
        </div>
        ${levelRows}
      </section>
    `;
  }).join('');

  const content = `<!doctype html>
<html lang="${langAttr}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(
    isAr
      ? 'منهج التعلّم الذاتي لأكاديمية إنسكو الهندسية (ASNT / ISO 9712)'
      : 'INSCO Engineering Academy — NDT & PWHT Self-Study Syllabus'
  )}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 32px auto; max-width: 960px; padding: 0 24px; color: #0f172a; line-height: 1.55; }
    header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
    h1 { margin: 4px 0 8px; font-size: 24px; color: #0f172a; }
    h2 { margin: 20px 0 6px; font-size: 18px; color: #0e7490; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
    .eyebrow { font-family: monospace; font-size: 12px; color: #0891b2; font-weight: 700; }
    .stats { display: flex; flex-wrap: wrap; gap: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; margin-bottom: 24px; }
    .discipline-section { margin-bottom: 28px; page-break-inside: avoid; }
    .overview { margin: 4px 0 8px; font-size: 13px; color: #334155; }
    .meta-line { font-family: monospace; font-size: 12px; color: #475569; margin-bottom: 12px; }
    .level-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .level-meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 13px; margin-bottom: 8px; color: #0f172a; }
    .module-box { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 12px; margin-top: 8px; }
    .module-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; font-size: 13px; }
    ul { margin: 6px 0 0; padding-inline-start: 20px; font-size: 12px; color: #334155; }
    footer { margin-top: 32px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 12px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">${escapeHtml(INSCO_COMPANY_DATA.docRef)} · ASNT SNT-TC-1A &amp; EN ISO 9712</div>
    <h1>${escapeHtml(
      isAr
        ? 'منهج التعلّم الذاتي للفحص غير الإتلافي والمعالجة الحرارية — أكاديمية إنسكو'
        : 'INSCO NDT, PAUT/RT & PWHT Self-Study Syllabus'
    )}</h1>
    <div>${escapeHtml(INSCO_COMPANY_DATA.name[language])} — ${escapeHtml(INSCO_COMPANY_DATA.contacts.email)}</div>
  </header>
  <p>${isAr ? 'للتعلّم الذاتي فقط. لا يمثل هذا المنهج تدريبًا معتمدًا أو شهادة مهنية.' : 'For self-study only. This syllabus is not accredited training or a professional credential.'}</p>
  <div class="stats">
    <span><strong>${stats.disciplineCount}</strong> ${isAr ? 'تخصصات هندسية' : 'Engineering Disciplines'}</span>
    <span>·</span>
    <span><strong>${stats.levelCount}</strong> ${isAr ? 'مستويات دراسية (Level I–III)' : 'Study Levels'}</span>
    <span>·</span>
    <span><strong>${stats.moduleCount}</strong> ${isAr ? 'وحدة تدريبية' : 'Course Modules'}</span>
    <span>·</span>
    <span><strong>${stats.totalTrainingHours}h</strong> ${isAr ? 'ساعات الدراسة التقديرية' : 'Estimated Study Hours'}</span>
  </div>
  ${disciplineBlocks}
  <footer>
    ${escapeHtml(INSCO_COMPANY_DATA.name[language])} · ${escapeHtml(INSCO_COMPANY_DATA.contacts.headOffice[language])} · Tel: ${escapeHtml(INSCO_COMPANY_DATA.contacts.phones[0])}
  </footer>
</body>
</html>`;

  return {
    filename,
    mimeType: 'text/html;charset=utf-8',
    content,
    stats,
  };
}

export function downloadTrainingSyllabus(language: Language): GeneratedSyllabusDocument {
  const doc = buildTrainingSyllabusDocument(language);

  if (typeof document !== 'undefined' && document.body) {
    let href = '';
    let shouldRevoke = false;

    if (
      typeof Blob !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      const blob = new Blob([doc.content], { type: doc.mimeType });
      href = URL.createObjectURL(blob);
      shouldRevoke = true;
    } else {
      href = `data:${doc.mimeType},${encodeURIComponent(doc.content)}`;
    }

    const link = document.createElement('a');
    link.href = href;
    link.download = doc.filename;
    link.rel = 'noopener';
    link.className = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (shouldRevoke && typeof URL.revokeObjectURL === 'function') {
      window.setTimeout(() => {
        URL.revokeObjectURL(href);
      }, 1500);
    }
  }

  return doc;
}
