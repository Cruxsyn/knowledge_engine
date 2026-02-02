import { useState, useRef, useEffect } from 'react'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FormattedText } from '@/components/ui/formatted-text'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Terminal, Send, BookOpen } from 'lucide-react'
import { NOTE_TYPE_CONFIGS } from '@/types'
import type { NoteType, NoteContent } from '@/types'

interface CommandHistory {
  type: 'input' | 'output' | 'error' | 'success'
  text: string
  timestamp: Date
}

interface DraftNote {
  title: string
  note_type: NoteType
  content: Record<string, string>
  confidence: number
  concept_ids: string[]
}

interface DraftConcept {
  name: string
  definition: string
  intuition?: string
  pitfalls?: string
}

const HELP_TEXT = `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  note new                  Start creating a new note
  note title <text>         Set note title
  note type <type>          Set type: definition, idea, connection, 
                            question, insight, process, example, other
  note set <field> <value>  Set a content field (depends on type)
  note confidence <1-5>     Set confidence level
  note link <concept>       Link to a concept by name
  note save                 Save the current note
  note clear                Clear current draft
  note fields               Show available fields for current type

  concept new             Start creating a new concept
  concept name <text>     Set concept name
  concept def <text>      Set definition
  concept intuition <txt> Set intuition (optional)
  concept pitfalls <text> Set pitfalls (optional)
  concept save            Save the current concept
  concept clear           Clear current draft

  list notes            List all notes
  list concepts         List all concepts
  
  help                  Show this help message
  clear                 Clear terminal history

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

export function TerminalPage() {
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CommandHistory[]>([
    { type: 'output', text: 'Arkvim Terminal v1.0', timestamp: new Date() },
    { type: 'output', text: 'Type "help" for available commands.', timestamp: new Date() },
    { type: 'output', text: 'Tip: Paste multiple commands at once (one per line).\n', timestamp: new Date() },
  ])
  const [showPreview, setShowPreview] = useState(true)
  const [showDocs, setShowDocs] = useState(false)
  const [draftNote, setDraftNote] = useState<DraftNote | null>(null)
  const [draftConcept, setDraftConcept] = useState<DraftConcept | null>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  // Refs to track draft state during batch processing (React state is async)
  const draftNoteRef = useRef<DraftNote | null>(null)
  const draftConceptRef = useRef<DraftConcept | null>(null)
  const historyRef = useRef<CommandHistory[]>([])

  const { notes, createNote } = useNotes()
  const { concepts, createConcept } = useConcepts()

  // Keep refs in sync with state
  useEffect(() => {
    draftNoteRef.current = draftNote
  }, [draftNote])

  useEffect(() => {
    draftConceptRef.current = draftConcept
  }, [draftConcept])

  useEffect(() => {
    historyRef.current = history
  }, [history])

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [history])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Add output using ref for immediate access in batch processing
  const addOutputImmediate = (text: string, type: CommandHistory['type'] = 'output') => {
    const newEntry = { type, text, timestamp: new Date() }
    historyRef.current = [...historyRef.current, newEntry]
    return newEntry
  }

  const addOutput = (text: string, type: CommandHistory['type'] = 'output') => {
    addOutputImmediate(text, type)
    setHistory(prev => [...prev, { type, text, timestamp: new Date() }])
  }

  // Process a single command using refs (for batch processing)
  const processCommandImmediate = (cmd: string): void => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    // Echo the command
    addOutputImmediate(`> ${trimmed}`, 'input')

    const parts = trimmed.split(' ')
    const command = parts[0].toLowerCase()
    const subCommand = parts[1]?.toLowerCase()
    const args = parts.slice(2).join(' ')

    switch (command) {
      case 'help':
        addOutputImmediate(HELP_TEXT)
        break

      case 'clear':
        historyRef.current = []
        break

      case 'note':
        handleNoteCommandImmediate(subCommand, args)
        break

      case 'concept':
        handleConceptCommandImmediate(subCommand, args)
        break

      case 'list':
        handleListCommandImmediate(subCommand)
        break

      default:
        addOutputImmediate(`Unknown command: ${command}. Type "help" for available commands.`, 'error')
    }
  }

  // Process multiple commands in batch, then sync state at the end
  const processBatchCommands = (commands: string[]) => {
    // Filter out empty lines and process each command
    const validCommands = commands.filter(cmd => cmd.trim())

    if (validCommands.length === 0) return

    // Add all valid commands to command history
    setCommandHistory(prev => [...prev, ...validCommands])
    setHistoryIndex(-1)

    // Process each command using refs
    for (const cmd of validCommands) {
      processCommandImmediate(cmd)
    }

    // Sync all state from refs
    setHistory([...historyRef.current])
    setDraftNote(draftNoteRef.current)
    setDraftConcept(draftConceptRef.current)
  }

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    // Check for multi-line input
    const lines = trimmed.split('\n')
    if (lines.length > 1) {
      processBatchCommands(lines)
      return
    }

    // Single command - use normal state-based processing
    setCommandHistory(prev => [...prev, trimmed])
    setHistoryIndex(-1)

    // Echo the command
    addOutput(`> ${trimmed}`, 'input')

    const parts = trimmed.split(' ')
    const command = parts[0].toLowerCase()
    const subCommand = parts[1]?.toLowerCase()
    const args = parts.slice(2).join(' ')

    switch (command) {
      case 'help':
        addOutput(HELP_TEXT)
        break

      case 'clear':
        setHistory([])
        break

      case 'note':
        handleNoteCommand(subCommand, args)
        break

      case 'concept':
        handleConceptCommand(subCommand, args)
        break

      case 'list':
        handleListCommand(subCommand)
        break

      default:
        addOutput(`Unknown command: ${command}. Type "help" for available commands.`, 'error')
    }
  }

  const getTypeConfig = (noteType: NoteType) => NOTE_TYPE_CONFIGS.find(c => c.value === noteType)
  
  const getDefaultContent = (noteType: NoteType): Record<string, string> => {
    const config = getTypeConfig(noteType)
    if (!config) return {}
    const content: Record<string, string> = {}
    for (const field of config.fields) {
      content[field.name] = ''
    }
    return content
  }

  const handleNoteCommand = (subCommand: string, args: string) => {
    switch (subCommand) {
      case 'new':
        setDraftNote({
          title: '',
          note_type: 'definition',
          content: getDefaultContent('definition'),
          confidence: 3,
          concept_ids: [],
        })
        addOutput('Started new note draft (type: definition). Use "note title <text>" to set title.', 'success')
        addOutput('Use "note fields" to see available fields for this type.', 'output')
        break

      case 'title':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        if (!args) {
          addOutput('Please provide a title: note title <text>', 'error')
          return
        }
        setDraftNote({ ...draftNote, title: args })
        addOutput(`Title set: "${args}"`, 'success')
        break

      case 'type':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        const validTypes = NOTE_TYPE_CONFIGS.map(t => t.value)
        const typeArg = args.toLowerCase() as NoteType
        if (!validTypes.includes(typeArg)) {
          addOutput(`Invalid type. Valid types: ${validTypes.join(', ')}`, 'error')
          return
        }
        // Reset content for new type
        setDraftNote({ ...draftNote, note_type: typeArg, content: getDefaultContent(typeArg) })
        const newConfig = getTypeConfig(typeArg)
        addOutput(`Type set to: ${newConfig?.label}. Fields: ${newConfig?.fields.map(f => f.name).join(', ')}`, 'success')
        break

      case 'fields':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        const config = getTypeConfig(draftNote.note_type)
        if (config) {
          const fieldList = config.fields.map(f => `  ${f.name}${f.required ? '*' : ''}: ${f.placeholder}`).join('\n')
          addOutput(`Fields for ${config.label}:\n${fieldList}\n\nUse: note set <field> <value>`)
        }
        break

      case 'set':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        const parts = args.split(' ')
        const fieldName = parts[0]?.toLowerCase()
        const fieldValue = parts.slice(1).join(' ')
        
        const typeConfig = getTypeConfig(draftNote.note_type)
        const field = typeConfig?.fields.find(f => f.name.toLowerCase() === fieldName)
        
        if (!field) {
          const availableFields = typeConfig?.fields.map(f => f.name).join(', ') || 'none'
          addOutput(`Unknown field "${fieldName}". Available: ${availableFields}`, 'error')
          return
        }
        if (!fieldValue) {
          addOutput(`Please provide a value: note set ${fieldName} <value>`, 'error')
          return
        }
        
        setDraftNote({ 
          ...draftNote, 
          content: { ...draftNote.content, [field.name]: fieldValue }
        })
        addOutput(`${field.label} set.`, 'success')
        break

      case 'confidence':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        const conf = parseInt(args)
        if (isNaN(conf) || conf < 1 || conf > 5) {
          addOutput('Confidence must be between 1 and 5.', 'error')
          return
        }
        setDraftNote({ ...draftNote, confidence: conf })
        addOutput(`Confidence set to ${conf}.`, 'success')
        break

      case 'link':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        if (!args) {
          addOutput('Please provide a concept name: note link <concept name>', 'error')
          return
        }
        const concept = concepts.find(c => c.name.toLowerCase() === args.toLowerCase())
        if (!concept) {
          addOutput(`Concept "${args}" not found. Available: ${concepts.map(c => c.name).join(', ')}`, 'error')
          return
        }
        if (draftNote.concept_ids.includes(concept.id)) {
          addOutput(`Already linked to "${concept.name}".`, 'error')
          return
        }
        setDraftNote({ ...draftNote, concept_ids: [...draftNote.concept_ids, concept.id] })
        addOutput(`Linked to concept: "${concept.name}"`, 'success')
        break

      case 'save':
        if (!draftNote) {
          addOutput('No draft note. Use "note new" first.', 'error')
          return
        }
        if (!draftNote.title) {
          addOutput('Missing required field: title', 'error')
          return
        }
        const saveConfig = getTypeConfig(draftNote.note_type)
        const requiredFields = saveConfig?.fields.filter(f => f.required) || []
        const missingFields = requiredFields.filter(f => !draftNote.content[f.name]?.trim())
        if (missingFields.length > 0) {
          addOutput(`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`, 'error')
          return
        }
        const newNote = createNote({
          title: draftNote.title,
          note_type: draftNote.note_type,
          content: draftNote.content as NoteContent,
          confidence: draftNote.confidence,
          concept_ids: draftNote.concept_ids,
        })
        if (newNote) {
          addOutput(`Note saved: "${newNote.title}" (${saveConfig?.label})`, 'success')
          setDraftNote(null)
        } else {
          addOutput('Failed to save note.', 'error')
        }
        break

      case 'clear':
        setDraftNote(null)
        addOutput('Draft note cleared.', 'success')
        break

      default:
        addOutput('Unknown note command. Use: new, title, summary, claim, example, confidence, link, save, clear', 'error')
    }
  }

  const handleConceptCommand = (subCommand: string, args: string) => {
    switch (subCommand) {
      case 'new':
        setDraftConcept({
          name: '',
          definition: '',
        })
        addOutput('Started new concept draft. Use "concept name <text>" to set name.', 'success')
        break

      case 'name':
        if (!draftConcept) {
          addOutput('No draft concept. Use "concept new" first.', 'error')
          return
        }
        if (!args) {
          addOutput('Please provide a name: concept name <text>', 'error')
          return
        }
        setDraftConcept({ ...draftConcept, name: args })
        addOutput(`Name set: "${args}"`, 'success')
        break

      case 'def':
      case 'definition':
        if (!draftConcept) {
          addOutput('No draft concept. Use "concept new" first.', 'error')
          return
        }
        if (!args) {
          addOutput('Please provide a definition: concept def <text>', 'error')
          return
        }
        setDraftConcept({ ...draftConcept, definition: args })
        addOutput(`Definition set.`, 'success')
        break

      case 'intuition':
        if (!draftConcept) {
          addOutput('No draft concept. Use "concept new" first.', 'error')
          return
        }
        setDraftConcept({ ...draftConcept, intuition: args || undefined })
        addOutput(`Intuition set.`, 'success')
        break

      case 'pitfalls':
        if (!draftConcept) {
          addOutput('No draft concept. Use "concept new" first.', 'error')
          return
        }
        setDraftConcept({ ...draftConcept, pitfalls: args || undefined })
        addOutput(`Pitfalls set.`, 'success')
        break

      case 'save':
        if (!draftConcept) {
          addOutput('No draft concept. Use "concept new" first.', 'error')
          return
        }
        if (!draftConcept.name || !draftConcept.definition) {
          addOutput('Missing required fields: name, definition', 'error')
          return
        }
        const newConcept = createConcept({
          name: draftConcept.name,
          definition: draftConcept.definition,
          intuition: draftConcept.intuition,
          pitfalls: draftConcept.pitfalls,
        })
        if (newConcept) {
          addOutput(`Concept saved: "${newConcept.name}"`, 'success')
          setDraftConcept(null)
        } else {
          addOutput('Failed to save concept.', 'error')
        }
        break

      case 'clear':
        setDraftConcept(null)
        addOutput('Draft concept cleared.', 'success')
        break

      default:
        addOutput('Unknown concept command. Use: new, name, def, intuition, pitfalls, save, clear', 'error')
    }
  }

  const handleListCommand = (subCommand: string) => {
    switch (subCommand) {
      case 'notes':
        if (notes.length === 0) {
          addOutput('No notes found.')
          return
        }
        const noteList = notes.map((n, i) => `  ${i + 1}. ${n.title} (confidence: ${n.confidence})`).join('\n')
        addOutput(`Notes (${notes.length}):\n${noteList}`)
        break

      case 'concepts':
        if (concepts.length === 0) {
          addOutput('No concepts found.')
          return
        }
        const conceptList = concepts.map((c, i) => `  ${i + 1}. ${c.name} [${c.mastery}]`).join('\n')
        addOutput(`Concepts (${concepts.length}):\n${conceptList}`)
        break

      default:
        addOutput('Unknown list command. Use: notes, concepts', 'error')
    }
  }

  // ============ IMMEDIATE HANDLERS (for batch processing with refs) ============

  const handleNoteCommandImmediate = (subCommand: string, args: string) => {
    switch (subCommand) {
      case 'new':
        draftNoteRef.current = {
          title: '',
          note_type: 'definition',
          content: getDefaultContent('definition'),
          confidence: 3,
          concept_ids: [],
        }
        addOutputImmediate('Started new note draft (type: definition). Use "note title <text>" to set title.', 'success')
        addOutputImmediate('Use "note fields" to see available fields for this type.', 'output')
        break

      case 'title':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        if (!args) {
          addOutputImmediate('Please provide a title: note title <text>', 'error')
          return
        }
        draftNoteRef.current = { ...draftNoteRef.current, title: args }
        addOutputImmediate(`Title set: "${args}"`, 'success')
        break

      case 'type':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        const validTypes = NOTE_TYPE_CONFIGS.map(t => t.value)
        const typeArg = args.toLowerCase() as NoteType
        if (!validTypes.includes(typeArg)) {
          addOutputImmediate(`Invalid type. Valid types: ${validTypes.join(', ')}`, 'error')
          return
        }
        draftNoteRef.current = { ...draftNoteRef.current, note_type: typeArg, content: getDefaultContent(typeArg) }
        const newConfig = getTypeConfig(typeArg)
        addOutputImmediate(`Type set to: ${newConfig?.label}. Fields: ${newConfig?.fields.map(f => f.name).join(', ')}`, 'success')
        break

      case 'fields':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        const config = getTypeConfig(draftNoteRef.current.note_type)
        if (config) {
          const fieldList = config.fields.map(f => `  ${f.name}${f.required ? '*' : ''}: ${f.placeholder}`).join('\n')
          addOutputImmediate(`Fields for ${config.label}:\n${fieldList}\n\nUse: note set <field> <value>`)
        }
        break

      case 'set':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        const parts = args.split(' ')
        const fieldName = parts[0]?.toLowerCase()
        const fieldValue = parts.slice(1).join(' ')

        const typeConfig = getTypeConfig(draftNoteRef.current.note_type)
        const field = typeConfig?.fields.find(f => f.name.toLowerCase() === fieldName)

        if (!field) {
          const availableFields = typeConfig?.fields.map(f => f.name).join(', ') || 'none'
          addOutputImmediate(`Unknown field "${fieldName}". Available: ${availableFields}`, 'error')
          return
        }
        if (!fieldValue) {
          addOutputImmediate(`Please provide a value: note set ${fieldName} <value>`, 'error')
          return
        }

        draftNoteRef.current = {
          ...draftNoteRef.current,
          content: { ...draftNoteRef.current.content, [field.name]: fieldValue }
        }
        addOutputImmediate(`${field.label} set.`, 'success')
        break

      case 'confidence':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        const conf = parseInt(args)
        if (isNaN(conf) || conf < 1 || conf > 5) {
          addOutputImmediate('Confidence must be between 1 and 5.', 'error')
          return
        }
        draftNoteRef.current = { ...draftNoteRef.current, confidence: conf }
        addOutputImmediate(`Confidence set to ${conf}.`, 'success')
        break

      case 'link':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        if (!args) {
          addOutputImmediate('Please provide a concept name: note link <concept name>', 'error')
          return
        }
        const concept = concepts.find(c => c.name.toLowerCase() === args.toLowerCase())
        if (!concept) {
          addOutputImmediate(`Concept "${args}" not found. Available: ${concepts.map(c => c.name).join(', ')}`, 'error')
          return
        }
        if (draftNoteRef.current.concept_ids.includes(concept.id)) {
          addOutputImmediate(`Already linked to "${concept.name}".`, 'error')
          return
        }
        draftNoteRef.current = { ...draftNoteRef.current, concept_ids: [...draftNoteRef.current.concept_ids, concept.id] }
        addOutputImmediate(`Linked to concept: "${concept.name}"`, 'success')
        break

      case 'save':
        if (!draftNoteRef.current) {
          addOutputImmediate('No draft note. Use "note new" first.', 'error')
          return
        }
        if (!draftNoteRef.current.title) {
          addOutputImmediate('Missing required field: title', 'error')
          return
        }
        const saveConfig = getTypeConfig(draftNoteRef.current.note_type)
        const requiredFields = saveConfig?.fields.filter(f => f.required) || []
        const missingFields = requiredFields.filter(f => !draftNoteRef.current!.content[f.name]?.trim())
        if (missingFields.length > 0) {
          addOutputImmediate(`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`, 'error')
          return
        }
        const newNote = createNote({
          title: draftNoteRef.current.title,
          note_type: draftNoteRef.current.note_type,
          content: draftNoteRef.current.content as NoteContent,
          confidence: draftNoteRef.current.confidence,
          concept_ids: draftNoteRef.current.concept_ids,
        })
        if (newNote) {
          addOutputImmediate(`Note saved: "${newNote.title}" (${saveConfig?.label})`, 'success')
          draftNoteRef.current = null
        } else {
          addOutputImmediate('Failed to save note.', 'error')
        }
        break

      case 'clear':
        draftNoteRef.current = null
        addOutputImmediate('Draft note cleared.', 'success')
        break

      default:
        addOutputImmediate('Unknown note command. Use: new, title, type, set, fields, confidence, link, save, clear', 'error')
    }
  }

  const handleConceptCommandImmediate = (subCommand: string, args: string) => {
    switch (subCommand) {
      case 'new':
        draftConceptRef.current = {
          name: '',
          definition: '',
        }
        addOutputImmediate('Started new concept draft. Use "concept name <text>" to set name.', 'success')
        break

      case 'name':
        if (!draftConceptRef.current) {
          addOutputImmediate('No draft concept. Use "concept new" first.', 'error')
          return
        }
        if (!args) {
          addOutputImmediate('Please provide a name: concept name <text>', 'error')
          return
        }
        draftConceptRef.current = { ...draftConceptRef.current, name: args }
        addOutputImmediate(`Name set: "${args}"`, 'success')
        break

      case 'def':
      case 'definition':
        if (!draftConceptRef.current) {
          addOutputImmediate('No draft concept. Use "concept new" first.', 'error')
          return
        }
        if (!args) {
          addOutputImmediate('Please provide a definition: concept def <text>', 'error')
          return
        }
        draftConceptRef.current = { ...draftConceptRef.current, definition: args }
        addOutputImmediate(`Definition set.`, 'success')
        break

      case 'intuition':
        if (!draftConceptRef.current) {
          addOutputImmediate('No draft concept. Use "concept new" first.', 'error')
          return
        }
        draftConceptRef.current = { ...draftConceptRef.current, intuition: args || undefined }
        addOutputImmediate(`Intuition set.`, 'success')
        break

      case 'pitfalls':
        if (!draftConceptRef.current) {
          addOutputImmediate('No draft concept. Use "concept new" first.', 'error')
          return
        }
        draftConceptRef.current = { ...draftConceptRef.current, pitfalls: args || undefined }
        addOutputImmediate(`Pitfalls set.`, 'success')
        break

      case 'save':
        if (!draftConceptRef.current) {
          addOutputImmediate('No draft concept. Use "concept new" first.', 'error')
          return
        }
        if (!draftConceptRef.current.name || !draftConceptRef.current.definition) {
          addOutputImmediate('Missing required fields: name, definition', 'error')
          return
        }
        const newConcept = createConcept({
          name: draftConceptRef.current.name,
          definition: draftConceptRef.current.definition,
          intuition: draftConceptRef.current.intuition,
          pitfalls: draftConceptRef.current.pitfalls,
        })
        if (newConcept) {
          addOutputImmediate(`Concept saved: "${newConcept.name}"`, 'success')
          draftConceptRef.current = null
        } else {
          addOutputImmediate('Failed to save concept.', 'error')
        }
        break

      case 'clear':
        draftConceptRef.current = null
        addOutputImmediate('Draft concept cleared.', 'success')
        break

      default:
        addOutputImmediate('Unknown concept command. Use: new, name, def, intuition, pitfalls, save, clear', 'error')
    }
  }

  const handleListCommandImmediate = (subCommand: string) => {
    switch (subCommand) {
      case 'notes':
        if (notes.length === 0) {
          addOutputImmediate('No notes found.')
          return
        }
        const noteList = notes.map((n, i) => `  ${i + 1}. ${n.title} (confidence: ${n.confidence})`).join('\n')
        addOutputImmediate(`Notes (${notes.length}):\n${noteList}`)
        break

      case 'concepts':
        if (concepts.length === 0) {
          addOutputImmediate('No concepts found.')
          return
        }
        const conceptList = concepts.map((c, i) => `  ${i + 1}. ${c.name} [${c.mastery}]`).join('\n')
        addOutputImmediate(`Concepts (${concepts.length}):\n${conceptList}`)
        break

      default:
        addOutputImmediate('Unknown list command. Use: notes, concepts', 'error')
    }
  }

  // ============ END IMMEDIATE HANDLERS ============

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = submit, Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      processCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp' && !input.includes('\n')) {
      // Only navigate history if single line
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown' && !input.includes('\n')) {
      // Only navigate history if single line
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  const getLinkedConceptNames = () => {
    if (!draftNote) return []
    return draftNote.concept_ids
      .map(id => concepts.find(c => c.id === id)?.name)
      .filter(Boolean) as string[]
  }

  return (
    <div className="h-full flex flex-col bg-deep-obsidian">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-ash-stone/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-parchment flex items-center gap-2">
              <Terminal className="h-6 w-6 text-icon-gold" />
              Terminal
            </h1>
            <p className="text-sm text-warm-gray mt-1">
              Create notes and concepts using commands
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={showDocs ? "gold" : "outline"}
              size="sm"
              onClick={() => setShowDocs(!showDocs)}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Docs
            </Button>
            <Button
              variant={showPreview ? "gold" : "outline"}
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              {showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Docs Panel */}
        {showDocs && (
          <div className="w-72 border-r border-ash-stone/50 p-4 overflow-y-auto bg-charcoal-slate/30">
            <h3 className="text-sm font-medium text-parchment mb-4">Command Reference</h3>
            
            {/* Note Commands */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Note Commands</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-emerald-400">note new</span>
                  <p className="text-warm-gray/70 mt-0.5">Start a new note draft</p>
                </div>
                <div>
                  <span className="text-emerald-400">note title</span> <span className="text-warm-gray">&lt;text&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set the note title</p>
                </div>
                <div>
                  <span className="text-emerald-400">note type</span> <span className="text-warm-gray">&lt;type&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Changes fields (see below)</p>
                </div>
                <div>
                  <span className="text-emerald-400">note set</span> <span className="text-warm-gray">&lt;field&gt; &lt;value&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set a content field</p>
                </div>
                <div>
                  <span className="text-emerald-400">note fields</span>
                  <p className="text-warm-gray/70 mt-0.5">Show fields for current type</p>
                </div>
                <div>
                  <span className="text-emerald-400">note confidence</span> <span className="text-warm-gray">&lt;1-5&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set confidence level</p>
                </div>
                <div>
                  <span className="text-emerald-400">note link</span> <span className="text-warm-gray">&lt;concept&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Link to a concept</p>
                </div>
                <div>
                  <span className="text-emerald-400">note save</span>
                  <p className="text-warm-gray/70 mt-0.5">Save the note</p>
                </div>
                <div>
                  <span className="text-emerald-400">note clear</span>
                  <p className="text-warm-gray/70 mt-0.5">Discard draft</p>
                </div>
              </div>
            </div>

            {/* Note Types */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Note Types & Fields</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-emerald-400">definition</span>
                  <p className="text-warm-gray/70">term*, definition*</p>
                </div>
                <div>
                  <span className="text-emerald-400">idea</span>
                  <p className="text-warm-gray/70">description*, applications</p>
                </div>
                <div>
                  <span className="text-emerald-400">connection</span>
                  <p className="text-warm-gray/70">item_a*, item_b*, relationship*</p>
                </div>
                <div>
                  <span className="text-emerald-400">question</span>
                  <p className="text-warm-gray/70">question*, context, possible_answers</p>
                </div>
                <div>
                  <span className="text-emerald-400">insight</span>
                  <p className="text-warm-gray/70">insight*, trigger, implications</p>
                </div>
                <div>
                  <span className="text-emerald-400">process</span>
                  <p className="text-warm-gray/70">steps*, use_case</p>
                </div>
                <div>
                  <span className="text-emerald-400">example</span>
                  <p className="text-warm-gray/70">subject*, example*, why_it_works</p>
                </div>
              </div>
            </div>

            {/* Concept Commands */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Concept Commands</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-emerald-400">concept new</span>
                  <p className="text-warm-gray/70 mt-0.5">Start a new concept draft</p>
                </div>
                <div>
                  <span className="text-emerald-400">concept name</span> <span className="text-warm-gray">&lt;text&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set the concept name</p>
                </div>
                <div>
                  <span className="text-emerald-400">concept def</span> <span className="text-warm-gray">&lt;text&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set the definition</p>
                </div>
                <div>
                  <span className="text-emerald-400">concept intuition</span> <span className="text-warm-gray">&lt;text&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set intuition (optional)</p>
                </div>
                <div>
                  <span className="text-emerald-400">concept pitfalls</span> <span className="text-warm-gray">&lt;text&gt;</span>
                  <p className="text-warm-gray/70 mt-0.5">Set pitfalls (optional)</p>
                </div>
                <div>
                  <span className="text-emerald-400">concept save</span>
                  <p className="text-warm-gray/70 mt-0.5">Save the current concept</p>
                </div>
                <div>
                  <span className="text-emerald-400">concept clear</span>
                  <p className="text-warm-gray/70 mt-0.5">Discard the draft</p>
                </div>
              </div>
            </div>

            {/* Utility Commands */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Utilities</h4>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-emerald-400">list notes</span>
                  <p className="text-warm-gray/70 mt-0.5">Show all notes</p>
                </div>
                <div>
                  <span className="text-emerald-400">list concepts</span>
                  <p className="text-warm-gray/70 mt-0.5">Show all concepts</p>
                </div>
                <div>
                  <span className="text-emerald-400">help</span>
                  <p className="text-warm-gray/70 mt-0.5">Show help in terminal</p>
                </div>
                <div>
                  <span className="text-emerald-400">clear</span>
                  <p className="text-warm-gray/70 mt-0.5">Clear terminal history</p>
                </div>
              </div>
            </div>

            {/* Formatting */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Text Formatting</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">**bold**</code>
                  <span className="text-warm-gray/70 ml-2">→ <strong>bold</strong></span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">*italic*</code>
                  <span className="text-warm-gray/70 ml-2">→ <em>italic</em></span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">~~strike~~</code>
                  <span className="text-warm-gray/70 ml-2">→ <del>strike</del></span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">`code`</code>
                  <span className="text-warm-gray/70 ml-2">→ inline code</span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">[link](url)</code>
                  <span className="text-warm-gray/70 ml-2">→ hyperlink</span>
                </div>
              </div>
            </div>

            {/* Math Formatting */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Math & Science</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">$E=mc^2$</code>
                  <p className="text-warm-gray/70 mt-0.5">Inline math (LaTeX)</p>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">$$...$$</code>
                  <p className="text-warm-gray/70 mt-0.5">Block math equation</p>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">x^2^</code>
                  <span className="text-warm-gray/70 ml-2">→ x² (superscript)</span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">H~2~O</code>
                  <span className="text-warm-gray/70 ml-2">→ H₂O (subscript)</span>
                </div>
              </div>
            </div>

            {/* Structure */}
            <div className="mb-6">
              <h4 className="text-xs font-medium text-icon-gold uppercase tracking-wide mb-2">Structure</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded"># Heading</code>
                  <span className="text-warm-gray/70 ml-2">→ H1-H4</span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">- item</code>
                  <span className="text-warm-gray/70 ml-2">→ bullet list</span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">1. item</code>
                  <span className="text-warm-gray/70 ml-2">→ numbered list</span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">&gt; quote</code>
                  <span className="text-warm-gray/70 ml-2">→ blockquote</span>
                </div>
                <div>
                  <code className="text-emerald-400 bg-ash-stone/30 px-1 rounded">| a | b |</code>
                  <span className="text-warm-gray/70 ml-2">→ table</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="pt-4 border-t border-ash-stone/30">
              <h4 className="text-xs font-medium text-warm-gray uppercase tracking-wide mb-2">Tips</h4>
              <ul className="text-xs text-warm-gray/70 space-y-1">
                <li>• <strong className="text-icon-gold">Paste multiple commands</strong> at once</li>
                <li>• Shift+Enter for new line</li>
                <li>• Enter to run all commands</li>
                <li>• Use ↑/↓ arrows for history</li>
                <li>• Concepts need: name, def</li>
                <li>• Formatting renders in Preview</li>
              </ul>
            </div>
          </div>
        )}

        {/* Terminal */}
        <div className={cn("flex flex-col", (showPreview || showDocs) ? "flex-1" : "w-full")}>
          {/* Output */}
          <div 
            ref={outputRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm"
            onClick={() => inputRef.current?.focus()}
          >
            {history.map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "whitespace-pre-wrap mb-1",
                  item.type === 'input' && "text-icon-gold",
                  item.type === 'output' && "text-warm-gray",
                  item.type === 'error' && "text-red-400",
                  item.type === 'success' && "text-emerald-400",
                )}
              >
                {item.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t border-ash-stone/50">
            <div className="flex gap-2 bg-charcoal-slate rounded-md px-3 py-2">
              <span className="text-icon-gold font-mono mt-0.5">{'>'}</span>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={input.includes('\n') ? Math.min(input.split('\n').length, 10) : 1}
                className="flex-1 bg-transparent border-none outline-none text-parchment font-mono text-sm placeholder:text-warm-gray/50 resize-none min-h-[24px]"
                placeholder="Type a command... (paste multiple lines, Shift+Enter for new line)"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 self-end"
                onClick={() => {
                  processCommand(input)
                  setInput('')
                }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {input.includes('\n') && (
              <p className="text-xs text-warm-gray/50 mt-1 ml-6">
                {input.split('\n').filter(l => l.trim()).length} commands ready • Press Enter to run all
              </p>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-80 border-l border-ash-stone/50 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-parchment mb-3">Live Preview</h3>
            
            {/* Draft Note Preview */}
            {draftNote && (() => {
              const previewConfig = NOTE_TYPE_CONFIGS.find(c => c.value === draftNote.note_type)
              const requiredFields = previewConfig?.fields.filter(f => f.required) || []
              const missingFields = [
                !draftNote.title && 'title',
                ...requiredFields.filter(f => !draftNote.content[f.name]?.trim()).map(f => f.name)
              ].filter(Boolean)
              const isReady = missingFields.length === 0
              
              return (
                <Card className="p-4 mb-4 bg-charcoal-slate border-ash-stone/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="border-[#4A9E8F] text-[#4A9E8F]">
                      Note Draft
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {previewConfig?.label || draftNote.note_type}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-warm-gray">Title: </span>
                      <span className={cn("text-parchment", !draftNote.title && "text-warm-gray/50 italic")}>
                        {draftNote.title ? <FormattedText inline>{draftNote.title}</FormattedText> : 'Not set'}
                      </span>
                    </div>
                    
                    {/* Dynamic fields based on type */}
                    {previewConfig?.fields.map(field => (
                      <div key={field.name}>
                        <span className="text-warm-gray">{field.label}{field.required ? '*' : ''}: </span>
                        <span className={cn("text-parchment", !draftNote.content[field.name] && "text-warm-gray/50 italic")}>
                          {draftNote.content[field.name] ? (
                            <FormattedText inline>{draftNote.content[field.name]}</FormattedText>
                          ) : 'Not set'}
                        </span>
                      </div>
                    ))}
                    
                    <div>
                      <span className="text-warm-gray">Confidence: </span>
                      <span className="text-parchment">{draftNote.confidence}/5</span>
                    </div>
                    <div>
                      <span className="text-warm-gray">Linked Concepts: </span>
                      <span className={cn("text-parchment", getLinkedConceptNames().length === 0 && "text-warm-gray/50 italic")}>
                        {getLinkedConceptNames().length > 0 ? getLinkedConceptNames().join(', ') : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-ash-stone/30">
                    <p className="text-xs text-warm-gray">
                      {isReady 
                        ? '✓ Ready to save' 
                        : 'Missing: ' + missingFields.join(', ')}
                    </p>
                  </div>
                </Card>
              )
            })()}

            {/* Draft Concept Preview */}
            {draftConcept && (
              <Card className="p-4 mb-4 bg-charcoal-slate border-ash-stone/50">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="border-[#5B7DB8] text-[#5B7DB8]">
                    Concept Draft
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-warm-gray">Name: </span>
                    <span className={cn("text-parchment", !draftConcept.name && "text-warm-gray/50 italic")}>
                      {draftConcept.name ? <FormattedText inline>{draftConcept.name}</FormattedText> : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-warm-gray">Definition: </span>
                    <span className={cn("text-parchment", !draftConcept.definition && "text-warm-gray/50 italic")}>
                      {draftConcept.definition ? <FormattedText inline>{draftConcept.definition}</FormattedText> : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-warm-gray">Intuition: </span>
                    <span className={cn("text-parchment", !draftConcept.intuition && "text-warm-gray/50 italic")}>
                      {draftConcept.intuition ? <FormattedText inline>{draftConcept.intuition}</FormattedText> : 'Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-warm-gray">Pitfalls: </span>
                    <span className={cn("text-parchment", !draftConcept.pitfalls && "text-warm-gray/50 italic")}>
                      {draftConcept.pitfalls ? <FormattedText inline>{draftConcept.pitfalls}</FormattedText> : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-ash-stone/30">
                  <p className="text-xs text-warm-gray">
                    {draftConcept.name && draftConcept.definition 
                      ? '✓ Ready to save' 
                      : 'Missing: ' + [
                          !draftConcept.name && 'name',
                          !draftConcept.definition && 'definition'
                        ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </Card>
            )}

            {/* No draft */}
            {!draftNote && !draftConcept && (
              <div className="text-center text-warm-gray/60 text-sm py-8">
                <p>No active draft</p>
                <p className="mt-2 text-xs">
                  Type <span className="text-icon-gold">note new</span> or <span className="text-icon-gold">concept new</span> to start
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
