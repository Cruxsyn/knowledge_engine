# Arkvim Language Learning System: Research Synthesis & Architecture Proposal

## Executive Summary

This document synthesizes findings from 6 parallel research domains into a unified architecture for adding Japanese language learning to Arkvim. The system is built around **association webs** — multiplex semantic networks that mirror how the brain stores and retrieves language — combined with state-of-the-art spaced repetition (FSRS), evidence-based pedagogy, and Arkvim's existing knowledge graph infrastructure.

The core thesis: **Language is not a list to memorize, it's a network to grow.** Every word, kanji, radical, grammar point, and concept exists as a node in a densely interconnected graph. Learning is the process of expanding and strengthening this network. The system should make this network visible, navigable, and algorithmically optimized.

---

## Part 1: The Science (What Works)

### 1.1 Memory & Retention

| Principle | Evidence | Implication |
|-----------|----------|-------------|
| **FSRS > SM-2** | 99.6% superiority in benchmarks, 20-30% fewer reviews | Use ts-fsrs (npm package) as SRS engine |
| **Testing effect** | 50% better retention than re-reading despite 75% less exposure | Every interaction must be active recall, never passive review |
| **Elaborative encoding** | 88% recall (associations) vs 28% (rote) | Build dense connections at time of learning, not after |
| **Desirable difficulties** | Reviewing at near-forgetting produces largest stability gains | FSRS naturally optimizes for this; don't make learning "easy" |
| **Interleaving** | 50-125% improvement on novel problems vs blocked practice | Mix kanji/vocab/grammar in reviews; block only for absolute beginners |
| **Dual coding** | Combined verbal+visual mnemonics significantly outperform either alone | Every kanji needs both a story (verbal) and component visualization (visual) |
| **Chunking** | True working memory is ~4 items; experts build larger chunks | Teach radicals as reusable chunks; limit new items to 3-4 per lesson |
| **Spacing** | Optimal gap ≈ 10-20% of desired retention interval | FSRS handles this; key is consistency over intensity |
| **Generation effect** | Producing answers improves recall 40% over reading them | Type-in answers, not multiple choice; produce before recognize |
| **Schema theory** | New info attaches to existing frameworks; isolated facts are lost | Never introduce orphan items; always connect to ≥2 known items |

### 1.2 How the Brain Stores Language

