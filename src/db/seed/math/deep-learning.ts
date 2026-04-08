import type { Database } from 'sql.js'

export function seedDeepLearning(db: Database): void {
  const now = new Date().toISOString()
  const pathId = 'path-deep-learning'

  const concepts = [
    { id: 'dl-adam', name: 'Adam Optimizer', definition: 'Adaptive Moment Estimation: combines momentum (first moment) and RMSProp (second moment) with bias correction', intuition: 'An adaptive learning rate for each parameter — fast learners slow down, slow learners speed up' },
    { id: 'dl-lr-schedule', name: 'Learning Rate Schedule', definition: 'A strategy for changing the learning rate during training (e.g., cosine annealing, step decay, warmup)', intuition: 'Start cautious, explore fast, then fine-tune — like adjusting your stride on a mountain' },
    { id: 'dl-convolution', name: 'Convolution', definition: 'Sliding a kernel over input and computing dot products: (f*g)(t) = Σ f(τ)g(t-τ)', intuition: 'A pattern detector that shares weights across spatial positions' },
    { id: 'dl-pooling', name: 'Pooling', definition: 'Reducing spatial dimensions by taking max or average over local regions', intuition: 'Summarize a neighborhood: "was the feature here?" not "exactly where?"' },
    { id: 'dl-receptive-field', name: 'Receptive Field', definition: 'The region of input that influences a given neuron\'s output', intuition: 'How much of the image a neuron can "see" — grows with depth' },
    { id: 'dl-rnn', name: 'Recurrent Neural Network', definition: 'A network with hidden state: h_t = f(W_h h_{t-1} + W_x x_t + b)', intuition: 'A neural network with memory — processes sequences one step at a time' },
    { id: 'dl-lstm', name: 'LSTM', definition: 'Long Short-Term Memory: uses forget, input, and output gates to control information flow', intuition: 'A cell with a conveyor belt (cell state) and valves (gates) that learn what to remember and forget' },
    { id: 'dl-attention', name: 'Attention Mechanism', definition: 'Attention(Q,K,V) = softmax(QK^T/√d_k)V — weighted sum of values based on query-key similarity', intuition: 'Let the model decide what to focus on, rather than processing everything equally' },
    { id: 'dl-multihead', name: 'Multi-Head Attention', definition: 'Running multiple attention heads in parallel, then concatenating: MultiHead = Concat(head_1,...,head_h)W^O', intuition: 'Different heads can attend to different things: syntax, semantics, position, etc.' },
    { id: 'dl-positional', name: 'Positional Encoding', definition: 'Adding position information via sinusoids: PE(pos,2i) = sin(pos/10000^{2i/d})', intuition: 'Since transformers have no recurrence, we must explicitly tell them where each token is' },
    { id: 'dl-layer-norm', name: 'Layer Normalization', definition: 'Normalizing across features (not batch): μ and σ computed per sample across the feature dimension', intuition: 'Like batch norm but works for any batch size — essential for transformers' },
  ]

  for (const c of concepts) {
    db.run(`INSERT OR IGNORE INTO concepts (id, name, definition, intuition, mastery, created_at, updated_at) VALUES (?, ?, ?, ?, 'unknown', ?, ?)`,
      [c.id, c.name, c.definition, c.intuition, now, now])
  }

  const links = [
    ['dl-adam', 'cm-momentum', 'refines'],
    ['dl-lr-schedule', 'cm-learning-rate', 'refines'],
    ['dl-pooling', 'dl-convolution', 'depends_on'],
    ['dl-receptive-field', 'dl-convolution', 'depends_on'],
    ['dl-lstm', 'dl-rnn', 'refines'],
    ['dl-attention', 'nn-softmax', 'depends_on'],
    ['dl-multihead', 'dl-attention', 'depends_on'],
    ['dl-positional', 'dl-attention', 'depends_on'],
    ['dl-layer-norm', 'nn-batch-norm', 'refines'],
  ]
  for (let i = 0; i < links.length; i++) {
    db.run(`INSERT OR IGNORE INTO links (id, source_id, target_id, relationship, created_at) VALUES (?, ?, ?, ?, ?)`,
      [`dl-link-${i}`, links[i][0], links[i][1], links[i][2], now])
  }

  db.run(`INSERT OR IGNORE INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [pathId, 'Deep Learning Mathematics', 'Adam optimizer, CNNs, attention mechanisms, and transformers — cutting edge math.', now, now])

  // Module 1: Advanced Optimization
  const mod1 = 'mod-dl-optim'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod1, pathId, 'Advanced Optimization', 'Beyond vanilla gradient descent', 0, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-dl-adam', mod1, 'The Adam Optimizer', 'Adaptive learning rates done right', `## Beyond SGD + Momentum

{{term:dl-adam:Adam}} (Adaptive Moment Estimation) combines two ideas:

**First moment** (like momentum): $m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t$

**Second moment** (like RMSProp): $v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2$

**Bias correction** (because $m_0 = v_0 = 0$):

$$\\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}$$

**Update**:

$$\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t$$

Default hyperparameters: $\\beta_1 = 0.9$, $\\beta_2 = 0.999$, $\\epsilon = 10^{-8}$.

:::tip
Adam is the default optimizer for most deep learning. It adapts the learning rate per-parameter: parameters with large gradients get smaller steps, and vice versa. This is crucial for training with diverse parameter scales.
:::

### {{term:dl-lr-schedule:Learning Rate Schedules}}

**Cosine annealing**: $\\alpha_t = \\alpha_{\\min} + \\frac{1}{2}(\\alpha_{\\max} - \\alpha_{\\min})(1 + \\cos(\\frac{t}{T}\\pi))$

{{graph:0.5*(1+cos(x*3.14159/10)):0:10}}

**Warmup**: Start with a tiny LR, linearly increase to full LR over the first few epochs. Prevents early instability.`, 0, 'published', 12, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-adam', 'dl-adam'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-adam', 'dl-lr-schedule'])

  // Module 2: CNNs
  const mod2 = 'mod-dl-cnn'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod2, pathId, 'CNNs & Convolution', 'The math of image understanding', 1, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-dl-conv', mod2, 'Convolution as Matrix Operation', 'How CNNs detect patterns', `## Discrete Convolution

{{term:dl-convolution:Convolution}} slides a kernel $K$ over input $X$:

$$(X * K)_{ij} = \\sum_m \\sum_n X_{i+m, j+n} \\cdot K_{m,n}$$

A $3 \\times 3$ kernel with 9 parameters is applied at every spatial position — **parameter sharing**.

### Why Convolutions Work

1. **Translation equivariance**: A cat is a cat regardless of position
2. **Local connectivity**: Each output depends only on a small input region
3. **Parameter sharing**: Same kernel everywhere = far fewer parameters than fully-connected

### {{term:dl-pooling:Pooling}} & {{term:dl-receptive-field:Receptive Fields}}

**Max pooling** with stride 2 halves spatial dimensions:

$$\\text{output}_{ij} = \\max_{m,n \\in \\text{window}} \\text{input}_{2i+m, 2j+n}$$

Output size: $\\lfloor \\frac{W - K + 2P}{S} \\rfloor + 1$ where $W$ = input, $K$ = kernel, $P$ = padding, $S$ = stride.

:::tip
Each layer's receptive field grows: a stack of $3 \\times 3$ convolutions sees $5 \\times 5$ after 2 layers, $7 \\times 7$ after 3. Deep CNNs learn hierarchical features: edges → textures → parts → objects.
:::`, 0, 'published', 12, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-conv', 'dl-convolution'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-conv', 'dl-pooling'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-conv', 'dl-receptive-field'])

  // Module 3: Sequence Models
  const mod3 = 'mod-dl-sequence'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod3, pathId, 'Sequence Models', 'RNNs, LSTMs, and the birth of attention', 2, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-dl-attention', mod3, 'The Attention Mechanism', 'The idea that transformed AI', `## From RNNs to Attention

{{term:dl-rnn:RNNs}} process sequences step-by-step: $h_t = \\tanh(W_h h_{t-1} + W_x x_t + b)$

Problem: information from early tokens fades as the sequence grows. {{term:dl-lstm:LSTMs}} help but are sequential (slow).

### Attention: Look at Everything at Once

{{term:dl-attention:Attention}} computes:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$

Where:
- $Q$ (queries): "what am I looking for?"
- $K$ (keys): "what do I contain?"
- $V$ (values): "what information do I have?"
- $\\sqrt{d_k}$: scaling prevents softmax saturation

:::tip
Attention is just a soft dictionary lookup. The query asks a question, keys are matched, and the weighted sum of values is the answer. The $\\sqrt{d_k}$ scaling keeps dot products from growing too large as dimension increases.
:::

### {{term:dl-multihead:Multi-Head Attention}}

Run $h$ attention heads in parallel:

$$\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_h) W^O$$

