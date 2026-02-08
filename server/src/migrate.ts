import { pool } from './db';

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id         VARCHAR(20) PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS links (
  id          VARCHAR(20) PRIMARY KEY,
  category_id VARCHAR(20) NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  url         TEXT NOT NULL,
  icon_url    TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_links_category ON links(category_id, sort_order);
`;

export async function migrate() {
  console.log('Running database migrations...');
  await pool.query(MIGRATION_SQL);
  console.log('Migrations complete.');
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}
