import initSqlJs, { type Database, type SqlJsStatic, type SqlValue } from 'sql.js'
import { loadFromStorage, saveToStorage } from '@/lib/persistence'
import schema from './schema.sql?raw'
import learningSchema from './learning-schema.sql?raw'
import japaneseSchema from './japanese-schema.sql?raw'
import { seedJapaneseData } from '@/db/seed/japanese-seed'

let SQL: SqlJsStatic | null = null
let db: Database | null = null
let saveTimeout: ReturnType<typeof setTimeout> | null = null

const DEBOUNCE_SAVE_MS = 1000

/**
 * Seed database with test data
 */
function seedTestData(database: Database): void {
  const now = new Date().toISOString()
  
  // Create test concepts
  const concepts = [
    { id: 'c1', name: 'React Hooks', definition: 'Functions that let you use state and other React features in functional components', intuition: 'Think of hooks as a way to "hook into" React features', pitfalls: 'Cannot call hooks conditionally or in loops', mastery: 'solid' },
    { id: 'c2', name: 'State Management', definition: 'The practice of managing the data that determines the behavior and appearance of an application', intuition: 'Like a central nervous system for your app', pitfalls: 'Over-engineering simple apps with complex state solutions', mastery: 'learning' },
    { id: 'c3', name: 'Component Composition', definition: 'Building complex UIs from smaller, reusable components', intuition: 'Like LEGO blocks - small pieces combine to make complex structures', pitfalls: 'Creating too many tiny components or too few large ones', mastery: 'teachable' },
    { id: 'c4', name: 'TypeScript Generics', definition: 'A way to create reusable components that work with multiple types', intuition: 'Like function parameters, but for types', pitfalls: 'Over-complicating type definitions', mastery: 'unknown' },
    { id: 'c5', name: 'Async/Await', definition: 'Syntactic sugar for working with Promises in JavaScript', intuition: 'Makes async code read like synchronous code', pitfalls: 'Forgetting error handling with try/catch', mastery: 'solid' },
    { id: 'c6', name: 'REST APIs', definition: 'Architectural style for designing networked applications using HTTP methods', intuition: 'Like a waiter taking orders between kitchen and customers', pitfalls: 'Not following proper HTTP status codes', mastery: 'teachable' },
  ]
  
  for (const c of concepts) {
    database.run(`
      INSERT INTO concepts (id, name, definition, intuition, pitfalls, mastery, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [c.id, c.name, c.definition, c.intuition, c.pitfalls, c.mastery, now, now])
  }
  
  // Create test notes with type-specific content
  const notes = [
    { 
      id: 'n1', 
      title: 'useState vs useReducer', 
      note_type: 'connection', 
      content: JSON.stringify({ item_a: 'useState', item_b: 'useReducer', relationship: 'useState is simpler for single values, useReducer is better for complex state logic with multiple sub-values. Use useReducer when state logic is complex or when the next state depends on the previous one.' }),
      confidence: 4 
    },
    { 
      id: 'n2', 
      title: 'The Rules of Hooks', 
      note_type: 'definition', 
      content: JSON.stringify({ term: 'Rules of Hooks', definition: 'Hooks must be called at the top level and only from React functions. Breaking hook rules causes unpredictable behavior because React relies on call order.' }),
      confidence: 5 
    },
    { 
      id: 'n3', 
      title: 'Props vs State', 
      note_type: 'connection', 
      content: JSON.stringify({ item_a: 'Props', item_b: 'State', relationship: 'Props are passed from parent and are read-only. State is managed internally. Both trigger re-renders when changed. Never modify props directly.' }),
      confidence: 5 
    },
    { 
      id: 'n4', 
      title: 'Generic Constraints', 
      note_type: 'definition', 
      content: JSON.stringify({ term: 'Generic Constraints', definition: 'Use the extends keyword to limit what types can be passed to a generic. Constraints let you access properties on generic types safely.' }),
      confidence: 3 
    },
    { 
      id: 'n5', 
      title: 'Error Boundaries', 
      note_type: 'definition', 
      content: JSON.stringify({ term: 'Error Boundaries', definition: 'React components that catch JavaScript errors in their child component tree. Error boundaries only catch errors during rendering, not in event handlers.' }),
      confidence: 3 
    },
    { 
      id: 'n6', 
      title: 'API Design Best Practices', 
      note_type: 'process', 
      content: JSON.stringify({ steps: '1. Use nouns for resources (e.g., /users, /posts)\n2. Use HTTP verbs for actions (GET, POST, PUT, DELETE)\n3. Use consistent naming conventions\n4. Return proper status codes', use_case: 'Good API design prioritizes predictability and developer experience' }),
      confidence: 4 
    },
    { 
      id: 'n7', 
      title: 'Promise.all vs Promise.allSettled', 
      note_type: 'connection', 
      content: JSON.stringify({ item_a: 'Promise.all', item_b: 'Promise.allSettled', relationship: 'Promise.all fails fast on first rejection, allSettled waits for all to complete. Use allSettled when you need all results regardless of individual failures.' }),
      confidence: 4 
    },
  ]
  
  for (const n of notes) {
    database.run(`
      INSERT INTO atomic_notes (id, title, note_type, content, confidence, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [n.id, n.title, n.note_type, n.content, n.confidence, now, now])
  }
  
  // Link notes to concepts
  const noteConceptLinks = [
    { note_id: 'n1', concept_id: 'c1' }, // useState vs useReducer -> React Hooks
    { note_id: 'n1', concept_id: 'c2' }, // useState vs useReducer -> State Management
    { note_id: 'n2', concept_id: 'c1' }, // Rules of Hooks -> React Hooks
    { note_id: 'n3', concept_id: 'c2' }, // Props vs State -> State Management
    { note_id: 'n3', concept_id: 'c3' }, // Props vs State -> Component Composition
    { note_id: 'n4', concept_id: 'c4' }, // Generic Constraints -> TypeScript Generics
    { note_id: 'n5', concept_id: 'c3' }, // Error Boundaries -> Component Composition
    { note_id: 'n6', concept_id: 'c6' }, // API Best Practices -> REST APIs
    { note_id: 'n7', concept_id: 'c5' }, // Promise methods -> Async/Await
  ]
  
  for (const link of noteConceptLinks) {
    database.run(`
      INSERT INTO concept_notes (concept_id, note_id)
      VALUES (?, ?)
    `, [link.concept_id, link.note_id])
  }
  
  // Create concept-to-concept links
  const conceptLinks = [
    { id: 'l1', source_id: 'c1', target_id: 'c2', relationship: 'used_in' }, // React Hooks used in State Management
    { id: 'l2', source_id: 'c3', target_id: 'c1', relationship: 'depends_on' }, // Component Composition depends on React Hooks
    { id: 'l3', source_id: 'c5', target_id: 'c6', relationship: 'used_in' }, // Async/Await used in REST APIs
    { id: 'l4', source_id: 'c4', target_id: 'c1', relationship: 'refines' }, // TypeScript Generics refines React Hooks
  ]
  
  for (const link of conceptLinks) {
    database.run(`
      INSERT INTO links (id, source_id, target_id, relationship, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [link.id, link.source_id, link.target_id, link.relationship, now])
  }
  
  console.log('[Database] Seeded test data: 6 concepts, 7 notes, 9 note-concept links, 4 concept links')
}

/**
 * Seed learning data for Peak Learning feature
 */
function seedLearningData(database: Database): void {
  const now = new Date().toISOString()

  // Create concepts for calculus (if they don't already exist)
  const calcConcepts = [
    { id: 'calc-limit', name: 'Limit', definition: 'The value a function approaches as the input approaches a specific value', intuition: 'Like getting infinitely close to something without necessarily touching it', pitfalls: 'A limit can exist even if the function is undefined at that point', mastery: 'unknown' },
    { id: 'calc-continuity', name: 'Continuity', definition: 'A function is continuous at a point if the limit equals the function value there', intuition: 'You can draw the graph without lifting your pen', pitfalls: 'Piecewise functions may look continuous but have hidden discontinuities', mastery: 'unknown' },
    { id: 'calc-derivative', name: 'Derivative', definition: 'The instantaneous rate of change of a function, defined as the limit of the difference quotient', intuition: 'The slope of the tangent line at any point on a curve', pitfalls: 'Not all continuous functions are differentiable (e.g., |x| at x=0)', mastery: 'unknown' },
    { id: 'calc-slope', name: 'Slope', definition: 'The ratio of vertical change to horizontal change between two points, rise over run', intuition: 'How steep a hill is — positive means uphill, negative means downhill', pitfalls: 'Slope of a curve changes at every point, unlike a straight line', mastery: 'unknown' },
    { id: 'calc-power-rule', name: 'Power Rule', definition: 'The derivative of x^n is n*x^(n-1)', intuition: 'Bring the exponent down and reduce it by one', pitfalls: 'Only applies directly to power functions; use chain rule for compositions', mastery: 'unknown' },
    { id: 'calc-chain-rule', name: 'Chain Rule', definition: 'The derivative of f(g(x)) is f\'(g(x)) * g\'(x)', intuition: 'Peel off layers like an onion — differentiate the outside, then multiply by the derivative of the inside', pitfalls: 'Easy to forget the inner derivative, especially with nested compositions', mastery: 'unknown' },
  ]

  for (const c of calcConcepts) {
    try {
      database.run(`
        INSERT OR IGNORE INTO concepts (id, name, definition, intuition, pitfalls, mastery, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [c.id, c.name, c.definition, c.intuition, c.pitfalls, c.mastery, now, now])
    } catch { /* ignore duplicates */ }
  }

  // Create learning path
  const pathId = 'path-calc-fundamentals'
  database.run(
    'INSERT INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [pathId, 'Calculus Fundamentals', 'Build deep intuition for the core ideas of calculus — limits, continuity, and derivatives.', now, now]
  )

  // Module 1: Limits
  const mod1Id = 'mod-limits'
  database.run(
    'INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [mod1Id, pathId, 'Limits & Continuity', 'Understanding what happens as we approach infinity — and everything in between.', 0, now, now]
  )

  // Module 2: Derivatives
  const mod2Id = 'mod-derivatives'
  database.run(
    'INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [mod2Id, pathId, 'Derivatives', 'Capturing the idea of instantaneous change.', 1, now, now]
  )

  // Lesson 1: What is a Limit?
  const lesson1Id = 'lesson-what-is-limit'
  const lesson1Content = `## The Intuition

Imagine walking toward a wall. With each step, you cover half the remaining distance. You get closer and closer, but do you ever actually *reach* the wall?

This is the essence of a {{term:calc-limit:limit}}. In calculus, we care about what value a function *approaches* — not necessarily what it equals.

## A Visual Example

Consider the function $f(x) = \\frac{\\sin(x)}{x}$. What happens as $x$ approaches $0$?

We can't just plug in $x = 0$ because that gives us $\\frac{0}{0}$ — undefined! But look at the graph:

{{graph:sin(x)/x:-10:10}}

As $x$ gets closer and closer to $0$ from both sides, $f(x)$ approaches **1**. We write this as:

$$\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1$$

:::tip
The limit exists even though the function is undefined at $x = 0$. This is one of the most important ideas in calculus!
:::

## Formal Definition

The {{term:calc-limit:limit}} of $f(x)$ as $x$ approaches $a$ is $L$ if we can make $f(x)$ as close to $L$ as we want by making $x$ sufficiently close to $a$ (but not equal to $a$).

$$\\lim_{x \\to a} f(x) = L$$

## One-Sided Limits

Sometimes a function approaches different values from the left and right:

- **Left-hand limit**: $\\lim_{x \\to a^-} f(x)$ — approaching from values less than $a$
- **Right-hand limit**: $\\lim_{x \\to a^+} f(x)$ — approaching from values greater than $a$

:::note
A two-sided limit exists only if both one-sided limits exist AND are equal.
:::

## Connection to Continuity

A function is {{term:calc-continuity:continuous}} at a point $a$ if three conditions hold:

1. $f(a)$ is defined
2. $\\lim_{x \\to a} f(x)$ exists
3. $\\lim_{x \\to a} f(x) = f(a)$

If any of these fail, the function has a **discontinuity** at $a$.`

  database.run(
    'INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [lesson1Id, mod1Id, 'What is a Limit?', 'The foundational concept of calculus', lesson1Content, 0, 'published', 8, now, now]
  )

  // Lesson 2: Computing Limits
  const lesson2Id = 'lesson-computing-limits'
  const lesson2Content = `## Algebraic Techniques

Now that we understand *what* a {{term:calc-limit:limit}} is, let's learn to *compute* them.

### Direct Substitution

The simplest case: just plug in the value.

$$\\lim_{x \\to 3} (2x + 1) = 2(3) + 1 = 7$$

This works whenever the function is {{term:calc-continuity:continuous}} at the point.

### Factoring

When direct substitution gives $\\frac{0}{0}$, try factoring:

$$\\lim_{x \\to 2} \\frac{x^2 - 4}{x - 2} = \\lim_{x \\to 2} \\frac{(x+2)(x-2)}{x-2} = \\lim_{x \\to 2} (x + 2) = 4$$

### Rationalization

For expressions with radicals, multiply by the conjugate:

$$\\lim_{x \\to 0} \\frac{\\sqrt{x+1} - 1}{x}$$

Multiply top and bottom by $\\sqrt{x+1} + 1$:

$$= \\lim_{x \\to 0} \\frac{(x+1) - 1}{x(\\sqrt{x+1} + 1)} = \\lim_{x \\to 0} \\frac{1}{\\sqrt{x+1} + 1} = \\frac{1}{2}$$

## Limits at Infinity

What happens as $x$ grows without bound?

{{graph:1/x:-10:10}}

$$\\lim_{x \\to \\infty} \\frac{1}{x} = 0$$

:::tip
For rational functions at infinity, divide everything by the highest power of $x$ in the denominator. The dominant term wins.
:::

### The Squeeze Theorem

If $g(x) \\leq f(x) \\leq h(x)$ near $a$, and $\\lim_{x \\to a} g(x) = \\lim_{x \\to a} h(x) = L$, then:

$$\\lim_{x \\to a} f(x) = L$$

:::note
The Squeeze Theorem is especially useful for oscillating functions like $x \\sin(\\frac{1}{x})$ near $x = 0$.
:::`

  database.run(
    'INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [lesson2Id, mod1Id, 'Computing Limits', 'Algebraic techniques for evaluating limits', lesson2Content, 1, 'published', 10, now, now]
  )

  // Lesson 3: The Derivative
  const lesson3Id = 'lesson-the-derivative'
  const lesson3Content = `## Rate of Change

The {{term:calc-derivative:derivative}} captures a simple but powerful idea: **how fast is something changing?**

Think about driving a car. Your speedometer shows your *instantaneous* speed — not your average speed over the whole trip, but how fast you're going *right now*.

That's exactly what a derivative measures.

## From Average to Instantaneous

The average rate of change of $f(x)$ between $x = a$ and $x = b$ is:

$$\\text{Average rate} = \\frac{f(b) - f(a)}{b - a}$$

This is just the {{term:calc-slope:slope}} of the line connecting two points on the graph.

Now, what if we bring $b$ closer and closer to $a$? The secant line becomes a **tangent line**:

$$f'(a) = \\lim_{h \\to 0} \\frac{f(a + h) - f(a)}{h}$$

This is the **derivative** of $f$ at $a$.

## Visualizing the Derivative

Consider $f(x) = x^2$:

{{graph:x^2:-4:4}}

At $x = 1$, the slope of the tangent line is $f'(1) = 2(1) = 2$.
At $x = -2$, the slope is $f'(-2) = 2(-2) = -4$.

The derivative $f'(x) = 2x$ tells us the slope at *every* point.

## Notation

Several notations exist for the derivative:

| Notation | Read as |
|----------|---------|
| $f'(x)$ | "f prime of x" |
| $\\frac{dy}{dx}$ | "dy dx" (Leibniz notation) |
| $\\frac{d}{dx}[f(x)]$ | "d dx of f of x" |

:::note
Leibniz notation $\\frac{dy}{dx}$ emphasizes that the derivative is a ratio of infinitesimal changes. It's especially useful in chain rule applications.
:::

## When Derivatives Don't Exist

A function must be {{term:calc-continuity:continuous}} to be differentiable, but continuity alone isn't enough.

The derivative fails to exist at:
- **Corners** (like $|x|$ at $x = 0$)
- **Cusps** (like $x^{2/3}$ at $x = 0$)
- **Vertical tangent lines**
- **Discontinuities**

:::warning
Continuity is necessary but not sufficient for differentiability. Always check for corners and cusps!
:::`

  database.run(
    'INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [lesson3Id, mod2Id, 'The Derivative', 'Capturing instantaneous change', lesson3Content, 0, 'published', 10, now, now]
  )

  // Lesson 4: Differentiation Rules
  const lesson4Id = 'lesson-diff-rules'
  const lesson4Content = `## Why Rules Matter

Computing derivatives from the limit definition every time would be tedious. Fortunately, we have powerful shortcuts.

## The Power Rule

The most fundamental rule. If $f(x) = x^n$, then:

$$f'(x) = nx^{n-1}$$

The {{term:calc-power-rule:power rule}} works for any real exponent $n$.

**Examples:**
- $\\frac{d}{dx}[x^3] = 3x^2$
- $\\frac{d}{dx}[x^{-1}] = -x^{-2} = -\\frac{1}{x^2}$
- $\\frac{d}{dx}[\\sqrt{x}] = \\frac{d}{dx}[x^{1/2}] = \\frac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}$

## Sum and Constant Rules

Derivatives are **linear** — they distribute over addition and pull out constants:

$$\\frac{d}{dx}[f(x) + g(x)] = f'(x) + g'(x)$$

$$\\frac{d}{dx}[c \\cdot f(x)] = c \\cdot f'(x)$$

## Product Rule

When two functions are multiplied:

$$\\frac{d}{dx}[f(x) \\cdot g(x)] = f'(x) \\cdot g(x) + f(x) \\cdot g'(x)$$

:::tip
Remember it as: "derivative of the first times the second, plus the first times the derivative of the second."
:::

## Quotient Rule

$$\\frac{d}{dx}\\left[\\frac{f(x)}{g(x)}\\right] = \\frac{f'(x) \\cdot g(x) - f(x) \\cdot g'(x)}{[g(x)]^2}$$

## The Chain Rule

The {{term:calc-chain-rule:chain rule}} handles **compositions** — functions inside functions:

$$\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)$$

**Example:** Find $\\frac{d}{dx}[\\sin(x^2)]$

- Outer function: $\\sin(u)$, derivative: $\\cos(u)$
- Inner function: $u = x^2$, derivative: $2x$
- Result: $\\cos(x^2) \\cdot 2x = 2x\\cos(x^2)$

Let's visualize $\\sin(x^2)$:

{{graph:sin(x^2):-4:4}}

:::warning
The most common mistake with the chain rule is forgetting to multiply by the inner derivative. Always ask: "Is there a function inside another function?"
:::

## Practice Pattern

For any derivative problem:
1. **Identify** the overall structure (sum, product, quotient, composition?)
2. **Apply** the appropriate rule
3. **Simplify** the result
4. **Check** with the original function's behavior`

  database.run(
    'INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [lesson4Id, mod2Id, 'Differentiation Rules', 'Power rule, chain rule, and beyond', lesson4Content, 1, 'published', 12, now, now]
  )

  // Link lessons to concepts
  const lessonConcepts = [
    { lesson: lesson1Id, concept: 'calc-limit' },
    { lesson: lesson1Id, concept: 'calc-continuity' },
    { lesson: lesson2Id, concept: 'calc-limit' },
    { lesson: lesson2Id, concept: 'calc-continuity' },
    { lesson: lesson3Id, concept: 'calc-derivative' },
    { lesson: lesson3Id, concept: 'calc-slope' },
    { lesson: lesson3Id, concept: 'calc-continuity' },
    { lesson: lesson4Id, concept: 'calc-power-rule' },
    { lesson: lesson4Id, concept: 'calc-chain-rule' },
    { lesson: lesson4Id, concept: 'calc-derivative' },
  ]

  for (const lc of lessonConcepts) {
    database.run(
      'INSERT INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)',
      [lc.lesson, lc.concept]
    )
  }

  // Create concept-to-concept links for calculus
  const calcConceptLinks = [
    { id: 'cl1', source: 'calc-continuity', target: 'calc-limit', rel: 'depends_on' },
    { id: 'cl2', source: 'calc-derivative', target: 'calc-limit', rel: 'depends_on' },
    { id: 'cl3', source: 'calc-derivative', target: 'calc-slope', rel: 'refines' },
    { id: 'cl4', source: 'calc-power-rule', target: 'calc-derivative', rel: 'used_in' },
    { id: 'cl5', source: 'calc-chain-rule', target: 'calc-derivative', rel: 'used_in' },
  ]

  for (const link of calcConceptLinks) {
    try {
      database.run(
        'INSERT OR IGNORE INTO links (id, source_id, target_id, relationship, created_at) VALUES (?, ?, ?, ?, ?)',
        [link.id, link.source, link.target, link.rel, now]
      )
    } catch { /* ignore duplicates */ }
  }

  // Add term definitions for lessons
  const terms = [
    { id: 'term-limit-1', lesson_id: lesson1Id, term: 'limit', definition: 'The value a function approaches as the input approaches a specific value', concept_id: 'calc-limit' },
    { id: 'term-cont-1', lesson_id: lesson1Id, term: 'continuous', definition: 'A function where the limit equals the actual value at every point', concept_id: 'calc-continuity' },
    { id: 'term-deriv-1', lesson_id: lesson3Id, term: 'derivative', definition: 'The instantaneous rate of change of a function', concept_id: 'calc-derivative' },
    { id: 'term-slope-1', lesson_id: lesson3Id, term: 'slope', definition: 'Rise over run — the steepness of a line', concept_id: 'calc-slope' },
    { id: 'term-power-1', lesson_id: lesson4Id, term: 'power rule', definition: 'Derivative of x^n is n*x^(n-1)', concept_id: 'calc-power-rule' },
    { id: 'term-chain-1', lesson_id: lesson4Id, term: 'chain rule', definition: 'Derivative of f(g(x)) is f\'(g(x)) * g\'(x)', concept_id: 'calc-chain-rule' },
  ]

  for (const t of terms) {
    database.run(
      'INSERT INTO lesson_terms (id, lesson_id, term, definition, concept_id) VALUES (?, ?, ?, ?, ?)',
      [t.id, t.lesson_id, t.term, t.definition, t.concept_id]
    )
  }

  console.log('[Database] Seeded Peak Learning data: 1 path, 2 modules, 4 lessons, 6 concepts')
}

/**
 * Run database migrations for existing databases
 */
function runMigrations(database: Database): void {
  try {
    const result = database.exec("PRAGMA table_info(atomic_notes)")
    const columns = result[0]?.values.map(row => row[1]) || []
    
    // Add note_type column if missing
    if (!columns.includes('note_type')) {
      console.log('[Database] Running migration: adding note_type column')
      database.run("ALTER TABLE atomic_notes ADD COLUMN note_type TEXT NOT NULL DEFAULT 'other'")
    }
    
    // Add content column if missing
    if (!columns.includes('content')) {
      console.log('[Database] Running migration: adding content column')
      database.run("ALTER TABLE atomic_notes ADD COLUMN content TEXT NOT NULL DEFAULT '{}'")
      
      // Migrate existing data from summary/key_claim/example to content JSON
      const notes = database.exec("SELECT id, summary, key_claim, example FROM atomic_notes")
      if (notes[0]) {
        for (const row of notes[0].values) {
          const id = row[0]
          const content = JSON.stringify({
            summary: row[1] || '',
            key_claim: row[2] || '',
            example: row[3] || undefined,
          })
          database.run("UPDATE atomic_notes SET content = ? WHERE id = ?", [content, id])
        }
        console.log('[Database] Migrated note content to JSON format')
      }
    }
  } catch (err) {
    console.error('[Database] Migration error:', err)
  }
}

/**
 * Run learning schema migration
 */
function runLearningMigrations(database: Database): void {
  try {
    const tables = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='learning_paths'")
    if (tables.length === 0 || tables[0].values.length === 0) {
      console.log('[Database] Running migration: adding Peak Learning tables')
      database.run(learningSchema)
    }
  } catch (err) {
    console.error('[Database] Learning migration error:', err)
  }
}

/**
 * Run Japanese language learning schema migration
 */
function runJapaneseMigrations(database: Database): void {
  try {
    const tables = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='jp_kanji'")
    if (tables.length === 0 || tables[0].values.length === 0) {
      console.log('[Database] Running migration: adding Japanese Language Learning tables')
      database.run(japaneseSchema)
      // Seed default SRS settings
      const defaults = [
        ['desired_retention', '0.9'],
        ['new_cards_per_day', '15'],
        ['max_reviews_per_day', '9999'],
        ['daily_new_radical', '5'],
        ['daily_new_kanji', '5'],
        ['daily_new_vocab', '10'],
        ['interleave_reviews', 'true'],
        ['show_pitch_accent', 'true'],
      ]
      for (const [key, value] of defaults) {
        database.run('INSERT OR IGNORE INTO jp_settings (key, value) VALUES (?, ?)', [key, value])
      }
      // Seed progress dimensions
      const dims = ['vocabulary', 'kanji', 'grammar', 'reading', 'listening']
      for (const dim of dims) {
        database.run('INSERT OR IGNORE INTO jp_progress (dimension) VALUES (?)', [dim])
      }
      console.log('[Database] Japanese Language Learning tables created with default settings')
    }
  } catch (err) {
    console.error('[Database] Japanese migration error:', err)
  }
}

/**
 * Initialize sql.js and the database
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db

  // Initialize sql.js with local WASM file (includes FTS5 support)
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    })
  }

  // Try to load existing database from storage
  const existingData = await loadFromStorage()

  if (existingData) {
    db = new SQL.Database(existingData)
    console.log('[Database] Loaded existing database')
    // Run migrations for existing databases
    runMigrations(db)
    runLearningMigrations(db)
    runJapaneseMigrations(db)
    // Seed Japanese data if jp_kanji table is empty
    try {
      const kanjiCount = db.exec('SELECT COUNT(*) as count FROM jp_kanji')
      if (kanjiCount.length === 0 || kanjiCount[0].values[0][0] === 0) {
        console.log('[Database] Seeding Japanese starter data...')
        seedJapaneseData(db)
        console.log('[Database] Japanese starter data seeded')
      }
    } catch (err) {
      console.error('[Database] Japanese seed check error:', err)
    }
    await persistDatabase()
  } else {
    db = new SQL.Database()
    // Run schema for new database
    db.run(schema)
    db.run(learningSchema)
    db.run(japaneseSchema)
    console.log('[Database] Created new database with schema')
    // Save the new database (no test data by default)
    await persistDatabase()
  }

  return db
}

/**
 * Get the current database instance
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Persist database to storage (debounced)
 */
export function schedulePersist(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(async () => {
    await persistDatabase()
  }, DEBOUNCE_SAVE_MS)
}

/**
 * Force immediate persist
 */
export async function persistDatabase(): Promise<void> {
  if (!db) return
  const data = db.export()
  await saveToStorage(data)
}

/**
 * Execute a query and return results
 */
export function query<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
  const database = getDatabase()
  const stmt = database.prepare(sql)
  stmt.bind(params)
  
  const results: T[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject() as T
    results.push(row)
  }
  stmt.free()
  
  return results
}

