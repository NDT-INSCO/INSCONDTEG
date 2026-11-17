/**
 * The four field photographs used by the company sections.
 *
 * They live in `public/images/` and are addressed through `publicUrl()` so the
 * paths carry the deployment base (`/INSCONDTEG/…` on GitHub Pages). The old
 * literals (`/src/assets/images/…`) only ever worked in the dev server: the
 * build never copied `src/assets`, so every photo was a 404 on the live site.
 */
import { publicUrl } from '../utils/publicUrl';

export const COMPANY_MEDIA = {
  heroInspection: publicUrl('images/hero_ndt_inspection_1792692322245.jpg'),
  pwhtHeatTreatment: publicUrl('images/pwht_heat_treatment_1792692336668.jpg'),
  radiographyGammaScan: publicUrl('images/radiography_gamma_scan_1792692355717.jpg'),
  pautFlawDetector: publicUrl('images/paut_flaw_detector_1792692369481.jpg'),
} as const;
