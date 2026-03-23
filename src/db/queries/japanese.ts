import { query, queryOne, execute, transaction } from '@/db/database'
import { nanoid } from 'nanoid'
import type {
  JpRadical,
  JpKanji,
  JpVocabulary,
  JpGrammar,
  JpSentence,
  JpAssociation,
  JpSrsCard,
  JpReviewLog,
  JpKnownWord,
  JpGhost,
  JpProgress,
  JpStudySession,
  JpGraphData,
  JpGraphNode,
  JpGraphEdge,
  JpDashboardStats,
  JpItemType,
  JpCardType,
  JpSrsState,
  JpAssociationCategory,
  JpAssociationRelation,
  JpMasteryLevel,
} from '@/types'

// ============================================================
// Row types (raw DB rows before JSON parsing)
// ============================================================

interface RadicalRow {
  id: string
  character: string
  meaning: string
  alt_meanings: string | null
  stroke_count: number
  mnemonic: string | null
  frequency_rank: number | null
  position_hint: string | null
  created_at: string
}

interface KanjiRow {
  id: string
  character: string
  meanings: string
  on_readings: string | null
  kun_readings: string | null
  stroke_count: number
  jlpt_level: number | null
  grade: number | null
  frequency_rank: number | null
  mnemonic_meaning: string | null
  mnemonic_reading: string | null
  phonetic_component: string | null
  semantic_component: string | null
  sort_order: number | null
  created_at: string
}

interface VocabularyRow {
  id: string
  word: string
  reading: string
  meanings: string
  part_of_speech: string | null
  jlpt_level: number | null
  frequency_rank: number | null
  pitch_accent: string | null
  conjugation_class: string | null
  notes: string | null
  sort_order: number | null
  created_at: string
}

interface GrammarRow {
  id: string
  pattern: string
  meaning: string
  formation: string | null
  jlpt_level: number | null
  examples: string | null
  related_grammar: string | null
  notes: string | null
  sort_order: number | null
  created_at: string
}

interface SentenceRow {
  id: string
  japanese: string
  english: string | null
  tokens: string | null
  difficulty_score: number | null
  source: string | null
  created_at: string
}

interface AssociationRow {
  id: string
  source_id: string
  source_type: string
  target_id: string
  target_type: string
  category: string
  relation: string
  weight: number
  bidirectional: number
  metadata: string | null
  created_at: string
}

interface SrsCardRow {
  id: string
  item_id: string
  item_type: string
  card_type: string
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: number
  due: string
  last_review: string | null
  implicit_boost: number
  created_at: string
}

interface ReviewLogRow {
  id: string
  card_id: string
  rating: number
  state: number
  elapsed_days: number
  scheduled_days: number
  reviewed_at: string
  duration_ms: number | null
}

interface KnownWordRow {
  lemma: string
  reading: string | null
  mastery_level: string
  encounter_count: number
  first_seen: string
  last_encountered: string
  source: string | null
}

interface GhostRow {
  id: string
  card_id: string
  fail_count: number
  ghost_interval: number
  ghost_due: string
  created_at: string
}

interface ProgressRow {
  dimension: string
  current_level: number
  items_total: number
  items_learning: number
  items_known: number
  items_mastered: number
  daily_streak: number
  last_study_date: string | null
  updated_at: string
}

interface StudySessionRow {
  id: string
  session_date: string
  duration_minutes: number
  cards_reviewed: number
  cards_new: number
  accuracy: number
  created_at: string
}

interface ComponentRow {
  component_id: string
  component_type: string
  position: string | null
}

// ============================================================
// Row converters
// ============================================================

function rowToRadical(row: RadicalRow): JpRadical {
  return {
    id: row.id,
    character: row.character,
    meaning: row.meaning,
    alt_meanings: JSON.parse(row.alt_meanings as string || '[]'),
    stroke_count: row.stroke_count,
    mnemonic: row.mnemonic || undefined,
    frequency_rank: row.frequency_rank || undefined,
    position_hint: row.position_hint || undefined,
    created_at: row.created_at,
  }
}

function rowToKanji(row: KanjiRow): JpKanji {
  return {
    id: row.id,
    character: row.character,
    meanings: JSON.parse(row.meanings as string || '[]'),
    on_readings: JSON.parse(row.on_readings as string || '[]'),
    kun_readings: JSON.parse(row.kun_readings as string || '[]'),
    stroke_count: row.stroke_count,
    jlpt_level: row.jlpt_level || undefined,
    grade: row.grade || undefined,
    frequency_rank: row.frequency_rank || undefined,
    mnemonic_meaning: row.mnemonic_meaning || undefined,
    mnemonic_reading: row.mnemonic_reading || undefined,
    phonetic_component: row.phonetic_component || undefined,
    semantic_component: row.semantic_component || undefined,
    sort_order: row.sort_order || undefined,
    created_at: row.created_at,
  }
}

