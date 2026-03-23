import { FSRS, Rating, type Card, type RecordLogItem, State, createEmptyCard, fsrs } from 'ts-fsrs'
import type { JpSrsCard } from '@/types'

/**
 * Initialize FSRS with configurable desired retention.
 * Default retention is 0.9 (90%).
 */
export function createFSRS(desiredRetention?: number): FSRS {
  return fsrs({
    request_retention: desiredRetention ?? 0.9,
    maximum_interval: 36500,
    enable_fuzz: true,
    enable_short_term: true,
  })
}

/**
 * Convert our JpSrsCard DB format to ts-fsrs Card format.
 */
export function dbCardToFsrs(card: JpSrsCard): Card {
  const fsrsCard: Card = createEmptyCard(new Date(card.due))

  fsrsCard.due = new Date(card.due)
  fsrsCard.stability = card.stability
  fsrsCard.difficulty = card.difficulty
  fsrsCard.elapsed_days = card.elapsed_days
  fsrsCard.scheduled_days = card.scheduled_days
  fsrsCard.reps = card.reps
  fsrsCard.lapses = card.lapses
  fsrsCard.state = card.state as State
  fsrsCard.last_review = card.last_review ? new Date(card.last_review) : undefined
  fsrsCard.learning_steps = card.learning_steps

  return fsrsCard
}

/**
 * Convert ts-fsrs Card back to our DB format (partial update fields).
 */
export function fsrsToDbCard(card: Card, original: JpSrsCard): Partial<JpSrsCard> {
  return {
    id: original.id,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    last_review: card.last_review ? card.last_review.toISOString() : undefined,
    learning_steps: card.learning_steps,
    updated_at: new Date().toISOString(),
  }
}

/**
 * Core review function: given a card and rating, return the updated card state.
 * Rating: 1=Again, 2=Hard, 3=Good, 4=Easy
 */
export function reviewCard(
  engine: FSRS,
  card: JpSrsCard,
  rating: 1 | 2 | 3 | 4
): {
  updatedCard: Partial<JpSrsCard>
  reviewLog: { rating: number; state: number; elapsed_days: number; scheduled_days: number }
} {
  const fsrsCard = dbCardToFsrs(card)
  const now = new Date()

  const ratingValue = rating as Rating
  const result: RecordLogItem = engine.next(fsrsCard, now, ratingValue)

  const updatedCard = fsrsToDbCard(result.card, card)
  const reviewLog = {
    rating: result.log.rating as number,
    state: result.log.state as number,
    elapsed_days: result.log.elapsed_days,
    scheduled_days: result.log.scheduled_days,
  }

  return { updatedCard, reviewLog }
}

/**
 * Get scheduling info for a card showing what happens for each possible rating.
 */
export function getSchedulingInfo(
  engine: FSRS,
  card: JpSrsCard
): {
  again: { interval: number; stability: number }
  hard: { interval: number; stability: number }
  good: { interval: number; stability: number }
  easy: { interval: number; stability: number }
} {
  const fsrsCard = dbCardToFsrs(card)
  const now = new Date()

  const preview = engine.repeat(fsrsCard, now)

  const extract = (item: RecordLogItem) => ({
    interval: item.card.scheduled_days,
    stability: item.card.stability,
  })

  return {
    again: extract(preview[Rating.Again]),
    hard: extract(preview[Rating.Hard]),
    good: extract(preview[Rating.Good]),
    easy: extract(preview[Rating.Easy]),
  }
}

/**
 * Calculate retrievability (probability of recall) for a card.
 * Returns a number between 0 and 1.
 */
export function getRetrievability(engine: FSRS, card: JpSrsCard): number {
  const fsrsCard = dbCardToFsrs(card)
  const now = new Date()

  // New cards have no retrievability yet
  if (fsrsCard.state === State.New) {
    return 0
  }

  return engine.get_retrievability(fsrsCard, now, false)
}
