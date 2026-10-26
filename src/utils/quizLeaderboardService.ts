import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';

export interface LeaderboardEntry {
  id: string;
  studentName: string;
  disciplineId: string;
  disciplineTitle?: string;
  score: number;
  percentage: number;
  date: string;
  badgeUnlocked?: string;
}

const LOCAL_LEADERBOARD_KEY = 'insco_academy_local_leaderboard_v1';

const INITIAL_MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'lb_1', studentName: 'Eng. Tareq Al-Ghamdi', disciplineId: 'conventional_ndt', disciplineTitle: 'Conventional NDT (UT/RT)', score: 95, percentage: 95, date: '2026-10-14', badgeUnlocked: 'NDT Level II' },
  { id: 'lb_2', studentName: 'Insp. Sarah Mansour', disciplineId: 'api_inspection', disciplineTitle: 'API 510/570 In-Service', score: 92, percentage: 92, date: '2026-10-15', badgeUnlocked: 'API Inspector' },
  { id: 'lb_3', studentName: 'Eng. Ahmed El-Sayed', disciplineId: 'pwht_metallurgy', disciplineTitle: 'PWHT & Heat Treatment', score: 90, percentage: 90, date: '2026-10-16', badgeUnlocked: 'Thermal Specialist' },
  { id: 'lb_4', studentName: 'Technician Khalid Omar', disciplineId: 'welding_inspection', disciplineTitle: 'Welding Inspection (CSWIP)', score: 88, percentage: 88, date: '2026-10-16', badgeUnlocked: 'CWI Inspector' },
  { id: 'lb_5', studentName: 'Inspector Fatima Zahra', disciplineId: 'coating_corrosion', disciplineTitle: 'AMPP / NACE Coating CIP', score: 85, percentage: 85, date: '2026-10-17', badgeUnlocked: 'Coating Level 2' },
];

export function getLeaderboardScores(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(INITIAL_MOCK_LEADERBOARD));
      return INITIAL_MOCK_LEADERBOARD;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_LEADERBOARD;
  }
}

export async function submitLeaderboardScore(entry: Omit<LeaderboardEntry, 'id'>): Promise<void> {
  const current = getLeaderboardScores();
  const newEntry: LeaderboardEntry = {
    ...entry,
    id: 'lb_' + Date.now().toString(36)
  };

  const updated = [newEntry, ...current].sort((a, b) => b.percentage - a.percentage).slice(0, 50);
  try {
    localStorage.setItem(LOCAL_LEADERBOARD_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving leaderboard locally:', e);
  }

  // Attempt Firestore sync
  if (db) {
    try {
      const colRef = collection(db, 'quiz_leaderboard');
      await addDoc(colRef, {
        studentName: entry.studentName,
        disciplineId: entry.disciplineId,
        percentage: entry.percentage,
        score: entry.score,
        badgeUnlocked: entry.badgeUnlocked || null,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn('Leaderboard Firestore sync note:', e);
    }
  }
}
