import { useState } from 'react'
import { FormattedText } from '@/components/ui/formatted-text'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Check, AlertCircle } from 'lucide-react'
import { nanoid } from 'nanoid'

interface ProofStep {
  id: string
  statement: string // LaTeX math statement
  justification: string // Axiom, theorem, or computation name
  isValid?: boolean
}

interface Proof {
  title: string
  goal: string
  steps: ProofStep[]
}

export function ProofEditor() {
  const [proof, setProof] = useState<Proof>({
    title: '',
    goal: '',
    steps: [{ id: nanoid(), statement: '', justification: '' }],
  })

  const addStep = () => {
    setProof(p => ({
      ...p,
      steps: [...p.steps, { id: nanoid(), statement: '', justification: '' }],
    }))
  }

  const removeStep = (id: string) => {
    setProof(p => ({
      ...p,
      steps: p.steps.filter(s => s.id !== id),
    }))
  }

  const updateStep = (id: string, updates: Partial<ProofStep>) => {
    setProof(p => ({
      ...p,
      steps: p.steps.map(s => s.id === id ? { ...s, ...updates } : s),
    }))
  }

  const validateAll = () => {
    // Basic validation: mark all steps as valid if they have content
    setProof(p => ({
      ...p,
      steps: p.steps.map(s => ({
        ...s,
        isValid: s.statement.trim().length > 0 && s.justification.trim().length > 0,
      })),
    }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Proof header */}
      <div className="space-y-3">
        <input
          type="text"
          value={proof.title}
          onChange={e => setProof({ ...proof, title: e.target.value })}
          placeholder="Proof title (e.g., Chain Rule Derivation)"
          className="w-full bg-transparent text-xl font-serif text-parchment outline-none border-b border-ash-stone/30 pb-2 placeholder:text-warm-gray/30"
        />
        <div>
          <label className="text-xs uppercase tracking-wider text-warm-gray/50 mb-1 block">Goal / Statement to Prove</label>
          <textarea
            value={proof.goal}
            onChange={e => setProof({ ...proof, goal: e.target.value })}
            placeholder="$$\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)$$"
            className="w-full bg-charcoal-slate/50 border border-ash-stone/30 rounded p-3 text-sm font-mono text-parchment outline-none resize-none min-h-[60px]"
          />
          {proof.goal && (
            <div className="mt-2 p-3 bg-obsidian/30 rounded border border-ash-stone/20">
              <FormattedText>{proof.goal}</FormattedText>
            </div>
          )}
        </div>
      </div>

      {/* Proof steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-warm-gray/50 font-medium">Proof Steps</h3>
          <Button variant="outline" size="sm" onClick={validateAll}>
            <Check className="h-3 w-3 mr-1" /> Validate
          </Button>
        </div>

        {proof.steps.map((step, i) => (
          <div
            key={step.id}
            className={`border rounded-lg p-4 space-y-2 ${
              step.isValid === true ? 'border-green-500/30 bg-green-500/5' :
              step.isValid === false ? 'border-oxide-red/30 bg-oxide-red/5' :
              'border-ash-stone/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xs text-warm-gray/50 font-mono mt-2 shrink-0 w-6">{i + 1}.</span>
              <div className="flex-1 space-y-2">
                <textarea
                  value={step.statement}
                  onChange={e => updateStep(step.id, { statement: e.target.value })}
                  placeholder="$$\text{Statement in LaTeX}$$"
                  className="w-full bg-obsidian/30 border border-ash-stone/20 rounded p-2 text-sm font-mono text-parchment outline-none resize-none"
                  rows={2}
                />
                <input
                  type="text"
                  value={step.justification}
                  onChange={e => updateStep(step.id, { justification: e.target.value })}
                  placeholder="Justification (e.g., Power Rule, Given, Algebra)"
                  className="w-full bg-obsidian/30 border border-ash-stone/20 rounded p-2 text-xs text-warm-gray outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                {step.isValid === true && <Check className="h-4 w-4 text-green-500" />}
                {step.isValid === false && <AlertCircle className="h-4 w-4 text-oxide-red" />}
                <button onClick={() => removeStep(step.id)} className="p-1 text-warm-gray/40 hover:text-oxide-red">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Preview */}
            {step.statement && (
              <div className="ml-9 p-2 bg-obsidian/20 rounded text-sm">
                <FormattedText>{step.statement}</FormattedText>
                <div className="text-[10px] text-warm-gray/40 mt-1 italic">by {step.justification || '?'}</div>
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addStep} className="w-full">
          <Plus className="h-3 w-3 mr-1" /> Add Step
        </Button>
      </div>

      {/* QED */}
      {proof.steps.length > 0 && proof.steps.every(s => s.isValid) && (
        <div className="text-center text-icon-gold font-serif text-lg">Q.E.D.</div>
      )}
    </div>
  )
}
