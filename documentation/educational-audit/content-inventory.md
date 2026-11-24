# Phase 1 — Educational Content Inventory (Source Snapshot)

Snapshot taken from repository source on 2026-11-24. Counts are source-based; published-site reconciliation should be repeated after each build.

## 1. Content layers

| Layer | Source | Actual snapshot | Notes |
|---|---|---:|---|
| NDE-Ed courses | `src/data/ndeEd/index.ts` | 7 courses | physics, vt, pt, mt, ut, rt, et |
| NDE-Ed lessons | `src/data/ndeEd/*.ts` | 35 lessons | physics 5, VT 4, PT 5, MT 5, UT 6, RT 5, ET 5 |
| NDE-Ed sources | `src/data/ndeEd/sources.ts` | 564-line registry | nde-ed.org/ASNT reading anchors; not normative code copies |
| Curriculum disciplines | `src/data/academyCurriculum.ts` | 5 disciplines | conventional_ndt, ndt_advanced, welding_inspection, pwht_metallurgy, api_inspection |
| Textbooks | `src/data/ndeTextbooksData.ts` | 11 books | UT, PT, MT, RT, ET, VT, Materials & Flaws, NDT Scope/Standards, PAUT & TOFD, Welding Quality & Codes, AE & LT |
| Encyclopedia | `src/data/ndeEncyclopediaData.ts` | 1 dataset (2032 lines) | Needs term-level audit |
| Reference tables | `src/data/ndeReferenceTablesData.ts` | 1 dataset | Needs source/edition trace |
| Learning paths | `src/data/learningPaths.ts` | 3 paths | foundations, volumetric, surface-advanced |
| Practical assessment tasks | `src/data/practicalAssessment.ts` | 8 tasks | Added `pa-ut-weld-scan` and `pa-pt-indication-evaluation`; reconciled prior count |
| Lesson quiz bank (legacy/curriculum) | `src/data/curriculumLessonQuizzes.ts` | present | Large file; needs question-by-question audit |
| NDE curriculum quizzes | `src/data/ndeCurriculumQuizzes.ts` | present | Needs audit |
| Exam generators | `src/utils/curriculumExamGenerator.ts`, `src/utils/certificationExamService.ts` | present | **High risk**: contains code/acceptance logic; SME review required |
| Virtual labs/simulators | `src/components/academy/virtuallab/*` | many | UT, RT, PAUT, TOFD, DAC, V1/V2, MT/PT/VT/PWHT, etc. |

## 2. NDE-Ed course inventory

| Course ID | Code | Declared level | Lessons | Minutes | Standards listed | Review status (course register) |
|---|---|---:|---:|---:|---|---|
| `nde-physics` | PHYS | foundation | 5 | TBD | see course file | pending |
| `nde-vt` | VT | level1 | 4 | TBD | see course file | pending |
| `nde-pt` | PT | level1 | 5 | TBD | see course file | pending |
| `nde-mt` | MT | level1 | 5 | TBD | see course file | pending |
| `nde-ut` | UT | level1 | 6 | 130 | ASME Sec V Art.4, ASME Sec VIII Div.1, AWS D1.1, ISO 17640 | pending |
| `nde-rt` | RT | level1 | 5 | TBD | see course file | pending |
| `nde-et` | ET | level1 | 5 | TBD | see course file | pending |

## 3. UT lesson inventory (pilot)

| Lesson ID | Title (EN) | Min | Prerequisites (new) | Quiz bank | Lab | Textbook | Curriculum link | Governance |
|---|---|---:|---|---:|---|---|---|---|
| `ut-principles` | Sound generation, pulse and echo | 20 | phy-waves, phy-impedance | 3 Qs | ut_lab | book-ut p1 | conventional_ndt/L1/mod_c_ut | draft, SME review required |
| `ut-beam` | Beam, near field and coupling | 22 | ut-principles | 3 Qs | — | book-ut p2 | conventional_ndt/L1/mod_c_ut | draft, SME review required |
| `ut-presentation` | Data presentation: A, B and C scans | 20 | ut-principles | 3 Qs | ut_lab | book-ut p3 | conventional_ndt/L2/mod_c2_1 | draft, SME review required |
| `ut-calibration` | Calibration and the DAC curve | 22 | ut-principles, ut-presentation | 4 Qs | ut_lab | book-ut p4 | conventional_ndt/L2/mod_c2_1 | draft, SME review required |
| `ut-welds` | Angle-beam weld inspection | 24 | ut-beam, ut-calibration | 3 Qs | ut_lab | book-ut p5 | conventional_ndt/L2/mod_c2_1 | draft, SME review required |
| `ut-advanced` | Immersion, EMAT and PAUT/TOFD | 22 | ut-welds | 3 Qs | — | book-paut-tofd p1 | ndt_advanced/L1/mod_adv_ut | draft, SME review required |

## 4. Inventory gaps / reconciliation required

1. **Practical task count reconciled:** source now has 8 tasks in `PRACTICAL_TASKS` (added UT weld scan + PT indication evaluation).
2. **Two curriculum systems:** NDE-Ed lessons and `academyCurriculum` disciplines/modules coexist. Define ownership and mapping rules.
3. **Published-site reconciliation:** `docs/` contains built assets; verify published content matches source after build.
4. **Metadata gaps:** before pilot, NDE-Ed lessons lacked review status, reviewer, reference trace, prerequisite IDs, and change log. UT pilot adds them; other courses still need migration.
5. **Assessment inventory:** question banks in exam generators and quiz stores need question-level inventory with review status.
