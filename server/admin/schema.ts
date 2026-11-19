export const ADMIN_SCHEMA = `
CREATE TABLE IF NOT EXISTS quotes (
  reference TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  service_type TEXT NOT NULL,
  received_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  project_location TEXT NOT NULL,
  description TEXT NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS quote_received ON quotes (received_at DESC, reference DESC);
CREATE TABLE IF NOT EXISTS announcement (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  ar TEXT NOT NULL,
  en TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS passkey_accounts (
  origin TEXT PRIMARY KEY,
  user_handle TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS passkeys (
  origin TEXT NOT NULL REFERENCES passkey_accounts(origin),
  credential_id TEXT NOT NULL,
  public_key BLOB NOT NULL,
  sign_count INTEGER NOT NULL CHECK (sign_count >= 0),
  label TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  PRIMARY KEY (origin, credential_id)
) STRICT;
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  origin TEXT NOT NULL,
  passkey_id TEXT,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS admin_session_scope ON admin_sessions (scope, issued_at DESC);
CREATE INDEX IF NOT EXISTS admin_session_expiry ON admin_sessions (expires_at);
CREATE INDEX IF NOT EXISTS admin_session_passkey ON admin_sessions (origin, passkey_id);
CREATE TABLE IF NOT EXISTS admin_challenges (
  token TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  payload TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS admin_challenge_scope ON admin_challenges (scope, issued_at DESC);
CREATE INDEX IF NOT EXISTS admin_challenge_expiry ON admin_challenges (expires_at);
CREATE TABLE IF NOT EXISTS admin_throttle (
  scope TEXT NOT NULL,
  purpose TEXT NOT NULL,
  address TEXT NOT NULL,
  hits INTEGER NOT NULL,
  resets_at INTEGER NOT NULL,
  checked_at INTEGER NOT NULL,
  PRIMARY KEY (scope, purpose, address)
) STRICT;
CREATE INDEX IF NOT EXISTS admin_throttle_expiry ON admin_throttle (resets_at);

-- Bound private state regardless of how many processes write it. A revoked key
-- loses all of its sessions in the same write, even when another worker issued them.
CREATE TRIGGER IF NOT EXISTS admin_revoke_passkey_sessions AFTER DELETE ON passkeys BEGIN
  DELETE FROM admin_sessions WHERE origin = OLD.origin AND passkey_id = OLD.credential_id;
END;
CREATE TRIGGER IF NOT EXISTS admin_bound_sessions AFTER INSERT ON admin_sessions BEGIN
  DELETE FROM admin_sessions WHERE expires_at <= NEW.issued_at;
  DELETE FROM admin_sessions WHERE token IN (
    SELECT token FROM admin_sessions WHERE scope = NEW.scope ORDER BY issued_at DESC, rowid DESC LIMIT -1 OFFSET 128
  );
END;
CREATE TRIGGER IF NOT EXISTS admin_bound_challenges AFTER INSERT ON admin_challenges BEGIN
  DELETE FROM admin_challenges WHERE expires_at <= NEW.issued_at;
  DELETE FROM admin_challenges WHERE token IN (
    SELECT token FROM admin_challenges WHERE scope = NEW.scope ORDER BY issued_at DESC, rowid DESC LIMIT -1 OFFSET 128
  );
END;
CREATE TRIGGER IF NOT EXISTS admin_prune_throttle AFTER INSERT ON admin_throttle BEGIN
  DELETE FROM admin_throttle WHERE resets_at <= NEW.checked_at;
END;
CREATE TRIGGER IF NOT EXISTS admin_prune_throttle_update AFTER UPDATE ON admin_throttle BEGIN
  DELETE FROM admin_throttle WHERE resets_at <= NEW.checked_at;
END;
`;
