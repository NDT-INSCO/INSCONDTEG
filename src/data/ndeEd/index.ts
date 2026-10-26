import { NdeEdCourse, NdeEdLesson, NdeEdSource, NdeEdText } from './types';
import { NDE_ED_SOURCES, NDE_ED_SOURCE_MAP } from './sources';
import { physicsCourse } from './physics';
import { vtCourse } from './vt';
import { ptCourse } from './pt';
import { mtCourse } from './mt';
import { utCourse } from './ut';
import { rtCourse } from './rt';
import { etCourse } from './et';

export const NDE_ED_COURSES: NdeEdCourse[] = [
  physicsCourse,
  vtCourse,
  ptCourse,
  mtCourse,
  utCourse,
  rtCourse,
  etCourse,
];

export const NDE_ED_LESSONS: NdeEdLesson[] = NDE_ED_COURSES.flatMap(course => course.lessons);

export const NDE_ED_TOTAL_MINUTES = NDE_ED_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0);

export const NDE_ED_EDITORIAL_DATE = '2026-10-21';

export const NDE_ED_ATTRIBUTION = {
  publisher: 'Iowa State University — Center for Nondestructive Evaluation',
  site: 'https://www.nde-ed.org/',
  statement: {
    ar: 'استُخدمت صفحات nde-ed.org لتحديد هيكل الموضوعات والقراءة الداعمة. الصياغة والأمثلة وأسئلة الفحص أصلية لإنسكو ولم تُنسخ من الموقع. لا يعني ذلك اعتماداً أو شراكة من جامعة ولاية آيوا.',
    en: 'nde-ed.org pages were used to structure topics and provide supporting reading. Wording, examples and assessment questions are original INSCO work, not copied from the site. This does not imply endorsement or partnership by Iowa State University.',
  },
} as const;

export function getCourse(courseId: string): NdeEdCourse | undefined {
  return NDE_ED_COURSES.find(course => course.id === courseId);
}

export function getLesson(lessonId: string): NdeEdLesson | undefined {
  return NDE_ED_LESSONS.find(lesson => lesson.id === lessonId);
}

export function getSource(sourceId: string): NdeEdSource | undefined {
  return NDE_ED_SOURCE_MAP[sourceId];
}

export function courseLessons(courseId: string): NdeEdLesson[] {
  return getCourse(courseId)?.lessons || [];
}

export function courseMinutes(course: NdeEdCourse): number {
  return course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
}

/** Quiz items used by the course-level self-check; one per lesson, in order. */
export function courseAssessment(course: NdeEdCourse) {
  return course.lessons.map(lesson => ({ lessonId: lesson.id, lessonTitle: lesson.title, quiz: lesson.quiz }));
}

/** Coverage of the existing eight-discipline curriculum, shown in the catalog. */
export function disciplineCoverage() {
  const map = new Map<string, { courseIds: string[]; lessonCount: number; minutes: number }>();
  NDE_ED_COURSES.forEach(course => {
    const item = map.get(course.disciplineId) || { courseIds: [], lessonCount: 0, minutes: 0 };
    item.courseIds.push(course.id);
    item.lessonCount += course.lessons.length;
    item.minutes += courseMinutes(course);
    map.set(course.disciplineId, item);
  });
  return map;
}

export { NDE_ED_SOURCES, NDE_ED_SOURCE_MAP };
export type { NdeEdCourse, NdeEdLesson, NdeEdSource, NdeEdText };
