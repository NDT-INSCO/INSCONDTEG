import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFineTuneDataset, toChatMessagesJsonl, toVertexJsonl } from '../src/ai/fineTuneDataset.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(process.argv[2] || path.join(here, '..', 'training', 'generated'));
const { train, validation, skipped } = buildFineTuneDataset();
const trainLessons = [...new Set(train.map(record => record.lessonId))].sort();
const validationLessons = [...new Set(validation.map(record => record.lessonId))].sort();

await mkdir(outputDir, { recursive: true });
await Promise.all([
  writeFile(path.join(outputDir, 'train.jsonl'), toVertexJsonl(train), 'utf8'),
  writeFile(path.join(outputDir, 'validation.jsonl'), toVertexJsonl(validation), 'utf8'),
  writeFile(path.join(outputDir, 'kaggle_train.jsonl'), toChatMessagesJsonl(train), 'utf8'),
  writeFile(path.join(outputDir, 'kaggle_validation.jsonl'), toChatMessagesJsonl(validation), 'utf8'),
  writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify({
    format: 'Vertex AI Gemini supervised fine-tuning GenerateContent JSONL',
    generatedAt: new Date().toISOString(),
    source: 'src/data/academyKnowledge.ts (authored bilingual lessons only)',
    trainExamples: train.length,
    validationExamples: validation.length,
    trainLessons,
    validationLessons,
    skippedLessons: skipped,
    languages: ['ar', 'en'],
    note: 'Review every example and source before any upload or paid tuning job. Not a standards authority or engineering approval dataset.',
  }, null, 2)}\n`, 'utf8'),
]);

console.log(`Prepared ${train.length} train and ${validation.length} validation examples in ${outputDir}`);
console.log(`Lesson-level split: ${trainLessons.length} train lessons / ${validationLessons.length} held-out lessons; skipped ${skipped.length}.`);
console.log('No cloud upload or model tuning job was started.');
