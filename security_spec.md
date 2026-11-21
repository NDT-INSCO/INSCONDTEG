# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Unique Company Code Reservation**: No `/companies/{companyId}` document may be created without atomically reserving its unique `companyCode` in `/company_codes/{companyCode}` (`existsAfter`).
2. **Master Gate Report, Employee & Attendance Isolation**: No `/companies/{companyId}/reports/{reportId}`, `/employees/{employeeId}`, or `/attendance/{logId}` document may exist without an existing parent `/companies/{companyId}` document, and `companyId == companyId` plus owner/client UID alignment must hold on creation.
3. **Self-Assigned Role Prevention**: A newly created `/client_accounts/{userId}` document created by a non-admin user MUST force `role == 'client'`, `approvalStatus == 'pending'`, `assignedCompanyId == ''`, and `assignedCompanyCode == ''`.
4. **Self-Service Tenant Isolation**: Non-admin verified users may create `/companies/{companyId}` ONLY when `createdByUid == request.auth.uid && assignedClientUid == request.auth.uid`; they cannot create or mutate another user's company, employees, or reports.
5. **PII Isolation**: `/client_accounts/{userId}` only allows reads by the verified owner or a verified reviewer whose immutable audit request minted an active grant for that exact UID. Profile lists are denied for all web clients, including the bootstrap admin. `/client_requests` and company operations have separate owner/staff access. Content users choose to publish lives separately from private profiles.
6. **Verified Identity & Admin Spoofing Guard**: All standard writes require either `request.auth.token.email_verified == true` (Google / verified Email-Password) OR Firebase Phone OTP (`sign_in_provider == 'phone'` with a verified `phone_number`). Admin checks (`isAdminEmail()`) strictly require `request.auth.token.email_verified == true` so phone accounts can never spoof the admin email.
7. **Temporal Integrity & Immutability**: `createdAt` and `updatedAt` are validated against `request.time`. Author/owner IDs (`uid`, `submittedByUid`, `createdByUid`, `ownerUid`) and `createdAt` are immutable after creation. Attendance logs are append-only (`allow update: if false`).
8. **Account Review Audit**: `account_reviewers/{uid}` may be provisioned only out-of-band with IAM. A reviewer must atomically write a validated, server-timed event and matching grant; grants expire after five minutes and no browser user can update/delete an audit record. Cloud IAM and Data Access logs need separate operator configuration. Private account records use Cloud Firestore's managed storage encryption over TLS, not end-to-end encryption.
9. **Terminal State Locking**: Once a `client_requests` document reaches `'completed'` or `'rejected'`, or a `reports` document reaches `'archived'`, non-admin users cannot mutate it.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: `POST /client_accounts/attackerUid` with `role: 'admin', approvalStatus: 'approved'` -> `PERMISSION_DENIED`.
2. **Shadow Field Injection**: `POST /client_requests/req1` with `extraField: true` -> `PERMISSION_DENIED` (`hasOnly` check).
3. **Spoofed Unverified Admin Email**: `auth.token = { email: 'inscondtco@gmail.com', email_verified: false }` reading `/companies` -> `PERMISSION_DENIED`.
4. **Cross-Tenant Client Read**: Client A calling `get(/client_accounts/clientB)` -> `PERMISSION_DENIED`.
5. **Blanket List Scraping**: Client A calling `list(/client_requests)` or `list(/companies)` without owner filter -> `PERMISSION_DENIED`.
6. **Orphan Subcollection Creation**: Creating `/companies/fakeParent/employees/e1` or `/attendance/a1` where parent does not exist -> `PERMISSION_DENIED`.
7. **Unbound 1MB Resource Poisoning**: `POST /companies/validId` with 20KB `companyCode` or raw base64 webcam blobs in `attendance` -> `PERMISSION_DENIED`.
8. **ID Poisoning**: Creating `/companies/invalid$id!withSpaces` -> `PERMISSION_DENIED` (`isValidId`).
9. **Client Forging Timestamp**: `createdAt` set to past timestamp != `request.time` -> `PERMISSION_DENIED`.
10. **Cross-Tenant Company Hijacking**: User A attempting `POST /companies/co1` with `assignedClientUid: 'userB'` -> `PERMISSION_DENIED`.
11. **Non-Admin Mutating Request Status**: Client trying to change `client_requests/req1.status` from `'new'` to `'approved'` -> `PERMISSION_DENIED`.
11. **Tampering Historical Attendance Logs**: Any user attempting `PATCH /companies/co1/attendance/log1` -> `PERMISSION_DENIED`.
12. **PII & Impersonation in INSCO Community**: Any post/comment/opportunity under `/community_posts`, `/community_connections`, `/community_opportunities` MUST isolate PII (`authorUid == request.auth.uid` on create), force `isPinnedAnnouncement == false` for non-admins, and prevent spoofing `likesCount`/`commentsCount` outside bounded ±1 reaction/comment transitions.