/**
 * Execute a query that returns a single row
 */
export function queryOne<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T | null {
  const results = query<T>(sql, params)
  return results[0] || null
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 */
export function execute(sql: string, params: SqlValue[] = []): void {
  const database = getDatabase()
  database.run(sql, params)
  schedulePersist()
}

/**
 * Execute multiple statements in a transaction
 */
export function transaction(fn: () => void): void {
  const database = getDatabase()
  database.run('BEGIN TRANSACTION')
  try {
    fn()
    database.run('COMMIT')
    schedulePersist()
  } catch (err) {
    database.run('ROLLBACK')
    throw err
  }
}

/**
 * Get the row ID of the last inserted row
 */
export function lastInsertRowId(): number {
  const database = getDatabase()
  const result = database.exec('SELECT last_insert_rowid() as id')
  return result[0]?.values[0]?.[0] as number
}

/**
 * Export database for download
 */
export function exportDatabase(): Uint8Array {
  const database = getDatabase()
  return database.export()
}

/**
 * Import database from data
 */
export async function importDatabaseData(data: Uint8Array): Promise<void> {
  if (!SQL) {
    throw new Error('SQL.js not initialized')
  }
  
  // Close existing database
  if (db) {
    db.close()
  }
  
  // Create new database from imported data
  db = new SQL.Database(data)
  await persistDatabase()
}

/**
 * Close the database
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}

/**
 * Reset database and reseed with test data
 */
export async function resetAndSeedDatabase(): Promise<void> {
  if (!SQL) {
    throw new Error('SQL.js not initialized')
  }
  
  // Close existing database
  if (db) {
    db.close()
  }
  
  // Create fresh database
  db = new SQL.Database()
  db.run(schema)
  db.run(learningSchema)
  db.run(japaneseSchema)
  seedTestData(db)
  seedLearningData(db)
  runJapaneseMigrations(db)
  seedJapaneseData(db)
  await persistDatabase()
  console.log('[Database] Reset and reseeded')
}

/**
 * Clear all data from the database (keeps schema, no test data)
 */
export async function clearDatabase(): Promise<void> {
  if (!SQL) {
    throw new Error('SQL.js not initialized')
  }
  
  // Close existing database
  if (db) {
    db.close()
  }
  
  // Create fresh database with just the schema
  db = new SQL.Database()
  db.run(schema)
  db.run(learningSchema)
  db.run(japaneseSchema)
  await persistDatabase()
  console.log('[Database] Cleared all data')
}
