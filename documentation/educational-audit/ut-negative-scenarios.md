# UT Negative Learner Scenarios

| ID | Scenario | Trigger | Current risk | Expected behavior | Control / fix | Priority |
|---|---|---|---|---|---|---|
| UT-N01 | Beginner opens angle-beam weld lesson first | Learner jumps to `ut-welds` | Misunderstands skip/leg/depth | System recommends prerequisites and blocks or warns | Enforce `prerequisiteLessonIds`; show learning path | High |
| UT-N02 | Learner memorizes the single lesson quiz | Repeats same MCQ | False mastery | Randomized question bank with explanations and application items | Use `quizBank`; add assessment categories | High |
| UT-N03 | Learner treats +6 dB DAC as automatic reject | Sees DAC value without decision boundary | Unsafe/incorrect reporting behavior | UI shows "record relative to DAC; acceptance follows approved code/procedure" | Decision-boundary callout in lesson and quiz feedback | Critical |
| UT-N04 | Learner applies skip formula to non-parallel geometry | Uses simplified formula outside assumptions | Wrong flaw location | Lesson/UI warns assumptions; asks to confirm geometry | Assumptions/limits box + practical exercise | High |
| UT-N05 | Learner confuses geometry echo with flaw | Root/cap/backing echo | False call or missed flaw | Teach confirmation by movement, direction, drawing, other angles | Add UT weld signal-characterization lab scenario | High |
| UT-N06 | Learner uses outdated or unverified code clause | AI or old note gives clause without edition | Compliance error | System shows "verify edition/clause" and blocks unverified citations | Reference trace verification workflow | Critical |
| UT-N07 | Learner assumes PAUT/TOFD gives automatic sizing/acceptance | Advanced lesson over-trust | Overconfidence in advanced output | Explain dead zones, setup, qualification, procedure | Limits section + critical-thinking quiz | High |
| UT-N08 | Calibration changed but learner keeps scanning | Probe/cable/couplant changed | Invalid data | System/checklist forces recalibration verification | Practical checklist + simulator interlock | Critical |
| UT-N09 | Learner on mobile cannot read A-scan details | Small screen/image | Misinterpretation | Responsive zoom/pan and accessible alt text | UI/mobile QA | Medium |
| UT-N10 | Learner fails repeatedly on DAC concept | Wrong dB/sign/meaning | Frustration and misconception | System recommends remediation lesson and visual exercise | Adaptive remediation path | Medium |
