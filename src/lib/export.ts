import { getAllNotes } from '@/db/queries/notes'
import { getAllConcepts, getConceptById } from '@/db/queries/concepts'
import { getAllCaptures } from '@/db/queries/captures'
import type { AtomicNote, Concept, Capture } from '@/types'

function noteToMarkdown(note: AtomicNote): string {
  let md = `# ${note.title}\n\n`
  md += `## Summary\n${note.summary}\n\n`
  md += `## Key Claim\n${note.key_claim}\n\n`
  
  if (note.example) {
    md += `## Example / Application\n${note.example}\n\n`
  }
  
  md += `## Metadata\n`
  md += `- **Confidence**: ${note.confidence}/5\n`
  md += `- **Created**: ${note.created_at}\n`
  md += `- **Last Updated**: ${note.updated_at}\n`
  
  if (note.last_reviewed) {
    md += `- **Last Reviewed**: ${note.last_reviewed}\n`
  }
  
  return md
}

function conceptToMarkdown(concept: Concept): string {
  let md = `# ${concept.name}\n\n`
  md += `## Definition\n${concept.definition}\n\n`
  
  if (concept.intuition) {
    md += `## Intuition\n${concept.intuition}\n\n`
  }
  
  if (concept.pitfalls) {
    md += `## Common Pitfalls\n${concept.pitfalls}\n\n`
  }
  
  // Get full concept with relationships
  const fullConcept = getConceptById(concept.id)
  
  if (fullConcept?.prerequisites && fullConcept.prerequisites.length > 0) {
    md += `## Prerequisites\n`
    for (const prereq of fullConcept.prerequisites) {
      md += `- [[${prereq.name}]]\n`
    }
    md += '\n'
  }
  
  if (fullConcept?.notes && fullConcept.notes.length > 0) {
    md += `## Related Notes\n`
    for (const note of fullConcept.notes) {
      md += `- [[${note.title}]]\n`
    }
    md += '\n'
  }
  
  md += `## Metadata\n`
  md += `- **Mastery Level**: ${concept.mastery}\n`
  md += `- **Created**: ${concept.created_at}\n`
  md += `- **Last Updated**: ${concept.updated_at}\n`
  
  return md
}

function captureToMarkdown(capture: Capture): string {
  let md = `# ${capture.title}\n\n`
  
  if (capture.content) {
    md += `${capture.content}\n\n`
  }
  
  if (capture.why_saved) {
    md += `## Why Saved\n${capture.why_saved}\n\n`
  }
  
  md += `## Metadata\n`
  md += `- **Type**: ${capture.type}\n`
  md += `- **Status**: ${capture.status}\n`
  md += `- **Priority**: ${capture.priority}\n`
  
  if (capture.topic) {
    md += `- **Topic**: ${capture.topic}\n`
  }
  
  if (capture.source?.url) {
    md += `- **Source**: ${capture.source.url}\n`
  }
  
  md += `- **Captured**: ${capture.created_at}\n`
  
  return md
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100)
}

