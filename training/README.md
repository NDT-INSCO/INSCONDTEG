# INSCO model-training preparation

This repository supports two separate levers:

1. **In-product behavior improvement**: shared response contracts, curated retrieval, guarded web grounding, and automated quality tests. This changes what the app supplies to models; it does not alter model weights.
2. **Supervised fine-tuning (SFT)**: the export script below prepares a reviewable Gemini Vertex AI dataset from the repository's authored bilingual Academy lessons. It does not submit a tuning job or upload data.

## Prepare the dataset

```sh
npm run ai:finetune:prepare
```

Outputs (ignored by Git) are written under `training/generated/`:

- `train.jsonl` / `validation.jsonl` — Vertex GenerateContent examples
- `kaggle_train.jsonl` / `kaggle_validation.jsonl` — chat `messages` examples for Hugging Face Datasets/TRL/Unsloth workflows on Kaggle
- `manifest.json` — counts and lesson-level split

The exporter creates four task families in Arabic and English (knowledge check, principle, application, limitations). Splitting is deterministic and happens by whole lesson, so neither translations nor task variants of a lesson leak between training and validation. It only uses `src/data/academyKnowledge.ts`, whose lessons are authored bilingual study notes with explicit source metadata. The exporter rejects lessons with missing/unknown sources and deliberately excludes the broader unreviewed academy corpus and user conversations. The prompt does not expose the quiz answer key.

## Use with Kaggle (manual upload; no account linking)

Kaggle is not connected to Arena or this repository. Keep the account password and API token private; they are not needed for this manual path.

1. Run the export command above in the workspace and download `kaggle_train.jsonl` and `kaggle_validation.jsonl` from `training/generated/` to your computer.
2. In Kaggle, create a **private Dataset** and upload those two files. Do not publish it publicly.
3. Create a Notebook, attach the private Dataset as input, and select an available GPU accelerator. Kaggle's free GPU can be queued/limited, so save checkpoints to the notebook output.
4. Load the JSONL with Hugging Face `datasets` and use a chat-tuning notebook compatible with the chosen open model (for example TRL/Unsloth). The uploaded files are only the examples; the notebook still needs a compatible base model, a training configuration, and evaluation.
5. Keep the held-out validation file separate from training. Check privacy, source permissions, and technical review before uploading; do not treat a successful training run as proof of engineering accuracy.

## Required review before tuning

The export is a **candidate dataset**, not a claim that all technical statements have been independently audited. A qualified INSCO reviewer must check every training and validation example, its source rights, technical correctness, translation, and intended use. Do not use it to teach code acceptance limits, qualification decisions, or site procedures. If sources conflict or are obsolete, correct/remove the source lesson and regenerate. Maintain a separate held-out set when iterating; never tune on validation examples.

Google AI Studio / the Gemini API no longer offer Gemini fine-tuning. Google documents supervised tuning through Gemini Enterprise Agent Platform / Vertex AI for a limited set of model IDs, with dataset upload to Cloud Storage. This export therefore requires a compatible GCP project, billing, region, permissions, and model selection before a human starts a paid cloud job. The current application uses a Gemini API key; that key alone is not sufficient to run a Vertex tuning job. Do not upload the generated files or start a paid job without explicit operational approval.

After tuning, quality must be compared against the base model on the held-out set and the existing INSCO AI regression suite (Arabic/English quality, source-grounding, code-safety, hallucination, privacy, and latency). A fine-tuned endpoint should only be integrated after it passes those gates. The fine-tuned model would not automatically update every other provider/agent; those routes need provider-specific support and separate evaluation.
