import { getAssociationsForNode, updateSrsCard } from '@/db/queries/japanese'
import { spreadingActivation } from './association-web'
import type { JpItemType } from '@/types'
import { query } from '@/db/database'

/**
 * Apply spreading activation after a card review.
 * Boosts implicit_boost on SRS cards of neighboring items in the association web.
 */
export async function applySpreadingActivation(
  itemId: string,
  itemType: JpItemType,
  ratingScale: number // 0-1 scale based on rating (e.g., again=0.25, hard=0.5, good=0.75, easy=1.0)
): Promise<void> {
  // 1. Get associations for the reviewed item
  const associations = getAssociationsForNode(itemId, itemType)

  if (associations.length === 0) return

  // 2. Run spreading activation to get boost factors for neighbors
  const boosts = spreadingActivation(associations, itemId)

  // 3. For each boosted neighbor, find their SRS card and update implicit_boost
  for (const [neighborId, boostFactor] of boosts) {
    // Find SRS cards for this neighbor item
    const cards = query<{ id: string; implicit_boost: number }>(
      'SELECT id, implicit_boost FROM jp_srs_cards WHERE item_id = ?',
      [neighborId]
    )

    for (const card of cards) {
      // new_boost = old_boost + boost_factor * ratingScale * 0.1, capped at 1.0
      const newBoost = Math.min(1.0, card.implicit_boost + boostFactor * ratingScale * 0.1)
      updateSrsCard(card.id, { implicit_boost: newBoost })
    }
  }
}