The mental lexicon is a **multiplex network** with 3 layers (Levelt's model):
1. **Concept layer** — semantic meaning
2. **Lemma layer** — morphosyntactic properties (word class, conjugation, particles)
3. **Lexeme layer** — phonological and orthographic form

Key properties:
- **Small-world structure** — high clustering, short path lengths
- **Scale-free degree distribution** — a few hub words have many connections; most words have few
- **Spreading activation** — activating one node primes connected nodes
- **Preferential acquisition** — new words are learned faster when they connect to many already-known words

**Critical finding for Japanese**: Japanese speakers produce predominantly **syntagmatic** associations (collocational: "drink → beer") vs English speakers who favor **paradigmatic** associations (categorical: "dog → cat"). The association web must weight collocational relationships more heavily than for European languages.

### 1.3 L2 Acquisition Path

The Revised Hierarchical Model shows L2 learners initially access meaning via L1 mediation:
```
Early:    犬 → "dog" → [concept]
Advanced: 犬 → [concept]
```

The system should support progressive L1 withdrawal:
- Beginners: English glosses + Japanese context
- Intermediate (~3,000 words): Monolingual Japanese definitions + English backup
- Advanced: Japanese-only definitions, example sentences, collocations

---

## Part 2: Japanese-Specific Architecture

### 2.1 The Writing System Challenge

Japanese has 3 scripts with compounding complexity:
- **Hiragana** (46 chars) — grammatical glue, native words
- **Katakana** (46 chars) — loanwords, emphasis, onomatopoeia
- **Kanji** (2,136 jōyō) — semantic content words

**Coverage data** (kanji frequency research):
| Kanji Known | Text Coverage |
|-------------|---------------|
| 100 | ~45% |
| 300 | ~72% |
| 500 | ~80% |
| 777 | 90% |
| 1,000 | ~96% |
| 1,477 | 98% |
| 2,136 | ~99.9% |

### 2.2 The Phonetic Component Insight

**80-90% of jōyō kanji are phono-semantic compounds.** ~150 phonetic components enable reading prediction for ~25% of encountered words. This is a massive efficiency lever:

Example: Component 青 (せい/しょう) appears in:
- 清 (せい) — pure
- 晴 (せい) — clear weather
- 精 (せい) — spirit/essence
- 請 (せい) — request
- 情 (じょう) — emotion (variant reading)

The system should explicitly model phonetic component series and surface them during learning.

### 2.3 Reading Rules for Kanji

For most kanji, **one reading covers 80-90% of vocabulary** containing that character:
| Context | Expected Reading |
|---------|------------------|
| Multi-kanji compound (熟語) | On'yomi |
| Standalone kanji | Kun'yomi |
| Kanji + okurigana (verb/adj) | Kun'yomi |

Teaching the dominant reading first, then exceptions, follows the 80/20 principle.

### 2.4 Compound Word Composability

Jukugo meanings are often composable, creating accelerating returns:
- 火 + 山 = 火山 (volcano) — fire + mountain
- 入 + 口 = 入口 (entrance) — enter + mouth
- 外 + 国 + 人 = 外国人 (foreigner) — outside + country + person

This means each new kanji "unlocks" multiple compound words, and the system should surface these compositional patterns.

### 2.5 Pitch Accent

Japanese is a pitch-accent language (not tonal like Chinese, not stress-based like English). 4 patterns exist:
- **Heiban (flat)** [0] — most common, safest default
- **Atamadaka (head-high)** [1]
- **Nakadaka (middle-high)** [2+]
- **Odaka (tail-high)** [n]

Classic minimal pair: はし = 箸 chopsticks (HL) / 橋 bridge (LH-drop) / 端 edge (LH-stay)

### 2.6 Grammar Essentials

- SOV word order with flexible positioning via particles
- Particle system (は/が/を/に/で/と/から/まで/の/も)
- Verb conjugation: ichidan (1-step) and godan (5-step), only 2 irregulars (する, 来る)
- Adjective types: i-adjectives (conjugate independently) and na-adjectives (copula-dependent)
- Politeness levels: casual → polite (ます/です) → honorific/humble (keigo)
- Relative clauses: prenominal modification with no relative pronouns

---

## Part 3: The Association Web Architecture

### 3.1 Multiplex Network Model

The association web is a **multiplex graph** with 6 layers, mirroring how the brain organizes the mental lexicon:

```
Layer 1: SEMANTIC
  ├── synonym, antonym, hypernym, hyponym, co-hyponym
  ├── meronym (part-of), holonym (has-part)
  └── thematic (same scene/domain)

Layer 2: PHONOLOGICAL
  ├── homophone, minimal pair
  ├── pitch accent pair
  └── shared mora pattern

Layer 3: ORTHOGRAPHIC
  ├── shared radical
  ├── shared phonetic component
  ├── contains component (DAG)
  └── visually similar

Layer 4: COLLOCATIONAL
  ├── verb-object pairs (電話をかける)
  ├── adjective-noun pairs (強い風)
  └── compound word constituents (学+校=学校)

Layer 5: GRAMMATICAL
  ├── same conjugation class
  ├── same particle governance
  ├── transitive-intransitive pair
  └── same grammar pattern

Layer 6: MNEMONIC
  ├── user-created story links
  ├── shared mnemonic characters
  └── component-meaning stories
```

### 3.2 Node Types

```typescript
type NodeType = 'radical' | 'kanji' | 'word' | 'grammar' | 'concept' | 'mnemonic';

interface LearningNode {
  id: string;
  type: NodeType;
  // Common properties
  jlpt_level: 1 | 2 | 3 | 4 | 5;
  frequency_rank?: number;
  // Mastery tracking
  srs_state: FSRSState;       // FSRS card state
  mastery: MasteryLevel;       // unknown → learning → solid → teachable
  // Type-specific data (discriminated union)
  data: RadicalData | KanjiData | WordData | GrammarData;
}
```

### 3.3 Edge Types (Full Taxonomy)

```typescript
type EdgeCategory = 'semantic' | 'phonological' | 'orthographic' | 'collocational' | 'grammatical' | 'mnemonic';

interface AssociationEdge {
  source: string;
  target: string;
  category: EdgeCategory;
  relation: string;        // e.g., 'SYNONYM', 'SHARED_RADICAL', 'VERB_OBJECT'
  weight: number;          // 0-1, strength of association
  bidirectional: boolean;  // true for synonym/antonym; false for hypernym/contains
}
```

### 3.4 Graph Traversal Strategies

**A. Component-First (Kanji Learning)**
Topological sort on the component DAG ensures radicals → simple kanji → complex kanji. Uses modified Kahn's algorithm with frequency-based tiebreaking (TopoKanji approach).

**B. Hub-First (Vocabulary Bootstrapping)**
Identify high-centrality words (degree + betweenness centrality). Teach these first because they:
- Connect the most other words
- Create the densest initial network
- Enable preferential acquisition of subsequent words

**C. Neighborhood Expansion (Daily Learning)**
For each candidate word w:
```
score(w) = Σ weight(w, k) for k in known_words
```
Select highest-scoring candidates. This implements preferential acquisition — new words enter the lexicon when they connect to many already-known words.

**D. Adaptive Interleaving (Review)**
- Beginners: block by semantic cluster (all food words, then transport)
- Intermediate+: interleave across clusters (mix food, transport, emotions)
- Transition is gradual and data-driven based on learner performance

**E. Spreading Activation (Review Scheduling)**
When word A is reviewed, propagate partial activation to connected words:
```
stability_boost(B) = α × weight(A, B)
```
This implements content-aware SRS: strongly connected words get implicit reinforcement and can have their reviews delayed.

### 3.5 FSRS + Association-Aware Scheduling

Extend FSRS with three association-aware mechanisms:

**1. Stability Propagation**
When card A is successfully recalled:
```
S_b(t+) = S_b(t) × (1 + α × weight(A, B))
```

**2. Interference Detection**
Build semantic interference matrix from word embeddings. When two confusable words are both due for review, schedule them in the same session with explicit comparison prompts.

**3. Trickle-Down Review**
Reviewing 電車 (train) implicitly reinforces its components 電 and 車. Update their stability estimates accordingly.

### 3.6 Orphan Prevention Rule

**Never introduce a word with fewer than 2 connections to already-known words.** If no such word exists in the lesson queue, first teach a "bridge" word that creates the necessary connections. This is supported by Matuschak's research showing orphan prompts feel burdensome and are harder to retain.

---

## Part 4: Data Sources & Integration

### 4.1 Available Open Data

| Source | Content | Format | License |
|--------|---------|--------|---------|
| **JMDict** | ~200,000 word entries with readings, meanings, POS, cross-refs | XML | CC BY-SA 3.0 |
| **KANJIDIC2** | 13,108 kanji with readings, meanings, stroke count, frequency, grade, JLPT | XML | CC BY-SA 3.0 |
| **KRADFILE** | Kanji → radical decomposition mapping | Text | Free |
| **KanjiVG** | Stroke-level SVG data for ~3,000 kanji | SVG/XML | CC BY-SA 3.0 |
| **CJK Decomposition** | Visual decomposition of ~75,000 CJK characters | Text | Open |
| **Tatoeba** | Sentence pairs (JP↔EN and many others) | TSV | CC BY 2.0 |
| **Kanji Frequency** | Usage frequency across Aozora, News, Twitter, Wikipedia | JSON | CC BY 4.0 |
| **JLPT Lists** | Vocabulary/kanji organized by N5→N1 | JSON | Open |
| **ConceptNet 5.5** | 36 relation types, 8M nodes, 21M edges, multilingual (includes JP) | JSON/API | CC BY-SA 4.0 |

### 4.2 Client-Side NLP

| Tool | Purpose | Package |
|------|---------|---------|
| **kuromoji.js** | Japanese tokenization (morphological analysis) | `@sglkc/kuromoji` (npm) |
| **ts-fsrs** | FSRS-6 spaced repetition engine | `ts-fsrs` (npm) |
| **jReadability** | Text difficulty scoring | Port formula to TypeScript |

### 4.3 Data Pipeline (Build Time)

```
JMDict XML ─────────┐
KANJIDIC2 XML ──────┤
KRADFILE ───────────┤──→ Build Script ──→ SQLite/JSON Bundle
CJK Decomp ────────┤                      ├── vocabulary.db
Kanji Frequency ────┤                      ├── kanji_dag.json
JLPT Lists ────────┤                      ├── component_order.json
Tatoeba ────────────┘                      ├── sentences.db
                                           └── association_edges.json
```

Process at build time into compact formats loadable by sql.js (which Arkvim already uses).

---

## Part 5: The Learning Pipeline

### 5.1 Stage Progression

Based on synthesized research from immersion methods, cognitive science, and community validation:

```
Stage 0: BOOTSTRAP (Week 1)
├── Learn hiragana (3-4 days)
├── Learn katakana (3-4 days)
├── System setup & orientation
└── Milestone: Can read all kana

Stage 1: FOUNDATION (Months 1-3, ~150-300 hours)
├── Core vocabulary: Kaishi 1.5k equivalent (15-20 new/day)
├── Grammar: Basic particles, verb conjugation, adjectives
├── Radicals: Learn ~100 most frequent components
├── Kanji: ~300 kanji through vocabulary context
├── Immersion: 1-2 hours/day (anime with JP subs, graded readers)
└── Milestone: Basic sentence comprehension, ~80% text coverage

Stage 2: EXPANSION (Months 3-8, ~300-800 hours)
├── Vocabulary: Sentence mining from immersion (10-15 new/day)
├── Grammar: Intermediate patterns, compound sentences
├── Kanji: ~700 kanji (90% text coverage)
├── Reading: Manga with furigana, graded readers
├── Association web becomes primary learning interface
└── Milestone: Read simple manga, ~85% comprehension of slice-of-life

Stage 3: COMPREHENSION (Months 8-18, ~800-1,500 hours)
├── Vocabulary: Mining intensification (15-20 new/day)
├── Grammar: Advanced patterns via Bunpro-style SRS
├── Kanji: ~1,000 kanji (96% coverage)
├── Monolingual transition begins (~3,000 known words)
├── Reading: Light novels, visual novels
└── Milestone: Read first novel, JLPT N3 equivalent

Stage 4: FLUENCY (Months 18-30, ~1,500-2,500 hours)
├── Full monolingual definitions
├── Kanji: ~1,500+ kanji (98% coverage)
├── All content types accessible
└── Milestone: JLPT N2-N1 equivalent
```

### 5.2 Review Modality Escalation

As SRS stage increases, review difficulty escalates:

| SRS Stage | Modality | Example |
|-----------|----------|---------|
| New/Learning | Recognition (multiple choice) | See 犬, pick "dog" from 4 options |
| Apprentice | Typed recognition | See 犬, type "dog" |
| Guru | Cloze production | "I walked the ___" → 犬 |
| Master | Contextual production | "What animal says わんわん?" → 犬 |
| Enlightened | Full production | English → Japanese typed answer |

### 5.3 i+1 Sentence Detection

```typescript
function detectI1(sentence: string, knownVocab: Set<string>): I1Result {
  const tokens = tokenize(sentence);  // kuromoji.js
  const contentWords = tokens.filter(isContentWord);
  const unknown = contentWords.filter(w => !knownVocab.has(w.lemma));

  if (unknown.length === 0) return { type: 'known', value: 0 };
  if (unknown.length === 1) return { type: 'i+1', target: unknown[0] };
  if (unknown.length === 2 && contentWords.length > 10)
    return { type: 'i+2', targets: unknown };
  return { type: 'too_hard', unknownCount: unknown.length };
}
```

### 5.4 Text Difficulty Scoring

Port the validated jReadability formula:
```typescript
function jReadability(text: string): number {
  const stats = analyzeText(text); // kuromoji tokenization + classification
  return (
    stats.meanWordsPerSentence * -0.056 +
    stats.kangoPercentage * -0.126 +
    stats.wagoPercentage * -0.042 +
    stats.verbPercentage * -0.145 +
    stats.particlePercentage * -0.044 +
    11.724
  );
}
// Score ranges: 0.5-1.5 (upper-advanced) to 5.5-6.5 (lower-elementary)
```

---

## Part 6: UX Architecture

### 6.1 Core Differentiation

The market is fragmented: learners use 2-4 tools (WaniKani + Bunpro + Anki + Language Reactor). Arkvim unifies:
- WaniKani's **decomposition + mnemonics** (without rigid/punishing SRS)
- Bunpro's **grammar SRS with ghost reviews**
- Migaku's **closed-loop known-word tracking**
- LingQ's **color-coded word states on real text**
- Anki's **FSRS algorithm** (via ts-fsrs)
- A navigable **association web visualization** that no existing tool provides

### 6.2 Known-Word Database

Every interaction updates a global known-word database:
- SRS reviews → word mastery updates
- Reading practice → word encounters tracked
- Grammar drills → pattern mastery updates

This database drives:
- i+1 sentence selection
- Text difficulty personalization
- Unknown word highlighting in any content
- Progress visualization

### 6.3 Association Web Visualization

The knowledge graph (which Arkvim already has for concepts) extends to language:
- **Nodes** colored by mastery: red (unknown) → yellow (learning) → green (solid) → blue (teachable)
- **Edges** colored by type: semantic (purple), phonological (orange), orthographic (blue), collocational (green)
- **Interactive exploration**: click any node to see all connections, drill into related items
- **Kanji decomposition trees**: visual breakdown showing components → kanji → compounds
- **Phonetic component clusters**: groups of kanji sharing the same reading predictor

### 6.4 Progress Visualization

- **Radar chart**: Vocabulary / Kanji / Grammar / Reading / Listening dimensions
- **Heat map calendar**: Daily study consistency (GitHub-style)
- **JLPT progress bars**: Per-level completion tracking
- **Known-word overlay**: Real Japanese text with color-coded word states
- **Network growth animation**: Watch the association web grow over time

### 6.5 Gamification (Evidence-Based)

Research shows gamification effect size g = 0.822 when combining mechanics + dynamics + aesthetics.

**DO:**
- Points/XP tied to mastery demonstrations (items reaching Guru, grammar drills at 80%+)
- Streaks that reward engagement with difficult material, not just daily login
- Achievement badges for concrete milestones (first 100 kanji, N5 grammar complete)
- Level-ups gated by demonstrated knowledge

**DON'T:**
- Allow XP grinding on easy content
- Use leaderboards comparing time-spent rather than progress
- Make gamification the primary motivation (it should scaffold intrinsic motivation)
- Add romaji/transliteration crutches

---

## Part 7: Technical Implementation Plan

### 7.1 Integration with Existing Arkvim

Arkvim already has:
- sql.js (in-browser SQLite) with IndexedDB persistence
- Concept graphs with mastery tracking
- Learning paths with modules, lessons, progress
- Custom markdown with term links, inline definitions
- Zustand state management
- React Router navigation

The language learning system extends these:
- **New database tables** for the association web (nodes, edges, learner state)
- **New pages**: Japanese Dashboard, SRS Review, Association Explorer, Reading Practice
- **Extended concept graph**: Language nodes integrate with existing concept nodes
- **New hooks**: `useJapanese()`, `useSRS()`, `useAssociationWeb()`

### 7.2 Database Schema Extensions

```sql
-- Node tables (learnable items)
CREATE TABLE jp_radicals (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL,
  meaning TEXT NOT NULL,
  stroke_count INTEGER,
  mnemonic TEXT,
  frequency_rank INTEGER
);

CREATE TABLE jp_kanji (
  id TEXT PRIMARY KEY,
  character TEXT NOT NULL UNIQUE,
  meanings TEXT NOT NULL,        -- JSON array
  on_readings TEXT,              -- JSON array
  kun_readings TEXT,             -- JSON array
  stroke_count INTEGER,
  jlpt_level INTEGER,
  grade INTEGER,
  frequency_rank INTEGER,
  mnemonic_meaning TEXT,
  mnemonic_reading TEXT,
  pitch_accent TEXT
);

CREATE TABLE jp_vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  reading TEXT NOT NULL,         -- hiragana
  meanings TEXT NOT NULL,        -- JSON array
  part_of_speech TEXT,
  jlpt_level INTEGER,
  frequency_rank INTEGER,
  pitch_accent TEXT,
  example_sentences TEXT,        -- JSON array of sentence IDs
  notes TEXT
);

CREATE TABLE jp_grammar (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  meaning TEXT NOT NULL,
  jlpt_level INTEGER,
  formation TEXT,                -- How to construct it
  examples TEXT,                 -- JSON array
  notes TEXT,
  related_grammar TEXT           -- JSON array of related grammar IDs
);

CREATE TABLE jp_sentences (
  id TEXT PRIMARY KEY,
  japanese TEXT NOT NULL,
  english TEXT,
  tokens TEXT,                   -- JSON: tokenized form with readings
  difficulty_score REAL,
  source TEXT
);

-- Association web edges
CREATE TABLE jp_associations (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL,     -- 'radical' | 'kanji' | 'word' | 'grammar'
  target_id TEXT NOT NULL,
  target_type TEXT NOT NULL,
  category TEXT NOT NULL,        -- 'semantic' | 'phonological' | 'orthographic' | etc.
  relation TEXT NOT NULL,        -- 'SYNONYM' | 'SHARED_RADICAL' | 'CONTAINS_COMPONENT' | etc.
  weight REAL DEFAULT 0.5,
  bidirectional INTEGER DEFAULT 0
);

-- Learner state (FSRS)
CREATE TABLE jp_srs_cards (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,       -- 'radical' | 'kanji' | 'word' | 'grammar'
  card_type TEXT NOT NULL,       -- 'meaning' | 'reading' | 'production' | 'listening'
  -- FSRS state
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  elapsed_days INTEGER DEFAULT 0,
  scheduled_days INTEGER DEFAULT 0,
  reps INTEGER DEFAULT 0,
  lapses INTEGER DEFAULT 0,
  state INTEGER DEFAULT 0,      -- 0=New, 1=Learning, 2=Review, 3=Relearning
  due TEXT,
  last_review TEXT,
  -- Association-aware fields
  last_implicit_activation TEXT,  -- Last time activated via spreading activation
  implicit_boost REAL DEFAULT 0   -- Accumulated stability boost from related reviews
);

-- Known word tracking
CREATE TABLE jp_known_words (
  lemma TEXT PRIMARY KEY,
  first_seen TEXT,
  mastery_level TEXT DEFAULT 'unknown',  -- unknown | learning | solid | teachable
  encounter_count INTEGER DEFAULT 0,
  last_encountered TEXT
);

-- Review history (for FSRS optimization)
CREATE TABLE jp_review_log (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  rating INTEGER NOT NULL,       -- 1=Again, 2=Hard, 3=Good, 4=Easy
  reviewed_at TEXT NOT NULL,
  elapsed_days INTEGER,
  scheduled_days INTEGER,
  state INTEGER
);

-- Learner progress dimensions
CREATE TABLE jp_progress (
  dimension TEXT PRIMARY KEY,    -- 'vocabulary' | 'kanji' | 'grammar' | 'reading' | 'listening'
  current_level REAL DEFAULT 0,
  target_level REAL DEFAULT 0,
  items_total INTEGER DEFAULT 0,
  items_mastered INTEGER DEFAULT 0,
  updated_at TEXT
);

-- Ghost reviews (leech management, inspired by Bunpro)
CREATE TABLE jp_ghosts (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  fail_count INTEGER DEFAULT 1,
  ghost_stability REAL,
  ghost_due TEXT,
  created_at TEXT
);

-- Indexes for performance
CREATE INDEX idx_associations_source ON jp_associations(source_id, source_type);
CREATE INDEX idx_associations_target ON jp_associations(target_id, target_type);
CREATE INDEX idx_associations_category ON jp_associations(category);
CREATE INDEX idx_srs_due ON jp_srs_cards(due);
CREATE INDEX idx_srs_state ON jp_srs_cards(state);
CREATE INDEX idx_srs_item ON jp_srs_cards(item_id, item_type);
CREATE INDEX idx_known_words_mastery ON jp_known_words(mastery_level);
CREATE INDEX idx_review_log_card ON jp_review_log(card_id);
CREATE INDEX idx_kanji_jlpt ON jp_kanji(jlpt_level);
CREATE INDEX idx_vocab_jlpt ON jp_vocabulary(jlpt_level);
CREATE INDEX idx_grammar_jlpt ON jp_grammar(jlpt_level);
```

### 7.3 Core Algorithms

```
1. ts-fsrs          → SRS scheduling (npm package, production-ready)
2. kuromoji.js      → Japanese tokenization (npm package, browser-compatible)
3. Kahn's algorithm → Kanji component ordering (custom, ~50 lines)
4. Neighborhood expansion → Next-word recommendation (custom, ~30 lines)
5. Spreading activation → Association-aware review boost (custom, ~40 lines)
6. jReadability     → Text difficulty scoring (port formula, ~20 lines)
7. i+1 detection    → Sentence difficulty for known vocab (custom, ~30 lines)
8. BKT simplified   → Skill-level mastery tracking (custom, ~50 lines)
```

### 7.4 npm Dependencies to Add

```
ts-fsrs            — FSRS-6 spaced repetition engine
@sglkc/kuromoji    — Japanese morphological analyzer (browser-compatible)
```

All other functionality is custom implementation using existing Arkvim infrastructure (sql.js, D3/graph visualization, React, Zustand, Tailwind).

### 7.5 Key Pages/Components

```
/japanese                    — Dashboard: progress radar, streak, due reviews, weak areas
/japanese/review             — SRS review session (FSRS-scheduled cards)
/japanese/explore            — Association web explorer (interactive graph)
/japanese/explore/:nodeId    — Deep dive into a specific node's connections
/japanese/kanji              — Kanji browser with decomposition trees
/japanese/kanji/:id          — Individual kanji page with component breakdown
/japanese/vocabulary         — Vocabulary browser with semantic clusters
/japanese/grammar            — Grammar patterns with SRS integration
/japanese/read               — Reading practice with known-word highlighting
/japanese/read/:textId       — Individual text with inline dictionary
/japanese/settings           — SRS settings, desired retention, daily limits
```

---

## Part 8: What Makes This Different

### vs WaniKani
- Association web shows WHY kanji connect, not just WHAT to learn next
- FSRS adapts to you; WaniKani's fixed intervals punish and frustrate
- Vocabulary, grammar, reading integrated — not kanji-only
- Phonetic component patterns surfaced explicitly

### vs Anki
- Zero-configuration defaults with guided workflow
- Association web provides context that raw flashcards lack
- Built-in tokenization, i+1 detection, difficulty scoring
- No analysis paralysis over card templates and settings

### vs Bunpro
- Grammar integrated with vocabulary and kanji, not isolated
- Association web connects grammar patterns to vocabulary they govern
- Reading practice reinforces grammar in context

### vs Duolingo
- Depth over engagement; desirable difficulty over gamified ease
- Association web makes learning structure visible
- No crutches (romaji, multiple choice only)
- Evidence-based gamification tied to mastery, not activity

### vs All of Them
- **Unified known-word database** across all activities
- **Navigable association web** showing the structure of what you know
- **Content-aware SRS** where related items reinforce each other
- **Integrated with Arkvim's knowledge management** — language learning connects to your broader concept graph

---

## Sources

### Cognitive Science
- Ebbinghaus forgetting curve (1885), replicated Murre & Dros 2015 (PLOS ONE)
- Craik & Lockhart depth of processing (1972)
- Paivio dual coding theory (1960s-70s)
- Collins & Loftus spreading activation (1975)
- Bjork desirable difficulties (1994)
- Roediger & Karpicke testing effect (2006)
- Cowan working memory capacity ~4 items (2001)
- Dunlosky et al. learning techniques ranking (2013)
- Cepeda et al. optimal spacing meta-analysis (2006)

### SRS & Algorithms
- FSRS: github.com/open-spaced-repetition/ts-fsrs
- FSRS benchmarks: expertium.github.io/Benchmark.html
- Duolingo Half-Life Regression: github.com/duolingo/halflife-regression
- KARL content-aware SR: giacomoran.com/blog/content-aware-sr/
- LECTOR semantic interference: arxiv.org/html/2508.03275v1
- TopoKanji: github.com/scriptin/topokanji

### Japanese Language Data
- JMDict: edrdg.org/jmdict/edict.html
- KANJIDIC2: edrdg.org/kanjidic/kanjd2index_legacy.html
- KRADFILE: edrdg.org/krad/kradinf.html
- KanjiVG: kanjivg.tagaini.net
- Tatoeba: tatoeba.org
- Kanji Frequency: scriptin.github.io/kanji-frequency/
- ConceptNet 5.5: arxiv.org/abs/1612.03975

### Association Web Research
- Mental lexicon small-world structure (PMC 10907441)
- L2 lexical-semantic network development (Nature, 2023)
- Preferential acquisition (PMC 4216730)
- Word association norms: smallworldofwords.org
- Mnemonic medium: Andy Matuschak & Michael Nielsen
- Mind-mapping for vocabulary (PMC 10220411)
- Cognitive maps and knowledge navigation (PMC 7746605)

### Immersion Methods
- AJATT (Khatzumoto, 2006)
- Refold Roadmap (refold.la)
- James Maa N1 in 20 months case study
- Targeted Sentence Cards community consensus
- Monolingual transition methodology

### Learning UX
- WaniKani community feedback analysis
- Bunpro ghost review system
- Migaku closed-loop known-word tracking
- LingQ color-coded word states
- Gamification meta-analysis (Frontiers in Psychology, 41 studies, g=0.822)
- Contextual vocabulary learning (PMC 9285746)

### Mnemonic Generation
- Interpretable Mnemonic Generation for Kanji (EMNLP 2025, arxiv.org/abs/2507.05137)
- 148,411 learner-authored mnemonics from Koohii Kanji platform
