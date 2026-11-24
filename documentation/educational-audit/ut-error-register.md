# UT Error / Findings Register

Status legend: `Open` | `In Progress` | `Resolved` | `Blocked by SME` | `Accepted Risk (documented)`

| ID | Lesson/Course | Type | Severity | Finding | Evidence (source) | Recommended action | Status |
|---|---|---|---:|---|---|---|---|
| UT-001 | nde-ut course | Governance | High | Course lists standards but no edition/clause trace per lesson. | `ut.ts` standards + lesson sources | Add `referenceTrace` with edition/clause placeholders and verification workflow. | In Progress (pilot added) |
| UT-002 | nde-ut course | Sequencing | High | Course declared level1 but lessons map to level2 and ndt_advanced. | `ut-presentation/calibration/welds/advanced` curriculum links | Split into UT Foundation / UT Weld / UT Advanced Awareness, or add enforced gates. | Open |
| UT-003 | all UT lessons (before pilot) | Assessment | High | Only 1 MCQ per lesson. | previous `ut.ts` | Expand quizBank by category/difficulty; add option feedback. | In Progress (pilot expanded to 3-4) |
| UT-004 | ut-calibration | Technical completeness | High | DAC taught without clear TCG/DGS/transfer correction/procedure conditions. | `ut-calibration` sections | Add comparison table and procedure-conditioned notes; SME review. | In Progress |
| UT-005 | ut-welds | Pedagogy/technical | High | Skip math simplified; leg identification/index/beam path verification not explicit. | `ut-welds` sections | Add skip chart, index point verification, leg examples, geometry echo lab. | Open |
| UT-006 | ut-advanced | Technical completeness | High | TOFD dead zones previously missing; PAUT focal laws/encoding/coverage map still shallow. | `ut-advanced` sections | Add TOFD dead-zone diagram and PAUT setup workflow; SME review. | In Progress |
| UT-007 | course-wide | Governance schema | Critical | NDE-Ed lesson schema lacked review metadata before pilot. | `src/data/ndeEd/types.ts` before change | Extended schema with governance/referenceTrace/prerequisites/quizBank. | Resolved in schema, migration open |
| UT-008 | exam generators | Compliance/safety | Critical | Acceptance-criteria questions (DAC %, ASME Appendix 12) may be used without edition/scope/SME sign-off. | `certificationExamService.ts`, `curriculumExamGenerator.ts` | Add `needsSmeReview`, disable authoritative scoring until reviewed, show warning. | Open |
| UT-009 | ut-presentation | Visualization | Medium | No interactive A-scan/gate exercise in-lesson. | lesson has labId but no embedded interaction | Add interactive gate/A-scan activity and image. | Open |
| UT-010 | course-wide | Reference quality | High | nde-ed.org anchors are reading support, not normative code editions. | lesson sources/referenceTrace | Add normative references with verified edition/clause/page where licensed/available. | Blocked by SME/reference access |
| UT-011 | practicalAssessment | Coverage | Medium | Only 1 UT practical task (`pa-ut-calibration`); no angle-beam weld flaw characterization task. | `practicalAssessment.ts` | Add UT weld scan/characterization supervised task. | Open |
| UT-012 | learning path | Sequencing | Medium | Volumetric path includes UT but no enforced prerequisite check. | `learningPaths.ts` | Add prerequisite gate and remedial recommendation logic. | Open |
