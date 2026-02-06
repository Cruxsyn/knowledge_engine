import { create, all, SymbolNode } from 'mathjs'
import type { MathNode } from 'mathjs'

// Create a mathjs instance with all functions
const math = create(all)

export interface ParseResult {
  success: boolean
  expression?: MathNode
  error?: string
  variables: string[]
  isFunction: boolean
  isMatrix: boolean
  isVector: boolean
}

export interface EvaluateResult {
  success: boolean
  value?: number | number[] | number[][]
  error?: string
}

/**
 * Clean LaTeX syntax from input for math.js parsing
 */
function cleanLatexInput(input: string): string {
  let cleaned = input.trim()

  // Remove LaTeX delimiters
  cleaned = cleaned.replace(/^\$+|\$+$/g, '')
  cleaned = cleaned.replace(/^\\\[|\\\]$/g, '')
  cleaned = cleaned.replace(/^\\\(|\\\)$/g, '')

  // Convert common LaTeX commands to math.js syntax
  cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '(($1)/($2))')
  cleaned = cleaned.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
  cleaned = cleaned.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, 'nthRoot($2, $1)')
  cleaned = cleaned.replace(/\\sin/g, 'sin')
  cleaned = cleaned.replace(/\\cos/g, 'cos')
  cleaned = cleaned.replace(/\\tan/g, 'tan')
  cleaned = cleaned.replace(/\\log/g, 'log10')
  cleaned = cleaned.replace(/\\ln/g, 'log')
  cleaned = cleaned.replace(/\\pi/g, 'pi')
  cleaned = cleaned.replace(/\\e(?![a-z])/g, 'e')
  cleaned = cleaned.replace(/\\cdot/g, '*')
  cleaned = cleaned.replace(/\\times/g, '*')
  cleaned = cleaned.replace(/\\div/g, '/')
  cleaned = cleaned.replace(/\^/g, '^')
  cleaned = cleaned.replace(/\{([^}]+)\}/g, '($1)') // Convert remaining braces to parens
  cleaned = cleaned.replace(/\\left\(/g, '(')
  cleaned = cleaned.replace(/\\right\)/g, ')')
  cleaned = cleaned.replace(/\\left\[/g, '[')
  cleaned = cleaned.replace(/\\right\]/g, ']')

  return cleaned
}

/**
 * Extract the right side of an equation (after =)
 */
function extractFunctionExpression(input: string): string {
  const cleaned = cleanLatexInput(input)

  // Handle y = f(x) or f(x) = ... format
  const equalsMatch = cleaned.match(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)$/i)
  if (equalsMatch) {
    return equalsMatch[1].trim()
  }

  // Handle x = ... (for implicit y)
  const xEqualsMatch = cleaned.match(/^x\s*=\s*(.+)$/i)
  if (xEqualsMatch) {
    return xEqualsMatch[1].trim()
  }

  return cleaned
}

/**
 * Find all variables in an expression
 */
function findVariables(node: MathNode): Set<string> {
  const variables = new Set<string>()
  const constants = new Set(['pi', 'e', 'i', 'Infinity', 'NaN'])

  node.traverse((n: MathNode) => {
    if (n.type === 'SymbolNode') {
      const symbol = (n as SymbolNode).name
      if (!constants.has(symbol) && !math[symbol as keyof typeof math]) {
        variables.add(symbol)
      }
    }
  })

  return variables
}

/**
 * Parse a mathematical expression
 */
export function parseExpression(input: string): ParseResult {
  if (!input.trim()) {
    return {
      success: false,
      error: 'Empty expression',
      variables: [],
      isFunction: false,
      isMatrix: false,
      isVector: false,
    }
  }

  try {
    const expression = extractFunctionExpression(input)
    const parsed = math.parse(expression)
    const variables = Array.from(findVariables(parsed))

    // Check if it's a matrix
    const isMatrix = input.includes('[[') || input.toLowerCase().includes('matrix')

    // Check if it's a vector (angle brackets or simple array)
    const isVector = /^<[^>]+>$/.test(input.trim()) ||
                     (/^\[[^\[\]]+\]$/.test(input.trim()) && !isMatrix)

    // It's a function if it has variables (usually x)
    const isFunction = variables.length > 0 && !isMatrix && !isVector

    return {
      success: true,
      expression: parsed,
      variables,
      isFunction,
      isMatrix,
      isVector,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Parse error',
      variables: [],
      isFunction: false,
      isMatrix: false,
      isVector: false,
    }
  }
}

