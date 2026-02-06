import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export type VisualizationType =
  | 'function-2d'
  | 'parametric'
  | 'matrix'
  | 'vector'
  | 'geometry'
  | 'equation'
  | 'unknown'

export interface MathExpression {
  id: string
  input: string
  visualizationType: VisualizationType
  timestamp: Date
  color: string
}

export interface GraphBounds {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface EquationGroup {
  id: string
  name: string
  description?: string
  category?: string
  expressions: { input: string; visualizationType: VisualizationType }[]
  createdAt: Date
  isBuiltIn?: boolean
}

interface MathVizState {
  currentInput: string
  setCurrentInput: (input: string) => void

  expressions: MathExpression[]
  addExpression: (expr: MathExpression) => void
  removeExpression: (id: string) => void
  clearHistory: () => void

  activeExpressionIds: string[]
  toggleActiveExpression: (id: string) => void
  setActiveExpressions: (ids: string[]) => void

  graphBounds: GraphBounds
  setGraphBounds: (bounds: GraphBounds) => void
  resetBounds: () => void

  zoom: number
  setZoom: (zoom: number) => void

  showGrid: boolean
  toggleGrid: () => void

  showAxes: boolean
  toggleAxes: () => void

  mouseCoords: { x: number; y: number } | null
  setMouseCoords: (coords: { x: number; y: number } | null) => void

  matrixAnimating: boolean
  setMatrixAnimating: (animating: boolean) => void

  // Derivative overlay
  derivativeExpressionIds: string[]
  toggleDerivative: (id: string) => void

  // Equation groups
  equationGroups: EquationGroup[]
  activeGroupId: string | null
  saveGroup: (name: string, description?: string, category?: string) => void
  loadGroup: (id: string) => void
  deleteGroup: (id: string) => void
  renameGroup: (id: string, name: string) => void
  updateGroupExpressions: (id: string) => void
}

const DEFAULT_BOUNDS: GraphBounds = {
  xMin: -10,
  xMax: 10,
  yMin: -10,
  yMax: 10,
}

export const GRAPH_COLORS = [
  '#4A9E8F', // teal
  '#5B7DB8', // blue
  '#C8A24A', // gold
  '#8B5A8B', // purple
  '#B85B5B', // red
  '#5BB87D', // green
]

const BUILTIN_GROUPS: EquationGroup[] = [
  {
    id: 'preset-activation-functions',
    name: 'Activation Functions',
    description: 'Common neural network activations',
    category: 'deep-learning',
    expressions: [
      { input: 'y = 1/(1+e^(-x))', visualizationType: 'function-2d' },
      { input: 'y = (e^x - e^(-x))/(e^x + e^(-x))', visualizationType: 'function-2d' },
      { input: 'y = (x + abs(x)) / 2', visualizationType: 'function-2d' },
      { input: 'y = x / (1 + e^(-x))', visualizationType: 'function-2d' },
    ],
    createdAt: new Date(),
    isBuiltIn: true,
  },
  {
    id: 'preset-loss-functions',
    name: 'Loss Functions',
    description: 'Common loss function shapes',
    category: 'deep-learning',
    expressions: [
      { input: 'y = x^2', visualizationType: 'function-2d' },
      { input: 'y = abs(x)', visualizationType: 'function-2d' },
      { input: 'y = -log(x)', visualizationType: 'function-2d' },
    ],
    createdAt: new Date(),
    isBuiltIn: true,
  },
  {
    id: 'preset-trig',
    name: 'Trigonometric Functions',
    description: 'Basic trig functions overlaid',
    category: 'calculus',
    expressions: [
      { input: 'y = sin(x)', visualizationType: 'function-2d' },
      { input: 'y = cos(x)', visualizationType: 'function-2d' },
      { input: 'y = tan(x)', visualizationType: 'function-2d' },
    ],
    createdAt: new Date(),
    isBuiltIn: true,
  },
  {
    id: 'preset-polynomials',
    name: 'Polynomial Comparison',
    description: 'Compare polynomial growth rates',
    category: 'calculus',
    expressions: [
      { input: 'y = x', visualizationType: 'function-2d' },
      { input: 'y = x^2', visualizationType: 'function-2d' },
      { input: 'y = x^3', visualizationType: 'function-2d' },
    ],
    createdAt: new Date(),
    isBuiltIn: true,
  },
]

const GROUPS_STORAGE_KEY = 'arkvim-equation-groups'

function loadGroupsFromStorage(): EquationGroup[] {
  try {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as EquationGroup[]
    return parsed.map((g) => ({ ...g, createdAt: new Date(g.createdAt) }))
  } catch { return [] }
}

function saveGroupsToStorage(groups: EquationGroup[]) {
  const userGroups = groups.filter((g) => !g.isBuiltIn)
  localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(userGroups))
}

