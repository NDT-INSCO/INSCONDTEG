import { calibrationState, validityEnd, type CalibrationState } from './calibration';

export interface FleetRecordDates {
  /** Older, unverified register entry (month or day precision). */
  validUntil: string | null;
  /** Set by QA only after checking the signed certificate against this asset. */
  reviewedCalibration?: {
    certificateReference: string;
    expiresOn: string;
    reviewedOn: string;
  };
  /** Only publish a next date when maintenance scheduling supplies one. */
  nextCalibrationOn?: string;
  maintenance?: 'on_hold' | 'clear';
}

function exactDay(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && validityEnd(value));
}

export function fleetRecordStatus(record: FleetRecordDates, now: Date): {
  verified: boolean;
  state: CalibrationState;
  expiry: string | null;
  nextCalibration: string | null;
  maintenance: 'on_hold' | 'clear' | 'not_reported';
} {
  const reviewed = record.reviewedCalibration;
  const reviewedDate = reviewed && exactDay(reviewed.reviewedOn) ? new Date(`${reviewed.reviewedOn}T00:00:00Z`) : null;
  const verified = Boolean(reviewed?.certificateReference.trim() && exactDay(reviewed.expiresOn) && reviewedDate && reviewedDate <= now);
  const expiry = verified ? reviewed!.expiresOn : validityEnd(record.validUntil) ? record.validUntil : null;
  return {
    verified,
    state: calibrationState(expiry, now),
    expiry,
    nextCalibration: exactDay(record.nextCalibrationOn) ? record.nextCalibrationOn : null,
    maintenance: record.maintenance ?? 'not_reported',
  };
}