/**
 * Evaluate a parsed expression at a given x value
 */
export function evaluateAt(expression: MathNode, x: number): EvaluateResult {
  try {
    const result = expression.evaluate({ x })
    if (typeof result === 'number' && isFinite(result)) {
      return { success: true, value: result }
    }
    return { success: false, error: 'Result is not a finite number' }
  } catch {
    return { success: false, error: 'Evaluation error' }
  }
}

/**
 * Evaluate expression with given scope (for parametric, etc.)
 */
export function evaluateWithScope(expression: MathNode, scope: Record<string, number>): EvaluateResult {
  try {
    const result = expression.evaluate(scope)
    if (typeof result === 'number' && isFinite(result)) {
      return { success: true, value: result }
    }
    return { success: false, error: 'Result is not a finite number' }
  } catch {
    return { success: false, error: 'Evaluation error' }
  }
}

/**
 * Parse a matrix from input string
 */
export function parseMatrix(input: string): { success: boolean; matrix?: number[][]; error?: string } {
  try {
    // Clean the input
    let cleaned = cleanLatexInput(input).trim()

    // Convert vector notation <a,b,c> to [[a,b,c]]
    if (/^<[^>]+>$/.test(cleaned)) {
      cleaned = '[[' + cleaned.slice(1, -1) + ']]'
    }

    const result = math.evaluate(cleaned)

    // Helper to extract 2D number array from any result type
    const extractMatrix = (val: unknown): number[][] | null => {
      // Matrix-like object with toArray method (duck typing)
      if (val && typeof val === 'object' && 'toArray' in val) {
        const matrixLike = val as { toArray: () => unknown }
        if (typeof matrixLike.toArray === 'function') {
          const arr = matrixLike.toArray()
          return extractMatrix(arr)
        }
      }

      // Direct 2D array
      if (Array.isArray(val)) {
        // Single row vector - wrap in array
        if (val.every(r => typeof r === 'number' && isFinite(r as number))) {
          return [val as number[]]
        }
        // 2D array
        if (val.every(r => Array.isArray(r) && (r as unknown[]).every(c => typeof c === 'number' && isFinite(c as number)))) {
          return val as number[][]
        }
      }

      return null
    }

    const matrix = extractMatrix(result)
    if (matrix && matrix.length > 0) {
      return { success: true, matrix }
    }

    return { success: false, error: 'Not a valid matrix' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Matrix parse error' }
  }
}

/**
 * Parse a vector from input string
 */
export function parseVector(input: string): { success: boolean; vector?: number[]; error?: string } {
  try {
    let cleaned = cleanLatexInput(input).trim()

    // Convert <a,b,c> to [a,b,c] - handle various spacing
    const angleMatch = cleaned.match(/^<\s*(.+?)\s*>$/)
    if (angleMatch) {
      cleaned = '[' + angleMatch[1] + ']'
    }

    // Ensure we have a valid array format for simple comma-separated values
    if (!cleaned.startsWith('[') && cleaned.includes(',')) {
      cleaned = '[' + cleaned + ']'
    }

    const result = math.evaluate(cleaned)

    // Helper to extract numbers from any result type
    const extractNumbers = (val: unknown): number[] | null => {
      // Direct array
      if (Array.isArray(val)) {
        const flat = val.flat(Infinity) as unknown[]
        if (flat.every(r => typeof r === 'number' && isFinite(r as number))) {
          return flat as number[]
        }
      }

      // Matrix-like object with toArray method (duck typing to avoid instanceof issues)
      if (val && typeof val === 'object' && 'toArray' in val) {
        const matrixLike = val as { toArray: () => unknown }
        if (typeof matrixLike.toArray === 'function') {
          const arr = matrixLike.toArray()
          return extractNumbers(arr)
        }
      }

      // Single number
      if (typeof val === 'number' && isFinite(val)) {
        return [val]
      }

      return null
    }

    const vector = extractNumbers(result)
    if (vector && vector.length > 0) {
      return { success: true, vector }
    }

    return { success: false, error: 'Not a valid vector' }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Vector parse error' }
  }
}

/**
 * Sample a function over a range
 */
export function sampleFunction(
  expression: MathNode,
  xMin: number,
  xMax: number,
  numSamples: number = 500
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const step = (xMax - xMin) / numSamples

  for (let i = 0; i <= numSamples; i++) {
    const x = xMin + i * step
    const result = evaluateAt(expression, x)

    if (result.success && typeof result.value === 'number') {
      points.push({ x, y: result.value })
    } else {
      // Insert a break in the line (for discontinuities)
      points.push({ x, y: NaN })
    }
  }

  return points
}

/**
 * Calculate matrix operations
 */
export function matrixDeterminant(matrix: number[][]): number | null {
  try {
    const m = math.matrix(matrix)
    const det = math.det(m)
    return typeof det === 'number' ? det : null
  } catch {
    return null
  }
}

export function matrixTranspose(matrix: number[][]): number[][] {
  try {
    const m = math.matrix(matrix)
    const transposed = math.transpose(m)
    return transposed.toArray() as number[][]
  } catch {
    return matrix
  }
}

export function matrixInverse(matrix: number[][]): number[][] | null {
  try {
    const m = math.matrix(matrix)
    const inverted = math.inv(m)
    return inverted.toArray() as number[][]
  } catch {
    return null
  }
}

export function matrixMultiply(a: number[][], b: number[][]): number[][] | null {
  try {
    const mA = math.matrix(a)
    const mB = math.matrix(b)
    const result = math.multiply(mA, mB)
    return result.toArray() as number[][]
  } catch {
    return null
  }
}

export function matrixAdd(a: number[][], b: number[][]): number[][] | null {
  try {
    const mA = math.matrix(a)
    const mB = math.matrix(b)
    const result = math.add(mA, mB)
    // Use duck typing for toArray call
    if (result && typeof result === 'object' && 'toArray' in result) {
      return (result as { toArray: () => number[][] }).toArray()
    }
    return null
  } catch {
    return null
  }
}

export function matrixScalarMultiply(matrix: number[][], scalar: number): number[][] {
  try {
    const m = math.matrix(matrix)
    const result = math.multiply(m, scalar)
    return result.toArray() as number[][]
  } catch {
    return matrix
  }
}

export function matrixSubtract(a: number[][], b: number[][]): number[][] | null {
  try {
    const mA = math.matrix(a)
    const mB = math.matrix(b)
    const result = math.subtract(mA, mB)
    if (result && typeof result === 'object' && 'toArray' in result) {
      return (result as { toArray: () => number[][] }).toArray()
    }
    return null
  } catch {
    return null
  }
}

export function matrixTrace(matrix: number[][]): number | null {
  try {
    const m = math.matrix(matrix)
    const result = math.trace(m)
    return typeof result === 'number' ? result : null
  } catch {
    return null
  }
}

export function matrixRank(matrix: number[][]): number | null {
  try {
    // Use SVD-based rank calculation for numerical stability
    const m = math.matrix(matrix)
    // mathjs doesn't have rank directly, calculate via matrix operations
    // For now, use a simple approach: count non-zero pivots in RREF-like process
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    const minDim = Math.min(rows, cols)

    // Use determinant for square matrices
    if (rows === cols) {
      const det = math.det(m)
      if (Math.abs(det as number) > 1e-10) return rows
    }

    // For non-square or singular, use SVD approach
    // Count singular values above threshold
    try {
      // Simple rank estimation using column space
      let rank = 0
      const work = matrix.map(row => [...row])

      for (let col = 0; col < cols && rank < rows; col++) {
        // Find pivot
        let maxRow = rank
        for (let row = rank + 1; row < rows; row++) {
          if (Math.abs(work[row][col]) > Math.abs(work[maxRow][col])) {
            maxRow = row
          }
        }

        if (Math.abs(work[maxRow][col]) < 1e-10) continue

        // Swap rows
        [work[rank], work[maxRow]] = [work[maxRow], work[rank]]

        // Eliminate below
        for (let row = rank + 1; row < rows; row++) {
          const factor = work[row][col] / work[rank][col]
          for (let j = col; j < cols; j++) {
            work[row][j] -= factor * work[rank][j]
          }
        }
        rank++
      }
      return rank
    } catch {
      return minDim // Fallback
    }
  } catch {
    return null
  }
}

export function matrixPower(matrix: number[][], n: number): number[][] | null {
  if (matrix.length !== matrix[0]?.length) return null // Must be square
  if (n < 0) return null // No negative powers for now
  if (n === 0) {
    // Return identity matrix
    const size = matrix.length
    return Array.from({ length: size }, (_, i) =>
      Array.from({ length: size }, (_, j) => (i === j ? 1 : 0))
    )
  }
  if (n === 1) return matrix

  try {
    let result = matrix
    for (let i = 1; i < n; i++) {
      const multiplied = math.multiply(math.matrix(result), math.matrix(matrix))
      // Handle duck typing for matrix result
      if (multiplied && typeof multiplied === 'object' && 'toArray' in multiplied) {
        result = (multiplied as { toArray: () => number[][] }).toArray()
      } else {
        return null
      }
    }
    return result
  } catch {
    return null
  }
}

export function matrixDotProduct(a: number[][], b: number[][]): number | null {
  // Element-wise multiplication and sum (Frobenius inner product)
  if (a.length !== b.length || a[0]?.length !== b[0]?.length) return null

  try {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < a[0].length; j++) {
        sum += a[i][j] * b[i][j]
      }
    }
    return sum
  } catch {
    return null
  }
}