function rowToVocabulary(row: VocabularyRow): JpVocabulary {
  return {
    id: row.id,
    word: row.word,
    reading: row.reading,
    meanings: JSON.parse(row.meanings as string || '[]'),
    part_of_speech: row.part_of_speech || undefined,
    jlpt_level: row.jlpt_level || undefined,
    frequency_rank: row.frequency_rank || undefined,
    pitch_accent: row.pitch_accent || undefined,
    conjugation_class: row.conjugation_class || undefined,
    notes: row.notes || undefined,
    sort_order: row.sort_order || undefined,
    created_at: row.created_at,
  }
}

function rowToGrammar(row: GrammarRow): JpGrammar {
  return {
    id: row.id,
    pattern: row.pattern,
    meaning: row.meaning,
    formation: row.formation || undefined,
    jlpt_level: row.jlpt_level || undefined,
    examples: JSON.parse(row.examples as string || '[]'),
    related_grammar: JSON.parse(row.related_grammar as string || '[]'),
    notes: row.notes || undefined,
    sort_order: row.sort_order || undefined,
    created_at: row.created_at,
  }
}

function rowToSentence(row: SentenceRow): JpSentence {
  return {
    id: row.id,
    japanese: row.japanese,
    english: row.english || undefined,
    tokens: JSON.parse(row.tokens as string || '[]'),
    difficulty_score: row.difficulty_score || undefined,
    source: row.source || undefined,
    created_at: row.created_at,
  }
}

function rowToAssociation(row: AssociationRow): JpAssociation {
  return {
    id: row.id,
    source_id: row.source_id,
    source_type: row.source_type as JpItemType | 'sentence',
    target_id: row.target_id,
    target_type: row.target_type as JpItemType | 'sentence',
    category: row.category as JpAssociationCategory,
    relation: row.relation as JpAssociationRelation,
    weight: row.weight,
    bidirectional: row.bidirectional === 1,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    created_at: row.created_at,
  }
}

function rowToSrsCard(row: SrsCardRow): JpSrsCard {
  return {
    id: row.id,
    item_id: row.item_id,
    item_type: row.item_type as JpItemType,
    card_type: row.card_type as JpCardType,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state as JpSrsState,
    due: row.due,
    last_review: row.last_review || undefined,
    implicit_boost: row.implicit_boost,
    created_at: row.created_at,
  }
}

function rowToReviewLog(row: ReviewLogRow): JpReviewLog {
  return {
    id: row.id,
    card_id: row.card_id,
    rating: row.rating as 1 | 2 | 3 | 4,
    state: row.state as JpSrsState,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    reviewed_at: row.reviewed_at,
    duration_ms: row.duration_ms || undefined,
  }
}

function rowToKnownWord(row: KnownWordRow): JpKnownWord {
  return {
    lemma: row.lemma,
    reading: row.reading || undefined,
    mastery_level: row.mastery_level as JpMasteryLevel,
    encounter_count: row.encounter_count,
    first_seen: row.first_seen,
    last_encountered: row.last_encountered,
    source: row.source || undefined,
  }
}

function rowToGhost(row: GhostRow): JpGhost {
  return {
    id: row.id,
    card_id: row.card_id,
    fail_count: row.fail_count,
    ghost_interval: row.ghost_interval,
    ghost_due: row.ghost_due,
    created_at: row.created_at,
  }
}

function rowToProgress(row: ProgressRow): JpProgress {
  return {
    dimension: row.dimension as JpProgress['dimension'],
    current_level: row.current_level,
    items_total: row.items_total,
    items_learning: row.items_learning,
    items_known: row.items_known,
    items_mastered: row.items_mastered,
    daily_streak: row.daily_streak,
    last_study_date: row.last_study_date || undefined,
    updated_at: row.updated_at,
  }
}

function rowToStudySession(row: StudySessionRow): JpStudySession {
  return {
    id: row.id,
    session_date: row.session_date,
    duration_minutes: row.duration_minutes,
    cards_reviewed: row.cards_reviewed,
    cards_new: row.cards_new,
    accuracy: row.accuracy,
    created_at: row.created_at,
  }
}

