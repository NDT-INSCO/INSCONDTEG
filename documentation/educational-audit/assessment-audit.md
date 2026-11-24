# Assessment Audit (Pilot)

## 1. Current assessment layers

| Layer | Source | Observation | Risk |
|---|---|---|---|
| NDE-Ed lesson quiz | `lesson.quiz` in `src/data/ndeEd/*.ts` | Previously 1 question/lesson; UT pilot expanded with `quizBank` | Medium — other courses still thin |
| Curriculum lesson quizzes | `src/data/curriculumLessonQuizzes.ts` | Large bank; not audited question-by-question in this pass | High |
| NDE curriculum quizzes | `src/data/ndeCurriculumQuizzes.ts` | Needs audit | Medium/High |
| Exam generator | `src/utils/curriculumExamGenerator.ts` | Contains code-specific acceptance logic (e.g., DAC/ASME) | **Critical** until SME reviewed |
| Certification exam service | `src/utils/certificationExamService.ts` | Contains acceptance/remaining-life/corrosion calculations and code references | **Critical** until SME reviewed |
| Practical assessment | `src/data/practicalAssessment.ts` | Good structure: criteria, evidence, critical steps, safety, policy | Medium — needs more UT tasks and assessor workflow |

## 2. UT pilot assessment status

| Lesson | Before | After pilot | Categories covered | Needs SME review |
|---|---:|---:|---|---|
| ut-principles | 1 | 3 | knowledge, understanding, application | Yes |
| ut-beam | 1 | 3 | knowledge, understanding, application | Yes |
| ut-presentation | 1 | 3 | knowledge, application, critical_thinking | Yes |
| ut-calibration | 1 | 4 | understanding, application, critical_thinking, understanding | Yes |
| ut-welds | 1 | 3 | understanding, application, knowledge | Yes |
| ut-advanced | 1 | 3 | knowledge, understanding, critical_thinking | Yes |

## 3. Required assessment controls

1. Every question must have: objective, difficulty, category, correct answer rationale, incorrect-option rationale, reference, review status.
2. Code/acceptance questions must include edition/scope/conditions; no "automatic reject/accept" without context.
3. Add question reporting workflow (`Report issue`) and quarantine state.
4. Separate assessment types: diagnostic, formative, summative, practical observation, critical thinking.
5. Prevent "pass by repetition" from being interpreted as competency.
6. Exams must sample across objectives; do not expose identical item repeatedly without cooldown/randomization policy.

## 4. Immediate actions

- [ ] Add `reviewStatus` / `needsSmeReview` metadata to all certification/curriculum exam questions.
- [ ] Quarantine code-acceptance questions until SME sign-off.
- [ ] Migrate remaining NDE-Ed lessons to `quizBank` with 4+ questions each.
- [ ] Add per-option feedback to legacy quiz banks.
- [ ] Add practical UT weld characterization task.
