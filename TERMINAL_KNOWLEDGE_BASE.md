# Terminal Implementation Knowledge Base

> A comprehensive collection of interconnected concepts and notes for implementing a CLI-style terminal interface in React applications. Use this as a reference for feature expansion.

---

## Core Concepts

### 1. React Terminal Architecture

**Definition:** A CLI-style interface built entirely in React without external terminal libraries, using controlled inputs, local state management, and a command-dispatch pattern.

**Intuition:** Think of it as a chat interface where the user types commands instead of messages, and the system responds with structured output. The terminal is essentially a sophisticated text-based form with real-time feedback.

**Pitfalls:**
- Don't try to emulate a real shell - focus on domain-specific commands
- Avoid making it a monolithic component - extract reusable pieces
- Local state works well for single-session terminals, but consider persistence for multi-session needs

**Related Concepts:** [Command Parser](#2-command-parser), [History Buffer](#3-history-buffer), [Output Renderer](#4-output-renderer)

---

### 2. Command Parser

**Definition:** A string-processing function that tokenizes user input into command, subcommand, and arguments, then routes execution to appropriate handlers.

**Intuition:** Like a URL router, but for text commands. `note title Hello` becomes `{command: "note", subCommand: "title", args: "Hello"}`.

**Pitfalls:**
- Handle edge cases: empty input, extra whitespace, quoted strings
- Case sensitivity decisions should be consistent
- Error messages must guide users to correct syntax

**Implementation Pattern:**
```typescript
const processCommand = (cmd: string) => {
  const parts = cmd.trim().split(' ')
  const command = parts[0].toLowerCase()
  const subCommand = parts[1]?.toLowerCase()
  const args = parts.slice(2).join(' ')

  switch (command) {
    case 'note': handleNoteCommand(subCommand, args); break
    case 'concept': handleConceptCommand(subCommand, args); break
    default: showError(`Unknown command: ${command}`)
  }
}
```

**Related Concepts:** [Command Handlers](#5-command-handlers), [Validation Layer](#6-validation-layer)

---

### 3. History Buffer

**Definition:** A dual-state system tracking both displayed output (visual history) and command strings (navigation history) to enable arrow-key command recall.

**Intuition:** Two separate arrays - one for what you see (output), one for what you typed (for recall). Arrow keys traverse the command array, while the output array just grows.

**Implementation Pattern:**
```typescript
const [history, setHistory] = useState<CommandHistory[]>([])      // Visual output
const [commandHistory, setCommandHistory] = useState<string[]>([]) // For arrow navigation
const [historyIndex, setHistoryIndex] = useState(-1)               // Current position

// Arrow key handler
if (e.key === 'ArrowUp') {
  const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1)
  setHistoryIndex(newIndex)
  setInput(commandHistory[commandHistory.length - 1 - newIndex])
}
```

**Pitfalls:**
- Reset `historyIndex` to -1 after executing a command
- Navigate from most recent (end of array) backwards
- Clear input when navigating past the end

**Related Concepts:** [Keyboard Navigation](#7-keyboard-navigation)

---

### 4. Output Renderer

**Definition:** A component that maps command history items to styled output based on type (input, output, error, success).

**Intuition:** Each line in terminal output is an object with a type. The type determines color. Input echoes in gold, errors in red, success in green.

**Type System:**
```typescript
interface CommandHistory {
  type: 'input' | 'output' | 'error' | 'success'
  text: string
  timestamp: Date
}
```

**Color Mapping:**
| Type | Color | Use Case |
|------|-------|----------|
| input | icon-gold (#C8A24A) | Echo user commands |
| output | warm-gray (#B8B1A6) | Informational text |
| error | red-400 | Validation failures |
| success | emerald-400 | Confirmations |

**Related Concepts:** [Auto-Scroll](#8-auto-scroll), [Rich Text Rendering](#9-rich-text-rendering)

---

### 5. Command Handlers

**Definition:** Domain-specific functions that implement the logic for each command category, managing draft state and executing operations.

**Intuition:** Each top-level command (note, concept, list) has its own handler function. The handler receives subcommand and args, then uses a switch to dispatch further.

**Handler Pattern:**
```typescript
const handleNoteCommand = (subCommand: string, args: string) => {
  switch (subCommand) {
    case 'new': initializeDraft(); break
    case 'title': setDraftField('title', args); break
    case 'set': setContentField(args); break
    case 'save': validateAndSave(); break
    case 'clear': clearDraft(); break
    default: showError('Unknown subcommand')
  }
}
```

**Related Concepts:** [Draft State](#10-draft-state), [Validation Layer](#6-validation-layer)

---

### 6. Validation Layer

**Definition:** A set of checks performed before operations that ensure required fields exist, values are in valid ranges, and referenced entities exist.

**Intuition:** Gate every destructive or persisting operation with validation. Return early with clear error messages.

**Validation Types:**
1. **Presence:** Required fields must have non-empty values
2. **Range:** Numeric values within bounds (confidence 1-5)
3. **Reference:** Linked entities must exist (concept names)
4. **Uniqueness:** Prevent duplicate links

**Implementation Example:**
```typescript
// Before save
if (!draftNote.title) return addError('Missing required field: title')

const requiredFields = config.fields.filter(f => f.required)
const missing = requiredFields.filter(f => !draft.content[f.name]?.trim())
if (missing.length) return addError(`Missing: ${missing.map(f => f.name).join(', ')}`)
```

**Related Concepts:** [Error Messaging](#11-error-messaging)

---

### 7. Keyboard Navigation

**Definition:** Event handlers for keyboard shortcuts that enable efficient terminal interaction without mouse.

**Key Bindings:**
| Key | Action |
|-----|--------|
| Enter | Execute command, clear input |
| Arrow Up | Previous command in history |
| Arrow Down | Next command / clear |

**Implementation:**
```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    processCommand(input)
    setInput('')
  } else if (e.key === 'ArrowUp') {
    e.preventDefault() // Prevent cursor movement
    // Navigate history backwards
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    // Navigate history forwards or clear
  }
}
```

**Related Concepts:** [History Buffer](#3-history-buffer), [Input Focus Management](#12-input-focus-management)

---

### 8. Auto-Scroll

**Definition:** A useEffect hook that scrolls the output container to bottom whenever new content is added.

**Implementation:**
```typescript
const outputRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (outputRef.current) {
    outputRef.current.scrollTop = outputRef.current.scrollHeight
  }
}, [history])
```

**Pitfalls:**
- Ensure the container has overflow-y-auto
- This fires on every history change - acceptable for most use cases
- Consider debouncing if performance becomes an issue with rapid output

---

### 9. Rich Text Rendering

**Definition:** Support for markdown, LaTeX math, and custom formatting in terminal output and preview panels.

**Supported Syntax:**
- `**bold**` → **bold**
- `*italic*` → *italic*
- `~~strikethrough~~` → ~~strikethrough~~
- `` `code` `` → inline code
- `[link](url)` → hyperlink
- `$E=mc^2$` → inline math
- `$$equation$$` → block math
- `x^2^` → superscript
- `H~2~O` → subscript

**Implementation:** Use a FormattedText component that parses and renders these formats. Can use react-markdown + KaTeX for math.

**Related Concepts:** [Preview Panel](#13-preview-panel)

---

### 10. Draft State

**Definition:** Temporary objects holding in-progress note or concept data before saving to the database.

**Draft Interfaces:**
```typescript
interface DraftNote {
  title: string
  note_type: NoteType
  content: Record<string, string>  // Dynamic fields based on type
  confidence: number               // 1-5 scale
  concept_ids: string[]            // Linked concepts
}

interface DraftConcept {
  name: string
  definition: string
  intuition?: string
  pitfalls?: string
}
```

**State Flow:**
1. `new` command initializes empty draft with defaults
2. Property commands (`title`, `set`, etc.) update draft
3. `save` validates and persists, then clears draft
4. `clear` discards draft without saving

**Pitfalls:**
- Only one draft per entity type at a time
- Changing note type resets content fields
- Draft is lost on page navigation (unless persisted)

**Related Concepts:** [Dynamic Field Configuration](#14-dynamic-field-configuration)

---

### 11. Error Messaging

**Definition:** User-friendly error output that explains what went wrong and how to fix it.

**Principles:**
1. State what's wrong: "Missing required field: title"
2. Show what's available: "Valid types: definition, idea, connection..."
3. Provide correct syntax: "Use: note set <field> <value>"

**Implementation Pattern:**
```typescript
// Bad
addOutput('Error', 'error')

// Good
addOutput(`Unknown field "${fieldName}". Available: ${validFields.join(', ')}`, 'error')
```

---

### 12. Input Focus Management

**Definition:** Automatic and programmatic focus control ensuring the input is always ready for typing.

**Scenarios:**
1. **Mount focus:** Auto-focus input when component loads
2. **Click focus:** Click anywhere in terminal to focus input
3. **Post-command focus:** Input stays focused after command execution

**Implementation:**
```typescript
const inputRef = useRef<HTMLInputElement>(null)

// Auto-focus on mount
useEffect(() => {
  inputRef.current?.focus()
}, [])

// Click-to-focus
<div onClick={() => inputRef.current?.focus()}>
  {/* Terminal content */}
</div>
```

---

### 13. Preview Panel

**Definition:** A side panel showing real-time visualization of the current draft with validation status.

**Features:**
- Shows all draft fields with current values
- Indicates which fields are set vs "Not set"
- Shows validation status: "Ready to save" or "Missing: [fields]"
- Supports rich text rendering for preview
- Toggleable via header button

**Layout:**
```
┌─────────────────┬─────────────────┐
│                 │ Live Preview    │
│    Terminal     │                 │
│    Output       │ [Draft Type]    │
│                 │ Title: ...      │
│                 │ Field1: ...     │
│ > input         │ Field2: ...     │
│                 │                 │
│                 │ ✓ Ready to save │
└─────────────────┴─────────────────┘
```

**Related Concepts:** [Draft State](#10-draft-state)

---

### 14. Dynamic Field Configuration

**Definition:** A type-driven system where note types define their own required and optional fields, enabling flexible content structures.

**Configuration Structure:**
```typescript
interface NoteTypeConfig {
  value: NoteType          // 'definition', 'idea', etc.
  label: string            // Display name
  description: string      // Help text
  fields: {
    name: string           // Field key
    label: string          // Display label
    placeholder: string    // Help text for field
    required: boolean      // Validation flag
    multiline?: boolean    // UI hint
  }[]
}
```

**Available Note Types:**

| Type | Required Fields | Optional Fields |
|------|-----------------|-----------------|
| definition | term, definition | - |
| idea | description | applications |
| connection | item_a, item_b, relationship | - |
| question | question | context, possible_answers |
| insight | insight | trigger, implications |
| process | steps | use_case |
| example | subject, example | why_it_works |

**Usage Pattern:**
```typescript
const getDefaultContent = (type: NoteType) => {
  const config = NOTE_TYPE_CONFIGS.find(c => c.value === type)
  return Object.fromEntries(config.fields.map(f => [f.name, '']))
}
```

---

### 15. Database Integration

**Definition:** The connection layer between terminal commands and persistent storage using custom hooks and query functions.

**Architecture:**
```
Terminal Commands
       ↓
  Draft State
       ↓
  Validation
       ↓
  Custom Hooks (useNotes, useConcepts)
       ↓
  Query Functions (noteQueries.createNote)
       ↓
  SQL.js Database
```

**Hook Pattern:**
```typescript
const { notes, createNote } = useNotes()
const { concepts, createConcept } = useConcepts()

// Usage in save command
const newNote = createNote({
  title: draft.title,
  note_type: draft.note_type,
  content: draft.content,
  confidence: draft.confidence,
  concept_ids: draft.concept_ids,
})
```

**Related Concepts:** [Entity Linking](#16-entity-linking)

---

### 16. Entity Linking

**Definition:** The ability to create relationships between notes and concepts through terminal commands.

**Flow:**
1. User types `note link <concept-name>`
2. System searches concepts by name (case-insensitive)
3. If found, concept ID added to draft's concept_ids array
4. If not found, error with available concept names
5. Duplicates prevented

**Implementation:**
```typescript
case 'link':
  const concept = concepts.find(c =>
    c.name.toLowerCase() === args.toLowerCase()
  )
  if (!concept) {
    return addError(`Concept "${args}" not found. Available: ${concepts.map(c => c.name).join(', ')}`)
  }
  if (draft.concept_ids.includes(concept.id)) {
    return addError(`Already linked to "${concept.name}"`)
  }
  setDraft({ ...draft, concept_ids: [...draft.concept_ids, concept.id] })
  addSuccess(`Linked to concept: "${concept.name}"`)
```

---

### 17. Documentation Panel

**Definition:** A collapsible sidebar providing inline command reference, syntax examples, and usage tips.

**Sections:**
1. **Command Reference** - All available commands with syntax
2. **Note Types & Fields** - Type-specific field documentation
3. **Text Formatting** - Markdown syntax quick reference
4. **Math & Science** - LaTeX and super/subscript
5. **Structure** - Headers, lists, tables
6. **Tips** - Keyboard shortcuts and best practices

**Benefits:**
- Users don't need to memorize commands
- Reduces context switching to external docs
- Shows field requirements per note type

---

## Implementation Notes

### Note: Building a Terminal from Scratch

**Type:** Process

**Steps:**
1. Create component with controlled input state
2. Add output history array state
3. Implement processCommand function with switch routing
4. Add command-specific handlers
5. Implement keyboard event handling (Enter, arrows)
6. Add auto-scroll effect
7. Style with monospace font and terminal colors
8. Add optional preview/docs panels

**Use Case:** When you need a domain-specific CLI without external dependencies, want full control over styling, or need tight integration with React state.

---

### Note: State Architecture Decision

**Type:** Insight

**Insight:** All terminal state is kept local to the component rather than in global state. This simplifies the implementation and is appropriate when terminal state doesn't need to persist across sessions or be accessed from other components.

**Trigger:** Analyzing why the implementation uses useState instead of Zustand for terminal-specific state.

**Implications:**
- Terminal history is lost on unmount/navigation
- No need to coordinate with other components
- Simpler mental model for terminal interactions
- Consider adding persistence if session continuity matters

---

### Note: Command History Navigation

**Type:** Example

**Subject:** Arrow key navigation through command history

**Example:**
User types commands: `note new`, `note title Test`, `note save`

Array state: `['note new', 'note title Test', 'note save']`

Arrow Up once → shows `note save` (index 0 from end)
Arrow Up again → shows `note title Test` (index 1 from end)
Arrow Down → back to `note save`
Arrow Down again → clears input (past end of history)

**Why It Works:** The historyIndex is inverted - it counts from -1 (no selection) upward, but we read from the array end backwards. This matches user expectation that "up" means "older."

---

### Note: Dynamic Type Switching

**Type:** Connection

**Item A:** Note type selection (`note type <type>`)

**Item B:** Content field initialization

**Relationship:** When a user changes the note type, the content object must be reset to match the new type's fields. Otherwise, old fields would persist and new required fields would be missing. This is accomplished by calling `getDefaultContent(newType)` which creates an empty object with all field keys for that type.

---

### Note: Validation Before Persistence

**Type:** Process

**Steps:**
1. Check draft exists (`if (!draft) return error`)
2. Check required scalar fields (title, name)
3. Get type-specific field configuration
4. Filter required fields
5. Check each required field has non-empty trimmed value
6. Collect missing field names
7. If any missing, return error listing them
8. If all valid, proceed to create/save

**Use Case:** Every save operation in a terminal that builds objects incrementally through multiple commands.

---

### Note: Why No External Terminal Libraries?

**Type:** Question

**Question:** Why build a terminal from scratch instead of using xterm.js or react-terminal-ui?

**Context:** External terminal libraries provide shell emulation, ANSI support, and complex features out of the box.

**Possible Answers:**
- Full control over styling to match application theme
- Domain-specific commands don't need shell features
- Simpler bundle size without terminal emulator
- Tight integration with React state and hooks
- Preview panel and validation not supported by terminal libs
- Custom rich text rendering (markdown, LaTeX) in output

---

### Note: Terminal Color Scheme

**Type:** Definition

**Term:** Terminal Theme Variables

**Definition:** A set of CSS custom properties defining the terminal's visual appearance:
- `--deep-obsidian` (#0B0F14): Main background
- `--charcoal-slate` (#121923): Input bar, secondary backgrounds
- `--ash-stone` (#161E29): Borders, subtle accents
- `--parchment` (#E7E0D4): Primary text
- `--warm-gray` (#B8B1A6): Secondary text, output
- `--icon-gold` (#C8A24A): Commands, prompts, accents
- `--emerald-400`: Success messages
- `--red-400`: Error messages

---

## Connection Map

```
                    ┌─────────────────────┐
                    │  React Terminal     │
                    │   Architecture      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌────────────────┐
│ Command Parser│───▶│ Command Handlers│───▶│ Database       │
└───────────────┘    └─────────────────┘    │ Integration    │
        │                    │              └────────────────┘
        │                    │                      │
        ▼                    ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌────────────────┐
│ History Buffer│    │   Draft State   │    │ Entity Linking │
└───────────────┘    └─────────────────┘    └────────────────┘
        │                    │
        ▼                    ▼
┌───────────────┐    ┌─────────────────┐
│   Keyboard    │    │ Validation Layer│
│  Navigation   │    └─────────────────┘
└───────────────┘            │
        │                    ▼
        ▼            ┌─────────────────┐
┌───────────────┐    │ Error Messaging │
│ Input Focus   │    └─────────────────┘
│  Management   │
└───────────────┘

        ┌─────────────────────────────────────┐
        │           UI Components             │
        ├─────────────┬───────────┬───────────┤
        │   Output    │  Preview  │   Docs    │
        │  Renderer   │   Panel   │  Panel    │
        └─────────────┴───────────┴───────────┘
               │             │
               ▼             ▼
        ┌─────────────┐ ┌───────────────────┐
        │ Auto-Scroll │ │ Rich Text         │
        └─────────────┘ │ Rendering         │
                        └───────────────────┘
                               │
                               ▼
                        ┌───────────────────┐
                        │ Dynamic Field     │
                        │ Configuration     │
                        └───────────────────┘
```

---

## Quick Reference

### Minimal Terminal Implementation Checklist

- [ ] Controlled input with useState
- [ ] History array for output display
- [ ] Command history array for navigation
- [ ] processCommand router function
- [ ] Enter key handler
- [ ] Arrow key handlers
- [ ] Auto-scroll useEffect
- [ ] Output type styling (input/output/error/success)
- [ ] Click-to-focus on container
- [ ] Help command showing available commands

### Optional Enhancements

- [ ] Preview panel for drafts
- [ ] Documentation panel
- [ ] Rich text rendering
- [ ] Validation feedback
- [ ] Entity linking
- [ ] Session persistence
- [ ] Command autocomplete
- [ ] Command aliases
- [ ] Multi-line input
- [ ] Searchable history

---

## File Structure Reference

```
src/
├── pages/
│   └── TerminalPage.tsx           # Main terminal component (917 lines)
├── hooks/
│   ├── useNotes.ts                # Note CRUD operations
│   └── useConcepts.ts             # Concept CRUD operations
├── types/
│   └── index.ts                   # Type definitions, NOTE_TYPE_CONFIGS
├── components/
│   └── ui/
│       ├── formatted-text.tsx     # Rich text renderer
│       ├── button.tsx             # UI components
│       ├── card.tsx
│       └── badge.tsx
├── stores/
│   └── appStore.ts                # Global state (minimal terminal use)
└── db/
    └── queries/
        ├── notes.ts               # Database queries
        └── concepts.ts
```

---

*Generated from Arkvim Terminal implementation analysis*
