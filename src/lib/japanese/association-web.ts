import type { JpGraphData, JpAssociation, JpAssociationCategory } from '@/types'

/**
 * Spreading Activation: given a reviewed node, calculate stability boosts
 * for connected nodes via BFS.
 * Returns a map of node_id -> boost_factor (0-1).
 */
export function spreadingActivation(
  associations: JpAssociation[],
  reviewedNodeId: string,
  decayFactor: number = 0.5
): Map<string, number> {
  const boosts = new Map<string, number>()

  // Build adjacency list
  const adjacency = new Map<string, { neighborId: string; weight: number }[]>()
  for (const assoc of associations) {
    if (!adjacency.has(assoc.source_id)) {
      adjacency.set(assoc.source_id, [])
    }
    adjacency.get(assoc.source_id)!.push({ neighborId: assoc.target_id, weight: assoc.weight })

    if (!adjacency.has(assoc.target_id)) {
      adjacency.set(assoc.target_id, [])
    }
    adjacency.get(assoc.target_id)!.push({ neighborId: assoc.source_id, weight: assoc.weight })
  }

  // BFS spreading activation
  const queue: { nodeId: string; activation: number }[] = []
  const visited = new Set<string>()

  // Seed node starts with activation 1.0
  visited.add(reviewedNodeId)
  const neighbors = adjacency.get(reviewedNodeId) ?? []
  for (const { neighborId, weight } of neighbors) {
    const activation = weight * decayFactor
    if (activation > 0.01) {
      queue.push({ nodeId: neighborId, activation })
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!
    if (visited.has(current.nodeId)) {
      // Keep the maximum activation if already visited
      const existing = boosts.get(current.nodeId) ?? 0
      if (current.activation > existing) {
        boosts.set(current.nodeId, current.activation)
      }
      continue
    }

    visited.add(current.nodeId)
    boosts.set(current.nodeId, current.activation)

    // Propagate to next layer with decay
    const nextNeighbors = adjacency.get(current.nodeId) ?? []
    for (const { neighborId, weight } of nextNeighbors) {
      if (!visited.has(neighborId)) {
        const nextActivation = current.activation * weight * decayFactor
        if (nextActivation > 0.01) {
          queue.push({ nodeId: neighborId, activation: nextActivation })
        }
      }
    }
  }

  return boosts
}

/**
 * Neighborhood Expansion: score candidate words by connections to known vocabulary.
 * Higher score = more connections to already-known words = better next-to-learn.
 */
export function scoreNextWords(
  candidates: { id: string; associations: JpAssociation[] }[],
  knownWordIds: Set<string>
): { id: string; score: number }[] {
  const scored = candidates.map(({ id, associations }) => {
    let score = 0
    for (const assoc of associations) {
      const otherId = assoc.source_id === id ? assoc.target_id : assoc.source_id
      if (knownWordIds.has(otherId)) {
        score += assoc.weight
      }
    }
    return { id, score }
  })

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score)
  return scored
}

/**
 * Semantic Interference Detection: find pairs of items that are likely to be confused.
 * Uses association weight and category to identify confusable pairs.
 */
export function findInterferencePairs(
  associations: JpAssociation[],
  threshold: number = 0.7
): { a: string; b: string; relation: string; weight: number }[] {
  const confusableCategories: Set<JpAssociationCategory> = new Set([
    'phonological',
    'semantic',
    'orthographic',
  ])

  return associations
    .filter(
      (assoc) =>
        confusableCategories.has(assoc.category) && assoc.weight >= threshold
    )
    .map((assoc) => ({
      a: assoc.source_id,
      b: assoc.target_id,
      relation: assoc.category,
      weight: assoc.weight,
    }))
    .sort((a, b) => b.weight - a.weight)
}

/**
 * Filter graph data by association category.
 */
export function filterGraphByCategory(
  graphData: JpGraphData,
  categories: JpAssociationCategory[]
): JpGraphData {
  const categorySet = new Set(categories)

  const filteredEdges = graphData.edges.filter((edge) =>
    categorySet.has(edge.category)
  )

  // Collect node IDs present in filtered edges
  const nodeIds = new Set<string>()
  for (const edge of filteredEdges) {
    nodeIds.add(edge.source)
    nodeIds.add(edge.target)
  }

  const filteredNodes = graphData.nodes.filter((node) => nodeIds.has(node.id))

  return {
    nodes: filteredNodes,
    edges: filteredEdges,
  }
}

/**
 * Calculate node centrality (degree centrality: count of connections).
 */
export function calculateCentrality(
  associations: JpAssociation[]
): Map<string, number> {
  const centrality = new Map<string, number>()

  for (const assoc of associations) {
    centrality.set(assoc.source_id, (centrality.get(assoc.source_id) ?? 0) + 1)
    centrality.set(assoc.target_id, (centrality.get(assoc.target_id) ?? 0) + 1)
  }

  return centrality
}

/**
 * Orphan Check: verify a word has >= minConnections to known words.
 * Returns true if the word IS an orphan (too few connections).
 */
export function isOrphan(
  wordId: string,
  associations: JpAssociation[],
  knownWordIds: Set<string>,
  minConnections: number = 2
): boolean {
  let connectionCount = 0

  for (const assoc of associations) {
    const otherId =
      assoc.source_id === wordId ? assoc.target_id : assoc.source_id
    if (
      (assoc.source_id === wordId || assoc.target_id === wordId) &&
      knownWordIds.has(otherId)
    ) {
      connectionCount++
      if (connectionCount >= minConnections) {
        return false
      }
    }
  }

  return true
}

/**
 * Build subgraph around a center node up to given depth via BFS.
 */
export function buildSubgraph(
  allAssociations: JpAssociation[],
  centerId: string,
  depth: number
): { nodeIds: Set<string>; edges: JpAssociation[] } {
  // Build adjacency list
  const adjacency = new Map<string, { neighborId: string; assoc: JpAssociation }[]>()
  for (const assoc of allAssociations) {
    if (!adjacency.has(assoc.source_id)) {
      adjacency.set(assoc.source_id, [])
    }
    adjacency.get(assoc.source_id)!.push({ neighborId: assoc.target_id, assoc })

    if (!adjacency.has(assoc.target_id)) {
      adjacency.set(assoc.target_id, [])
    }
    adjacency.get(assoc.target_id)!.push({ neighborId: assoc.source_id, assoc })
  }

  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()
  const edges: JpAssociation[] = []

  // BFS with depth tracking
  const queue: { nodeId: string; currentDepth: number }[] = [
    { nodeId: centerId, currentDepth: 0 },
  ]
  nodeIds.add(centerId)

  while (queue.length > 0) {
    const { nodeId, currentDepth } = queue.shift()!

    if (currentDepth >= depth) continue

    const neighbors = adjacency.get(nodeId) ?? []
    for (const { neighborId, assoc } of neighbors) {
      // Add edge if not seen
      if (!edgeIds.has(assoc.id)) {
        edgeIds.add(assoc.id)
        edges.push(assoc)
      }

      // Add node and continue BFS if not visited
      if (!nodeIds.has(neighborId)) {
        nodeIds.add(neighborId)
        queue.push({ nodeId: neighborId, currentDepth: currentDepth + 1 })
      }
    }
  }

  return { nodeIds, edges }
}