async function createZipBlob(files: Array<{ path: string; content: string }>): Promise<Blob> {
  // Simple ZIP creation without external library
  // This creates a basic ZIP file structure
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  const centralDirectory: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const content = encoder.encode(file.content)
    const pathBytes = encoder.encode(file.path)
    
    // Local file header
    const localHeader = new Uint8Array(30 + pathBytes.length)
    const view = new DataView(localHeader.buffer)
    
    view.setUint32(0, 0x04034b50, true) // Local file header signature
    view.setUint16(4, 20, true) // Version needed
    view.setUint16(6, 0, true) // General purpose flag
    view.setUint16(8, 0, true) // Compression method (store)
    view.setUint16(10, 0, true) // Last mod time
    view.setUint16(12, 0, true) // Last mod date
    view.setUint32(14, 0, true) // CRC-32 (skip for simplicity)
    view.setUint32(18, content.length, true) // Compressed size
    view.setUint32(22, content.length, true) // Uncompressed size
    view.setUint16(26, pathBytes.length, true) // File name length
    view.setUint16(28, 0, true) // Extra field length
    localHeader.set(pathBytes, 30)
    
    parts.push(localHeader)
    parts.push(content)
    
    // Central directory entry
    const centralEntry = new Uint8Array(46 + pathBytes.length)
    const centralView = new DataView(centralEntry.buffer)
    
    centralView.setUint32(0, 0x02014b50, true) // Central directory signature
    centralView.setUint16(4, 20, true) // Version made by
    centralView.setUint16(6, 20, true) // Version needed
    centralView.setUint16(8, 0, true) // General purpose flag
    centralView.setUint16(10, 0, true) // Compression method
    centralView.setUint16(12, 0, true) // Last mod time
    centralView.setUint16(14, 0, true) // Last mod date
    centralView.setUint32(16, 0, true) // CRC-32
    centralView.setUint32(20, content.length, true) // Compressed size
    centralView.setUint32(24, content.length, true) // Uncompressed size
    centralView.setUint16(28, pathBytes.length, true) // File name length
    centralView.setUint16(30, 0, true) // Extra field length
    centralView.setUint16(32, 0, true) // Comment length
    centralView.setUint16(34, 0, true) // Disk number
    centralView.setUint16(36, 0, true) // Internal attributes
    centralView.setUint32(38, 0, true) // External attributes
    centralView.setUint32(42, offset, true) // Relative offset
    centralEntry.set(pathBytes, 46)
    
    centralDirectory.push(centralEntry)
    offset += localHeader.length + content.length
  }

  // Calculate central directory size
  let centralDirSize = 0
  for (const entry of centralDirectory) {
    centralDirSize += entry.length
  }

  // End of central directory
  const endOfCentral = new Uint8Array(22)
  const endView = new DataView(endOfCentral.buffer)
  
  endView.setUint32(0, 0x06054b50, true) // End signature
  endView.setUint16(4, 0, true) // Disk number
  endView.setUint16(6, 0, true) // Start disk
  endView.setUint16(8, files.length, true) // Entries on disk
  endView.setUint16(10, files.length, true) // Total entries
  endView.setUint32(12, centralDirSize, true) // Central directory size
  endView.setUint32(16, offset, true) // Central directory offset
  endView.setUint16(20, 0, true) // Comment length

  // Combine all parts into a single Blob
  const allParts: BlobPart[] = [...parts, ...centralDirectory, endOfCentral] as BlobPart[]
  return new Blob(allParts, { type: 'application/zip' })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportNotesAsMarkdown() {
  const notes = getAllNotes()
  const files = notes.map(note => ({
    path: `notes/${sanitizeFilename(note.title)}.md`,
    content: noteToMarkdown(note),
  }))
  
  if (files.length === 0) {
    alert('No notes to export')
    return
  }
  
  const blob = await createZipBlob(files)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadBlob(blob, `knowledge-notes-${timestamp}.zip`)
}

export async function exportConceptsAsMarkdown() {
  const concepts = getAllConcepts()
  const files = concepts.map(concept => ({
    path: `concepts/${sanitizeFilename(concept.name)}.md`,
    content: conceptToMarkdown(concept),
  }))
  
  if (files.length === 0) {
    alert('No concepts to export')
    return
  }
  
  const blob = await createZipBlob(files)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadBlob(blob, `knowledge-concepts-${timestamp}.zip`)
}

export async function exportAllAsMarkdown() {
  const files: Array<{ path: string; content: string }> = []
  
  // Export captures
  const captures = getAllCaptures()
  for (const capture of captures) {
    files.push({
      path: `inbox/${sanitizeFilename(capture.title)}.md`,
      content: captureToMarkdown(capture),
    })
  }
  
  // Export notes
  const notes = getAllNotes()
  for (const note of notes) {
    files.push({
      path: `notes/${sanitizeFilename(note.title)}.md`,
      content: noteToMarkdown(note),
    })
  }
  
  // Export concepts
  const concepts = getAllConcepts()
  for (const concept of concepts) {
    files.push({
      path: `concepts/${sanitizeFilename(concept.name)}.md`,
      content: conceptToMarkdown(concept),
    })
  }
  
  // Add index file
  let indexContent = `# Knowledge Base Export\n\n`
  indexContent += `Exported on ${new Date().toISOString()}\n\n`
  indexContent += `## Summary\n`
  indexContent += `- **Captures**: ${captures.length}\n`
  indexContent += `- **Notes**: ${notes.length}\n`
  indexContent += `- **Concepts**: ${concepts.length}\n`
  
  files.push({ path: 'README.md', content: indexContent })
  
  if (files.length <= 1) {
    alert('No content to export')
    return
  }
  
  const blob = await createZipBlob(files)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadBlob(blob, `knowledge-base-${timestamp}.zip`)
}
