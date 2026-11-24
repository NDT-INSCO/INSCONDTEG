/**
 * Google Drive sync for user preferences —
 * Optionally backup translation cache and language preference
 * to user's Drive (if they connect).
 *
 * Privacy: only syncs if user explicitly opts in via admin.
 * Uses Drive file with appProperties for metadata.
 */

export const DRIVE_SYNC_KEY = 'insco_drive_sync_enabled';
export const DRIVE_FILE_NAME = 'insco-preferences.json';

export interface DrivePreferences {
  language: string;
  robotLang: string | null;
  theme: string;
  portalChoice: string | null;
  updatedAt: string;
}

/**
 * Check if Drive sync is enabled
 */
export function isDriveSyncEnabled(): boolean {
  try {
    return localStorage.getItem(DRIVE_SYNC_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDriveSyncEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DRIVE_SYNC_KEY, 'true');
    else localStorage.removeItem(DRIVE_SYNC_KEY);
  } catch {
    // ignore
  }
}

/**
 * Collect current preferences for backup
 */
export function collectPreferences(): DrivePreferences {
  return {
    language: localStorage.getItem('insco_language_v1') || 'ar',
    robotLang: localStorage.getItem('insco_robot_lang_v1'),
    theme: localStorage.getItem('insco_theme_v1') || 'dark',
    portalChoice: localStorage.getItem('insco_portal_choice_v1'),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Restore preferences from Drive backup
 */
export function restorePreferences(prefs: DrivePreferences): void {
  try {
    if (prefs.language) localStorage.setItem('insco_language_v1', prefs.language);
    if (prefs.robotLang) localStorage.setItem('insco_robot_lang_v1', prefs.robotLang);
    else localStorage.removeItem('insco_robot_lang_v1');
    if (prefs.theme) localStorage.setItem('insco_theme_v1', prefs.theme);
    if (prefs.portalChoice) localStorage.setItem('insco_portal_choice_v1', prefs.portalChoice);
  } catch {
    // ignore
  }
}

/**
 * Generate Drive file content for upload
 */
export function generateDriveFileContent(): string {
  return JSON.stringify(collectPreferences(), null, 2);
}
