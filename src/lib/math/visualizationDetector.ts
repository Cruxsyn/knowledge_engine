import type { VisualizationType } from '@/stores/mathVizStore'

/**
 * Detect what type of visualization is appropriate for the given input
 */
export function detectVisualizationType(input: string): VisualizationType {
  if (!input.trim()) {
    return 'unknown'
  }

  const normalized = input.trim().toLowerCase()
  const original = input.trim()

  // 1. Matrix detection: [[1,2],[3,4]] or explicit matrix notation
  if (/^\[\s*\[/.test(original) || normalized.includes('matrix')) {
    return 'matrix'
  }

  // 2. Vector detection: <1,2,3> or vec notation
  if (/^<[^>]+>$/.test(original) || normalized.startsWith('vec')) {
    return 'vector'
  }

  // 3. Single array that's not a matrix - could be vector
  if (/^\[[^\[\]]+\]$/.test(original) && original.includes(',')) {
    return 'vector'
  }

  // 4. Parametric equations: x(t) and y(t) both present
  if (/x\s*\(\s*t\s*\)/.test(normalized) && /y\s*\(\s*t\s*\)/.test(normalized)) {
    return 'parametric'
  }

  // 5. Geometry keywords
  const geometryKeywords = ['circle', 'line', 'point', 'triangle', 'rectangle', 'polygon', 'ellipse']
  if (geometryKeywords.some(kw => normalized.includes(kw))) {
    return 'geometry'
  }

  // 6. Function 2D: y = f(x), f(x) = ..., or implicit function with x
  // Check for explicit function form
  if (/^y\s*=\s*.+$/i.test(normalized) || /^f\s*\(\s*x\s*\)\s*=\s*.+$/i.test(normalized)) {
    return 'function-2d'
  }

  // Check if it contains 'x' and looks like a math expression
  const hasX = /\bx\b/.test(normalized)
  const hasMathOps = /[\+\-\*\/\^]|sin|cos|tan|log|sqrt|exp|abs/.test(normalized)
  const hasNumber = /\d/.test(normalized)

  if (hasX && (hasMathOps || hasNumber)) {
    return 'function-2d'
  }

  // 7. Pure math expression without x (like pi, e, 2+2)
  if (hasMathOps || hasNumber || /^[\d\.\s\+\-\*\/\^\(\)]+$/.test(normalized)) {
    return 'equation'
  }

  // 8. LaTeX expressions - check for common LaTeX commands
  if (original.includes('\\') || original.includes('$')) {
    // Try to determine if it's a function
    if (hasX || /\\frac|\\sin|\\cos|\\tan/.test(original)) {
      return 'function-2d'
    }
    return 'equation'
  }

  return 'unknown'
}

/**
 * Get a human-readable label for visualization type
 */
export function getVisualizationLabel(type: VisualizationType): string {
  const labels: Record<VisualizationType, string> = {
    'function-2d': 'Function',
    'parametric': 'Parametric',
    'matrix': 'Matrix',
    'vector': 'Vector',
    'geometry': 'Geometry',
    'equation': 'Equation',
    'unknown': 'Unknown',
  }
  return labels[type]
}

/**
 * Get color for visualization type badge
 */
export function getVisualizationColor(type: VisualizationType): string {
  const colors: Record<VisualizationType, string> = {
    'function-2d': '#4A9E8F', // teal
    'parametric': '#5B7DB8', // blue
    'matrix': '#C8A24A', // gold
    'vector': '#8B5A8B', // purple
    'geometry': '#B85B5B', // red
    'equation': '#5BB87D', // green
    'unknown': '#666666', // gray
  }
  return colors[type]
}

/**
 * Get example expressions for each type
 */
export function getExamples(): { type: VisualizationType; label: string; expression: string }[] {
  return [
    { type: 'function-2d', label: 'Sine wave', expression: 'y = sin(x)' },
    { type: 'function-2d', label: 'Parabola', expression: 'y = x^2' },
    { type: 'function-2d', label: 'Cubic', expression: 'y = x^3 - 3x' },
    { type: 'function-2d', label: 'Exponential', expression: 'y = e^x' },
    { type: 'function-2d', label: 'Logarithm', expression: 'y = log(x)' },
    { type: 'function-2d', label: 'Absolute value', expression: 'y = abs(x)' },
    { type: 'matrix', label: '2x2 Matrix', expression: '[[1, 2], [3, 4]]' },
    { type: 'matrix', label: '3x3 Identity', expression: '[[1, 0, 0], [0, 1, 0], [0, 0, 1]]' },
    { type: 'vector', label: '2D Vector', expression: '<3, 4>' },
    { type: 'vector', label: '3D Vector', expression: '<1, 2, 3>' },
    { type: 'geometry', label: 'Circle', expression: 'circle(0, 0, 5)' },
    { type: 'geometry', label: 'Line', expression: 'line(0, 0, 5, 5)' },
  ]
}
