/**
 * The academy tab list, in its own module.
 *
 * The academy is code-split (it carries the whole NDT library), but the router
 * in `App.tsx` has to know which `#tab` values open the academy. Importing this
 * tiny file keeps the app shell from pulling the library back into the first
 * payload just to read a list of strings.
 */
export const ACADEMY_TABS = [
  'knowledge', 'encyclopedia', 'curriculum', 'courses', 'paths', 'edb',
  'flashcards', 'workshops', 'defects', 'pwht_curve', 'methods', 'standards',
  'quiz', 'ask_ai', 'video_gen', 'certificates', 'practical', 'leaderboard',
  'completion_map', 'roadmap', 'certification_center', 'paut_controller',
  'weld_simulator', 'dac_builder', 'v1_v2_calibration', 'simulation_history',
] as const;

export type AcademyTab = (typeof ACADEMY_TABS)[number];

export function isAcademyTab(value: string): value is AcademyTab {
  return (ACADEMY_TABS as readonly string[]).includes(value);
}

/** `#courses` → `'courses'`; anything else → `undefined`. */
export function readAcademyTab(hash: string): AcademyTab | undefined {
  const candidate = hash.replace(/^#/, '').trim();
  return isAcademyTab(candidate) ? candidate : undefined;
}
