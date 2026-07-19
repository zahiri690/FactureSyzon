-- Schéma D1 pour FactureSyzon
-- Exécuter avec : npx wrangler d1 execute facturesyzon-db --remote --file=./db/schema.sql

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL
);

-- Identifiants par défaut : admin / Syzon@2025 (à changer depuis l'application après le premier déploiement)
INSERT OR IGNORE INTO admin (id, username, password_hash)
VALUES (1, 'admin', 'bebd615fff73c8e9c65de9544cf9ab62b3b5e1e8a09353fa4155fbf1ad763f4f');

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
