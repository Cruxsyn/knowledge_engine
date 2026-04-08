// Notebook types for computational notebook feature

export interface NotebookCell {
  id: string
  type: 'markdown' | 'math' | 'code' | 'visualization'
  content: string
  output?: CellOutput
  executionOrder?: number
}

export interface CellOutput {
  type: 'text' | 'latex' | 'error' | 'visualization' | 'steps'
  value: string
  steps?: DerivationStep[]
}

export interface DerivationStep {
  rule: string
  before_latex: string
  after_latex: string
}

export interface Notebook {
  id: string
  title: string
  cells: NotebookCell[]
  created_at: string
  updated_at: string
}
