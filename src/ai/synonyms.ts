/**
 * Domain thesaurus for the INSCO library.
 *
 * Why this exists: the library is bilingual, but a search for "شق" will never
 * match a page that only says "crack" through substring matching. Before real
 * vector embeddings are available, a curated NDT thesaurus gives the same
 * cross-lingual effect for the vocabulary that actually appears in these books.
 *
 * Rules for adding a group:
 *  - every Arabic spelling that engineers use in the field, including the
 *    broken plural and the verbal noun;
 *  - the English abbreviations that codes use (HAZ, IQI, LOF, PAUT…);
 *  - no abbreviations that are ambiguous across methods (e.g. "pt" is both
 *    penetrant testing and "point"), and no generic words that would flood
 *    every result.
 */
export interface TermGroup {
  /** Canonical English label, used for debugging and tests. */
  id: string;
  ar: string[];
  en: string[];
}

export const TERM_GROUPS: TermGroup[] = [
  { id: 'crack', ar: ['شق', 'شروخ', 'شقوق', 'تشقق', 'صدع', 'صدوع'], en: ['crack', 'cracks', 'cracking', 'cracked', 'fissure'] },
  { id: 'porosity', ar: ['مسامية', 'مسام', 'ثقب', 'ثقوب'], en: ['porosity', 'pore', 'pores', 'porous'] },
  { id: 'slag', ar: ['خبث', 'شوائب الخبث'], en: ['slag', 'inclusion', 'inclusions'] },
  { id: 'lack-of-fusion', ar: ['عدم الانصهار', 'نقص الانصهار'], en: ['lack of fusion', 'lof', 'incomplete fusion'] },
  { id: 'lack-of-penetration', ar: ['نقص التغلغل', 'نقص الاختراق', 'عدم الاختراق'], en: ['lack of penetration', 'incomplete penetration', 'lop'] },
  { id: 'undercut', ar: ['قطع تحت', 'تهدل الحافة', 'اخدود'], en: ['undercut', 'undercutting'] },
  { id: 'lamination', ar: ['تصفيح', 'انفصال صفيحي'], en: ['lamination', 'laminations', 'lamellar'] },
  { id: 'corrosion', ar: ['تآكل', 'تأكل', 'صدأ'], en: ['corrosion', 'corrosive', 'rust', 'pitting'] },
  { id: 'defect', ar: ['عيب', 'عيوب', 'خلل', 'عدم استمرارية'], en: ['defect', 'defects', 'flaw', 'flaws', 'discontinuity', 'discontinuities', 'imperfection'] },
  { id: 'weld', ar: ['لحام', 'ملحومة', 'ملحوم', 'وصلة لحام'], en: ['weld', 'welding', 'welded', 'weldment', 'joint'] },
  { id: 'base-metal', ar: ['معدن الأساس', 'المعدن الأم'], en: ['base metal', 'parent metal', 'parent material'] },
  { id: 'haz', ar: ['منطقة متأثرة بالحرارة', 'المنطقة المتأثرة'], en: ['haz', 'heat affected zone'] },
  { id: 'preheat', ar: ['تسخين مسبق', 'التسخين المسبق'], en: ['preheat', 'preheating', 'pre-heat'] },
  { id: 'pwht', ar: ['معالجة حرارية بعد اللحام', 'المعالجة الحرارية', 'التخفيف الإجهادي'], en: ['pwht', 'post weld heat treatment', 'post-weld', 'stress relief', 'stress relieving'] },
  { id: 'transducer', ar: ['محول طاقة', 'مسبار', 'رأس الفحص'], en: ['transducer', 'probe', 'search unit'] },
  { id: 'couplant', ar: ['وسط اقتران', 'مادة الاقتران', 'جيل'], en: ['couplant', 'coupling', 'gel'] },
  { id: 'frequency', ar: ['تردد', 'ذبذبة'], en: ['frequency', 'mhz', 'hertz'] },
  { id: 'wavelength', ar: ['طول موجي', 'الطول الموجي'], en: ['wavelength', 'lambda'] },
  { id: 'attenuation', ar: ['تخميد', 'انخفاض السعة'], en: ['attenuation', 'attenuate', 'attenuated'] },
  { id: 'calibration', ar: ['معايرة', 'معايرة الجهاز', 'ضبط'], en: ['calibration', 'calibrate', 'calibrated', 'standardisation', 'standardization'] },
  { id: 'reference-block', ar: ['كتلة مرجعية', 'قطعة معايرة', 'بلوك معايرة'], en: ['reference block', 'calibration block', 'iiw', 'step wedge'] },
  { id: 'sensitivity', ar: ['حساسية'], en: ['sensitivity', 'gain'] },
  { id: 'resolution', ar: ['تمييز', 'دقة التحليل', 'قدرة التمييز'], en: ['resolution', 'resolving power'] },
  { id: 'acceptance', ar: ['معايير القبول', 'قبول', 'مقبول'], en: ['acceptance criteria', 'acceptance', 'acceptable'] },
  { id: 'rejection', ar: ['رفض', 'مرفوض'], en: ['rejection', 'rejected', 'rejectable'] },
  { id: 'penetrant', ar: ['سائل نافذ', 'السوائل النافذة', 'سائل الاختراق'], en: ['penetrant', 'penetrant testing', 'dye penetrant', 'liquid penetrant'] },
  { id: 'developer', ar: ['مطور', 'المادة المطورة'], en: ['developer'] },
  { id: 'emulsifier', ar: ['مستحلب', 'المستحلبات'], en: ['emulsifier', 'emulsification'] },
  { id: 'dwell', ar: ['زمن التشرب', 'زمن الانتظار', 'وقت التشرب'], en: ['dwell', 'dwell time', 'penetration time'] },
  { id: 'magnetization', ar: ['تمغنط', 'التمغنط', 'مغنطة'], en: ['magnetization', 'magnetisation', 'magnetizing', 'magnetising', 'magnetised'] },
  { id: 'yoke', ar: ['مغناطيس Y', 'مغناطيس يدوي', 'اللاقط المغناطيسي'], en: ['yoke', 'electromagnetic yoke', 'prod'] },
  { id: 'flux-leakage', ar: ['تسرب الفيض', 'مجال التسرب'], en: ['flux leakage', 'leakage field', 'flux leak'] },
  { id: 'demagnetization', ar: ['إزالة المغناطيسية', 'إزالة التمغنط'], en: ['demagnetization', 'demagnetisation', 'demagnetize', 'demag'] },
  { id: 'eddy-current', ar: ['تيارات دوامية', 'التيارات الدوامية', 'تيار دوامي'], en: ['eddy current', 'eddy-current', 'eddy'] },
  { id: 'impedance', ar: ['ممانعة', 'الممانعة المركبة'], en: ['impedance', 'impedance plane'] },
  { id: 'lift-off', ar: ['فجوة الرفع', 'مسافة الرفع'], en: ['lift off', 'lift-off', 'liftoff', 'standoff'] },
  { id: 'radiography', ar: ['تصوير إشعاعي', 'التصوير الإشعاعي', 'أشعة سينية', 'إشعاع'], en: ['radiography', 'radiographic', 'radiology', 'x-ray', 'gamma'] },
  { id: 'isotope', ar: ['نظير مشع', 'النظائر المشعة'], en: ['isotope', 'iridium', 'ir-192', 'cobalt', 'selenium', 'se-75'] },
  { id: 'film', ar: ['فيلم', 'أفلام', 'الفيلم الإشعاعي'], en: ['film', 'films', 'radiograph', 'radiographs'] },
  { id: 'density', ar: ['كثافة', 'الكثافة الضوئية'], en: ['density', 'optical density'] },
  { id: 'iqi', ar: ['مؤشر جودة الصورة'], en: ['iqi', 'image quality indicator', 'penetrameter', 'penetrameter wire'] },
  { id: 'sfd', ar: ['مسافة المصدر إلى الفيلم'], en: ['sfd', 'source to film distance', 'source-to-film'] },
  { id: 'visual', ar: ['بصري', 'الفحص البصري', 'الرؤية'], en: ['visual', 'visual testing', 'vision', 'visual inspection'] },
  { id: 'illumination', ar: ['إضاءة', 'الإضاءة', 'شدة الإضاءة'], en: ['illumination', 'lux', 'lighting', 'foot candle'] },
  { id: 'acoustic-emission', ar: ['انبعاث صوتي', 'الانبعاث الصوتي'], en: ['acoustic emission', 'emission testing'] },
  { id: 'leak', ar: ['تسريب', 'اختبار التسريب', 'التسرب'], en: ['leak', 'leak testing', 'leakage', 'helium test'] },
  { id: 'phased-array', ar: ['مصفوفة طورية', 'المصفوفات الطورية'], en: ['phased array', 'paut', 'phased-array'] },
  { id: 'tofd', ar: ['حيود زمن الرحلة'], en: ['tofd', 'time of flight diffraction', 'diffraction'] },
  { id: 'dac', ar: ['منحنى المسافة والسعة'], en: ['dac', 'distance amplitude correction', 'distance amplitude curve'] },
  { id: 'dgs', ar: [], en: ['dgs', 'distance gain size', 'avg diagram'] },
  { id: 'snell', ar: [], en: ['snell', 'snell law'] },
  { id: 'refraction', ar: ['انكسار', 'زاوية الانكسار'], en: ['refraction', 'refracted'] },
  { id: 'reflection', ar: ['انعكاس', 'الانعكاس'], en: ['reflection', 'reflected', 'echo'] },
  { id: 'shear-wave', ar: ['موجة قص', 'الموجات المستعرضة'], en: ['shear wave', 'transverse wave', 's-wave'] },
  { id: 'longitudinal-wave', ar: ['موجة طولية', 'الموجات الطولية'], en: ['longitudinal wave', 'compression wave', 'p-wave'] },
  { id: 'surface-wave', ar: ['موجة سطحية'], en: ['surface wave', 'rayleigh', 'creeping wave'] },
  { id: 'welding-process', ar: ['عملية اللحام', 'طريقة اللحام'], en: ['smaw', 'gtaw', 'gmaw', 'fcaw', 'saw', 'welding process'] },
  { id: 'electrode', ar: ['قطب', 'أقطاب', 'مادة الحشو'], en: ['electrode', 'filler', 'filler metal'] },
  { id: 'groove', ar: ['شطف', 'حز', 'تحضير الحافة'], en: ['groove', 'bevel', 'joint preparation'] },
  { id: 'root', ar: ['جذر اللحام', 'الجذر'], en: ['root', 'root pass', 'root gap'] },
  { id: 'cap', ar: ['وجه اللحام', 'التاج'], en: ['cap', 'crown', 'cap pass'] },
  { id: 'thickness', ar: ['سماكة', 'السماكة', 'سمك'], en: ['thickness', 'wall thickness'] },
  { id: 'diameter', ar: ['قطر', 'القطر'], en: ['diameter', 'od', 'nominal diameter'] },
  { id: 'pressure-vessel', ar: ['وعاء ضغط', 'أوعية الضغط'], en: ['pressure vessel', 'boiler', 'vessel'] },
  { id: 'pipeline', ar: ['أنبوب', 'خط أنابيب', 'المواسير'], en: ['pipeline', 'pipe', 'piping', 'pipes'] },
  { id: 'ffs', ar: ['تقييم الصلاحية للخدمة'], en: ['fitness for service', 'ffs', 'remaining life'] },
  { id: 'creep', ar: ['زحف', 'الزحف'], en: ['creep'] },
  { id: 'fatigue', ar: ['كلال', 'إجهاد متكرر'], en: ['fatigue', 'cyclic loading'] },
  { id: 'hydrogen', ar: ['هيدروجين', 'الهيدروجين'], en: ['hydrogen', 'hydrogen cracking', 'delayed cracking'] },
  { id: 'hardness', ar: ['صلادة', 'الصلادة'], en: ['hardness', 'hardness testing', 'leeb', 'rockwell', 'brinell', 'vickers'] },
  { id: 'tensile', ar: ['شد', 'إجهاد الشد'], en: ['tensile', 'tensile test', 'yield strength', 'ultimate strength'] },
  { id: 'impact', ar: ['صدم', 'اختبار الصدم'], en: ['impact', 'charpy', 'izod', 'toughness'] },
  { id: 'microstructure', ar: ['بنية مجهرية', 'البنية المجهرية'], en: ['microstructure', 'metallography', 'grain structure'] },
  { id: 'grain', ar: ['حبيبة', 'حبيبات', 'حدود الحبيبات'], en: ['grain', 'grains', 'grain boundary'] },
  { id: 'phase', ar: ['طور', 'أطوار', 'مخطط الأطوار'], en: ['phase', 'phase diagram', 'transformation'] },
  { id: 'austenite', ar: ['أوستنيت'], en: ['austenite', 'austenitic'] },
  { id: 'martensite', ar: ['مارتنزيت'], en: ['martensite', 'martensitic'] },
  { id: 'qualification', ar: ['تأهيل', 'التأهيل', 'تدريب'], en: ['qualification', 'qualified', 'training', 'experience'] },
  { id: 'certification', ar: ['شهادة', 'اعتماد', 'الشهادات'], en: ['certification', 'certificate', 'certified', 'accreditation'] },
];

/** Token -> every other token in its group, including itself. */
export function buildSynonymIndex(groups: TermGroup[] = TERM_GROUPS): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const group of groups) {
    const members = [...group.ar, ...group.en];
    for (const raw of members) {
      const tokens = raw.split(/\s+/).filter(Boolean);
      if (tokens.length !== 1) continue; // multi-word terms are matched as phrases
      const key = tokens[0];
      const bucket = index.get(key) ?? [];
      for (const other of members) {
        if (!bucket.includes(other)) bucket.push(other);
      }
      index.set(key, bucket);
    }
  }
  return index;
}

/** Multi-word entries, matched against the normalised query as a phrase. */
export function buildPhraseIndex(groups: TermGroup[] = TERM_GROUPS): { phrase: string; expansions: string[] }[] {
  const phrases: { phrase: string; expansions: string[] }[] = [];
  for (const group of groups) {
    const members = [...group.ar, ...group.en];
    for (const raw of members) {
      if (!raw.includes(' ')) continue;
      phrases.push({ phrase: raw, expansions: members.filter(member => member !== raw) });
    }
  }
  return phrases.sort((a, b) => b.phrase.length - a.phrase.length);
}
