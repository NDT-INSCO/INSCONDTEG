# INSCO Smart Lesson Template (Target)

Use this template for new or rebuilt lessons. Do not force irrelevant sections; mark N/A with reason.

## 1. Metadata

- `id`, `courseId`, `title`, `summary`, `language`, `method`, `level`
- `minutes`, `estimatedPracticeMinutes`
- `prerequisiteLessonIds`
- `targetAudience`
- `governance`: status, reviewer role/name, lastUpdatedAt, lastReviewedAt, changeLog
- `referenceTrace`: reading support + normative references

## 2. Learning design

- **Learning objectives** (measurable, Bloom-aligned)
- **Prerequisites check** (what learner must already know)
- **Key terminology** (AR/EN)
- **Safety / decision boundary** (when applicable)

## 3. Instructional flow

1. Introduction / why it matters
2. Visual explanation (diagram, image, animation, simulator)
3. Technical explanation
4. Worked example / calculation
5. Real industrial case (sanitized/anonymized)
6. Interactive practice / simulation
7. Knowledge check (formative)
8. Summary
9. References & further reading

## 4. Assessment

Minimum per lesson after migration:
- 2 knowledge questions
- 2 understanding questions
- 2 application questions
- 1 critical thinking / decision-boundary question

Each question includes: answer, rationale, per-option feedback, difficulty, category, reference, review status.

## 5. Governance checklist

- [ ] Technical accuracy reviewed by qualified SME/Level III
- [ ] Educational clarity reviewed
- [ ] References verified (edition/clause/page)
- [ ] Terminology consistent AR/EN
- [ ] No unverified code acceptance claim
- [ ] No certification/authorization claim
- [ ] Assessment answers validated
- [ ] Accessibility/mobile checked
- [ ] Links/media/simulator IDs valid
- [ ] Change log updated

## 6. Lesson status lifecycle

`draft` → `under_technical_review` → `under_educational_review` → `approved` → `published`  
Any critical technical issue moves lesson to `needs_revision` or blocks publication.
