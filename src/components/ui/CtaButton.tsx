import React from 'react';

/**
 * The three button ranks of the site, in one place.
 *
 * Rule from the design system: one amber (primary) action per screen; the
 * secondary rank is an outline; the ghost rank is a quiet text action. Every
 * variant carries a visible focus ring, so keyboard users never lose the cursor.
 */
export type CtaVariant = 'primary' | 'secondary' | 'ghost';
export type CtaSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<CtaVariant, string> = {
  primary:
    'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-500 hover:border-amber-400',
  secondary:
    'border border-slate-700 bg-slate-900/60 text-slate-200 hover:text-white hover:border-cyan-500/60 font-semibold',
  ghost: 'text-cyan-300 hover:text-cyan-200 hover:bg-slate-900 font-semibold border border-transparent',
};

const SIZE_CLASS: Record<CtaSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-5 py-3 text-sm rounded-lg',
};

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 transition whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

export interface CtaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: CtaVariant;
  size?: CtaSize;
  /** When present the control renders as an anchor with the same styling. */
  href?: string;
  /** Opens `href` in a new tab with a safe rel. */
  external?: boolean;
  children: React.ReactNode;
}

export function ctaClassName(variant: CtaVariant = 'primary', size: CtaSize = 'md', extra = ''): string {
  return `${BASE_CLASS} ${SIZE_CLASS[size]} ${VARIANT_CLASS[variant]} ${extra}`.trim();
}

export const CtaButton: React.FC<CtaButtonProps> = ({
  variant = 'primary',
  size = 'md',
  href,
  external = false,
  className = '',
  children,
  ...rest
}) => {
  const classes = ctaClassName(variant, size, className);

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
};