// ============================================================
// Radicals
// ============================================================

export function getAllRadicals(): JpRadical[] {
  const rows = query<RadicalRow>('SELECT * FROM jp_radicals ORDER BY stroke_count ASC, frequency_rank ASC')
  return rows.map(rowToRadical)
}

export function getRadicalById(id: string): JpRadical | null {
  const row = queryOne<RadicalRow>('SELECT * FROM jp_radicals WHERE id = ?', [id])
  return row ? rowToRadical(row) : null
}

export function createRadical(data: Omit<JpRadical, 'id' | 'created_at'>): JpRadical {
  const id = nanoid()
  execute(
    `INSERT INTO jp_radicals (id, character, meaning, alt_meanings, stroke_count, mnemonic, frequency_rank, position_hint)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.character, data.meaning,
      JSON.stringify(data.alt_meanings || []),
      data.stroke_count,
      data.mnemonic || null,
      data.frequency_rank || null,
      data.position_hint || null,
    ]
  )
  return getRadicalById(id)!
}

// ============================================================
// Kanji
// ============================================================

export function getAllKanji(jlptLevel?: number): JpKanji[] {
  if (jlptLevel !== undefined) {
    const rows = query<KanjiRow>(
      'SELECT * FROM jp_kanji WHERE jlpt_level = ? ORDER BY sort_order ASC, frequency_rank ASC',
      [jlptLevel]
    )
    return rows.map(rowToKanji)
  }
  const rows = query<KanjiRow>('SELECT * FROM jp_kanji ORDER BY sort_order ASC, frequency_rank ASC')
  return rows.map(rowToKanji)
}

export function getKanjiById(id: string): JpKanji | null {
  const row = queryOne<KanjiRow>('SELECT * FROM jp_kanji WHERE id = ?', [id])
  return row ? rowToKanji(row) : null
}

export function getKanjiByCharacter(char: string): JpKanji | null {
  const row = queryOne<KanjiRow>('SELECT * FROM jp_kanji WHERE character = ?', [char])
  return row ? rowToKanji(row) : null
}

export function getKanjiComponents(kanjiId: string): { component: JpRadical | JpKanji; type: string; position?: string }[] {
  const rows = query<ComponentRow>(
    'SELECT component_id, component_type, position FROM jp_kanji_components WHERE kanji_id = ?',
    [kanjiId]
  )
  return rows.map(row => {
    if (row.component_type === 'radical') {
      const radical = getRadicalById(row.component_id)
      return { component: radical!, type: 'radical', position: row.position || undefined }
    }
    const kanji = getKanjiById(row.component_id)
    return { component: kanji!, type: 'kanji', position: row.position || undefined }
  }).filter(c => c.component !== null)
}

export function createKanji(data: Omit<JpKanji, 'id' | 'created_at'>): JpKanji {
  const id = nanoid()
  execute(
    `INSERT INTO jp_kanji (id, character, meanings, on_readings, kun_readings, stroke_count,
      jlpt_level, grade, frequency_rank, mnemonic_meaning, mnemonic_reading,
      phonetic_component, semantic_component, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.character,
      JSON.stringify(data.meanings),
      JSON.stringify(data.on_readings || []),
      JSON.stringify(data.kun_readings || []),
      data.stroke_count,
      data.jlpt_level || null,
      data.grade || null,
      data.frequency_rank || null,
      data.mnemonic_meaning || null,
      data.mnemonic_reading || null,
      data.phonetic_component || null,
      data.semantic_component || null,
      data.sort_order || null,
    ]
  )
  return getKanjiById(id)!
}

// ============================================================
// Vocabulary
// ============================================================

export function getAllVocabulary(jlptLevel?: number): JpVocabulary[] {
  if (jlptLevel !== undefined) {
    const rows = query<VocabularyRow>(
      'SELECT * FROM jp_vocabulary WHERE jlpt_level = ? ORDER BY sort_order ASC, frequency_rank ASC',
      [jlptLevel]
    )
    return rows.map(rowToVocabulary)
  }
  const rows = query<VocabularyRow>('SELECT * FROM jp_vocabulary ORDER BY sort_order ASC, frequency_rank ASC')
  return rows.map(rowToVocabulary)
}

export function getVocabById(id: string): JpVocabulary | null {
  const row = queryOne<VocabularyRow>('SELECT * FROM jp_vocabulary WHERE id = ?', [id])
  return row ? rowToVocabulary(row) : null
}

