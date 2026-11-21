/**
 * Which portal the visitor belongs to.
 *
 * The site serves two very different audiences (industrial buyers and NDT
 * learners). The portal guide is optional. An explicit portal preference is
 * remembered, and the header keeps a switch so nobody is locked in.
 */
export type PortalChoice = 'company' | 'client' | 'academy' | 'network';

export const PORTAL_CHOICE_KEY = 'insco_portal_choice_v1';

export function readPortalChoice(): PortalChoice | null {
  try {
    const value = localStorage.getItem(PORTAL_CHOICE_KEY);
    return value === 'company' || value === 'client' || value === 'academy' || value === 'network'
      ? value
      : null;
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