export function matrixEigenvalues(matrix: number[][]): number[] | null {
  try {
    const m = math.matrix(matrix)
    const result = math.eigs(m)
    // Extract eigenvalues - handle both Matrix and array results
    let values: (number | { re: number; im: number })[]

    // Use duck typing instead of instanceof (avoids bundling issues)
    if (result.values && typeof result.values === 'object' && 'toArray' in result.values) {
      const matrixLike = result.values as { toArray: () => unknown }
      values = matrixLike.toArray() as (number | { re: number; im: number })[]
    } else if (Array.isArray(result.values)) {
      values = result.values as (number | { re: number; im: number })[]
    } else {
      return null
    }
    return values.map(v => typeof v === 'number' ? v : (v as { re: number }).re)
  } catch {
    return null
  }
}

/**
 * Check if matrix is 2×2
 */
export function isMatrix2x2(matrix: number[][]): boolean {
  return matrix.length === 2 && matrix[0]?.length === 2 && matrix[1]?.length === 2
}

/**
 * Get eigenvectors for 2×2 matrix visualization
 * Returns eigenvalues and their corresponding eigenvectors (normalized)
 */
export function matrixEigenvectors(matrix: number[][]): {
  values: number[]
  vectors: number[][]
  allReal: boolean
} | null {
  if (!isMatrix2x2(matrix)) return null

  try {
    const m = math.matrix(matrix)
    const result = math.eigs(m)

    // Extract eigenvalues
    let eigenvalues: (number | { re: number; im: number })[]
    if (result.values && typeof result.values === 'object' && 'toArray' in result.values) {
      eigenvalues = (result.values as { toArray: () => unknown }).toArray() as (number | { re: number; im: number })[]
    } else if (Array.isArray(result.values)) {
      eigenvalues = result.values as (number | { re: number; im: number })[]
    } else {
      return null
    }

    // Extract eigenvectors
    let eigenvectors: number[][]
    if (result.eigenvectors && Array.isArray(result.eigenvectors)) {
      eigenvectors = result.eigenvectors.map((ev: { vector: unknown }) => {
        const vec = ev.vector
        if (vec && typeof vec === 'object' && 'toArray' in vec) {
          return (vec as { toArray: () => number[] }).toArray()
        }
        return Array.isArray(vec) ? vec as number[] : [0, 0]
      })
    } else {
      return null
    }

    // Check if all eigenvalues are real (no significant imaginary part)
    const allReal = eigenvalues.every(v => {
      if (typeof v === 'number') return true
      const complex = v as { re: number; im: number }
      return Math.abs(complex.im) < 0.0001
    })

    // Extract real parts of eigenvalues
    const realValues = eigenvalues.map(v =>
      typeof v === 'number' ? v : (v as { re: number }).re
    )

    // Normalize eigenvectors for consistent display
    const normalizedVectors = eigenvectors.map(vec => {
      const magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1])
      if (magnitude < 0.0001) return [1, 0]
      return [vec[0] / magnitude, vec[1] / magnitude]
    })

    return {
      values: realValues,
      vectors: normalizedVectors,
      allReal
    }
  } catch {
    return null
  }
}

/**
 * Compute the symbolic derivative of an expression with respect to x
 */
export function computeDerivative(expression: MathNode): MathNode | null {
  try {
    return math.derivative(expression, 'x')
  } catch {
    return null
  }
}

/**
 * Vector operations
 */
export function vectorMagnitude(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
}

export function vectorAngle(vector: number[]): number {
  if (vector.length < 2) return 0
  return Math.atan2(vector[1], vector[0])
}
