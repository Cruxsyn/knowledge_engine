import type { Database } from 'sql.js'

export function seedCalculusML(db: Database): void {
  const now = new Date().toISOString()
  const pathId = 'path-calculus-ml'

  const concepts = [
    { id: 'cm-partial', name: 'Partial Derivative', definition: 'The derivative of a multivariable function with respect to one variable, holding others constant', intuition: 'The slope in one direction while standing still in all other directions' },
    { id: 'cm-gradient', name: 'Gradient', definition: 'The vector of all partial derivatives: ∇f = (∂f/∂x₁, ..., ∂f/∂xₙ)', intuition: 'Points in the direction of steepest ascent — the compass for optimization' },
    { id: 'cm-jacobian', name: 'Jacobian', definition: 'The matrix of all first-order partial derivatives of a vector-valued function', intuition: 'The best linear approximation to a function at a point' },
    { id: 'cm-hessian', name: 'Hessian', definition: 'The matrix of second-order partial derivatives: H_{ij} = ∂²f/∂xᵢ∂xⱼ', intuition: 'Describes the curvature of a function — tells you if you are at a bowl or a saddle' },
    { id: 'cm-convexity', name: 'Convexity', definition: 'A function f is convex if f(λx + (1-λ)y) ≤ λf(x) + (1-λ)f(y) for all λ ∈ [0,1]', intuition: 'A bowl shape — any local minimum is a global minimum' },
    { id: 'cm-gradient-descent', name: 'Gradient Descent', definition: 'An iterative optimization algorithm: x_{t+1} = x_t - α∇f(x_t)', intuition: 'Walk downhill following the steepest slope — the learning algorithm' },
    { id: 'cm-learning-rate', name: 'Learning Rate', definition: 'The step size α in gradient descent that controls how far we move each iteration', intuition: 'Too large: overshoot. Too small: crawl. Just right: converge efficiently.' },
    { id: 'cm-momentum', name: 'Momentum', definition: 'Accumulating a velocity term: v_t = βv_{t-1} + ∇f(x_t), then x_{t+1} = x_t - αv_t', intuition: 'A ball rolling downhill builds speed — smooths out noisy gradients' },
    { id: 'cm-sgd', name: 'Stochastic Gradient Descent', definition: 'Gradient descent using a random subset (mini-batch) of data per step instead of the full dataset', intuition: 'Noisy but fast — trade accuracy per step for many more steps per second' },
  ]

  for (const c of concepts) {
    db.run(`INSERT OR IGNORE INTO concepts (id, name, definition, intuition, mastery, created_at, updated_at) VALUES (?, ?, ?, ?, 'unknown', ?, ?)`,
      [c.id, c.name, c.definition, c.intuition, now, now])
  }

  const links = [
    ['cm-gradient', 'cm-partial', 'depends_on'],
    ['cm-jacobian', 'cm-gradient', 'refines'],
    ['cm-hessian', 'cm-jacobian', 'refines'],
    ['cm-gradient-descent', 'cm-gradient', 'depends_on'],
    ['cm-learning-rate', 'cm-gradient-descent', 'refines'],
    ['cm-momentum', 'cm-gradient-descent', 'refines'],
    ['cm-sgd', 'cm-gradient-descent', 'refines'],
    ['cm-gradient-descent', 'cm-convexity', 'depends_on'],
  ]
  for (let i = 0; i < links.length; i++) {
    db.run(`INSERT OR IGNORE INTO links (id, source_id, target_id, relationship, created_at) VALUES (?, ?, ?, ?, ?)`,
      [`cm-link-${i}`, links[i][0], links[i][1], links[i][2], now])
  }

  db.run(`INSERT OR IGNORE INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [pathId, 'Calculus for Machine Learning', 'Gradients, optimization, and gradient descent — how neural networks learn.', now, now])

  // Module 1: Multivariable Calculus
  const mod1 = 'mod-cm-multivariable'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod1, pathId, 'Multivariable Calculus', 'Partial derivatives, gradients, and beyond', 0, now, now])

  const l1 = { id: 'lesson-cm-gradient', title: 'The Gradient', subtitle: 'The compass of optimization',
    content: `## From Derivatives to Gradients

For a function of multiple variables $f(x_1, x_2, \\ldots, x_n)$, the {{term:cm-partial:partial derivative}} with respect to $x_i$ holds everything else constant:

$$\\frac{\\partial f}{\\partial x_i} = \\lim_{h \\to 0} \\frac{f(x_1, \\ldots, x_i + h, \\ldots) - f(x_1, \\ldots, x_i, \\ldots)}{h}$$

The {{term:cm-gradient:gradient}} collects all partial derivatives into a vector:

$$\\nabla f = \\begin{pmatrix} \\frac{\\partial f}{\\partial x_1} \\\\ \\vdots \\\\ \\frac{\\partial f}{\\partial x_n} \\end{pmatrix}$$

{{graph:x^2:-3:3}}

:::tip
The gradient points in the direction of steepest ascent. To minimize a loss function, go in the **opposite** direction: $-\\nabla f$. This is the entire idea behind gradient descent.
:::

### The Jacobian and Hessian

The {{term:cm-jacobian:Jacobian}} generalizes the gradient to vector-valued functions — it's a matrix of all first derivatives. The {{term:cm-hessian:Hessian}} is the matrix of second derivatives, revealing curvature.

$$H_{ij} = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}$$

If the Hessian is positive definite at a critical point, you've found a local minimum.`, concepts: ['cm-partial', 'cm-gradient', 'cm-jacobian', 'cm-hessian'] }

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [l1.id, mod1, l1.title, l1.subtitle, l1.content, 0, 'published', 12, now, now])
  for (const c of l1.concepts) db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l1.id, c])

  // Module 2: Optimization
  const mod2 = 'mod-cm-optimization'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod2, pathId, 'Optimization', 'Finding minima and the role of convexity', 1, now, now])

  const l2 = { id: 'lesson-cm-convexity', title: 'Convexity', subtitle: 'Why bowl-shaped functions are easy to optimize',
    content: `## Convex Functions

A function $f$ is {{term:cm-convexity:convex}} if for any two points $x, y$ and $\\lambda \\in [0,1]$:

$$f(\\lambda x + (1-\\lambda)y) \\leq \\lambda f(x) + (1-\\lambda)f(y)$$

Geometrically: the line segment between any two points on the graph lies **above** the graph.

{{graph:x^2:-3:3}}

The parabola $f(x) = x^2$ is the simplest convex function. Every local minimum is a global minimum — no traps!

### Why Convexity Matters for ML

:::tip
MSE loss is convex in the parameters for linear regression. Cross-entropy loss is convex in the logits for logistic regression. Deep networks have non-convex loss landscapes, but understanding convexity helps us analyze what makes optimization hard.
:::

### Testing Convexity

For twice-differentiable functions, $f$ is convex if and only if its Hessian $H$ is positive semi-definite everywhere:

$$\\vec{v}^T H \\vec{v} \\geq 0 \\quad \\text{for all } \\vec{v}$$`, concepts: ['cm-convexity', 'cm-hessian'] }

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [l2.id, mod2, l2.title, l2.subtitle, l2.content, 0, 'published', 10, now, now])
  for (const c of l2.concepts) db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l2.id, c])

  // Module 3: Gradient Descent
  const mod3 = 'mod-cm-gd'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod3, pathId, 'Gradient Descent', 'The optimization algorithm that powers deep learning', 2, now, now])

  const l3 = { id: 'lesson-cm-gd-algorithm', title: 'The Gradient Descent Algorithm', subtitle: 'Walking downhill to find the minimum',
    content: `## The Update Rule

{{term:cm-gradient-descent:Gradient descent}} iteratively updates parameters:

$$\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta_t)$$

where $\\alpha$ is the {{term:cm-learning-rate:learning rate}} and $\\nabla L$ is the gradient of the loss.

### Learning Rate Matters

{{graph:exp(-x):-1:5}}

:::warning
If $\\alpha$ is too large, you overshoot the minimum and diverge. If too small, training takes forever. Finding the right learning rate is one of the most important hyperparameter choices.
:::

### SGD and Mini-Batches

{{term:cm-sgd:Stochastic gradient descent}} estimates the gradient using a random subset of data:

$$\\nabla L \\approx \\frac{1}{|B|} \\sum_{i \\in B} \\nabla L_i(\\theta)$$

This introduces noise but enables training on datasets too large to fit in memory.

### Momentum

{{term:cm-momentum:Momentum}} accumulates past gradients to smooth updates:

$$v_t = \\beta v_{t-1} + \\nabla L(\\theta_t)$$
$$\\theta_{t+1} = \\theta_t - \\alpha v_t$$

:::tip
Momentum helps escape shallow local minima and speeds up traversal of long, narrow valleys in the loss landscape — common in deep networks.
:::`, concepts: ['cm-gradient-descent', 'cm-learning-rate', 'cm-sgd', 'cm-momentum'] }

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [l3.id, mod3, l3.title, l3.subtitle, l3.content, 0, 'published', 12, now, now])
  for (const c of l3.concepts) db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l3.id, c])

  // SRS Cards
  const cards = [
    { id: 'srs-cm-1', l: l1.id, t: 'definition', c: 'cm-gradient', q: 'What is the **gradient** $\\nabla f$?', a: '$$\\nabla f = \\left(\\frac{\\partial f}{\\partial x_1}, \\ldots, \\frac{\\partial f}{\\partial x_n}\\right)$$\nThe vector of all partial derivatives. Points in the direction of steepest ascent.' },
    { id: 'srs-cm-2', l: l1.id, t: 'definition', c: 'cm-hessian', q: 'What is the **Hessian** matrix?', a: '$$H_{ij} = \\frac{\\partial^2 f}{\\partial x_i \\partial x_j}$$\nMatrix of second derivatives. Positive definite Hessian at a critical point ⟹ local minimum.' },
    { id: 'srs-cm-3', l: l2.id, t: 'theorem', c: 'cm-convexity', q: 'State the definition of a **convex function**.', a: '$$f(\\lambda x + (1-\\lambda)y) \\leq \\lambda f(x) + (1-\\lambda)f(y)$$\nfor all $\\lambda \\in [0,1]$. Any local minimum is a global minimum.' },
    { id: 'srs-cm-4', l: l3.id, t: 'theorem', c: 'cm-gradient-descent', q: 'Write the **gradient descent** update rule.', a: '$$\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta_t)$$\nSubtract the gradient scaled by the learning rate $\\alpha$.' },
    { id: 'srs-cm-5', l: l3.id, t: 'definition', c: 'cm-momentum', q: 'How does **momentum** modify gradient descent?', a: '$$v_t = \\beta v_{t-1} + \\nabla L(\\theta_t), \\quad \\theta_{t+1} = \\theta_t - \\alpha v_t$$\nAccumulates past gradients to smooth updates and escape shallow minima.' },
    { id: 'srs-cm-6', l: l3.id, t: 'definition', c: 'cm-sgd', q: 'What makes SGD "stochastic"?', a: 'The gradient is estimated from a random **mini-batch** instead of the full dataset:\n$$\\nabla L \\approx \\frac{1}{|B|} \\sum_{i \\in B} \\nabla L_i$$\nNoisy but much faster per iteration.' },
  ]

  for (const card of cards) {
    db.run(`INSERT OR IGNORE INTO math_srs_cards (id, path_id, lesson_id, card_type, question, answer, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [card.id, pathId, card.l, card.t, card.q, card.a, card.c])
  }

  console.log('[Math Seed] Calculus for ML: 3 modules, 3 lessons, 9 concepts, 6 SRS cards')
}
