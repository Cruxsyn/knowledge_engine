/**
 * Preprocesses lesson markdown content with custom syntax:
 * - {{term:id:Display Text}} → term link markers
 * - {{term:inline:Display Text:Definition}} → inline term markers
 * - {{graph:expression:xMin:xMax}} → inline graph markers
 * - :::note / :::tip / :::warning blocks → callout markers
 *
 * Outputs segments that alternate between plain markdown and custom elements.
 */

export interface TermReference {
  id: string
  conceptId?: string
  displayText: string
  definition?: string
}

export interface GraphReference {
  id: string
  expression: string
  xMin: number
  xMax: number
}

export type Segment =
  | { type: 'markdown'; content: string }
  | { type: 'graph'; ref: GraphReference }
  | { type: 'callout'; calloutType: 'note' | 'tip' | 'warning'; content: string }

export interface ProcessedContent {
  segments: Segment[]
  terms: Map<string, TermReference>
}

let termCounter = 0
let graphCounter = 0

export function processLearningContent(rawContent: string): ProcessedContent {
  const terms = new Map<string, TermReference>()

  let content = rawContent

  // Process term references inline: {{term:concept_id:Display Text}}
  // Replace with markdown links using special protocol: [Display Text](term://id)
  content = content.replace(
    /\{\{term:([^:}]+):([^}]+)\}\}/g,
    (_match, idOrInline: string, rest: string) => {
      const termId = `term-${termCounter++}`

      if (idOrInline === 'inline') {
        const colonIdx = rest.indexOf(':')
        if (colonIdx !== -1) {
          const displayText = rest.slice(0, colonIdx)
          const definition = rest.slice(colonIdx + 1)
          terms.set(termId, { id: termId, displayText, definition })
          return `[${displayText}](term://${termId})`
        }
        terms.set(termId, { id: termId, displayText: rest })
        return `[${rest}](term://${termId})`
      }

      terms.set(termId, { id: termId, conceptId: idOrInline, displayText: rest })
      return `[${rest}](term://${termId})`
    }
  )

  // Split into segments based on block-level custom elements (graphs and callouts)
  const segments: Segment[] = []

  // Process callout blocks first: :::note ... :::
  // And graph blocks: {{graph:...}}
  // We split the content by these block-level patterns

  const blockPattern = /(?:^:::(note|tip|warning)\s*\n([\s\S]*?)^:::\s*$)|(?:\{\{graph:([^:}]+):([^:}]+):([^}]+)\}\})/gm

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = blockPattern.exec(content)) !== null) {
    // Add preceding markdown
    if (match.index > lastIndex) {
      const md = content.slice(lastIndex, match.index).trim()
      if (md) segments.push({ type: 'markdown', content: md })
    }

    if (match[1]) {
      // Callout block
      const calloutType = match[1] as 'note' | 'tip' | 'warning'
      segments.push({ type: 'callout', calloutType, content: match[2].trim() })
    } else if (match[3]) {
      // Graph block
      const graphId = `graph-${graphCounter++}`
      segments.push({
        type: 'graph',
        ref: {
          id: graphId,
          expression: match[3].trim(),
          xMin: parseFloat(match[4]),
          xMax: parseFloat(match[5]),
        },
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Add trailing markdown
  if (lastIndex < content.length) {
    const md = content.slice(lastIndex).trim()
    if (md) segments.push({ type: 'markdown', content: md })
  }

  // If no block elements were found, the entire content is one markdown segment
  if (segments.length === 0 && content.trim()) {
    segments.push({ type: 'markdown', content: content.trim() })
  }

  return { segments, terms }
}