export function getVocabForKanji(kanjiId: string): JpVocabulary[] {
  const rows = query<VocabularyRow>(
    `SELECT v.* FROM jp_vocabulary v
     INNER JOIN jp_vocab_kanji vk ON v.id = vk.vocab_id
     WHERE vk.kanji_id = ?
     ORDER BY v.frequency_rank ASC`,
    [kanjiId]
  )
  return rows.map(rowToVocabulary)
}

export function createVocabulary(data: Omit<JpVocabulary, 'id' | 'created_at'>): JpVocabulary {
  const id = nanoid()
  execute(
    `INSERT INTO jp_vocabulary (id, word, reading, meanings, part_of_speech, jlpt_level,
      frequency_rank, pitch_accent, conjugation_class, notes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.word, data.reading,
      JSON.stringify(data.meanings),
      data.part_of_speech || null,
      data.jlpt_level || null,
      data.frequency_rank || null,
      data.pitch_accent || null,
      data.conjugation_class || null,
      data.notes || null,
      data.sort_order || null,
    ]
  )
  return getVocabById(id)!
}

// ============================================================
// Grammar
// ============================================================

export function getAllGrammar(jlptLevel?: number): JpGrammar[] {
  if (jlptLevel !== undefined) {
    const rows = query<GrammarRow>(
      'SELECT * FROM jp_grammar WHERE jlpt_level = ? ORDER BY sort_order ASC',
      [jlptLevel]
    )
    return rows.map(rowToGrammar)
  }
  const rows = query<GrammarRow>('SELECT * FROM jp_grammar ORDER BY sort_order ASC')
  return rows.map(rowToGrammar)
}

export function getGrammarById(id: string): JpGrammar | null {
  const row = queryOne<GrammarRow>('SELECT * FROM jp_grammar WHERE id = ?', [id])
  return row ? rowToGrammar(row) : null
}

export function createGrammar(data: Omit<JpGrammar, 'id' | 'created_at'>): JpGrammar {
  const id = nanoid()
  execute(
    `INSERT INTO jp_grammar (id, pattern, meaning, formation, jlpt_level, examples, related_grammar, notes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.pattern, data.meaning,
      data.formation || null,
      data.jlpt_level || null,
      JSON.stringify(data.examples || []),
      JSON.stringify(data.related_grammar || []),
      data.notes || null,
      data.sort_order || null,
    ]
  )
  return getGrammarById(id)!
}

// ============================================================
// Sentences
// ============================================================

export function getSentencesForVocab(vocabId: string): JpSentence[] {
  const rows = query<SentenceRow>(
    `SELECT s.* FROM jp_sentences s
     INNER JOIN jp_sentence_vocab sv ON s.id = sv.sentence_id
     WHERE sv.vocab_id = ?
     ORDER BY s.difficulty_score ASC`,
    [vocabId]
  )
  return rows.map(rowToSentence)
}

export function createSentence(data: Omit<JpSentence, 'id' | 'created_at'>): JpSentence {
  const id = nanoid()
  execute(
    `INSERT INTO jp_sentences (id, japanese, english, tokens, difficulty_score, source)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      id, data.japanese,
      data.english || null,
      JSON.stringify(data.tokens || []),
      data.difficulty_score || null,
      data.source || null,
    ]
  )
  return { id, ...data, created_at: new Date().toISOString() }
}

// ============================================================
// Associations
// ============================================================

export function getAssociationsForNode(nodeId: string, nodeType: JpItemType | 'sentence'): JpAssociation[] {
  const rows = query<AssociationRow>(
    `SELECT * FROM jp_associations
     WHERE (source_id = ? AND source_type = ?)
        OR (target_id = ? AND target_type = ? AND bidirectional = 1)
     ORDER BY weight DESC`,
    [nodeId, nodeType, nodeId, nodeType]
  )
  return rows.map(rowToAssociation)
}

export function createAssociation(data: Omit<JpAssociation, 'id' | 'created_at'>): JpAssociation {
  const id = nanoid()
  execute(
    `INSERT INTO jp_associations (id, source_id, source_type, target_id, target_type, category, relation, weight, bidirectional, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.source_id, data.source_type,
      data.target_id, data.target_type,
      data.category, data.relation,
      data.weight,
      data.bidirectional ? 1 : 0,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ]
  )
  return { id, ...data, created_at: new Date().toISOString() }
}