export const useMathVizStore = create<MathVizState>((set, get) => ({
  currentInput: '',
  setCurrentInput: (input) => set({ currentInput: input }),

  expressions: [],
  addExpression: (expr) => set((state) => ({
    expressions: [expr, ...state.expressions].slice(0, 20),
    activeExpressionIds: [...state.activeExpressionIds, expr.id],
  })),
  removeExpression: (id) => set((state) => ({
    expressions: state.expressions.filter((e) => e.id !== id),
    activeExpressionIds: state.activeExpressionIds.filter((i) => i !== id),
    derivativeExpressionIds: state.derivativeExpressionIds.filter((i) => i !== id),
  })),
  clearHistory: () => set({ expressions: [], activeExpressionIds: [], derivativeExpressionIds: [] }),

  activeExpressionIds: [],
  toggleActiveExpression: (id) => set((state) => ({
    activeExpressionIds: state.activeExpressionIds.includes(id)
      ? state.activeExpressionIds.filter((i) => i !== id)
      : [...state.activeExpressionIds, id],
  })),
  setActiveExpressions: (ids) => set({ activeExpressionIds: ids }),

  graphBounds: DEFAULT_BOUNDS,
  setGraphBounds: (bounds) => set({ graphBounds: bounds }),
  resetBounds: () => set({ graphBounds: DEFAULT_BOUNDS, zoom: 1 }),

  zoom: 1,
  setZoom: (zoom) => set({ zoom: Math.min(10, Math.max(0.1, zoom)) }),

  showGrid: true,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  showAxes: true,
  toggleAxes: () => set((state) => ({ showAxes: !state.showAxes })),

  mouseCoords: null,
  setMouseCoords: (coords) => set({ mouseCoords: coords }),

  matrixAnimating: false,
  setMatrixAnimating: (animating) => set({ matrixAnimating: animating }),

  // Derivative overlay
  derivativeExpressionIds: [],
  toggleDerivative: (id) => set((state) => ({
    derivativeExpressionIds: state.derivativeExpressionIds.includes(id)
      ? state.derivativeExpressionIds.filter((i) => i !== id)
      : [...state.derivativeExpressionIds, id],
  })),

  // Equation groups
  equationGroups: [...BUILTIN_GROUPS, ...loadGroupsFromStorage()],
  activeGroupId: null,

  saveGroup: (name, description, category) => {
    const state = get()
    const activeExprs = state.expressions.filter((e) =>
      state.activeExpressionIds.includes(e.id)
    )
    if (activeExprs.length === 0) return

    const newGroup: EquationGroup = {
      id: generateId(),
      name,
      description,
      category,
      expressions: activeExprs.map((e) => ({
        input: e.input,
        visualizationType: e.visualizationType,
      })),
      createdAt: new Date(),
    }

    const updated = [...state.equationGroups, newGroup]
    set({ equationGroups: updated, activeGroupId: newGroup.id })
    saveGroupsToStorage(updated)
  },

  loadGroup: (id) => {
    const state = get()
    const group = state.equationGroups.find((g) => g.id === id)
    if (!group) return

    const newExpressions: MathExpression[] = group.expressions.map((e, i) => ({
      id: generateId(),
      input: e.input,
      visualizationType: e.visualizationType,
      timestamp: new Date(),
      color: GRAPH_COLORS[i % GRAPH_COLORS.length],
    }))

    set({
      expressions: newExpressions,
      activeExpressionIds: newExpressions.map((e) => e.id),
      activeGroupId: id,
      derivativeExpressionIds: [],
    })
  },

  deleteGroup: (id) => {
    const state = get()
    const group = state.equationGroups.find((g) => g.id === id)
    if (!group || group.isBuiltIn) return

    const updated = state.equationGroups.filter((g) => g.id !== id)
    set({
      equationGroups: updated,
      activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
    })
    saveGroupsToStorage(updated)
  },

  renameGroup: (id, name) => {
    const state = get()
    const updated = state.equationGroups.map((g) =>
      g.id === id ? { ...g, name } : g
    )
    set({ equationGroups: updated })
    saveGroupsToStorage(updated)
  },

  updateGroupExpressions: (id) => {
    const state = get()
    const group = state.equationGroups.find((g) => g.id === id)
    if (!group || group.isBuiltIn) return

    const activeExprs = state.expressions.filter((e) =>
      state.activeExpressionIds.includes(e.id)
    )
    if (activeExprs.length === 0) return

    const updated = state.equationGroups.map((g) =>
      g.id === id
        ? { ...g, expressions: activeExprs.map((e) => ({ input: e.input, visualizationType: e.visualizationType })) }
        : g
    )
    set({ equationGroups: updated })
    saveGroupsToStorage(updated)
  },
}))
