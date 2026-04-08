import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, SkipForward, RotateCcw, Plus, Minus } from 'lucide-react'
import { isTauri } from '@/db/adapter'

interface LayerConfig {
  neurons: number
  activation: 'relu' | 'sigmoid' | 'tanh' | 'linear'
}

interface TrainingConfig {
  learningRate: number
  epochs: number
  batchSize: number
  optimizer: 'sgd' | 'adam'
  dataset: 'xor' | 'spiral' | 'circle' | 'gaussian'
}

interface TrainingState {
  epoch: number
  loss: number
  accuracy: number
  lossHistory: number[]
  running: boolean
}

const DATASETS = {
  xor: 'XOR Gate',
  spiral: 'Spiral',
  circle: 'Circle',
  gaussian: 'Gaussian Clusters',
}

const ACTIVATIONS = {
  relu: 'ReLU',
  sigmoid: 'Sigmoid',
  tanh: 'Tanh',
  linear: 'Linear',
}

export function NNPlayground() {
  const [layers, setLayers] = useState<LayerConfig[]>([
    { neurons: 4, activation: 'relu' },
    { neurons: 4, activation: 'relu' },
  ])

  const [config, setConfig] = useState<TrainingConfig>({
    learningRate: 0.03,
    epochs: 500,
    batchSize: 32,
    optimizer: 'adam',
    dataset: 'xor',
  })

  const [training, setTraining] = useState<TrainingState>({
    epoch: 0, loss: 1.0, accuracy: 0, lossHistory: [], running: false,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lossCanvasRef = useRef<HTMLCanvasElement>(null)

  const addLayer = () => setLayers([...layers, { neurons: 4, activation: 'relu' }])
  const removeLayer = (idx: number) => setLayers(layers.filter((_, i) => i !== idx))
  const updateLayer = (idx: number, updates: Partial<LayerConfig>) =>
    setLayers(layers.map((l, i) => i === idx ? { ...l, ...updates } : l))

  // Draw decision boundary on canvas
  const drawDecisionBoundary = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const resolution = 50

    // Draw grid of predictions (simulated for now)
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = (i / resolution) * 2 - 1
        const y = (j / resolution) * 2 - 1
        // Simple placeholder: radial gradient
        const dist = Math.sqrt(x * x + y * y)
        const pred = dist < 0.7 ? 0.8 : 0.2
        ctx.fillStyle = pred > 0.5
          ? `rgba(232, 183, 20, ${pred * 0.3})`
          : `rgba(100, 100, 120, ${(1 - pred) * 0.3})`
        ctx.fillRect(
          (i / resolution) * w,
          (j / resolution) * h,
          w / resolution + 1,
          h / resolution + 1
        )
      }
    }

    // Draw sample data points
    const points = generateDataset(config.dataset)
    for (const p of points) {
      ctx.beginPath()
      ctx.arc(
        ((p.x + 1) / 2) * w,
        ((p.y + 1) / 2) * h,
        4, 0, Math.PI * 2
      )
      ctx.fillStyle = p.label === 1 ? '#e8b714' : '#64748b'
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }, [config.dataset])

  // Draw loss curve
  const drawLossCurve = useCallback(() => {
    const canvas = lossCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const history = training.lossHistory

    ctx.clearRect(0, 0, w, h)
    ctx.strokeStyle = '#3a3a4e'
    ctx.lineWidth = 0.5

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * h
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }

    if (history.length < 2) return

    // Loss line
    ctx.beginPath()
    ctx.strokeStyle = '#e8b714'
    ctx.lineWidth = 2
    const maxLoss = Math.max(...history, 1)
    history.forEach((loss, i) => {
      const x = (i / (history.length - 1)) * w
      const y = h - (loss / maxLoss) * h
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [training.lossHistory])

  useEffect(() => { drawDecisionBoundary() }, [drawDecisionBoundary])
  useEffect(() => { drawLossCurve() }, [drawLossCurve])

  const startTraining = async () => {
    setTraining(prev => ({ ...prev, running: true }))

    if (isTauri()) {
      try {
        const { invoke } = await import('@tauri-apps/api/core')
        const arch = { layers: [2, ...layers.map(l => l.neurons), 1] }
        await invoke('nn_create', { architecture: arch })
        await invoke('nn_train', {
          id: 'playground',
          dataset: config.dataset,
          params: { lr: config.learningRate, epochs: config.epochs, batch_size: config.batchSize },
        })
      } catch (err) {
        console.error('NN training error:', err)
      }
    } else {
      // Browser simulation
      const lossHistory: number[] = []
      for (let epoch = 0; epoch < config.epochs; epoch++) {
        const loss = Math.exp(-epoch * config.learningRate * 0.1) * 0.7 + Math.random() * 0.05
        lossHistory.push(loss)
        if (epoch % 10 === 0) {
          setTraining(prev => ({
            ...prev,
            epoch,
            loss,
            accuracy: Math.min(99, 50 + epoch * 0.1),
            lossHistory: [...lossHistory],
          }))
          await new Promise(r => setTimeout(r, 10))
        }
      }
    }
    setTraining(prev => ({ ...prev, running: false }))
  }

  const reset = () => {
    setTraining({ epoch: 0, loss: 1.0, accuracy: 0, lossHistory: [], running: false })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-ash-stone/50">
        <h1 className="text-lg font-serif text-parchment">Neural Network Playground</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset} disabled={training.running}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button variant="outline" size="sm" disabled={training.running}>
            <SkipForward className="h-3 w-3 mr-1" /> Step
          </Button>
          <Button variant="gold" size="sm" onClick={startTraining} disabled={training.running}>
            {training.running ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            {training.running ? 'Training...' : 'Train'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: Config */}
        <div className="w-64 border-r border-ash-stone/50 p-4 overflow-y-auto space-y-6">
          {/* Dataset */}
          <div>
            <label className="text-xs uppercase tracking-wider text-warm-gray/50 mb-2 block">Dataset</label>
            <select
              className="w-full bg-charcoal-slate border border-ash-stone/50 rounded p-2 text-sm text-parchment"
              value={config.dataset}
              onChange={e => setConfig({ ...config, dataset: e.target.value as TrainingConfig['dataset'] })}
            >
              {Object.entries(DATASETS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {/* Learning Rate */}
          <div>
            <label className="text-xs uppercase tracking-wider text-warm-gray/50 mb-2 block">
              Learning Rate: {config.learningRate}
            </label>
            <input
              type="range" min="0.001" max="1" step="0.001"
              value={config.learningRate}
              onChange={e => setConfig({ ...config, learningRate: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Epochs */}
          <div>
            <label className="text-xs uppercase tracking-wider text-warm-gray/50 mb-2 block">
              Epochs: {config.epochs}
            </label>
            <input
              type="range" min="10" max="2000" step="10"
              value={config.epochs}
              onChange={e => setConfig({ ...config, epochs: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Hidden Layers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-wider text-warm-gray/50">Hidden Layers</label>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addLayer}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {layers.map((layer, i) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <input
                  type="number" min="1" max="32"
                  value={layer.neurons}
                  onChange={e => updateLayer(i, { neurons: Number(e.target.value) })}
                  className="w-14 bg-charcoal-slate border border-ash-stone/50 rounded p-1 text-sm text-center text-parchment"
                />
                <select
                  value={layer.activation}
                  onChange={e => updateLayer(i, { activation: e.target.value as LayerConfig['activation'] })}
                  className="flex-1 bg-charcoal-slate border border-ash-stone/50 rounded p-1 text-sm text-parchment"
                >
                  {Object.entries(ACTIVATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeLayer(i)}>
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Training stats */}
          <div className="border-t border-ash-stone/50 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-warm-gray">
              <span>Epoch</span>
              <span className="text-parchment font-mono">{training.epoch}</span>
            </div>
            <div className="flex justify-between text-warm-gray">
              <span>Loss</span>
              <span className="text-parchment font-mono">{training.loss.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-warm-gray">
              <span>Accuracy</span>
              <span className="text-parchment font-mono">{training.accuracy.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Center: Visualization */}
        <div className="flex-1 flex flex-col p-4 gap-4">
          {/* Network Architecture Visualization */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-8">
              {/* Input layer */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-warm-gray/50 uppercase">Input</span>
                {[0, 1].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-warm-gray/40 flex items-center justify-center text-xs text-warm-gray">
                    x{i + 1}
                  </div>
                ))}
              </div>

              {/* Hidden layers */}
              {layers.map((layer, li) => (
                <div key={li} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-warm-gray/50 uppercase">{layer.activation}</span>
                  {Array.from({ length: Math.min(layer.neurons, 8) }).map((_, ni) => (
                    <div key={ni} className="w-7 h-7 rounded-full bg-icon-gold/20 border border-icon-gold/40" />
                  ))}
                  {layer.neurons > 8 && (
                    <span className="text-[10px] text-warm-gray/40">+{layer.neurons - 8}</span>
                  )}
                </div>
              ))}

              {/* Output layer */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-warm-gray/50 uppercase">Output</span>
                <div className="w-8 h-8 rounded-full border-2 border-icon-gold flex items-center justify-center text-xs text-icon-gold">
                  y
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: decision boundary + loss curve */}
          <div className="flex gap-4 h-64">
            <div className="flex-1 rounded-lg border border-ash-stone/30 overflow-hidden">
              <canvas ref={canvasRef} width={400} height={250} className="w-full h-full" />
            </div>
            <div className="w-64 rounded-lg border border-ash-stone/30 overflow-hidden">
              <div className="text-[10px] text-warm-gray/50 uppercase p-2">Loss Curve</div>
              <canvas ref={lossCanvasRef} width={250} height={200} className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function generateDataset(type: string): Array<{ x: number; y: number; label: number }> {
  const points: Array<{ x: number; y: number; label: number }> = []
  const n = 100
  for (let i = 0; i < n; i++) {
    switch (type) {
      case 'xor': {
        const x = Math.random() * 2 - 1
        const y = Math.random() * 2 - 1
        points.push({ x, y, label: (x > 0) !== (y > 0) ? 1 : 0 })
        break
      }
      case 'spiral': {
        const r = (i / n) * 0.8
        const t = i * 0.1 + (i % 2 === 0 ? 0 : Math.PI)
        points.push({ x: r * Math.cos(t), y: r * Math.sin(t), label: i % 2 })
        break
      }
      case 'circle': {
        const angle = Math.random() * Math.PI * 2
        const r = Math.random() * 0.8
        points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle), label: r < 0.4 ? 1 : 0 })
        break
      }
      default: {
        const cx = i % 2 === 0 ? -0.4 : 0.4
        const cy = i % 2 === 0 ? -0.4 : 0.4
        points.push({
          x: cx + (Math.random() - 0.5) * 0.6,
          y: cy + (Math.random() - 0.5) * 0.6,
          label: i % 2,
        })
      }
    }
  }
  return points
}
