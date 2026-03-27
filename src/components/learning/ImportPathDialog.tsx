import { useState, useCallback } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { validateImport, importLearningPath } from '@/db/queries/learning'
import type { ImportLearningPath } from '@/db/queries/learning'
import { Copy, Check, AlertCircle, Upload, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImportPathDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: (pathId: string) => void
}

const AI_PROMPT = `Generate a complete learning path as JSON. Follow this exact schema:

{
  "title": "Path Title",
  "description": "One-sentence description of the learning path",
  "modules": [
    {
      "title": "Module Title",
      "description": "Brief module description",
      "lessons": [
        {
          "title": "Lesson Title",
          "subtitle": "Brief subtitle",
          "estimated_minutes": 8,
          "content": "Full markdown lesson content (see syntax below)",
          "terms": [
            { "term": "Term Name", "definition": "Clear one-sentence definition" }
          ]
        }
      ]
    }
  ]
}

CONTENT SYNTAX (inside the "content" string):
- Standard markdown (headings, bold, italic, lists, tables, blockquotes)
- Inline math: $E = mc^2$
- Block math: $$\\\\int_0^1 x^2 dx = \\\\frac{1}{3}$$
- Term links: {{term:inline:Term Name:Definition text}} — highlights the term with a hover tooltip
- Inline graphs: {{graph:sin(x):-5:5}} — renders a mini plot of the expression
- Callout blocks:
  :::tip
  Helpful tip here
  :::
  :::note
  Important note here
  :::
  :::warning
  Warning here
  :::

CRITICAL JSON ESCAPING RULES:
- This is a JSON string, so ALL backslashes must be doubled
- LaTeX \\\\alpha in the JSON renders as \\alpha in the content
- LaTeX \\\\frac{1}{2} in JSON renders as \\frac{1}{2}
- Newlines must be \\n, not literal line breaks
- Example: "content": "Inline math $\\\\alpha$ and block:\\n\\n$$\\n\\\\frac{1}{2}\\n$$"

GUIDELINES:
- Write 3-6 modules with 2-4 lessons each
- Each lesson should be 400-800 words of substantive teaching content
- Use an approachable, conversational tone — explain concepts intuitively before formally
- Include at least one math equation, one term link, and one callout per lesson
- Use {{graph:...}} blocks where visual plots would aid understanding
- Add 3-6 terms per lesson for key vocabulary
- Build concepts progressively — later lessons reference earlier ones

TOPIC: [YOUR TOPIC HERE]

Return ONLY the JSON object, no surrounding text.`

/** Fix backslashes character-by-character, properly handling already-escaped \\ sequences */
function fixBackslashes(raw: string): string {
  const result: string[] = []
  let i = 0
  while (i < raw.length) {
    if (raw[i] === '\\') {
      const next = raw[i + 1]
      if (next === '\\') {
        // Already escaped backslash — pass through both
        result.push('\\\\')
        i += 2
      } else if (next && '"/bfnrtu'.includes(next)) {
        // Could be valid JSON escape OR LaTeX starting with n/t/b/f/r
        if (next && 'ntbfr'.includes(next)) {
          let j = i + 2
          while (j < raw.length && raw[j] >= 'a' && raw[j] <= 'z') j++
          if (j - (i + 2) >= 2) {
            // 2+ lowercase letters after \n/\t/etc → LaTeX command (\nabla, \theta, \beta, \frac)
            result.push('\\\\')
            i++
            continue
          }
        }
        // Valid JSON escape (\n, \t, \", etc.)
        result.push('\\', next)
        i += 2
      } else {
        // Not a valid JSON escape (\alpha, \lambda, \sum, etc.) — escape it
        result.push('\\\\')
        i++
      }
    } else {
      result.push(raw[i])
      i++
    }
  }
  return result.join('')
}

/**
 * Robustly parse AI-generated JSON that may have:
 * - Unescaped LaTeX backslashes (\alpha, \frac, \nabla, \theta, etc.)
 * - Unescaped double quotes inside string values ("Linear")
 * - Markdown code fences wrapping the JSON
 */
