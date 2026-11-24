import React, { useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { Language } from '../../types';
import type { AcademyTab } from '../../academyTabs';
import { EducationalAcademy } from '../EducationalAcademy';
import { AcademyPageHeader } from './AcademyShell';
import { AcademyHub } from './AcademyHub';
import { AcademyAccountScope } from './AcademyAccountScope';
import { AcademyDisciplineIndex } from './AcademyDisciplineIndex';
import { AcademyDisciplinePage } from './AcademyDisciplinePage';
import { VirtualEngineer } from './VirtualEngineer';
import {
  ACADEMY_JOURNEY_SECTIONS,
  ACADEMY_SECTION_COPY,
  academySectionLabel,
  type AcademyRoute,
} from '../../utils/portalRoutes';

interface AcademyContentProps {
  language: Language;
  route: AcademyRoute;
  onOpenHash: (hash: string) => void;
  onTabChange?: (tab: AcademyTab) => void;
}

/** The academy pages, behind one code-split boundary. */
export const AcademyContent: React.FC<AcademyContentProps> = props => (
  <AcademyAccountScope language={props.language}>
    <AcademyPage {...props} />
    <VirtualEngineer language={props.language} route={props.route.page} onOpenHash={props.onOpenHash} />
  </AcademyAccountScope>
);

const AcademyPage: React.FC<AcademyContentProps> = ({
  language,
  route,
  onOpenHash,
  onTabChange,
}) => {
  const isAr = language === 'ar';
  const stableTabChange = useCallback(
    (tab: AcademyTab) => onTabChange?.(tab),
    [onTabChange]
  );

  if (route.page === 'hub') {
    return <AcademyHub language={language} onOpenHash={onOpenHash} />;
  }

  if (route.page === 'disciplines') {
    return <AcademyDisciplineIndex language={language} onOpenHash={onOpenHash} />;
  }

  if (route.page === 'discipline') {
    return (
      <AcademyDisciplinePage
        language={language}
        disciplineId={route.disciplineId}
        onOpenHash={onOpenHash}
      />
    );
  }

  const isUniversity = route.section === 'university';
  const sectionIndex = ACADEMY_JOURNEY_SECTIONS.indexOf(
    route.section as (typeof ACADEMY_JOURNEY_SECTIONS)[number]
  ) + 1;

  return (
    <div data-testid={`academy-section-${route.section}`} className="space-y-6">
      <AcademyPageHeader
        eyebrow={isUniversity
          ? (isAr ? 'وجهة تعليمية مستقلة' : 'Independent learning destination')
          : isAr
            ? `المحطة ${sectionIndex} من ${ACADEMY_JOURNEY_SECTIONS.length} · رحلة المتعلم`
            : `Station ${sectionIndex} of ${ACADEMY_JOURNEY_SECTIONS.length} · learner journey`
        }
        title={academySectionLabel(route.section, isAr ? 'ar' : 'en')}
        description={
          isAr ? ACADEMY_SECTION_COPY[route.section].ar : ACADEMY_SECTION_COPY[route.section].en
        }
        actions={
          <button
            type="button"
            onClick={() => onOpenHash('#academy')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#303961] bg-[#10132b] hover:border-amber-400/60 px-3 py-2 text-xs font-bold text-slate-200 transition cursor-pointer whitespace-nowrap"
          >
            <span>{isAr ? 'رئيسية الأكاديمية' : 'Academy home'}</span>
          </button>
        }
      />

      <EducationalAcademy
        key={route.section}
        language={language}
        section={route.section}
        initialSubTab={route.tab}
        onTabChange={stableTabChange}
        onOpenTab={tab => onOpenHash(`#${tab}`)}
      />

      <p className="flex items-start gap-2 rounded-xl border border-[#29315b] bg-[#0b0d1e] p-3 text-[11px] text-slate-400 leading-relaxed">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {isAr
            ? 'كل ما يصدر من هذه المحطة هو مادة تدريبية و«إفادة تعلّم ذاتي غير معتمدة»، وليس شهادة مهنية.'
            : 'Everything in this station is training material and a non-accredited self-study statement — not a professional certificate.'}
        </span>
      </p>
    </div>
  );
};
