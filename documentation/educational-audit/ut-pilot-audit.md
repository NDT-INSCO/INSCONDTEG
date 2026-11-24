# UT Pilot Audit — NDE-Ed Course (`nde-ut`)

**Course:** Ultrasonic Testing (UT)  
**Source:** `src/data/ndeEd/ut.ts`  
**Audit date:** 2026-11-24  
**Audit type:** Source-based educational/technical first pass  
**Publication decision:** **HOLD — requires UT Level III / SME review**

## 1. Course summary

| Field | Value |
|---|---|
| Course ID | `nde-ut` |
| Level (declared) | `level1` |
| Lessons | 6 |
| Total minutes | 130 |
| Standards listed | ASME Sec V Art. 4, ASME Sec VIII Div. 1, AWS D1.1, ISO 17640 |
| Limits statement | Present — does not grant qualification or set acceptance limits |
| Course review status | Pending in `src/data/ndeEd/review.ts` |

## 2. Lesson-by-lesson audit

| Lesson | Prereq | Strengths | Findings | Severity | Decision |
|---|---|---|---|---:|---|
| `ut-principles` | phy-waves, phy-impedance | Correct pulse-echo relation, frequency/attenuation tradeoff, delay compensation note | Add explicit velocity/temperature effect example; add visual waveform; only 3 questions after pilot expansion | Medium | Needs revision |
| `ut-beam` | ut-principles | Near field/beam spread formulas, Snell's law, couplant effect | Formulas are approximations — must state assumptions; add beam profile visual; no wedge delay/index point discussion | Medium | Needs revision |
| `ut-presentation` | ut-principles | A/B/C-scan distinction, dB formula, DAC-after-correction note | Sequencing mismatch: curriculum link points to Level 2/module C2_1 while course declared Level 1; needs interactive A-scan reading exercise | High | Needs revision |
| `ut-calibration` | ut-principles, ut-presentation | Calibration steps, DAC concept, dead zone, decision-boundary warning added | Missing TCG/DGS comparison detail, transfer correction, reflector/block types by procedure; needs block diagrams and simulator task rubric | High | Needs revision |
| `ut-welds` | ut-beam, ut-calibration | Skip math, scan coverage, geometry-vs-flaw confirmation added | Needs index point, beam path verification, skip chart drawing, leg identification, mode conversion notes; simplified math needs stronger assumptions box | High | Needs revision |
| `ut-advanced` | ut-welds | Good limits: no direct imaging, needs qualified procedure; TOFD dead zones added | PAUT focal laws/encoding/coverage map missing; EMAT sensitivity limits need quantitative caution by procedure; advanced lesson inside level1 course needs clear gate | High | Needs revision |

## 3. Technical audit notes (requires SME confirmation)

| Item | Observation | Status |
|---|---|---|
| `t=2d/v` | Correct for pulse-echo round trip. | Looks correct — SME confirm context |
| `N=D²/(4λ)` | Common circular piston approximation. | Looks correct — state assumptions |
| `sin θ ≈ 0.51 λ/D` | Common half-angle approximation. | Looks correct — state assumptions |
| `ΔdB=20 log(A2/A1)` | Correct for amplitude ratio. | Correct |
| Skip formulas | Correct for simplified parallel-surface straight-path case. | Looks correct — assumptions added |
| Course standard `ASME Sec VIII Div. 1` | Pressure vessel construction/acceptance context; not a UT technique standard by itself. | Needs SME reclassification |
| Course standard `AWS D1.1` | Structural welding code; acceptance context, not UT technique alone. | Needs SME reclassification |
| TOFD dead zones | Now mentioned in pilot edit. | Added — SME confirm wording |
| DAC acceptance logic in exam banks | High-risk if edition/scope/conditions not explicit. | **HOLD for SME review** |

## 4. Pedagogical audit

| Criterion | UT status | Target |
|---|---|---|
| Learning objectives | Present per lesson | Make measurable (Bloom/action verbs + observable outcome) |
| Prerequisites | Added pilot per lesson | Enforce in UI/learning path |
| Worked examples | Present | Add at least 1 visual/worked case per lesson |
| Exercises | Present | Add interactive/simulator-linked exercise |
| Assessment | 3-4 questions/lesson after pilot | 8-10 questions/lesson across knowledge/understanding/application/critical thinking |
| Feedback | Explanation present; option-level feedback partial | Add per-option misconception feedback |
| References | Reading anchors + normative placeholders | Add verified edition/clause/page where permitted |
| Review metadata | Added pilot governance fields | Complete for all lessons/courses |
| Limits/safety/decision boundary | Improved in pilot | Standardize across all lessons |

## 5. Recommended UT learning sequence

1. `phy-waves` (prerequisite)
2. `phy-impedance` (prerequisite)
3. `ut-principles`
4. `ut-beam`
5. `ut-presentation`
6. `ut-calibration`
7. `pa-ut-calibration` practical task (supervised)
8. `ut-welds`
9. UT weld simulator / lab exercises
10. `ut-advanced` (awareness only; not PAUT/TOFD qualification)

## 6. Publication recommendation

- **Do not mark UT as technically approved.**
- Keep course visible only with "Draft / Under technical review" messaging until SME sign-off.
- Freeze code-acceptance questions touching UT until reviewed against applicable code edition and scope.
