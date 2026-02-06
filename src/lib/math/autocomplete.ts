export interface MathSuggestion {
  trigger: string
  label: string
  expression: string
  description: string
  category: 'function' | 'constant' | 'template' | 'deep-learning' | 'calculus' | 'linear-algebra'
}

export const CATEGORY_COLORS: Record<MathSuggestion['category'], string> = {
  function: '#4A9E8F',
  constant: '#B8B1A6',
  template: '#5BB87D',
  'deep-learning': '#C8A24A',
  calculus: '#2E6F68',
  'linear-algebra': '#8B5A8B',
}

const MATH_SUGGESTIONS: MathSuggestion[] = [
  // Trig
  { trigger: 'sin', label: 'sin(x)', expression: 'sin(x)', description: 'Sine function', category: 'function' },
  { trigger: 'cos', label: 'cos(x)', expression: 'cos(x)', description: 'Cosine function', category: 'function' },
  { trigger: 'tan', label: 'tan(x)', expression: 'tan(x)', description: 'Tangent function', category: 'function' },
  { trigger: 'asin', label: 'asin(x)', expression: 'asin(x)', description: 'Inverse sine', category: 'function' },
  { trigger: 'acos', label: 'acos(x)', expression: 'acos(x)', description: 'Inverse cosine', category: 'function' },
  { trigger: 'atan', label: 'atan(x)', expression: 'atan(x)', description: 'Inverse tangent', category: 'function' },

  // Exponential/Log
  { trigger: 'exp', label: 'e^x', expression: 'e^x', description: 'Exponential function', category: 'function' },
  { trigger: 'log', label: 'log(x)', expression: 'log(x)', description: 'Natural logarithm', category: 'function' },
  { trigger: 'log10', label: 'log10(x)', expression: 'log10(x)', description: 'Base-10 logarithm', category: 'function' },
  { trigger: 'sqrt', label: 'sqrt(x)', expression: 'sqrt(x)', description: 'Square root', category: 'function' },
  { trigger: 'abs', label: 'abs(x)', expression: 'abs(x)', description: 'Absolute value', category: 'function' },

  // Constants
  { trigger: 'pi', label: 'pi', expression: 'pi', description: '3.14159...', category: 'constant' },

  // Deep Learning - activation functions
  { trigger: 'sigmoid', label: 'Sigmoid', expression: 'y = 1/(1+e^(-x))', description: 'Sigmoid activation', category: 'deep-learning' },
  { trigger: 'tanh', label: 'Tanh', expression: 'y = (e^x - e^(-x))/(e^x + e^(-x))', description: 'Hyperbolic tangent', category: 'deep-learning' },
  { trigger: 'relu', label: 'ReLU', expression: 'y = (x + abs(x)) / 2', description: 'Rectified Linear Unit', category: 'deep-learning' },
  { trigger: 'leaky', label: 'Leaky ReLU', expression: 'y = (x + abs(x)) / 2 + 0.01 * (x - abs(x)) / 2', description: 'Leaky ReLU (alpha=0.01)', category: 'deep-learning' },
  { trigger: 'swish', label: 'Swish', expression: 'y = x / (1 + e^(-x))', description: 'Swish/SiLU activation', category: 'deep-learning' },
  { trigger: 'softplus', label: 'Softplus', expression: 'y = log(1 + e^x)', description: 'Softplus activation', category: 'deep-learning' },
  { trigger: 'elu', label: 'ELU', expression: 'y = (x + abs(x)) / 2 + (e^((x - abs(x))/2) - 1)', description: 'Exponential Linear Unit', category: 'deep-learning' },

  // Deep Learning - loss functions
  { trigger: 'mse', label: 'MSE Loss', expression: 'y = x^2', description: 'Mean Squared Error shape', category: 'deep-learning' },
  { trigger: 'mae', label: 'MAE Loss', expression: 'y = abs(x)', description: 'Mean Absolute Error shape', category: 'deep-learning' },
  { trigger: 'cross', label: 'Cross-Entropy', expression: 'y = -log(x)', description: 'Binary cross-entropy term', category: 'deep-learning' },
  { trigger: 'logistic', label: 'Logistic Loss', expression: 'y = log(1 + e^(-x))', description: 'Logistic regression loss', category: 'deep-learning' },

  // Calculus templates
  { trigger: 'gauss', label: 'Gaussian', expression: 'y = e^(-x^2)', description: 'Gaussian/bell curve', category: 'calculus' },
  { trigger: 'normal', label: 'Normal PDF', expression: 'y = (1/sqrt(2*pi)) * e^(-x^2/2)', description: 'Standard normal distribution', category: 'calculus' },
  { trigger: 'sinc', label: 'Sinc', expression: 'y = sin(x)/x', description: 'Sinc function', category: 'calculus' },
  { trigger: 'logistic_curve', label: 'Logistic Curve', expression: 'y = 1/(1+e^(-x))', description: 'S-shaped growth curve', category: 'calculus' },

  // Linear algebra
  { trigger: 'identity', label: 'Identity 2x2', expression: '[[1, 0], [0, 1]]', description: '2x2 identity matrix', category: 'linear-algebra' },
  { trigger: 'rotation', label: 'Rotation Matrix', expression: '[[cos(0.5), -sin(0.5)], [sin(0.5), cos(0.5)]]', description: 'Rotation (0.5 rad)', category: 'linear-algebra' },
  { trigger: 'scale', label: 'Scale Matrix', expression: '[[2, 0], [0, 2]]', description: '2x2 scaling matrix', category: 'linear-algebra' },
  { trigger: 'shear', label: 'Shear Matrix', expression: '[[1, 1], [0, 1]]', description: '2x2 shear transform', category: 'linear-algebra' },
]

/**
 * Extract the last "word" being typed (after space, =, operator, or paren)
 */
function getLastToken(input: string): string {
  const match = input.match(/[a-zA-Z_][a-zA-Z0-9_]*$/)
  return match ? match[0] : ''
}

/**
 * Get autocomplete suggestions for the current input
 */
export function getSuggestions(input: string, maxResults: number = 6): MathSuggestion[] {
  const token = getLastToken(input).toLowerCase()
  if (token.length < 2) return []

  // Score and sort: exact prefix first, then contains
  const scored = MATH_SUGGESTIONS
    .map((s) => {
      const t = s.trigger.toLowerCase()
      const l = s.label.toLowerCase()
      if (t === token) return { s, score: 100 }
      if (t.startsWith(token)) return { s, score: 80 }
      if (l.startsWith(token)) return { s, score: 60 }
      if (t.includes(token)) return { s, score: 40 }
      if (l.includes(token) || s.description.toLowerCase().includes(token)) return { s, score: 20 }
      return { s, score: 0 }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((x) => x.s)

  return scored
}

/**
 * Apply a suggestion to the current input, replacing the last token
 */
export function applySuggestion(input: string, suggestion: MathSuggestion): string {
  const token = getLastToken(input)
  if (!token) return input + suggestion.expression

  // If the suggestion is a full equation (starts with "y = "), replace everything
  if (suggestion.expression.startsWith('y = ') || suggestion.expression.startsWith('[[')) {
    return suggestion.expression
  }

  // Otherwise replace just the token
  const beforeToken = input.slice(0, input.length - token.length)
  return beforeToken + suggestion.expression
}