export function getGraphData(centerId: string, centerType: JpItemType, depth: number): JpGraphData {
  const visitedIds = new Set<string>()
  const nodes: JpGraphNode[] = []
  const edges: JpGraphEdge[] = []

  // BFS frontier: [{id, type}]
  let frontier: { id: string; type: JpItemType | 'sentence' }[] = [{ id: centerId, type: centerType }]

  for (let d = 0; d <= depth && frontier.length > 0; d++) {
    const nextFrontier: { id: string; type: JpItemType | 'sentence' }[] = []

    for (const { id, type } of frontier) {
      const key = `${type}:${id}`
      if (visitedIds.has(key)) continue
      visitedIds.add(key)

      // Skip sentence nodes for graph display
      if (type === 'sentence') continue

      // Resolve node label/mastery from the item table
      const node = resolveGraphNode(id, type)
      if (node) nodes.push(node)

      // Get associations from this node
      const assocs = query<AssociationRow>(
        `SELECT * FROM jp_associations
         WHERE (source_id = ? AND source_type = ?)
            OR (target_id = ? AND target_type = ?)
         ORDER BY weight DESC`,
        [id, type, id, type]
      )

      for (const row of assocs) {
        const assoc = rowToAssociation(row)
        // Determine the neighbor
        const isSource = assoc.source_id === id && assoc.source_type === type
        const isTarget = assoc.target_id === id && assoc.target_type === type

        if (isSource || (isTarget && assoc.bidirectional)) {
          const neighborId = isSource ? assoc.target_id : assoc.source_id
          const neighborType = isSource ? assoc.target_type : assoc.source_type
          const neighborKey = `${neighborType}:${neighborId}`

          if (!visitedIds.has(neighborKey)) {
            nextFrontier.push({ id: neighborId, type: neighborType })
          }

          // Add edge (avoid duplicates)
          const edgeExists = edges.some(
            e => (e.source === assoc.source_id && e.target === assoc.target_id && e.relation === assoc.relation)
          )
          if (!edgeExists) {
            edges.push({
              source: assoc.source_id,
              target: assoc.target_id,
              category: assoc.category,
              relation: assoc.relation,
              weight: assoc.weight,
            })
          }
        }
      }
    }

    frontier = nextFrontier
  }

  return { nodes, edges }
}

function resolveGraphNode(id: string, type: JpItemType): JpGraphNode | null {
  switch (type) {
    case 'radical': {
      const r = getRadicalById(id)
      if (!r) return null
      return { id, type: 'radical', label: r.character, sublabel: r.meaning, mastery: 'unknown' }
    }
    case 'kanji': {
      const k = getKanjiById(id)
      if (!k) return null
      // Look up mastery from SRS cards
      const mastery = getItemMastery(id, 'kanji')
      return { id, type: 'kanji', label: k.character, sublabel: k.meanings[0], mastery, jlpt_level: k.jlpt_level }
    }
    case 'word': {
      const v = getVocabById(id)
      if (!v) return null
      const mastery = getItemMastery(id, 'word')
      return { id, type: 'word', label: v.word, sublabel: v.meanings[0], mastery, jlpt_level: v.jlpt_level }
    }
    case 'grammar': {
      const g = getGrammarById(id)
      if (!g) return null
      const mastery = getItemMastery(id, 'grammar')
      return { id, type: 'grammar', label: g.pattern, sublabel: g.meaning, mastery, jlpt_level: g.jlpt_level }
    }
    default:
      return null
  }
}

function getItemMastery(itemId: string, itemType: JpItemType): JpMasteryLevel {
  const card = queryOne<{ state: number; reps: number; lapses: number }>(
    'SELECT state, reps, lapses FROM jp_srs_cards WHERE item_id = ? AND item_type = ? LIMIT 1',
    [itemId, itemType]
  )
  if (!card) return 'unknown'
  if (card.state === 0) return 'unknown'
  if (card.state === 1 || card.state === 3) return 'learning'
  // state === 2 (Review): use reps to distinguish known vs mastered
  if (card.reps >= 5 && card.lapses === 0) return 'mastered'
  return 'known'
}

// ============================================================
// SRS Cards
// ============================================================

export function getDueCards(limit: number = 50): JpSrsCard[] {
  const rows = query<SrsCardRow>(
    `SELECT * FROM jp_srs_cards
     WHERE state > 0 AND due <= datetime('now')
     ORDER BY due ASC
     LIMIT ?`,
    [limit]
  )
  return rows.map(rowToSrsCard)
}

