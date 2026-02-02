import { useState, useRef, useEffect } from 'react'
import { useNotes } from '@/hooks/useNotes'
import { useConcepts } from '@/hooks/useConcepts'
import { useAppStore } from '@/stores/appStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Terminal, Send, X } from 'lucide-react'
import { NOTE_TYPE_CONFIGS } from '@/types'
import type { NoteType, AtomicNote, Concept } from '@/types'

interface CommandHistory {
  type: 'input' | 'output' | 'error' | 'success'
  text: string
}

interface DraftNote {
  title: string
  note_type: NoteType
  content: Record<string, string>
  confidence: number
  concept_ids: string[]
}

interface BranchTerminalProps {
  parentNode: {
    id: string
    type: 'note' | 'concept'
    label: string
    data: AtomicNote | Concept
  }
  onSave: () => void
  onCancel: () => void
}

const BRANCH_HELP = `
Branch Note Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  title <text>         Set note title
  type <type>          Set type: definition, idea, connection,
                       question, insight, process, example
  set <field> <value>  Set a content field
  fields               Show fields for current type
  confidence <1-5>     Set confidence level
  save                 Save and create the note
  cancel               Cancel branching
  help                 Show this help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

export function BranchTerminal({ parentNode, onSave, onCancel }: BranchTerminalProps) {
  // Get concept IDs to link to
  const getInitialConceptIds = (): string[] => {
    if (parentNode.type === 'concept') {
      return [parentNode.id.replace('concept-', '')]
    } else {
      const parentNote = parentNode.data as AtomicNote
      return parentNote.concepts?.map(c => c.id) || []
    }
  }

  const getDefaultContent = (noteType: NoteType): Record<string, string> => {
    const config = NOTE_TYPE_CONFIGS.find(c => c.value === noteType)
    if (!config) return {}
    const content: Record<string, string> = {}
    for (const field of config.fields) {
      content[field.name] = ''
    }
    return content
  }

  const [input, setInput] = useState('')
  const [history, setHistory] = useState<CommandHistory[]>([
    { type: 'output', text: `Branching from: ${parentNode.label}` },
    { type: 'output', text: 'Type "help" for commands or start with "title <your title>"' },
    { type: 'output', text: '' },
  ])
  const [draftNote, setDraftNote] = useState<DraftNote>({
    title: '',
    note_type: 'idea',
    content: getDefaultContent('idea'),
    confidence: 3,
    concept_ids: getInitialConceptIds(),
  })
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const { createNote } = useNotes()
  const { concepts } = useConcepts()
  const { triggerRefresh } = useAppStore()

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

  const addOutput = (text: string, type: CommandHistory['type'] = 'output') => {
    setHistory(prev => [...prev, { type, text }])
  }

  const getTypeConfig = (noteType: NoteType) => NOTE_TYPE_CONFIGS.find(c => c.value === noteType)

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim()
    if (!trimmed) return

    setCommandHistory(prev => [...prev, trimmed])
    setHistoryIndex(-1)

    // Echo the command
    addOutput(`> ${trimmed}`, 'input')

    const parts = trimmed.split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    switch (command) {
      case 'help':
        addOutput(BRANCH_HELP)
        break

      case 'cancel':
        onCancel()
        break

      case 'title':
        if (!args) {
          addOutput('Please provide a title: title <text>', 'error')
          return
        }
        setDraftNote(prev => ({ ...prev, title: args }))
        addOutput(`Title set: "${args}"`, 'success')
        break

      case 'type': {
        const validTypes = NOTE_TYPE_CONFIGS.map(t => t.value)
        const typeArg = args.toLowerCase() as NoteType
        if (!validTypes.includes(typeArg)) {
          addOutput(`Invalid type. Valid: ${validTypes.join(', ')}`, 'error')
          return
        }
        setDraftNote(prev => ({ ...prev, note_type: typeArg, content: getDefaultContent(typeArg) }))
        const newConfig = getTypeConfig(typeArg)
        addOutput(`Type: ${newConfig?.label}. Fields: ${newConfig?.fields.map(f => f.name).join(', ')}`, 'success')
        break
      }

      case 'fields': {
        const config = getTypeConfig(draftNote.note_type)
        if (config) {
          const fieldList = config.fields.map(f => `  ${f.name}${f.required ? '*' : ''}: ${f.placeholder}`).join('\n')
          addOutput(`Fields for ${config.label}:\n${fieldList}\n\nUse: set <field> <value>`)
        }
        break
      }

      case 'set': {
        const setParts = args.split(' ')
        const fieldName = setParts[0]?.toLowerCase()
        const fieldValue = setParts.slice(1).join(' ')

        const typeConfig = getTypeConfig(draftNote.note_type)
        const field = typeConfig?.fields.find(f => f.name.toLowerCase() === fieldName)

        if (!field) {
          const availableFields = typeConfig?.fields.map(f => f.name).join(', ') || 'none'
          addOutput(`Unknown field "${fieldName}". Available: ${availableFields}`, 'error')
          return
        }
        if (!fieldValue) {
          addOutput(`Please provide a value: set ${fieldName} <value>`, 'error')
          return
        }

        setDraftNote(prev => ({
          ...prev,
          content: { ...prev.content, [field.name]: fieldValue }
        }))
        addOutput(`${field.label} set.`, 'success')
        break
      }

      case 'confidence': {
        const conf = parseInt(args)
        if (isNaN(conf) || conf < 1 || conf > 5) {
          addOutput('Confidence must be between 1 and 5.', 'error')
          return
        }
        setDraftNote(prev => ({ ...prev, confidence: conf }))
        addOutput(`Confidence set to ${conf}.`, 'success')
        break
      }

      case 'save': {
        if (!draftNote.title) {
          addOutput('Missing title. Use: title <text>', 'error')
          return
        }
        const config = getTypeConfig(draftNote.note_type)
        const requiredFields = config?.fields.filter(f => f.required) || []
        const missingFields = requiredFields.filter(f => !draftNote.content[f.name]?.trim())

        if (missingFields.length > 0) {
          addOutput(`Missing required fields: ${missingFields.map(f => f.name).join(', ')}`, 'error')
          return
        }

        const newNote = createNote({
          title: draftNote.title,
          note_type: draftNote.note_type,
          content: draftNote.content as any,
          confidence: draftNote.confidence,
          concept_ids: draftNote.concept_ids,
        })

        if (newNote) {
          addOutput(`Note saved: "${newNote.title}"`, 'success')
          triggerRefresh() // Notify other components to refresh data
          setTimeout(() => onSave(), 300)
        } else {
          addOutput('Failed to save note.', 'error')
        }
        break
      }

      default:
        addOutput(`Unknown command: ${command}. Type "help" for commands.`, 'error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      processCommand(input)
      setInput('')
    } else if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'ArrowUp' && !input.includes('\n')) {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || '')
      }
    } else if (e.key === 'ArrowDown' && !input.includes('\n')) {
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
    return draftNote.concept_ids
      .map(id => concepts.find(c => c.id === id)?.name)
      .filter(Boolean) as string[]
  }

  const previewConfig = NOTE_TYPE_CONFIGS.find(c => c.value === draftNote.note_type)
  const requiredFields = previewConfig?.fields.filter(f => f.required) || []
  const missingFields = [
    !draftNote.title && 'title',
    ...requiredFields.filter(f => !draftNote.content[f.name]?.trim()).map(f => f.name)
  ].filter(Boolean)
  const isReady = missingFields.length === 0

  return (
    <div className="h-full flex flex-col bg-deep-obsidian border-l border-ash-stone/50">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-ash-stone/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-icon-gold" />
            <span className="text-sm font-medium text-parchment">Branch Terminal</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="flex-shrink-0 p-3 border-b border-ash-stone/50 bg-charcoal-slate/30">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="border-[#4A9E8F] text-[#4A9E8F] text-xs">
            Draft
          </Badge>
          <Badge variant="outline" className="text-xs capitalize">
            {previewConfig?.label || draftNote.note_type}
          </Badge>
          {isReady && (
            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Ready</Badge>
          )}
        </div>

        <div className="space-y-1 text-xs">
          <div>
            <span className="text-warm-gray">Title: </span>
            <span className={cn("text-parchment", !draftNote.title && "text-warm-gray/50 italic")}>
              {draftNote.title || 'Not set'}
            </span>
          </div>
          {previewConfig?.fields.slice(0, 2).map(field => (
            <div key={field.name}>
              <span className="text-warm-gray">{field.label}: </span>
              <span className={cn(
                "text-parchment",
                !draftNote.content[field.name] && "text-warm-gray/50 italic"
              )}>
                {draftNote.content[field.name]
                  ? (draftNote.content[field.name].length > 50
                      ? draftNote.content[field.name].slice(0, 50) + '...'
                      : draftNote.content[field.name])
                  : 'Not set'}
              </span>
            </div>
          ))}
          <div>
            <span className="text-warm-gray">Links to: </span>
            <span className="text-parchment">
              {getLinkedConceptNames().join(', ') || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs"
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

      {/* Terminal Input */}
      <div className="flex-shrink-0 p-3 border-t border-ash-stone/50">
        <div className="flex gap-2 bg-charcoal-slate rounded-md px-2 py-1.5">
          <span className="text-icon-gold font-mono text-xs mt-0.5">{'>'}</span>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-parchment font-mono text-xs placeholder:text-warm-gray/50 resize-none min-h-[20px]"
            placeholder="title <your title>"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 self-end"
            onClick={() => {
              processCommand(input)
              setInput('')
            }}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-warm-gray/50 mt-1 ml-4">
          {isReady ? 'Type "save" to create note' : `Missing: ${missingFields.join(', ')}`}
        </p>
      </div>
    </div>
  )
}
