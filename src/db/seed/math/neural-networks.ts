import type { Database } from 'sql.js'

export function seedNeuralNetworks(db: Database): void {
  const now = new Date().toISOString()
  const pathId = 'path-neural-networks'

  const concepts = [
    { id: 'nn-perceptron', name: 'Perceptron', definition: 'A single neuron computing y = σ(w·x + b)', intuition: 'The simplest neural network: a linear boundary + nonlinearity' },
    { id: 'nn-activation', name: 'Activation Function', definition: 'A nonlinear function applied after the linear transformation', intuition: 'Without it, stacking layers is pointless — composition of linear functions is still linear' },
    { id: 'nn-relu', name: 'ReLU', definition: 'ReLU(x) = max(0, x) — the most popular activation', intuition: 'Simple, fast, and avoids vanishing gradients for positive inputs' },
    { id: 'nn-sigmoid', name: 'Sigmoid', definition: 'σ(x) = 1/(1+e^(-x)) — squashes any input to (0,1)', intuition: 'Smooth step function. Output interpretable as probability.' },
    { id: 'nn-forward', name: 'Forward Pass', definition: 'Computing output by propagating input through layers: z=Wx+b, a=σ(z)', intuition: 'Feed the input forward, layer by layer, to get a prediction' },
    { id: 'nn-loss', name: 'Loss Function', definition: 'A function measuring how wrong the predictions are', intuition: 'The objective we minimize during training — lower loss = better model' },
    { id: 'nn-mse', name: 'Mean Squared Error', definition: 'L = (1/n)Σ(yᵢ - ŷᵢ)² — average squared prediction error', intuition: 'Penalizes large errors quadratically. Standard for regression.' },
    { id: 'nn-cross-entropy-loss', name: 'Cross-Entropy Loss', definition: 'L = -Σ yᵢ log(ŷᵢ) — negative log-likelihood of correct labels', intuition: 'Heavily punishes confident wrong answers. Standard for classification.' },
    { id: 'nn-softmax', name: 'Softmax', definition: 'softmax(zᵢ) = exp(zᵢ)/Σⱼ exp(zⱼ) — turns logits into probabilities', intuition: 'Makes outputs sum to 1 so they can be interpreted as class probabilities' },
    { id: 'nn-backprop', name: 'Backpropagation', definition: 'Computing gradients by applying the chain rule backwards through the network', intuition: 'Working backwards from the loss to find how each weight contributed to the error' },
    { id: 'nn-chain-rule', name: 'Chain Rule (NN)', definition: '∂L/∂w = (∂L/∂a)(∂a/∂z)(∂z/∂w) — gradient flows through composition', intuition: 'The mathematical backbone of backprop: multiply local gradients along the path' },
    { id: 'nn-vanishing', name: 'Vanishing Gradients', definition: 'Gradients shrink exponentially in deep networks as they pass through layers', intuition: 'Like a whisper passed through 100 people — the message disappears' },
    { id: 'nn-batch-norm', name: 'Batch Normalization', definition: 'Normalizing layer activations to zero mean and unit variance, then scaling: y = γx̂ + β', intuition: 'Keeps activations in a healthy range, stabilizing training' },
    { id: 'nn-dropout', name: 'Dropout', definition: 'Randomly zeroing activations during training with probability p', intuition: 'Forces the network to not rely on any single neuron — like training an ensemble' },
  ]

  for (const c of concepts) {
    db.run(`INSERT OR IGNORE INTO concepts (id, name, definition, intuition, mastery, created_at, updated_at) VALUES (?, ?, ?, ?, 'unknown', ?, ?)`,
      [c.id, c.name, c.definition, c.intuition, now, now])
  }

  const links = [
    ['nn-activation', 'nn-perceptron', 'depends_on'],
    ['nn-relu', 'nn-activation', 'refines'],
    ['nn-sigmoid', 'nn-activation', 'refines'],
    ['nn-forward', 'nn-perceptron', 'depends_on'],
    ['nn-loss', 'nn-forward', 'depends_on'],
    ['nn-mse', 'nn-loss', 'refines'],
    ['nn-cross-entropy-loss', 'nn-loss', 'refines'],
    ['nn-softmax', 'nn-forward', 'refines'],
    ['nn-backprop', 'nn-chain-rule', 'depends_on'],
    ['nn-backprop', 'nn-loss', 'depends_on'],
    ['nn-vanishing', 'nn-backprop', 'depends_on'],
    ['nn-batch-norm', 'nn-vanishing', 'depends_on'],
    ['nn-dropout', 'nn-forward', 'refines'],
  ]
  for (let i = 0; i < links.length; i++) {
    db.run(`INSERT OR IGNORE INTO links (id, source_id, target_id, relationship, created_at) VALUES (?, ?, ?, ?, ?)`,
      [`nn-link-${i}`, links[i][0], links[i][1], links[i][2], now])
  }

  db.run(`INSERT OR IGNORE INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [pathId, 'Neural Networks from Scratch', 'Build understanding from perceptrons to backpropagation — derive everything.', now, now])

  // Module 1: The Perceptron
  const mod1 = 'mod-nn-perceptron'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod1, pathId, 'The Perceptron', 'Where it all begins', 0, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-nn-activations', mod1, 'Activation Functions', 'Why nonlinearity matters', `## The Need for Nonlinearity

A {{term:nn-perceptron:perceptron}} computes $y = \\sigma(\\vec{w} \\cdot \\vec{x} + b)$, where $\\sigma$ is an {{term:nn-activation:activation function}}.

Without activation, stacking layers gives: $W_2(W_1\\vec{x}) = (W_2 W_1)\\vec{x}$ — still just a linear function!

### Common Activations

**{{term:nn-sigmoid:Sigmoid}}**: $\\sigma(x) = \\frac{1}{1 + e^{-x}}$

{{graph:1/(1+exp(-x)):-6:6}}

**{{term:nn-relu:ReLU}}**: $\\text{ReLU}(x) = \\max(0, x)$

{{graph:max(0, x):-3:5}}

:::tip
ReLU is the default choice for hidden layers because:
1. Fast to compute (just a threshold)
2. Gradient is 1 for positive inputs (no vanishing gradient)
3. Produces sparse activations (many zeros = efficient)
:::

:::warning
Sigmoid saturates for large/small inputs, causing vanishing gradients. Use it only for output layers (binary classification).
:::`, 0, 'published', 10, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-activations', 'nn-perceptron'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-activations', 'nn-activation'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-activations', 'nn-relu'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-activations', 'nn-sigmoid'])

  // Module 2: Forward Pass & Loss
  const mod2 = 'mod-nn-forward'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod2, pathId, 'Forward Pass & Loss', 'Computing predictions and measuring error', 1, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-nn-forward-loss', mod2, 'Forward Pass & Loss Functions', 'From input to error signal', `## The Forward Pass

A neural network with $L$ layers computes:

$$\\vec{z}^{[l]} = W^{[l]}\\vec{a}^{[l-1]} + \\vec{b}^{[l]}$$
$$\\vec{a}^{[l]} = \\sigma(\\vec{z}^{[l]})$$

where $\\vec{a}^{[0]} = \\vec{x}$ (the input). The {{term:nn-forward:forward pass}} chains these computations.

### Loss Functions

The {{term:nn-loss:loss function}} measures prediction quality:

**{{term:nn-mse:MSE}}** (regression): $L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$

**{{term:nn-cross-entropy-loss:Cross-Entropy}}** (classification): $L = -\\sum_{i} y_i \\log(\\hat{y}_i)$

:::tip
Cross-entropy penalizes confident wrong answers exponentially. If the true label is 1 and you predict 0.01, the loss is $-\\log(0.01) = 4.6$. If you predict 0.5, it's only $-\\log(0.5) = 0.69$.
:::

### Softmax Output

For multi-class classification, {{term:nn-softmax:softmax}} converts logits to probabilities:

$$\\text{softmax}(z_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$$`, 0, 'published', 12, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-forward-loss', 'nn-forward'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-forward-loss', 'nn-loss'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-forward-loss', 'nn-softmax'])

  // Module 3: Backpropagation
  const mod3 = 'mod-nn-backprop'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod3, pathId, 'Backpropagation', 'How neural networks learn', 2, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-nn-backprop', mod3, 'Deriving Backpropagation', 'The chain rule through layers', `## The Chain Rule is Everything

{{term:nn-backprop:Backpropagation}} computes $\\frac{\\partial L}{\\partial W^{[l]}}$ for every weight using the {{term:nn-chain-rule:chain rule}}:

$$\\frac{\\partial L}{\\partial W^{[l]}} = \\frac{\\partial L}{\\partial \\vec{z}^{[l]}} \\cdot \\frac{\\partial \\vec{z}^{[l]}}{\\partial W^{[l]}}$$

Define $\\delta^{[l]} = \\frac{\\partial L}{\\partial \\vec{z}^{[l]}}$ (the "error signal"). Then:

$$\\delta^{[L]} = \\vec{a}^{[L]} - \\vec{y} \\quad \\text{(for cross-entropy + softmax)}$$
$$\\delta^{[l]} = (W^{[l+1]})^T \\delta^{[l+1]} \\odot \\sigma'(\\vec{z}^{[l]})$$

And the weight gradient is:

$$\\frac{\\partial L}{\\partial W^{[l]}} = \\delta^{[l]} (\\vec{a}^{[l-1]})^T$$

:::note
Backprop is just the chain rule applied systematically. The "backward pass" computes gradients from output to input, reusing intermediate values from the forward pass.
:::

:::tip
The matrix $(W^{[l+1]})^T$ in the recursion explains why weight matrices matter for gradient flow. If singular values are < 1, gradients shrink (vanish). If > 1, they grow (explode).
:::`, 0, 'published', 15, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-backprop', 'nn-backprop'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-backprop', 'nn-chain-rule'])

  // Module 4: Training Dynamics
  const mod4 = 'mod-nn-training'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod4, pathId, 'Training Dynamics', 'Making deep networks actually work', 3, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-nn-training', mod4, 'Vanishing Gradients & Batch Norm', 'Why deep networks are hard to train', `## The Vanishing Gradient Problem

In a deep network, the gradient at layer $l$ involves a product:

$$\\frac{\\partial L}{\\partial W^{[1]}} = \\prod_{k=2}^{L} (W^{[k]})^T \\text{diag}(\\sigma'(z^{[k]})) \\cdot \\ldots$$

If $\\|W^{[k]}\\| < 1$ or $\\sigma'$ is small (sigmoid saturates), this product {{term:nn-vanishing:shrinks exponentially}}.

### Solutions

**ReLU**: Gradient is exactly 1 for positive inputs — no shrinkage.

**Residual connections**: $\\vec{a}^{[l]} = F(\\vec{a}^{[l-1]}) + \\vec{a}^{[l-1]}$. The identity shortcut lets gradients flow directly.

**{{term:nn-batch-norm:Batch Normalization}}**:

$$\\hat{x}_i = \\frac{x_i - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}}, \\quad y_i = \\gamma \\hat{x}_i + \\beta$$

Normalizes activations to zero mean and unit variance, then applies learned scale $\\gamma$ and shift $\\beta$.

:::tip
Batch norm is why modern deep networks (50+ layers) can be trained at all. It smooths the loss landscape and allows higher learning rates.
:::

### {{term:nn-dropout:Dropout}}

Randomly zero out neurons with probability $p$ during training. At test time, scale by $(1-p)$. Effect: the network can't rely on any single feature — it must learn redundant representations.`, 0, 'published', 12, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-training', 'nn-vanishing'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-training', 'nn-batch-norm'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-nn-training', 'nn-dropout'])

  // SRS Cards
  const cards = [
    { id: 'srs-nn-1', l: 'lesson-nn-activations', t: 'definition', c: 'nn-relu', q: 'Define **ReLU** and state why it is preferred.', a: '$\\text{ReLU}(x) = \\max(0, x)$\nGradient = 1 for $x > 0$ (no vanishing). Fast. Sparse activations.' },
    { id: 'srs-nn-2', l: 'lesson-nn-activations', t: 'definition', c: 'nn-sigmoid', q: 'Write the **sigmoid** function.', a: '$$\\sigma(x) = \\frac{1}{1 + e^{-x}}$$\nOutputs in $(0,1)$. Derivative: $\\sigma(x)(1 - \\sigma(x))$. Saturates for large $|x|$.' },
    { id: 'srs-nn-3', l: 'lesson-nn-forward-loss', t: 'theorem', c: 'nn-forward', q: 'Write the **forward pass** equations for layer $l$.', a: '$$z^{[l]} = W^{[l]}a^{[l-1]} + b^{[l]}, \\quad a^{[l]} = \\sigma(z^{[l]})$$' },
    { id: 'srs-nn-4', l: 'lesson-nn-forward-loss', t: 'definition', c: 'nn-softmax', q: 'Write the **softmax** formula.', a: '$$\\text{softmax}(z_i) = \\frac{e^{z_i}}{\\sum_j e^{z_j}}$$\nConverts logits to probabilities that sum to 1.' },
    { id: 'srs-nn-5', l: 'lesson-nn-backprop', t: 'theorem', c: 'nn-backprop', q: 'State the **backpropagation** recursion for $\\delta^{[l]}$.', a: '$$\\delta^{[l]} = (W^{[l+1]})^T \\delta^{[l+1]} \\odot \\sigma\'(z^{[l]})$$\nWeight gradient: $\\frac{\\partial L}{\\partial W^{[l]}} = \\delta^{[l]} (a^{[l-1]})^T$' },
    { id: 'srs-nn-6', l: 'lesson-nn-training', t: 'definition', c: 'nn-batch-norm', q: 'Write the **batch normalization** formula.', a: '$$\\hat{x} = \\frac{x - \\mu_B}{\\sqrt{\\sigma_B^2 + \\epsilon}}, \\quad y = \\gamma\\hat{x} + \\beta$$\nNormalize to zero mean / unit variance, then scale and shift.' },
    { id: 'srs-nn-7', l: 'lesson-nn-training', t: 'definition', c: 'nn-dropout', q: 'How does **dropout** regularize?', a: 'Randomly zero neurons with probability $p$ during training. Forces redundant representations. At test time, scale by $(1-p)$. Effect: implicit ensemble of $2^n$ subnetworks.' },
  ]

  for (const card of cards) {
    db.run(`INSERT OR IGNORE INTO math_srs_cards (id, path_id, lesson_id, card_type, question, answer, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [card.id, pathId, card.l, card.t, card.q, card.a, card.c])
  }

  console.log('[Math Seed] Neural Networks: 4 modules, 4 lessons, 14 concepts, 7 SRS cards')
}
