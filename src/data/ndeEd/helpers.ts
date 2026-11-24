import { NdeEdQuiz, NdeEdReviewStatus, NdeEdText } from './types.js';

export const t = (ar: string, en: string): NdeEdText => ({ ar, en });

export interface QuizMeta {
  category?: 'knowledge' | 'understanding' | 'application' | 'critical_thinking';
  difficulty?: 'easy' | 'medium' | 'hard';
  optionFeedback?: NdeEdText[];
  referenceNote?: NdeEdText;
  reviewStatus?: NdeEdReviewStatus;
}

export function quiz(
  id: string,
  questionAr: string,
  questionEn: string,
  options: [string, string][],
  answer: number,
  explanationAr: string,
  explanationEn: string,
  meta: QuizMeta = {}
): NdeEdQuiz {
  return {
    id,
    question: t(questionAr, questionEn),
    options: options.map(([ar, en]) => t(ar, en)),
    answer,
    explanation: t(explanationAr, explanationEn),
    ...meta,
  };
}

export const source = (id: string) => id;
