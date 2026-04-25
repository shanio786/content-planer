import { client } from "./index";

const STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idea',
    url TEXT,
    traffic INTEGER NOT NULL DEFAULT 0,
    revenue REAL NOT NULL DEFAULT 0,
    next_task TEXT,
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    project_id INTEGER,
    date INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    completed INTEGER NOT NULL DEFAULT 0,
    project_id INTEGER,
    due_date INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idea',
    scheduled_date INTEGER,
    project_id INTEGER,
    description TEXT,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    pinned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    timestamp INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    niche TEXT NOT NULL,
    volume INTEGER NOT NULL DEFAULT 0,
    difficulty INTEGER NOT NULL DEFAULT 0,
    cpc REAL NOT NULL DEFAULT 0,
    competition TEXT NOT NULL DEFAULT 'low',
    position INTEGER,
    project_id INTEGER,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'researching',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS planner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    project_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planned',
    time_slot TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'tool',
    billing_cycle TEXT NOT NULL DEFAULT 'monthly',
    renewal_date TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS daily_focus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    slot INTEGER NOT NULL,
    title TEXT NOT NULL,
    project_id INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS daily_focus_date_slot_idx ON daily_focus (date, slot);`,
  `CREATE TABLE IF NOT EXISTS daily_reflection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    did_what TEXT,
    blocker TEXT,
    lesson TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS wins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    project_id INTEGER,
    created_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mission TEXT NOT NULL DEFAULT '',
    monthly_goal_amount REAL NOT NULL DEFAULT 3000,
    kill_warn_days INTEGER NOT NULL DEFAULT 30,
    kill_dead_days INTEGER NOT NULL DEFAULT 45,
    week_starts_on INTEGER NOT NULL DEFAULT 1,
    reflection_start_hour INTEGER NOT NULL DEFAULT 20,
    updated_at INTEGER NOT NULL
  );`,
];

export async function ensureSchema(): Promise<void> {
  await client.execute("PRAGMA foreign_keys = ON");
  for (const stmt of STATEMENTS) {
    await client.execute(stmt);
  }
  // Ensure the settings singleton row exists (id = 1).
  const now = Date.now();
  await client.execute({
    sql: "INSERT OR IGNORE INTO settings (id, mission, monthly_goal_amount, kill_warn_days, kill_dead_days, week_starts_on, reflection_start_hour, updated_at) VALUES (1, '', 3000, 30, 45, 1, 20, ?)",
    args: [now],
  });
}
