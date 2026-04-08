import { useState, useEffect } from 'react'
import { FormattedText } from '@/components/ui/formatted-text'
import { useConcepts } from '@/hooks/useConcepts'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import type { Concept } from '@/types'

interface FormulaGroup {
  topic: string
  formulas: Array<{
    name: string
    latex: string
    conceptId?: string
  }>
}

// Extract formulas from concept definitions (look for $...$ or $$...$$ patterns)
function extractFormulas(concepts: Concept[]): FormulaGroup[] {
  const groups = new Map<string, FormulaGroup>()
  const mathRegex = /\$\$([^$]+)\$\$|\$([^$]+)\$/g

  for (const concept of concepts) {
    const text = `${concept.definition} ${concept.intuition || ''}`
    const matches = [...text.matchAll(mathRegex)]

    if (matches.length > 0) {
      const topic = concept.mastery === 'teachable' ? 'Mastered'
        : concept.mastery === 'solid' ? 'Solid'
        : concept.mastery === 'learning' ? 'Learning'
        : 'To Review'

      if (!groups.has(topic)) {
        groups.set(topic, { topic, formulas: [] })
      }

      for (const match of matches) {
        const latex = match[1] || match[2]
        if (latex && latex.length > 3) {
          groups.get(topic)!.formulas.push({
            name: concept.name,
            latex,
            conceptId: concept.id,
          })
        }
      }
    }
  }

  return Array.from(groups.values())
}

// Common math formulas for neural networks
const NN_FORMULAS: FormulaGroup[] = [
  {
    topic: 'Neural Network Fundamentals',
    formulas: [
      { name: 'Forward Pass', latex: 'z^{[l]} = W^{[l]} a^{[l-1]} + b^{[l]}' },
      { name: 'Activation', latex: 'a^{[l]} = g(z^{[l]})' },
      { name: 'ReLU', latex: 'g(z) = \\max(0, z)' },
      { name: 'Sigmoid', latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}' },
      { name: 'Softmax', latex: '\\text{softmax}(z_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}' },
    ],
  },
  {
    topic: 'Loss Functions',
    formulas: [
      { name: 'MSE', latex: 'L = \\frac{1}{n} \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2' },
      { name: 'Cross-Entropy', latex: 'L = -\\sum_{i} y_i \\log(\\hat{y}_i)' },
      { name: 'Binary CE', latex: 'L = -[y\\log(\\hat{y}) + (1-y)\\log(1-\\hat{y})]' },
    ],
  },
  {
    topic: 'Backpropagation',
    formulas: [
      { name: 'Weight Update', latex: 'W := W - \\alpha \\frac{\\partial L}{\\partial W}' },
      { name: 'Chain Rule', latex: '\\frac{\\partial L}{\\partial W^{[l]}} = \\frac{\\partial L}{\\partial z^{[l]}} \\cdot a^{[l-1]T}' },
      { name: 'Adam Update', latex: 'm_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t' },
    ],
  },
  {
    topic: 'Calculus Essentials',
    formulas: [
      { name: 'Power Rule', latex: '\\frac{d}{dx} x^n = nx^{n-1}' },
      { name: 'Chain Rule', latex: '\\frac{d}{dx} f(g(x)) = f\'(g(x)) \\cdot g\'(x)' },
      { name: 'Product Rule', latex: '(fg)\' = f\'g + fg\'' },
      { name: 'Gradient', latex: '\\nabla f = \\left(\\frac{\\partial f}{\\partial x_1}, \\ldots, \\frac{\\partial f}{\\partial x_n}\\right)' },
    ],
  },
]

export function FormulaSheet() {
  const { concepts } = useConcepts()
  const [userFormulas, setUserFormulas] = useState<FormulaGroup[]>([])

  useEffect(() => {
    setUserFormulas(extractFormulas(concepts))
  }, [concepts])

  const allGroups = [...NN_FORMULAS, ...userFormulas]

  const handlePrint = () => window.print()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h2 className="text-lg font-serif text-parchment">Formula Sheet</h2>
          <p className="text-sm text-warm-gray">Auto-generated from your concepts and NN fundamentals</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-3 w-3 mr-1" /> Print
          </Button>
        </div>
      </div>

      {/* Formula groups */}
      <div className="grid grid-cols-2 gap-4 print:gap-2">
        {allGroups.map((group, gi) => (
          <div key={gi} className="border border-ash-stone/30 rounded-lg p-4 print:border-gray-300 print:p-2">
            <h3 className="text-sm font-medium text-icon-gold mb-3 print:text-black print:text-xs">{group.topic}</h3>
            <div className="space-y-2">
              {group.formulas.map((formula, fi) => (
                <div key={fi} className="flex items-start gap-2">
                  <span className="text-xs text-warm-gray shrink-0 mt-1 w-24 print:text-gray-600">{formula.name}</span>
                  <div className="text-sm">
                    <FormattedText>{`$${formula.latex}$`}</FormattedText>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