Each head has its own $W_i^Q, W_i^K, W_i^V$ projections.

:::note
Different heads learn to attend to different relationships: one might track syntax, another semantics, another positional patterns. This is why transformers are so powerful.
:::`, 0, 'published', 15, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-attention', 'dl-rnn'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-attention', 'dl-attention'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-attention', 'dl-multihead'])

  // Module 4: Transformers
  const mod4 = 'mod-dl-transformers'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod4, pathId, 'Transformers', 'The architecture behind modern AI', 3, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-dl-transformer', mod4, 'Positional Encoding & Layer Norm', 'The supporting math of transformers', `## Positional Encoding

Since transformers process all tokens in parallel, they need explicit position information. {{term:dl-positional:Positional encoding}} uses sinusoids:

$$PE_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i/d}}\\right)$$
$$PE_{(pos, 2i+1)} = \\cos\\left(\\frac{pos}{10000^{2i/d}}\\right)$$

{{graph:sin(x/10):0:100}}

Each dimension oscillates at a different frequency. Relative positions can be computed via linear combinations — the model can learn to attend to "3 tokens ahead" using these encodings.

### {{term:dl-layer-norm:Layer Normalization}}

$$\\text{LayerNorm}(x) = \\gamma \\odot \\frac{x - \\mu}{\\sqrt{\\sigma^2 + \\epsilon}} + \\beta$$

