-- Peak Learning Database Schema

-- Learning Paths (curricula)
CREATE TABLE IF NOT EXISTS learning_paths (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Modules within a path
CREATE TABLE IF NOT EXISTS learning_modules (
  id TEXT PRIMARY KEY,
  path_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
);

-- Lessons (the actual content pages)
CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  estimated_minutes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (module_id) REFERENCES learning_modules(id) ON DELETE CASCADE
);

-- Junction: concepts taught/referenced in a lesson
CREATE TABLE IF NOT EXISTS lesson_concepts (
  lesson_id TEXT NOT NULL,
  concept_id TEXT NOT NULL,
  PRIMARY KEY (lesson_id, concept_id),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE
);

-- Inline term definitions
CREATE TABLE IF NOT EXISTS lesson_terms (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  concept_id TEXT,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id TEXT PRIMARY KEY,
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  scroll_position REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_learning_modules_path ON learning_modules(path_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_terms_lesson ON lesson_terms(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed);
