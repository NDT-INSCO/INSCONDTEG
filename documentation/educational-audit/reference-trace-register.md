# Reference Traceability Register (Pilot)

## Policy

- **Reading support** (nde-ed.org, ASNT overview pages): useful for learning structure; not normative acceptance criteria.
- **Normative standard** (ASME, ISO, AWS, API, ASTM, etc.): must include edition/revision, clause/section/table/page as applicable, and usage rights confirmation.
- **Unverified reference:** may be listed as `verified:false` placeholder; never presented as authoritative citation.

## UT reference status

| Lesson | Source ID / Reference | Kind | Verified | Status | Required action |
|---|---|---|---:|---|---|
| ut-principles | nde-ut-principles | reading_support | Yes | OK | Keep as support; add normative UT technique ref if used for procedure claims |
| ut-principles | nde-ut-piezo | reading_support | Yes | OK | — |
| ut-principles | nde-ut-normal | reading_support | Yes | OK | — |
| ut-principles | ASME Section V, Article 4 | normative_standard | No | Placeholder | SME to confirm edition/clause/scope |
| ut-beam | nde-ut-beamspread/fields/formulas/couplant | reading_support | Yes | OK | — |
| ut-presentation | nde-ut-presentation/dac/normal | reading_support | Yes | OK | — |
| ut-calibration | nde-ut-calibration/dac/formulas | reading_support | Yes | OK | — |
| ut-calibration | ASME Section V, Article 4 | normative_standard | No | Placeholder | Confirm DAC/TCG/reference block requirements by edition |
| ut-welds | nde-ut-angle1/angle2/weldments | reading_support | Yes | OK | — |
| ut-welds | ISO 17640 / AWS D1.1 / ASME V Art 4 | normative_standard | No | Placeholder | Select applicable standard by contract/procedure; verify edition |
| ut-advanced | nde-ut-immersion/emat/presentation | reading_support | Yes | OK | — |
| ut-advanced | ASME V / ISO 13588 / ISO 19285 | normative_standard | No | Placeholder | Confirm technique-specific scope and edition |

## Systemic gap

Most lessons outside UT still have only `sources: string[]` (reading anchors). They need migration to `referenceTrace[]` with governance status.

## Required fields for normative references

- publisher
- document title
- edition/revision/year
- clause/section/table/figure
- page (if applicable)
- access/permission status
- verified by (role/name)
- verification date
- notes/scope limits
