/**
 * Which portal the visitor belongs to.
 *
 * The site serves two very different audiences (industrial buyers and NDT
 * learners). The chooser gets shown once, the answer is remembered, and the
 * header keeps an explicit switch so nobody is locked in.
 */
export type PortalChoice = 'company' | 'academy';

export const PORTAL_CHOICE_KEY = 'insco_portal_choice_v1';

export function readPortalChoice(): PortalChoice | null {
  try {
    const value = localStorage.getItem(PORTAL_CHOICE_KEY);
    return value === 'company' || value === 'academy' ? value : null;
  } catch {
    return null;
  }
}

export function savePortalChoice(choice: PortalChoice): void {
  try {
    localStorage.setItem(PORTAL_CHOICE_KEY, choice);
  } catch {
    /* private mode: the chooser simply reappears next visit */
  }
}

export function clearPortalChoice(): void {
  try {
    localStorage.removeItem(PORTAL_CHOICE_KEY);
  } catch {
    /* nothing to clear */
  }
}

interface ChooserConditions {
  /** Stored preference, if any. */
  choice: PortalChoice | null;
  /** True when the URL already asks for a specific academy tab (`#rt_lab` …). */
  hasAcademyHash: boolean;
  /** True when the URL already asks for the demonstrations page (`#demo`). */
  hasDemoHash?: boolean;
  /** Current view, so a deep link never gets covered by a modal. */
  view: 'company' | 'academy' | 'demo';
}

/**
 * Show the chooser only when the visitor has not decided yet *and* no deep link
 * is directing them. A shared `#quiz` link must never open behind a modal.
 */
export function shouldOfferPortalChooser({
  choice,
  hasAcademyHash,
  hasDemoHash = false,
  view,
}: ChooserConditions): boolean {
  if (choice) return false;
  if (hasAcademyHash || hasDemoHash) return false;
  return view === 'company';
}
