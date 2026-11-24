# Remediation Backlog (Prioritized)

## P0 — Critical / publish-blocking

| ID | Item | Scope | Owner role | Status |
|---|---|---|---|---|
| P0-1 | Add review/governance metadata to all NDE-Ed lessons | all 7 courses | Content eng + SME coordinator | In Progress (35/35 governance+prereqs, UT deep pilot) |
| P0-2 | Quarantine/flag code-acceptance exam questions until SME review | exam generators | SME + frontend | In Progress (metadata + default exclusion in generators) |
| P0-3 | Build normative reference trace workflow (edition/clause/page/rights) | all technical content | SME + content ops | Open |
| P0-4 | Ensure no lesson/cert/exam implies certification/acceptance authority | site-wide copy | Content + legal/QA | Open |

## P1 — High

| ID | Item | Scope | Status |
|---|---|---|---|
| P1-1 | Complete UT lesson quality cards for all 6 lessons and get SME review | UT | In Progress |
| P1-2 | Migrate all NDE-Ed lessons to quizBank (>=4 questions/lesson) | all courses | Open |
| P1-3 | Add prerequisite enforcement in UI/learning path | academy UI | Open |
| P1-4 | Add UT weld characterization practical task and simulator rubric | UT | Open |
| P1-5 | Reconcile content count mismatch (practical tasks 6 vs previously reported 8) | inventory | Resolved (now 8 tasks) |
| P1-6 | Standardize AR/EN NDT glossary | all courses | Open |

## P2 — Medium

| ID | Item | Scope | Status |
|---|---|---|---|
| P2-1 | Add visuals/diagrams for UT beam, DAC, skip chart, TOFD dead zones | UT | Open |
| P2-2 | Add interactive A-scan gate exercise in UT presentation/calibration | UT lab | Open |
| P2-3 | Add question reporting/quarantine workflow | assessment system | Open |
| P2-4 | Generate machine-readable content inventory from source | tooling | Resolved (scripts/audit-educational-content.mjs) |
| P2-5 | Audit RT/MT/PT/VT/ET/Physics courses with same quality card | remaining NDE-Ed | Open |

## P3 — Enhancement

| ID | Item | Scope | Status |
|---|---|---|---|
| P3-1 | Adaptive remediation path based on missed question categories | AI coach + progress | Open |
| P3-2 | Skill map separated into knowledge/practical/verified competency | learner profile | Open |
| P3-3 | Automated content lint checks in CI (missing objectives/references/reviewStatus) | CI | Open |

## Definition of Done for a lesson

A lesson is "Done" only when: technically reviewed, educationally reviewed, references traced, assessments validated, mobile/accessibility checked, and governance metadata complete. **Technical accuracy overrides score.**