function parseAiJson(raw: string): unknown {
  let s = raw.trim()

  // Strip markdown code fences
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  // Try parsing as-is first (handles well-formed JSON)
  try {
    return JSON.parse(s)
  } catch { /* fall through to fixes */ }

  // Fix backslashes (handles \alpha, \nabla, \theta, \\, etc.)
  s = fixBackslashes(s)

  // Iteratively fix unescaped quotes inside string values ("Linear" → \"Linear\")
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      return JSON.parse(s)
    } catch (e) {
      if (!(e instanceof SyntaxError)) throw e
      const match = e.message.match(/position (\d+)/)
      if (!match) throw e

      const errorPos = parseInt(match[1])
      let fixed = false

      for (let i = errorPos; i >= 0; i--) {
        if (s[i] === '"') {
          let bs = 0
          let j = i - 1
          while (j >= 0 && s[j] === '\\') { bs++; j-- }
          if (bs % 2 === 0) {
            s = s.substring(0, i) + '\\"' + s.substring(i + 1)
            fixed = true
            break
          }
        }
      }

      if (!fixed) throw e
    }
  }

  throw new SyntaxError('Could not parse JSON after maximum fix attempts')
}

type Tab = 'import' | 'prompt'

export function ImportPathDialog({ open, onOpenChange, onImported }: ImportPathDialogProps) {
  const [tab, setTab] = useState<Tab>('prompt')
  const [json, setJson] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleCopyPrompt = useCallback(() => {
    navigator.clipboard.writeText(AI_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleImport = useCallback(() => {
    setError(null)

    let parsed: unknown
    try {
      parsed = parseAiJson(json)
    } catch (e) {
      const msg = e instanceof SyntaxError ? e.message : 'check for syntax errors'
      setError(`Invalid JSON — ${msg}`)
      return
    }

    const validation = validateImport(parsed)
    if (!validation.valid) {
      setError(validation.error || 'Invalid format')
      return
    }

    setImporting(true)
    try {
      const pathId = importLearningPath(parsed as ImportLearningPath)
      setJson('')
      setError(null)
      setImporting(false)
      onImported(pathId)
      onOpenChange(false)
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setImporting(false)
    }
  }, [json, onImported, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-charcoal-slate border-ash-stone">
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-serif text-parchment">Import Learning Path</DialogTitle>
          <DialogDescription className="text-warm-gray">
            Use AI to generate a learning path, then paste the JSON here.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-ash-stone/30 mb-4 shrink-0">
          <button
            onClick={() => setTab('prompt')}
            className={cn(
              'px-3 py-2 text-sm transition-colors border-b-2 -mb-px',
              tab === 'prompt'
                ? 'border-icon-gold text-parchment'
                : 'border-transparent text-warm-gray hover:text-parchment'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            AI Prompt
          </button>
          <button
            onClick={() => setTab('import')}
            className={cn(
              'px-3 py-2 text-sm transition-colors border-b-2 -mb-px',
              tab === 'import'
                ? 'border-icon-gold text-parchment'
                : 'border-transparent text-warm-gray hover:text-parchment'
            )}
          >
            <Upload className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Paste JSON
          </button>
        </div>

        {/* Tab content */}
        {tab === 'prompt' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            <p className="text-sm text-warm-gray shrink-0">
              Copy this prompt, paste it into any AI (ChatGPT, Claude, etc.), replace <code className="text-icon-gold bg-ash-stone/30 px-1 rounded text-xs">[YOUR TOPIC HERE]</code> with your subject, and paste the result in the Import tab.
            </p>
            <div className="flex-1 min-h-0 relative overflow-hidden">
              <pre className="h-full overflow-y-auto rounded-lg bg-deep-obsidian border border-ash-stone/30 p-4 text-xs text-warm-gray/80 font-mono leading-relaxed whitespace-pre-wrap break-words">
                {AI_PROMPT}
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={handleCopyPrompt}
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button onClick={() => setTab('import')} className="self-end shrink-0">
              Next: Paste JSON
            </Button>
          </div>
        )}

        {tab === 'import' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            <textarea
              value={json}
              onChange={(e) => { setJson(e.target.value); setError(null) }}
              placeholder='Paste the AI-generated JSON here...'
              className="flex-1 min-h-0 rounded-lg bg-deep-obsidian border border-ash-stone/30 p-4 text-sm text-parchment font-mono leading-relaxed resize-none focus:outline-none focus:border-icon-gold/50 placeholder:text-warm-gray/30"
            />

            {error && (
              <div className="flex items-start gap-2 text-oxide-red text-sm bg-oxide-red/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={!json.trim() || importing}>
                {importing ? 'Importing...' : 'Import Path'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