export function getNewCards(itemType?: JpItemType, limit: number = 20): JpSrsCard[] {
  if (itemType) {
    const rows = query<SrsCardRow>(
      `SELECT * FROM jp_srs_cards
       WHERE state = 0 AND item_type = ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [itemType, limit]
    )
    return rows.map(rowToSrsCard)
  }
  const rows = query<SrsCardRow>(
    `SELECT * FROM jp_srs_cards
     WHERE state = 0
     ORDER BY created_at ASC
     LIMIT ?`,
    [limit]
  )
  return rows.map(rowToSrsCard)
}

export function createSrsCard(data: Omit<JpSrsCard, 'id' | 'created_at'>): JpSrsCard {
  const id = nanoid()
  execute(
    `INSERT INTO jp_srs_cards (id, item_id, item_type, card_type, stability, difficulty,
      elapsed_days, scheduled_days, reps, lapses, state, due, last_review, implicit_boost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, data.item_id, data.item_type, data.card_type,
      data.stability, data.difficulty,
      data.elapsed_days, data.scheduled_days,
      data.reps, data.lapses,
      data.state, data.due,
      data.last_review || null,
      data.implicit_boost,
    ]
  )
  return getSrsCardById(id)!
}

export function updateSrsCard(id: string, state: Partial<Omit<JpSrsCard, 'id' | 'created_at'>>): void {
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (state.stability !== undefined) { fields.push('stability = ?'); values.push(state.stability) }
  if (state.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(state.difficulty) }
  if (state.elapsed_days !== undefined) { fields.push('elapsed_days = ?'); values.push(state.elapsed_days) }
  if (state.scheduled_days !== undefined) { fields.push('scheduled_days = ?'); values.push(state.scheduled_days) }
  if (state.reps !== undefined) { fields.push('reps = ?'); values.push(state.reps) }
  if (state.lapses !== undefined) { fields.push('lapses = ?'); values.push(state.lapses) }
  if (state.state !== undefined) { fields.push('state = ?'); values.push(state.state) }
  if (state.due !== undefined) { fields.push('due = ?'); values.push(state.due) }
  if (state.last_review !== undefined) { fields.push('last_review = ?'); values.push(state.last_review) }
  if (state.implicit_boost !== undefined) { fields.push('implicit_boost = ?'); values.push(state.implicit_boost) }

  if (fields.length === 0) return

  values.push(id)
  execute(`UPDATE jp_srs_cards SET ${fields.join(', ')} WHERE id = ?`, values)
}

export function getCardWithItemData(cardId: string): (JpSrsCard & { item: JpRadical | JpKanji | JpVocabulary | JpGrammar }) | null {
  const card = getSrsCardById(cardId)
  if (!card) return null

  let item: JpRadical | JpKanji | JpVocabulary | JpGrammar | null = null
  switch (card.item_type) {
    case 'radical': item = getRadicalById(card.item_id); break
    case 'kanji': item = getKanjiById(card.item_id); break
    case 'word': item = getVocabById(card.item_id); break
    case 'grammar': item = getGrammarById(card.item_id); break
  }

  if (!item) return null
  return { ...card, item }
}

function getSrsCardById(id: string): JpSrsCard | null {
  const row = queryOne<SrsCardRow>('SELECT * FROM jp_srs_cards WHERE id = ?', [id])
  return row ? rowToSrsCard(row) : null
}

// ============================================================
// Review Log
// ============================================================

export function addReviewLog(data: Omit<JpReviewLog, 'id' | 'reviewed_at'>): JpReviewLog {
  const id = nanoid()
  execute(
    `INSERT INTO jp_review_log (id, card_id, rating, state, elapsed_days, scheduled_days, duration_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, data.card_id, data.rating, data.state, data.elapsed_days, data.scheduled_days, data.duration_ms || null]
  )
  return { id, ...data, reviewed_at: new Date().toISOString() }
}

export function getTodayReviewCount(): number {
  const row = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM jp_review_log
     WHERE date(reviewed_at) = date('now')`,
    []
  )
  return row?.count ?? 0
}

export function getTodayAccuracy(): number {
  const row = queryOne<{ total: number; correct: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as correct
     FROM jp_review_log
     WHERE date(reviewed_at) = date('now')`,
    []
  )
  if (!row || row.total === 0) return 0
  return row.correct / row.total
}

// ============================================================
// Known Words
// ============================================================

export function getKnownWord(lemma: string): JpKnownWord | null {
  const row = queryOne<KnownWordRow>('SELECT * FROM jp_known_words WHERE lemma = ?', [lemma])
  return row ? rowToKnownWord(row) : null
}

export function updateKnownWord(lemma: string, data: Partial<Omit<JpKnownWord, 'lemma'>>): void {
  const existing = getKnownWord(lemma)
  const now = new Date().toISOString()

  if (!existing) {
    execute(
      `INSERT INTO jp_known_words (lemma, reading, mastery_level, encounter_count, first_seen, last_encountered, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        lemma,
        data.reading || null,
        data.mastery_level || 'seen',
        data.encounter_count || 1,
        now,
        now,
        data.source || null,
      ]
    )
  } else {
    const fields: string[] = ['last_encountered = ?']
    const values: (string | number | null)[] = [now]

    if (data.reading !== undefined) { fields.push('reading = ?'); values.push(data.reading || null) }
    if (data.mastery_level !== undefined) { fields.push('mastery_level = ?'); values.push(data.mastery_level) }
    if (data.encounter_count !== undefined) { fields.push('encounter_count = ?'); values.push(data.encounter_count) }
    if (data.source !== undefined) { fields.push('source = ?'); values.push(data.source || null) }

    values.push(lemma)
    execute(`UPDATE jp_known_words SET ${fields.join(', ')} WHERE lemma = ?`, values)
  }
}

