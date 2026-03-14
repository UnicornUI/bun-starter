import { sqlite } from './index';

export function initializeDatabase(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      title TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      data TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      sub_session_id INTEGER NOT NULL REFERENCES sessions(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      data TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS msg_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL REFERENCES messages(id),
      type TEXT NOT NULL,
      content TEXT,
      metadata TEXT,
      end_time INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_parent_id ON sessions(parent_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_agent_id ON sessions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sub_session_id ON messages(sub_session_id);
    CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON messages(parent_id);
    CREATE INDEX IF NOT EXISTS idx_msg_parts_message_id ON msg_parts(message_id);
  `);
}

if (require.main === module) {
  console.log('Initializing database...');
  initializeDatabase();
  console.log('Database initialized successfully!');
}
