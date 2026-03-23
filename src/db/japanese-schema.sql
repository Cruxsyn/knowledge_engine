-- Japanese Language Learning Schema
-- Association Web + FSRS SRS + Progress Tracking

-- ============================================================
-- CORE ITEM TABLES (learnable nodes in the association web)
-- ============================================================

-- Radicals / Components (building blocks of kanji)
CREATE TABLE IF NOT EXISTS jp_radicals (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL,
  meaning TEXT NOT NULL,
  alt_meanings TEXT,              -- JSON array of alternative meanings
  stroke_count INTEGER NOT NULL DEFAULT 1,
  mnemonic TEXT,                  -- Story/image for remembering
  frequency_rank INTEGER,        -- How often this appears in kanji
  position_hint TEXT,             -- 'left', 'right', 'top', 'bottom', 'enclosure', 'any'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kanji characters
CREATE TABLE IF NOT EXISTS jp_kanji (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL UNIQUE,
  meanings TEXT NOT NULL,          -- JSON array: ["mountain", "hill"]
  on_readings TEXT,                -- JSON array: ["サン", "セン"]
  kun_readings TEXT,               -- JSON array: ["やま"]
  stroke_count INTEGER NOT NULL DEFAULT 1,
  jlpt_level INTEGER,             -- 5=N5 (easiest) to 1=N1 (hardest)
  grade INTEGER,                  -- School grade (1-6 for kyoiku, 8 for remaining joyo)
  frequency_rank INTEGER,         -- 1-2500 (most frequent kanji)
  mnemonic_meaning TEXT,          -- Story for remembering the meaning
  mnemonic_reading TEXT,          -- Story for remembering the reading
  phonetic_component TEXT,        -- The component that hints at on'yomi reading
  semantic_component TEXT,        -- The component that hints at meaning category
  sort_order INTEGER,             -- Learning order (topological + frequency)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kanji-to-radical decomposition (DAG edges)
CREATE TABLE IF NOT EXISTS jp_kanji_components (
  kanji_id TEXT NOT NULL,
  component_id TEXT NOT NULL,     -- radical or another kanji
  component_type TEXT NOT NULL DEFAULT 'radical',  -- 'radical' or 'kanji'
  position TEXT,                  -- Where in the kanji this component appears
  PRIMARY KEY (kanji_id, component_id),
  FOREIGN KEY (kanji_id) REFERENCES jp_kanji(id) ON DELETE CASCADE
);

-- Vocabulary words
CREATE TABLE IF NOT EXISTS jp_vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,              -- Written form (kanji + kana mix)
  reading TEXT NOT NULL,           -- Full hiragana reading
  meanings TEXT NOT NULL,          -- JSON array: ["dog", "puppy"]
  part_of_speech TEXT,             -- 'noun', 'verb-ichidan', 'verb-godan', 'i-adjective', 'na-adjective', 'adverb', etc.
  jlpt_level INTEGER,
  frequency_rank INTEGER,
  pitch_accent TEXT,               -- Accent pattern notation
  conjugation_class TEXT,          -- For verbs: 'ichidan', 'godan-u', 'godan-ku', 'irregular', etc.
  notes TEXT,                      -- Usage notes, nuance
  sort_order INTEGER,              -- Learning order
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Vocabulary-to-kanji mapping (which kanji appear in this word)
CREATE TABLE IF NOT EXISTS jp_vocab_kanji (
  vocab_id TEXT NOT NULL,
  kanji_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,  -- Position in the word
  PRIMARY KEY (vocab_id, kanji_id, position),
  FOREIGN KEY (vocab_id) REFERENCES jp_vocabulary(id) ON DELETE CASCADE,
  FOREIGN KEY (kanji_id) REFERENCES jp_kanji(id) ON DELETE CASCADE
);

-- Grammar patterns
CREATE TABLE IF NOT EXISTS jp_grammar (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,           -- The grammar pattern: "〜ている"
  meaning TEXT NOT NULL,           -- English explanation
  formation TEXT,                  -- How to construct: "Verb て-form + いる"
  jlpt_level INTEGER,
  examples TEXT,                   -- JSON array of {jp, en, notes} objects
  related_grammar TEXT,            -- JSON array of related grammar IDs
  notes TEXT,                      -- Nuance, usage tips, common mistakes
  sort_order INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Example sentences
CREATE TABLE IF NOT EXISTS jp_sentences (
  id TEXT PRIMARY KEY,
  japanese TEXT NOT NULL,
  english TEXT,
  tokens TEXT,                     -- JSON: tokenized form [{surface, lemma, reading, pos}]
  difficulty_score REAL,           -- jReadability score
  source TEXT,                     -- Where this sentence came from
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Sentence-to-vocabulary mapping
CREATE TABLE IF NOT EXISTS jp_sentence_vocab (
  sentence_id TEXT NOT NULL,
  vocab_id TEXT NOT NULL,
  PRIMARY KEY (sentence_id, vocab_id),
  FOREIGN KEY (sentence_id) REFERENCES jp_sentences(id) ON DELETE CASCADE,
  FOREIGN KEY (vocab_id) REFERENCES jp_vocabulary(id) ON DELETE CASCADE
);

-- ============================================================
-- ASSOCIATION WEB (edges connecting nodes)
-- ============================================================

CREATE TABLE IF NOT EXISTS jp_associations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,       -- 'radical' | 'kanji' | 'word' | 'grammar' | 'sentence'
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  category TEXT NOT NULL,          -- 'semantic' | 'phonological' | 'orthographic' | 'collocational' | 'grammatical' | 'mnemonic'
  relation TEXT NOT NULL,          -- Specific relation: 'SYNONYM', 'SHARED_RADICAL', 'CONTAINS_COMPONENT', etc.
  weight REAL NOT NULL DEFAULT 0.5, -- Association strength 0-1
  bidirectional INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,                   -- JSON for extra data
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- FSRS SRS STATE (per-card spaced repetition)
-- ============================================================

CREATE TABLE IF NOT EXISTS jp_srs_cards (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,         -- 'radical' | 'kanji' | 'word' | 'grammar'
  card_type TEXT NOT NULL,         -- 'meaning' | 'reading' | 'recall' | 'listening'
  -- FSRS state fields
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  state INTEGER NOT NULL DEFAULT 0,  -- 0=New, 1=Learning, 2=Review, 3=Relearning
  due TEXT NOT NULL DEFAULT (datetime('now')),
  last_review TEXT,
  -- Association-aware fields
  implicit_boost REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Review history (for FSRS optimization and analytics)
CREATE TABLE IF NOT EXISTS jp_review_log (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  rating INTEGER NOT NULL,         -- 1=Again, 2=Hard, 3=Good, 4=Easy
  state INTEGER NOT NULL,          -- Card state at time of review
  elapsed_days INTEGER NOT NULL DEFAULT 0,
  scheduled_days INTEGER NOT NULL DEFAULT 0,
  reviewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  duration_ms INTEGER,             -- Time taken to answer
  FOREIGN KEY (card_id) REFERENCES jp_srs_cards(id) ON DELETE CASCADE
);

-- ============================================================
-- LEARNER STATE (known words, progress, preferences)
-- ============================================================

-- Global known-word tracking (updated across all activities)
CREATE TABLE IF NOT EXISTS jp_known_words (
  lemma TEXT PRIMARY KEY,
  reading TEXT,
  mastery_level TEXT NOT NULL DEFAULT 'unknown',  -- 'unknown' | 'seen' | 'learning' | 'known' | 'mastered'
  encounter_count INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_encountered TEXT NOT NULL DEFAULT (datetime('now')),
  source TEXT                      -- Where first encountered: 'srs', 'reading', 'import'
);

-- Ghost reviews (leech management, Bunpro-inspired)
CREATE TABLE IF NOT EXISTS jp_ghosts (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  fail_count INTEGER NOT NULL DEFAULT 1,
  ghost_interval REAL NOT NULL DEFAULT 0.5,  -- Days until next ghost review
  ghost_due TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES jp_srs_cards(id) ON DELETE CASCADE
);

-- Multidimensional progress tracking
CREATE TABLE IF NOT EXISTS jp_progress (
  dimension TEXT PRIMARY KEY,      -- 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening'
  current_level REAL NOT NULL DEFAULT 0,   -- 0-5 (maps to JLPT N5-N1)
  items_total INTEGER NOT NULL DEFAULT 0,
  items_learning INTEGER NOT NULL DEFAULT 0,
  items_known INTEGER NOT NULL DEFAULT 0,
  items_mastered INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0,
  last_study_date TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Study session log (for heat maps and analytics)
CREATE TABLE IF NOT EXISTS jp_study_sessions (
  id TEXT PRIMARY KEY,
  session_date TEXT NOT NULL,      -- YYYY-MM-DD
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  cards_reviewed INTEGER NOT NULL DEFAULT 0,
  cards_new INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0, -- 0-1
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User settings for SRS
CREATE TABLE IF NOT EXISTS jp_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Association web indexes (critical for graph traversal)
CREATE INDEX IF NOT EXISTS idx_jp_assoc_source ON jp_associations(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_jp_assoc_target ON jp_associations(target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_jp_assoc_category ON jp_associations(category);
CREATE INDEX IF NOT EXISTS idx_jp_assoc_relation ON jp_associations(relation);

-- SRS indexes (critical for review scheduling)
CREATE INDEX IF NOT EXISTS idx_jp_srs_due ON jp_srs_cards(due);
CREATE INDEX IF NOT EXISTS idx_jp_srs_state ON jp_srs_cards(state);
CREATE INDEX IF NOT EXISTS idx_jp_srs_item ON jp_srs_cards(item_id, item_type);
CREATE INDEX IF NOT EXISTS idx_jp_srs_type ON jp_srs_cards(card_type);

-- Item indexes
CREATE INDEX IF NOT EXISTS idx_jp_kanji_jlpt ON jp_kanji(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_jp_kanji_sort ON jp_kanji(sort_order);
CREATE INDEX IF NOT EXISTS idx_jp_kanji_freq ON jp_kanji(frequency_rank);
CREATE INDEX IF NOT EXISTS idx_jp_vocab_jlpt ON jp_vocabulary(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_jp_vocab_sort ON jp_vocabulary(sort_order);
CREATE INDEX IF NOT EXISTS idx_jp_grammar_jlpt ON jp_grammar(jlpt_level);
CREATE INDEX IF NOT EXISTS idx_jp_known_mastery ON jp_known_words(mastery_level);
CREATE INDEX IF NOT EXISTS idx_jp_components_kanji ON jp_kanji_components(kanji_id);
CREATE INDEX IF NOT EXISTS idx_jp_components_comp ON jp_kanji_components(component_id);
CREATE INDEX IF NOT EXISTS idx_jp_review_card ON jp_review_log(card_id);
CREATE INDEX IF NOT EXISTS idx_jp_review_date ON jp_review_log(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_jp_sessions_date ON jp_study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_jp_sentence_diff ON jp_sentences(difficulty_score);
