import React from 'react';

/**
 * One section heading for the whole corporate site.
 *
 * Before this component every section hand-wrote the same three lines with
 * small drifts (some had an icon in the eyebrow, some centred, some used a
 * different description colour). The visual result is identical to the old
 * markup — the difference is that there is now one place to change it.
 */
export interface SectionHeadingProps {
  eyebrow: React.ReactNode;
  /** Optional icon shown before the eyebrow text. */
  eyebrowIcon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3';
  align?: 'start' | 'center';
  /** Extra classes on the wrapper (e.g. a different max width). */
  className?: string;
  id?: string;
}

const TITLE_CLASS = 'text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight text-balance';
const DESCRIPTION_CLASS = 'mt-3 text-sm sm:text-base text-slate-400 leading-relaxed';

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  as: Heading = 'h2',
  align = 'start',
  className = '',
  id,
}) => {
  const centered = align === 'center';

  return (
    <div className={`${centered ? 'max-w-3xl mx-auto text-center' : 'max-w-3xl'} ${className}`.trim()}>
      <div
        className={`text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-2 ${
          centered ? 'justify-center' : ''
        }`}
      >
        {eyebrowIcon}
        <span>{eyebrow}</span>
      </div>
      <Heading id={id} className={TITLE_CLASS}>
        {title}
      </Heading>
      {description && <p className={DESCRIPTION_CLASS}>{description}</p>}
    </div>
  );
};
