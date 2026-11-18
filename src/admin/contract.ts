import type { LocalizedText } from '../types';

export const ADMIN_HASH = '#admin';
export const ADMIN_API = '/api/admin';
export const ANNOUNCEMENT_API = '/api/site/announcement';
export const NOTICE_LIMIT = 240;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Prompts and API share the limits, without altering the characters entered. */
export function isAdminPassword(value: unknown): value is string {
  return typeof value === 'string'
    && value.length >= PASSWORD_MIN_LENGTH
    && value.length <= PASSWORD_MAX_LENGTH
    && /\S/.test(value)
    && !/[\u0000-\u001f\u007f]/.test(value);
}

export const QUOTE_STATUSES = ['new', 'in_progress', 'closed'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return QUOTE_STATUSES.some(status => status === value);
}

export interface QuoteSummary {
  reference: string;
  companyName: string;
  serviceType: string;
  receivedAt: string;
  status: QuoteStatus;
}

export interface ManagedQuote extends QuoteSummary {
  contactName: string;
  phone: string;
  email: string;
  projectLocation: string;
  description: string;
}

export interface QuotePage {
  items: QuoteSummary[];
  page: number;
  pages: number;
  total: number;
}

export interface AnnouncementInput {
  enabled: boolean;
  message: LocalizedText;
}

export interface Announcement extends AnnouncementInput {
  updatedAt: string | null;
}

export interface DashboardData {
  sessionExpiresAt: number;
  updatedAt: string;
  totals: Record<QuoteStatus, number> & { total: number; overdue: number };
  activity: { day: string; count: number }[];
  recent: QuoteSummary[];
  announcement: Announcement;
  services: { tutorConfigured: boolean; rfqNotificationsConfigured: boolean };
}
