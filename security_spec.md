# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Unique Company Code Reservation**: No `/companies/{companyId}` document may be created without atomically reserving its unique `companyCode` in `/company_codes/{companyCode}` (`existsAfter`).
2. **Master Gate Report Isolation**: No `/companies/{companyId}/reports/{reportId}` document may exist without an existing parent `/companies/{companyId}` document, and `report.companyId == companyId` plus `report.assignedClientUid == parent.assignedClientUid` must hold on creation.
3. **Self-Assigned Role Prevention**: A newly created `/client_accounts/{userId}` document created by a non-admin user MUST force `role == 'client'`, `approvalStatus == 'pending'`, `assignedCompanyId == ''`, and `assignedCompanyCode == ''`.
4. **PII Isolation**: `/client_accounts/{userId}` and `/client_requests/{requestId}` contain emails and phone numbers; reads and `list` queries are strictly restricted to the owning `uid` or verified admin (`inscondtco@gmail.com` with `email_verified == true`).
5. **Email Verification & Admin Spoofing Guard**: All standard writes and admin checks require `request.auth.token.email_verified == true`.
6. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` are validated against `request.time`. Author/owner IDs (`uid`, `submittedByUid`, `createdByUid`) and `createdAt` are immutable after creation.
7. **Terminal State Locking**: Once a `client_requests` document reaches `'completed'` or `'rejected'`, or a `reports` document reaches `'archived'`, non-admin users cannot mutate it.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: `POST /client_accounts/attackerUid` with `role: 'admin', approvalStatus: 'approved'` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: `POST /client_requests/req1` with `extraField: true` -> `PERMISSION_DENIED` (`hasOnly` check).
3. **Spoofed Unverified Admin Email**: `auth.token = { email: 'inscondtco@gmail.com', email_verified: false }` reading `/companies` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Client Read**: Client A calling `get(/client_accounts/clientB)` -> `PERMISSION_DENIED`.
5. **Blanket List Scraping**: Client A calling `list(/client_requests)` without `where('submittedByUid', '==', uid)` -> `PERMISSION_DENIED`.
6. **Orphan Report Creation**: Creating `/companies/fakeParent/reports/rep1` where parent does not exist -> `PERMISSION_DENIED`.
7. **Unbound 1MB Resource Poisoning**: `POST /companies/validId` with 20KB `companyCode` or `nameEn` -> `PERMISSION_DENIED`.
8. **ID Poisoning**: Creating `/companies/invalid$id!withSpaces` -> `PERMISSION_DENIED` (`isValidId`).
9. **Client Forging Timestamp**: `createdAt` set to past timestamp != `request.time` -> `PERMISSION_DENIED`.
10. **Non-Admin Creating Company Record**: Client user attempting `POST /companies/co1` -> `PERMISSION_DENIED`.
11. **Non-Admin Mutating Request Status**: Client trying to change `client_requests/req1.status` from `'new'` to `'approved'` -> `PERMISSION_DENIED`.
12. **Client Mismatching Assigned Company Link on Report**: Creating report with `assignedClientUid` not matching parent company -> `PERMISSION_DENIED`.
