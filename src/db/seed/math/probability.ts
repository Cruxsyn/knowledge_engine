import type { Database } from 'sql.js'

export function seedProbability(db: Database): void {
  const now = new Date().toISOString()
  const pathId = 'path-probability'

  const concepts = [
    { id: 'prob-bayes', name: "Bayes' Theorem", definition: 'P(A|B) = P(B|A)P(A) / P(B) — updating beliefs with evidence', intuition: 'How to flip a conditional probability: go from "likelihood of data given hypothesis" to "probability of hypothesis given data"' },
    { id: 'prob-rv', name: 'Random Variable', definition: 'A function that maps outcomes of a random experiment to real numbers', intuition: 'A number that could be different every time you run the experiment' },
    { id: 'prob-expectation', name: 'Expectation', definition: 'E[X] = Σ xP(X=x) — the average value weighted by probability', intuition: 'What you would get "on average" over infinitely many trials' },
    { id: 'prob-variance', name: 'Variance', definition: 'Var(X) = E[(X - E[X])²] — how spread out the distribution is', intuition: 'The average squared distance from the mean — measures uncertainty' },
    { id: 'prob-gaussian', name: 'Gaussian Distribution', definition: 'N(μ, σ²): f(x) = (1/√(2πσ²))exp(-(x-μ)²/(2σ²))', intuition: 'The bell curve — appears everywhere due to the Central Limit Theorem' },
    { id: 'prob-mle', name: 'Maximum Likelihood Estimation', definition: 'Find parameters θ that maximize P(data|θ)', intuition: 'Choose the parameters that make your observed data most probable' },
    { id: 'prob-entropy', name: 'Entropy', definition: 'H(X) = -Σ p(x)log p(x) — the average information content', intuition: 'How surprised you are on average — measures uncertainty in a distribution' },
    { id: 'prob-cross-entropy', name: 'Cross-Entropy', definition: 'H(p,q) = -Σ p(x)log q(x) — cost of encoding using wrong distribution q', intuition: 'The loss function for classification: penalizes confident wrong predictions heavily' },
    { id: 'prob-kl', name: 'KL Divergence', definition: 'D_KL(p||q) = Σ p(x)log(p(x)/q(x)) — how different q is from p', intuition: 'The "extra cost" of using distribution q when the truth is p. Always ≥ 0, equals 0 only when p=q.' },
  ]

  for (const c of concepts) {
    db.run(`INSERT OR IGNORE INTO concepts (id, name, definition, intuition, mastery, created_at, updated_at) VALUES (?, ?, ?, ?, 'unknown', ?, ?)`,
      [c.id, c.name, c.definition, c.intuition, now, now])
  }

  const links = [
    ['prob-variance', 'prob-expectation', 'depends_on'],
    ['prob-gaussian', 'prob-rv', 'depends_on'],
    ['prob-mle', 'prob-gaussian', 'depends_on'],
    ['prob-mle', 'prob-bayes', 'depends_on'],
    ['prob-cross-entropy', 'prob-entropy', 'depends_on'],
    ['prob-kl', 'prob-cross-entropy', 'refines'],
  ]
  for (let i = 0; i < links.length; i++) {
    db.run(`INSERT OR IGNORE INTO links (id, source_id, target_id, relationship, created_at) VALUES (?, ?, ?, ?, ?)`,
      [`prob-link-${i}`, links[i][0], links[i][1], links[i][2], now])
  }

  db.run(`INSERT OR IGNORE INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [pathId, 'Probability & Statistics', 'Distributions, Bayes theorem, MLE, and information theory — the foundation of ML.', now, now])

  // Module 1: Probability Theory
  const mod1 = 'mod-prob-theory'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod1, pathId, 'Probability Theory', 'The rules of uncertainty', 0, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-prob-bayes', mod1, "Bayes' Theorem", 'Updating beliefs with evidence', `## The Most Important Formula in ML

{{term:prob-bayes:Bayes' theorem}} lets us invert conditional probabilities:

$$P(H|D) = \\frac{P(D|H) \\cdot P(H)}{P(D)}$$

Where:
- $P(H|D)$ = **posterior** — probability of hypothesis given data
- $P(D|H)$ = **likelihood** — probability of data given hypothesis
- $P(H)$ = **prior** — our initial belief
- $P(D)$ = **evidence** — normalizing constant

:::tip
Nearly all of machine learning is Bayesian at its core. Training a neural network = finding the parameters that maximize $P(\\theta|\\text{data})$. MLE ignores the prior; MAP includes it; full Bayesian methods integrate over all parameters.
:::

### Example: Medical Testing

A disease affects 1% of people. A test is 99% accurate. If you test positive, what's the probability you have the disease?

$$P(\\text{disease}|+) = \\frac{0.99 \\times 0.01}{0.99 \\times 0.01 + 0.01 \\times 0.99} = 0.5$$

Only 50%! The low prior (1%) dramatically changes the answer.`, 0, 'published', 10, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-bayes', 'prob-bayes'])

  // Module 2: Distributions
  const mod2 = 'mod-prob-distributions'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod2, pathId, 'Distributions', 'The shapes of randomness', 1, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-prob-gaussian', mod2, 'The Gaussian Distribution', 'The bell curve that rules ML', `## The Normal Distribution

The {{term:prob-gaussian:Gaussian}} (normal) distribution is:

$$f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)$$

{{graph:exp(-x*x/2)/sqrt(2*3.14159):-4:4}}

### Why It's Everywhere

The **Central Limit Theorem** says: the sum of many independent random variables tends toward a Gaussian, regardless of the original distribution.

:::note
This is why weights in neural networks are initialized from a Gaussian. Noise in real data is approximately Gaussian. And the Gaussian is the maximum-entropy distribution for a given mean and variance — it assumes the least structure.
:::

### Key Properties

- {{term:prob-expectation:Mean}}: $E[X] = \\mu$
- {{term:prob-variance:Variance}}: $\\text{Var}(X) = \\sigma^2$
- 68-95-99.7 rule: approximately 68% of values fall within $\\pm 1\\sigma$`, 0, 'published', 10, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-gaussian', 'prob-gaussian'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-gaussian', 'prob-expectation'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-gaussian', 'prob-variance'])

  // Module 3: Statistical Inference
  const mod3 = 'mod-prob-inference'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod3, pathId, 'Statistical Inference', 'Learning from data', 2, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-prob-mle', mod3, 'Maximum Likelihood Estimation', 'The parameters that best explain your data', `## The MLE Principle

{{term:prob-mle:Maximum Likelihood Estimation}} finds parameters $\\theta$ that maximize the likelihood:

$$\\hat{\\theta}_{\\text{MLE}} = \\arg\\max_\\theta P(\\text{data} | \\theta) = \\arg\\max_\\theta \\prod_{i=1}^n P(x_i | \\theta)$$

Taking the log (since products become sums):

$$\\hat{\\theta}_{\\text{MLE}} = \\arg\\max_\\theta \\sum_{i=1}^n \\log P(x_i | \\theta)$$

:::tip
**Minimizing cross-entropy loss = maximizing log-likelihood.** When you train a neural network classifier with cross-entropy loss, you are doing MLE. The connection is:
$$\\text{cross-entropy loss} = -\\frac{1}{n}\\sum \\log P(y_i | x_i, \\theta)$$
:::

### MLE for Gaussian

For data from $N(\\mu, \\sigma^2)$:
- $\\hat{\\mu} = \\frac{1}{n}\\sum x_i$ (sample mean)
- $\\hat{\\sigma}^2 = \\frac{1}{n}\\sum (x_i - \\hat{\\mu})^2$ (sample variance)`, 0, 'published', 12, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-mle', 'prob-mle'])

  // Module 4: Information Theory
  const mod4 = 'mod-prob-info'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod4, pathId, 'Information Theory', 'Entropy, cross-entropy, and KL divergence', 3, now, now])

  db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['lesson-prob-entropy', mod4, 'Entropy & Cross-Entropy', 'Measuring information and the loss function of classification', `## Shannon Entropy

{{term:prob-entropy:Entropy}} measures the average surprise (information content) of a distribution:

$$H(X) = -\\sum_{x} p(x) \\log_2 p(x)$$

{{graph:-x*log(x)/log(2)-(1-x)*log(1-x)/log(2):0.01:0.99}}

Maximum entropy is at $p = 0.5$ (most uncertain). Entropy is 0 when $p = 0$ or $p = 1$ (certain).

### Cross-Entropy

{{term:prob-cross-entropy:Cross-entropy}} measures the cost of using distribution $q$ to encode data from distribution $p$:

$$H(p, q) = -\\sum_x p(x) \\log q(x)$$

:::tip
Cross-entropy is THE loss function for classification in deep learning. For a binary classifier:
$$L = -[y \\log(\\hat{y}) + (1-y)\\log(1-\\hat{y})]$$
:::

### KL Divergence

{{term:prob-kl:KL divergence}} is the "extra bits" from using $q$ instead of $p$:

$$D_{KL}(p \\| q) = H(p, q) - H(p) = \\sum_x p(x) \\log \\frac{p(x)}{q(x)}$$

Always $\\geq 0$. Zero only when $p = q$.

:::note
Minimizing cross-entropy loss = minimizing KL divergence (since $H(p)$ is constant). This is why cross-entropy works: it pushes the model's distribution toward the true distribution.
:::`, 0, 'published', 12, now, now])

  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-entropy', 'prob-entropy'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-entropy', 'prob-cross-entropy'])
  db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, ['lesson-prob-entropy', 'prob-kl'])

  // SRS Cards
  const cards = [
    { id: 'srs-prob-1', l: 'lesson-prob-bayes', t: 'theorem', c: 'prob-bayes', q: "State **Bayes' theorem**.", a: "$$P(H|D) = \\frac{P(D|H) \\cdot P(H)}{P(D)}$$\nPosterior = (Likelihood × Prior) / Evidence" },
    { id: 'srs-prob-2', l: 'lesson-prob-gaussian', t: 'definition', c: 'prob-gaussian', q: 'Write the **Gaussian** PDF.', a: '$$f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} \\exp\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)$$' },
    { id: 'srs-prob-3', l: 'lesson-prob-mle', t: 'definition', c: 'prob-mle', q: 'What is **MLE**?', a: '$$\\hat{\\theta} = \\arg\\max_\\theta \\sum_{i} \\log P(x_i | \\theta)$$\nFind parameters that maximize the log-likelihood of observed data.' },
    { id: 'srs-prob-4', l: 'lesson-prob-entropy', t: 'definition', c: 'prob-entropy', q: 'What is **Shannon entropy**?', a: '$$H(X) = -\\sum p(x) \\log p(x)$$\nMeasures average surprise/uncertainty. Maximum when uniform, zero when certain.' },
    { id: 'srs-prob-5', l: 'lesson-prob-entropy', t: 'theorem', c: 'prob-cross-entropy', q: 'State the **cross-entropy** formula.', a: '$$H(p, q) = -\\sum_x p(x) \\log q(x)$$\nCost of encoding distribution $p$ using distribution $q$. The standard classification loss.' },
    { id: 'srs-prob-6', l: 'lesson-prob-entropy', t: 'theorem', c: 'prob-kl', q: 'What is **KL divergence** and why is it ≥ 0?', a: '$$D_{KL}(p\\|q) = \\sum p(x) \\log \\frac{p(x)}{q(x)} = H(p,q) - H(p) \\geq 0$$\nIt measures extra bits from using wrong distribution. Zero iff $p=q$ (Gibbs inequality).' },
  ]

  for (const card of cards) {
    db.run(`INSERT OR IGNORE INTO math_srs_cards (id, path_id, lesson_id, card_type, question, answer, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [card.id, pathId, card.l, card.t, card.q, card.a, card.c])
  }

  console.log('[Math Seed] Probability: 4 modules, 4 lessons, 9 concepts, 6 SRS cards')
}