export function getKnownWordCount(): number {
  const row = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM jp_known_words WHERE mastery_level IN ('known', 'mastered')`,
    []
  )
  return row?.count ?? 0
}

export function getAllKnownLemmas(): string[] {
  const rows = query<{ lemma: string }>(
    `SELECT lemma FROM jp_known_words WHERE mastery_level IN ('known', 'mastered')`,
    []
  )
  return rows.map(r => r.lemma)
}

// ============================================================
// Ghosts
// ============================================================

export function getGhostsDue(limit: number = 10): JpGhost[] {
  const rows = query<GhostRow>(
    `SELECT * FROM jp_ghosts
     WHERE ghost_due <= datetime('now')
     ORDER BY ghost_due ASC
     LIMIT ?`,
    [limit]
  )
  return rows.map(rowToGhost)
}

export function createOrUpdateGhost(cardId: string): void {
  const existing = queryOne<GhostRow>(
    'SELECT * FROM jp_ghosts WHERE card_id = ?',
    [cardId]
  )

  if (existing) {
    execute(
      `UPDATE jp_ghosts
       SET fail_count = fail_count + 1,
           ghost_interval = ghost_interval * 1.5,
           ghost_due = datetime('now', '+' || CAST(ROUND(ghost_interval * 1.5 * 24 * 60) AS TEXT) || ' minutes')
       WHERE card_id = ?`,
      [cardId]
    )
  } else {
    const id = nanoid()
    execute(
      `INSERT INTO jp_ghosts (id, card_id, fail_count, ghost_interval, ghost_due)
       VALUES (?, ?, 1, 0.5, datetime('now', '+12 hours'))`,
      [id, cardId]
    )
  }
}

export function removeGhost(cardId: string): void {
  execute('DELETE FROM jp_ghosts WHERE card_id = ?', [cardId])
}

// ============================================================
// Progress
// ============================================================

export function getProgress(): JpProgress[] {
  const rows = query<ProgressRow>('SELECT * FROM jp_progress ORDER BY dimension ASC')
  return rows.map(rowToProgress)
}

export function updateProgress(dimension: JpProgress['dimension'], data: Partial<Omit<JpProgress, 'dimension' | 'updated_at'>>): void {
  const now = new Date().toISOString()
  const existing = queryOne<ProgressRow>('SELECT * FROM jp_progress WHERE dimension = ?', [dimension])

  if (!existing) {
    execute(
      `INSERT INTO jp_progress (dimension, current_level, items_total, items_learning, items_known, items_mastered, daily_streak, last_study_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dimension,
        data.current_level || 0,
        data.items_total || 0,
        data.items_learning || 0,
        data.items_known || 0,
        data.items_mastered || 0,
        data.daily_streak || 0,
        data.last_study_date || null,
        now,
      ]
    )
  } else {
    const fields: string[] = ['updated_at = ?']
    const values: (string | number | null)[] = [now]

    if (data.current_level !== undefined) { fields.push('current_level = ?'); values.push(data.current_level) }
    if (data.items_total !== undefined) { fields.push('items_total = ?'); values.push(data.items_total) }
    if (data.items_learning !== undefined) { fields.push('items_learning = ?'); values.push(data.items_learning) }
    if (data.items_known !== undefined) { fields.push('items_known = ?'); values.push(data.items_known) }
    if (data.items_mastered !== undefined) { fields.push('items_mastered = ?'); values.push(data.items_mastered) }
    if (data.daily_streak !== undefined) { fields.push('daily_streak = ?'); values.push(data.daily_streak) }
    if (data.last_study_date !== undefined) { fields.push('last_study_date = ?'); values.push(data.last_study_date) }

    values.push(dimension)
    execute(`UPDATE jp_progress SET ${fields.join(', ')} WHERE dimension = ?`, values)
  }
}

