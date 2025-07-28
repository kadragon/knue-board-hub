-- KNUE Board Hub - Cloudflare D1 Database Schema
-- Created for managing board information and future user data

-- Departments/Boards Configuration
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  rss_url TEXT NOT NULL,
  bbs_no INTEGER NOT NULL,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RSS Feed Cache
CREATE TABLE rss_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  department_id TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT NOT NULL,
  description TEXT,
  pub_date DATETIME NOT NULL,
  content TEXT,
  hash TEXT UNIQUE NOT NULL, -- MD5 hash for deduplication
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- Application Settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Future: Users table (for Google OAuth)
CREATE TABLE users (
  id TEXT PRIMARY KEY, -- Google sub claim
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  locale TEXT DEFAULT 'ko',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Future: User Preferences
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  selected_departments TEXT, -- JSON array of department IDs
  notifications_enabled BOOLEAN DEFAULT 0,
  theme TEXT DEFAULT 'light', -- light, dark, auto
  language TEXT DEFAULT 'ko',
  items_per_page INTEGER DEFAULT 20,
  auto_refresh BOOLEAN DEFAULT 0,
  group_by_date BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Future: User Bookmarks
CREATE TABLE user_bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  rss_item_id INTEGER NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (rss_item_id) REFERENCES rss_cache(id),
  UNIQUE(user_id, rss_item_id)
);

-- Future: User Read History
CREATE TABLE user_read_history (
  user_id TEXT NOT NULL,
  rss_item_id INTEGER NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (rss_item_id) REFERENCES rss_cache(id),
  PRIMARY KEY (user_id, rss_item_id)
);

-- Indexes for performance
CREATE INDEX idx_rss_cache_department ON rss_cache(department_id);
CREATE INDEX idx_rss_cache_pub_date ON rss_cache(pub_date DESC);
CREATE INDEX idx_rss_cache_hash ON rss_cache(hash);
CREATE INDEX idx_user_bookmarks_user ON user_bookmarks(user_id);
CREATE INDEX idx_user_read_history_user ON user_read_history(user_id);