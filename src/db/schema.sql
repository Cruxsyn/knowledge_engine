-- Knowledge Engine Database Schema
-- Version 1

-- Sources table - tracks where knowledge comes from
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  url TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Captures table - inbox for raw captures
CREATE TABLE IF NOT EXISTS captures (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'thought',
  source_id TEXT,
  content TEXT NOT NULL DEFAULT '',
  why_saved TEXT,
  topic TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
);

-- Atomic Notes table - distilled knowledge atoms
CREATE TABLE IF NOT EXISTS atomic_notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'other',
  content TEXT NOT NULL DEFAULT '{}',
  confidence INTEGER NOT NULL DEFAULT 3,
  source_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_reviewed TEXT,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
);

-- Concepts table - core knowledge nodes
CREATE TABLE IF NOT EXISTS concepts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  definition TEXT NOT NULL DEFAULT '',
  intuition TEXT,
  pitfalls TEXT,
  mastery TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Links table - relationships between concepts
CREATE TABLE IF NOT EXISTS links (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationship TEXT NOT NULL,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES concepts(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id) REFERENCES concepts(id) ON DELETE CASCADE,
  UNIQUE(source_id, target_id, relationship)
);

-- Junction table: concepts <-> atomic_notes
CREATE TABLE IF NOT EXISTS concept_notes (
  concept_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  PRIMARY KEY (concept_id, note_id),
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES atomic_notes(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

-- Entity tags junction table (polymorphic)
CREATE TABLE IF NOT EXISTS entity_tags (
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (entity_id, entity_type, tag_id),
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_captures_status ON captures(status);
CREATE INDEX IF NOT EXISTS idx_captures_priority ON captures(priority);
CREATE INDEX IF NOT EXISTS idx_captures_created ON captures(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_confidence ON atomic_notes(confidence);
CREATE INDEX IF NOT EXISTS idx_notes_created ON atomic_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concepts_mastery ON concepts(mastery);
CREATE INDEX IF NOT EXISTS idx_concepts_name ON concepts(name);
CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);

-- Insert initial schema version
INSERT OR IGNORE INTO schema_version (version) VALUES (1);
