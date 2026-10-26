import { NdeEdQuiz, NdeEdText } from './types';

export const t = (ar: string, en: string): NdeEdText => ({ ar, en });

export function quiz(
  id: string,
  questionAr: string,
  questionEn: string,
  options: [string, string][],
  answer: number,
  explanationAr: string,
  explanationEn: string
): NdeEdQuiz {
  return {
    id,
    question: t(questionAr, questionEn),
    options: options.map(([ar, en]) => t(ar, en)),
    answer,
    explanation: t(explanationAr, explanationEn),
  };
}

export const source = (id: string) => id;