Unlike batch norm (normalize across batch), layer norm normalizes across features **within each sample**. This works for any batch size, including 1.

:::tip
The transformer block is: LayerNorm → Multi-Head Attention → Residual → LayerNorm → FFN → Residual. This "pre-norm" pattern is now standard. The residual connections ensure gradients flow freely through very deep transformer stacks (GPT-3 has 96 layers!).
:::

### The Full Transformer Block

$$x = x + \\text{MultiHeadAttention}(\\text{LN}(x))$$
$$x = x + \\text{FFN}(\\text{LN}(x))$$

That's it. Stack this $L$ times and you have GPT, BERT, or any modern language model.`, 0, 'published', 15, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-transformer', 'dl-positional'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-dl-transformer', 'dl-layer-norm'])

  // SRS Cards
  const cards = [
    { id: 'srs-dl-1', l: 'lesson-dl-adam', t: 'theorem', c: 'dl-adam', q: 'Write the **Adam** update rule.', a: '$$m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t, \\quad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2$$\n$$\\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}_t}+\\epsilon}\\hat{m}_t$$\nwith bias correction: $\\hat{m}_t = m_t/(1-\\beta_1^t)$' },
    { id: 'srs-dl-2', l: 'lesson-dl-conv', t: 'definition', c: 'dl-convolution', q: 'Write the **discrete convolution** formula.', a: '$$(X*K)_{ij} = \\sum_m \\sum_n X_{i+m,j+n} \\cdot K_{m,n}$$\nSlide kernel over input, compute dot product at each position.' },
    { id: 'srs-dl-3', l: 'lesson-dl-conv', t: 'computation', c: 'dl-pooling', q: 'What is the **output size** formula for convolution?', a: '$$\\lfloor\\frac{W - K + 2P}{S}\\rfloor + 1$$\n$W$=input, $K$=kernel, $P$=padding, $S$=stride.' },
    { id: 'srs-dl-4', l: 'lesson-dl-attention', t: 'theorem', c: 'dl-attention', q: 'Write the **scaled dot-product attention** formula.', a: '$$\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$\n$\\sqrt{d_k}$ prevents large dot products from saturating softmax.' },
    { id: 'srs-dl-5', l: 'lesson-dl-attention', t: 'definition', c: 'dl-multihead', q: 'How does **multi-head attention** work?', a: '$$\\text{MultiHead} = \\text{Concat}(\\text{head}_1,\\ldots,\\text{head}_h)W^O$$\nEach head has separate $W^Q, W^K, W^V$ projections. Different heads attend to different relationships.' },
    { id: 'srs-dl-6', l: 'lesson-dl-transformer', t: 'theorem', c: 'dl-positional', q: 'Write the **positional encoding** formula.', a: '$$PE_{(pos,2i)} = \\sin(pos/10000^{2i/d}), \\quad PE_{(pos,2i+1)} = \\cos(pos/10000^{2i/d})$$\nDifferent frequencies per dimension. Enables learning relative positions.' },
    { id: 'srs-dl-7', l: 'lesson-dl-transformer', t: 'definition', c: 'dl-layer-norm', q: 'How does **layer norm** differ from batch norm?', a: 'Layer norm: normalize across features within each sample.\nBatch norm: normalize across batch for each feature.\nLayer norm works for any batch size — essential for transformers and inference.' },
  ]

  for (const card of cards) {
    db.run(`INSERT OR IGNORE INTO math_srs_cards (id, path_id, lesson_id, card_type, question, answer, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [card.id, pathId, card.l, card.t, card.q, card.a, card.c])
  }

  console.log('[Math Seed] Deep Learning: 4 modules, 4 lessons, 11 concepts, 7 SRS cards')
}
