/** Shared client/server constraints. Composing a phone does not prove its ownership. */
export const RFQ_FIELD_LIMITS = {
  companyName: 160, contactName: 160, phone: 40, email: 160,
  serviceType: 60, projectLocation: 160, description: 4000,
} as const;

const EMAIL = /^[^\s@<>]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function validRfqEmail(value: string): boolean {
  return value.length <= RFQ_FIELD_LIMITS.email && EMAIL.test(value);
}

export function normalizeRfqPhone(value: string): string | null {
  const phone = value.trim()
    .replace(/[\u0660-\u0669]/g, digit => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, digit => String(digit.charCodeAt(0) - 0x06f0));
  if (phone.length > RFQ_FIELD_LIMITS.phone || !/^\+?[\d ().-]+$/.test(phone)) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15 ? `${phone.startsWith('+') ? '+' : ''}${digits}` : null;
}