export function recalculateProgress(): void {
  const dimensions: JpProgress['dimension'][] = ['vocabulary', 'kanji', 'grammar']
  const itemTypeMap: Record<string, JpItemType> = { vocabulary: 'word', kanji: 'kanji', grammar: 'grammar' }
  const now = new Date().toISOString()

  transaction(() => {
    for (const dim of dimensions) {
      const itemType = itemTypeMap[dim]

      const total = queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM jp_srs_cards WHERE item_type = ?',
        [itemType]
      )
      const learning = queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM jp_srs_cards WHERE item_type = ? AND state IN (1, 3)',
        [itemType]
      )
      const known = queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM jp_srs_cards WHERE item_type = ? AND state = 2',
        [itemType]
      )
      const mastered = queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM jp_srs_cards WHERE item_type = ? AND state = 2 AND reps >= 5 AND lapses = 0',
        [itemType]
      )

      const itemsTotal = total?.count ?? 0
      const itemsLearning = learning?.count ?? 0
      const itemsKnown = known?.count ?? 0
      const itemsMastered = mastered?.count ?? 0

      // Estimate JLPT level (0-5 scale) from mastery ratio
      const ratio = itemsTotal > 0 ? (itemsKnown + itemsMastered) / itemsTotal : 0
      const currentLevel = Math.min(5, ratio * 5)

      updateProgress(dim, {
        current_level: currentLevel,
        items_total: itemsTotal,
        items_learning: itemsLearning,
        items_known: itemsKnown,
        items_mastered: itemsMastered,
        last_study_date: now,
      })
    }
  })
}

// ============================================================
// Sessions
// ============================================================

export function logStudySession(data: Omit<JpStudySession, 'id' | 'created_at'>): JpStudySession {
  const id = nanoid()
  execute(
    `INSERT INTO jp_study_sessions (id, session_date, duration_minutes, cards_reviewed, cards_new, accuracy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, data.session_date, data.duration_minutes, data.cards_reviewed, data.cards_new, data.accuracy]
  )
  return { id, ...data, created_at: new Date().toISOString() }
}

export function getStudySessions(days: number = 30): JpStudySession[] {
  const rows = query<StudySessionRow>(
    `SELECT * FROM jp_study_sessions
     WHERE session_date >= date('now', '-' || ? || ' days')
     ORDER BY session_date DESC`,
    [days]
  )
  return rows.map(rowToStudySession)
}

export function getCurrentStreak(): number {
  const rows = query<{ session_date: string }>(
    `SELECT DISTINCT session_date FROM jp_study_sessions
     ORDER BY session_date DESC
     LIMIT 365`,
    []
  )

  if (rows.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(today)
    expected.setDate(expected.getDate() - i)
    const expectedStr = expected.toISOString().split('T')[0]

    if (rows[i].session_date === expectedStr) {
      streak++
    } else {
      break
    }
  }

  return streak
}

// ============================================================
// Settings
// ============================================================

export function getSetting(key: string): string | null {
  const row = queryOne<{ value: string }>('SELECT value FROM jp_settings WHERE key = ?', [key])
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  execute(
    `INSERT INTO jp_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  )
}

export function getAllSettings(): Record<string, string> {
  const rows = query<{ key: string; value: string }>('SELECT key, value FROM jp_settings')
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  return settings
}

// ============================================================
// Dashboard
// ============================================================

export function getDashboardStats(): JpDashboardStats {
  const dueRow = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM jp_srs_cards WHERE state > 0 AND due <= datetime('now')`,
    []
  )
  const newRow = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM jp_srs_cards WHERE state = 0',
    []
  )
  const ghostRow = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM jp_ghosts WHERE ghost_due <= datetime('now')`,
    []
  )

  return {
    dueCards: dueRow?.count ?? 0,
    newCardsAvailable: newRow?.count ?? 0,
    ghostCount: ghostRow?.count ?? 0,
    todayReviewed: getTodayReviewCount(),
    todayAccuracy: getTodayAccuracy(),
    currentStreak: getCurrentStreak(),
    totalKnownWords: getKnownWordCount(),
    progress: getProgress(),
  }
}
