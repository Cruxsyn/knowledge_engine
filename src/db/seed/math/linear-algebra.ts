import type { Database } from 'sql.js'

export function seedLinearAlgebra(db: Database): void {
  const now = new Date().toISOString()
  const pathId = 'path-linear-algebra'

  // --- Concepts ---
  const concepts = [
    { id: 'la-vector', name: 'Vector', definition: 'An ordered list of numbers representing a point or direction in n-dimensional space', intuition: 'An arrow with direction and magnitude — or simply a list of features describing something', mastery: 'unknown' },
    { id: 'la-dot-product', name: 'Dot Product', definition: 'The sum of element-wise products of two vectors: a·b = Σ aᵢbᵢ', intuition: 'Measures how much two vectors point in the same direction', mastery: 'unknown' },
    { id: 'la-linear-independence', name: 'Linear Independence', definition: 'A set of vectors where no vector can be written as a linear combination of the others', intuition: 'Each vector adds a genuinely new direction — no redundancy', mastery: 'unknown' },
    { id: 'la-span', name: 'Span', definition: 'The set of all possible linear combinations of a set of vectors', intuition: 'All the places you can reach by scaling and adding your vectors', mastery: 'unknown' },
    { id: 'la-basis', name: 'Basis', definition: 'A linearly independent set of vectors that spans the entire space', intuition: 'The minimal set of building blocks for a vector space', mastery: 'unknown' },
    { id: 'la-matrix', name: 'Matrix', definition: 'A rectangular array of numbers that represents a linear transformation', intuition: 'A function that takes vectors in and spits vectors out — by multiplying', mastery: 'unknown' },
    { id: 'la-matrix-multiply', name: 'Matrix Multiplication', definition: 'The composition of two linear transformations: (AB)ᵢⱼ = Σₖ AᵢₖBₖⱼ', intuition: 'Applying transformation B first, then A — like composing functions', mastery: 'unknown' },
    { id: 'la-transpose', name: 'Transpose', definition: 'Flipping a matrix over its diagonal: (Aᵀ)ᵢⱼ = Aⱼᵢ', intuition: 'Swapping rows and columns — mirrors the matrix', mastery: 'unknown' },
    { id: 'la-inverse', name: 'Matrix Inverse', definition: 'The matrix A⁻¹ such that AA⁻¹ = I (identity)', intuition: 'The "undo" button for a linear transformation', mastery: 'unknown' },
    { id: 'la-determinant', name: 'Determinant', definition: 'A scalar value that describes how a matrix scales area/volume', intuition: 'If det=0, the transformation squishes space into a lower dimension', mastery: 'unknown' },
    { id: 'la-eigenvalue', name: 'Eigenvalue', definition: 'A scalar λ such that Av = λv for some nonzero vector v', intuition: 'The factor by which a special direction gets stretched', mastery: 'unknown' },
    { id: 'la-eigenvector', name: 'Eigenvector', definition: 'A nonzero vector v such that Av = λv — it only gets scaled, not rotated', intuition: 'A direction that the transformation leaves unchanged (except for stretching)', mastery: 'unknown' },
    { id: 'la-diagonalization', name: 'Diagonalization', definition: 'Writing A = PDP⁻¹ where D is diagonal and P contains eigenvectors', intuition: 'Changing to a coordinate system where the transformation is just scaling', mastery: 'unknown' },
    { id: 'la-svd', name: 'Singular Value Decomposition', definition: 'A = UΣVᵀ where U, V are orthogonal and Σ is diagonal with singular values', intuition: 'Any matrix is a rotation, then a stretch, then another rotation', mastery: 'unknown' },
    { id: 'la-pca', name: 'Principal Component Analysis', definition: 'Finding the directions of maximum variance in data using eigendecomposition of the covariance matrix', intuition: 'Rotating your data so the first axis captures the most information', mastery: 'unknown' },
  ]

  for (const c of concepts) {
    db.run(`INSERT OR IGNORE INTO concepts (id, name, definition, intuition, mastery, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.definition, c.intuition, c.mastery, now, now])
  }

  // --- Concept Links ---
  const links = [
    ['la-dot-product', 'la-vector', 'depends_on'],
    ['la-linear-independence', 'la-vector', 'depends_on'],
    ['la-span', 'la-vector', 'depends_on'],
    ['la-basis', 'la-linear-independence', 'depends_on'],
    ['la-basis', 'la-span', 'depends_on'],
    ['la-matrix-multiply', 'la-matrix', 'depends_on'],
    ['la-transpose', 'la-matrix', 'refines'],
    ['la-inverse', 'la-matrix', 'refines'],
    ['la-determinant', 'la-matrix', 'refines'],
    ['la-eigenvalue', 'la-matrix', 'depends_on'],
    ['la-eigenvector', 'la-eigenvalue', 'depends_on'],
    ['la-diagonalization', 'la-eigenvector', 'depends_on'],
    ['la-svd', 'la-matrix', 'depends_on'],
    ['la-pca', 'la-svd', 'depends_on'],
    ['la-pca', 'la-eigenvalue', 'depends_on'],
  ]

  for (let i = 0; i < links.length; i++) {
    db.run(`INSERT OR IGNORE INTO links (id, source_id, target_id, relationship, created_at) VALUES (?, ?, ?, ?, ?)`,
      [`la-link-${i}`, links[i][0], links[i][1], links[i][2], now])
  }

  // --- Learning Path ---
  db.run(`INSERT OR IGNORE INTO learning_paths (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [pathId, 'Linear Algebra Foundations', 'Vectors, matrices, eigendecomposition, and SVD — the mathematical language of neural networks.', now, now])

  // --- Module 1: Vectors & Spaces ---
  const mod1 = 'mod-la-vectors'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod1, pathId, 'Vectors & Spaces', 'The building blocks of linear algebra', 0, now, now])

  const lessons1 = [
    {
      id: 'lesson-la-what-is-vector', title: 'What is a Vector?', subtitle: 'Arrows, lists, and abstract elements',
      content: `## Vectors: More Than Arrows

A {{term:la-vector:vector}} is one of the most fundamental objects in mathematics and machine learning. At its core, it's simply an ordered list of numbers:

$$\\vec{v} = \\begin{pmatrix} v_1 \\\\ v_2 \\\\ \\vdots \\\\ v_n \\end{pmatrix}$$

In $\\mathbb{R}^2$, vectors are arrows in the plane. In $\\mathbb{R}^n$, they represent points in n-dimensional space.

### Vector Addition and Scaling

Two fundamental operations define a vector space:

$$\\vec{u} + \\vec{v} = \\begin{pmatrix} u_1 + v_1 \\\\ u_2 + v_2 \\end{pmatrix}, \\quad c\\vec{v} = \\begin{pmatrix} cv_1 \\\\ cv_2 \\end{pmatrix}$$

{{graph:x:0:5}}

:::tip
In neural networks, every input is a vector. An image is a vector of pixel values. A sentence is a vector of word embeddings. Understanding vectors is understanding the language of ML.
:::

### The Dot Product

The {{term:la-dot-product:dot product}} measures similarity between vectors:

$$\\vec{a} \\cdot \\vec{b} = \\sum_{i=1}^n a_i b_i = |\\vec{a}||\\vec{b}|\\cos\\theta$$

When the dot product is zero, vectors are **orthogonal** — completely independent directions.`,
      concepts: ['la-vector', 'la-dot-product'], minutes: 8,
    },
    {
      id: 'lesson-la-independence', title: 'Linear Independence & Basis', subtitle: 'What makes a set of vectors useful',
      content: `## Linear Combinations

A {{term:la-span:linear combination}} of vectors $\\vec{v}_1, \\ldots, \\vec{v}_k$ is any expression:

$$c_1\\vec{v}_1 + c_2\\vec{v}_2 + \\cdots + c_k\\vec{v}_k$$

The {{term:la-span:span}} of these vectors is the set of *all* such combinations — every point you can reach.

### Linear Independence

Vectors are {{term:la-linear-independence:linearly independent}} if no vector in the set can be written as a combination of the others. Formally:

$$c_1\\vec{v}_1 + c_2\\vec{v}_2 + \\cdots + c_k\\vec{v}_k = \\vec{0} \\implies c_1 = c_2 = \\cdots = c_k = 0$$

### Basis

A {{term:la-basis:basis}} is a linearly independent spanning set — the minimal set of vectors that reaches everywhere in the space.

:::note
In $\\mathbb{R}^n$, any basis has exactly $n$ vectors. The standard basis in $\\mathbb{R}^3$ is $\\{\\hat{e}_1, \\hat{e}_2, \\hat{e}_3\\}$.
:::

:::tip
In ML, choosing a good basis for your features is essentially what PCA does — finding the directions that matter most.
:::`,
      concepts: ['la-linear-independence', 'la-span', 'la-basis'], minutes: 10,
    },
  ]

  for (let i = 0; i < lessons1.length; i++) {
    const l = lessons1[i]
    db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, mod1, l.title, l.subtitle, l.content, i, 'published', l.minutes, now, now])
    for (const cid of l.concepts) {
      db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l.id, cid])
    }
  }

  // --- Module 2: Matrices ---
  const mod2 = 'mod-la-matrices'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod2, pathId, 'Matrices & Transformations', 'How matrices encode linear transformations', 1, now, now])

  const lessons2 = [
    {
      id: 'lesson-la-matrix-basics', title: 'Matrix Basics', subtitle: 'Notation, multiplication, and transpose',
      content: `## What is a Matrix?

A {{term:la-matrix:matrix}} is a rectangular array of numbers with $m$ rows and $n$ columns:

$$A = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}$$

### Matrix Multiplication

{{term:la-matrix-multiply:Matrix multiplication}} composes transformations. For $C = AB$:

$$C_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}$$

:::warning
Matrix multiplication is **not commutative**: $AB \\neq BA$ in general. Order matters!
:::

The {{term:la-transpose:transpose}} $A^T$ swaps rows and columns: $(A^T)_{ij} = A_{ji}$.

:::tip
In a neural network, each layer computes $\\vec{y} = W\\vec{x} + \\vec{b}$. The weight matrix $W$ is the transformation, and understanding matrix multiplication is understanding the forward pass.
:::`,
      concepts: ['la-matrix', 'la-matrix-multiply', 'la-transpose'], minutes: 10,
    },
    {
      id: 'lesson-la-inverse-det', title: 'Inverse & Determinant', subtitle: 'When can we undo a transformation?',
      content: `## Matrix Inverse

The {{term:la-inverse:inverse}} of a matrix $A$ is the matrix $A^{-1}$ such that:

$$AA^{-1} = A^{-1}A = I$$

where $I$ is the identity matrix. Not every matrix has an inverse.

### The Determinant

The {{term:la-determinant:determinant}} tells us whether an inverse exists and how the matrix scales area:

$$\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc$$

{{graph:x*x - 1:-3:3}}

If $\\det(A) = 0$, the matrix is **singular** — it squishes space into a lower dimension and has no inverse.

:::note
For neural networks, singular weight matrices mean the network has lost information — gradients can vanish through such layers.
:::`,
      concepts: ['la-inverse', 'la-determinant'], minutes: 8,
    },
  ]

  for (let i = 0; i < lessons2.length; i++) {
    const l = lessons2[i]
    db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, mod2, l.title, l.subtitle, l.content, i, 'published', l.minutes, now, now])
    for (const cid of l.concepts) {
      db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l.id, cid])
    }
  }

  // --- Module 3: Eigendecomposition ---
  const mod3 = 'mod-la-eigen'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod3, pathId, 'Eigendecomposition', 'The eigenvectors and eigenvalues that reveal a matrix\'s true nature', 2, now, now])

  const lessons3 = [
    {
      id: 'lesson-la-eigenvalues', title: 'Eigenvalues & Eigenvectors', subtitle: 'The special directions of a transformation',
      content: `## The Eigen-Equation

An {{term:la-eigenvector:eigenvector}} $\\vec{v}$ of matrix $A$ satisfies:

$$A\\vec{v} = \\lambda\\vec{v}$$

where $\\lambda$ is the corresponding {{term:la-eigenvalue:eigenvalue}}. The transformation only *scales* this direction — it doesn't rotate it.

### Finding Eigenvalues

Eigenvalues satisfy the **characteristic equation**:

$$\\det(A - \\lambda I) = 0$$

For a $2 \\times 2$ matrix, this gives a quadratic. For larger matrices, it's a polynomial of degree $n$.

{{graph:x^2 - 5*x + 6:-1:5}}

The graph above shows $\\lambda^2 - 5\\lambda + 6 = 0$, with eigenvalues at $\\lambda = 2$ and $\\lambda = 3$.

:::tip
In PCA, eigenvalues tell you how much variance each principal component captures. Larger eigenvalues = more important directions.
:::`,
      concepts: ['la-eigenvalue', 'la-eigenvector'], minutes: 12,
    },
    {
      id: 'lesson-la-diagonalization', title: 'Diagonalization', subtitle: 'Simplifying matrices with eigenvectors',
      content: `## The Diagonalization Formula

If matrix $A$ has $n$ linearly independent eigenvectors, we can write:

$$A = PDP^{-1}$$

where $P$ is the matrix of eigenvectors and $D$ is diagonal with eigenvalues:

$$D = \\begin{pmatrix} \\lambda_1 & 0 \\\\ 0 & \\lambda_2 \\end{pmatrix}$$

This makes computing powers trivial: $A^k = PD^kP^{-1}$.

### Why {{term:la-diagonalization:Diagonalization}} Matters

In the eigenbasis, every linear transformation is just **scaling along axes**. This insight powers:
- **PCA**: Data covariance is diagonalized to find principal components
- **Stability analysis**: Eigenvalues determine if a system grows or decays
- **PageRank**: Google's algorithm uses the dominant eigenvector of the web graph

:::note
Not all matrices can be diagonalized. A matrix is diagonalizable if and only if it has $n$ linearly independent eigenvectors.
:::`,
      concepts: ['la-diagonalization', 'la-eigenvalue', 'la-eigenvector'], minutes: 10,
    },
  ]

  for (let i = 0; i < lessons3.length; i++) {
    const l = lessons3[i]
    db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, mod3, l.title, l.subtitle, l.content, i, 'published', l.minutes, now, now])
    for (const cid of l.concepts) {
      db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l.id, cid])
    }
  }

  // --- Module 4: SVD & Applications ---
  const mod4 = 'mod-la-svd'
  db.run(`INSERT INTO learning_modules (id, path_id, title, description, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [mod4, pathId, 'SVD & Applications', 'The most important matrix factorization in applied mathematics', 3, now, now])

  const lessons4 = [
    {
      id: 'lesson-la-svd', title: 'Singular Value Decomposition', subtitle: 'Any matrix = rotation × stretch × rotation',
      content: `## The SVD Formula

Every matrix $A$ (even non-square) can be factored as:

$$A = U\\Sigma V^T$$

where:
- $U$ is orthogonal (left singular vectors)
- $\\Sigma$ is diagonal with {{term:la-svd:singular values}} $\\sigma_1 \\geq \\sigma_2 \\geq \\cdots \\geq 0$
- $V$ is orthogonal (right singular vectors)

### Geometric Interpretation

The SVD says: *any linear transformation is a rotation ($V^T$), then a scaling ($\\Sigma$), then another rotation ($U$)*.

:::tip
SVD is the Swiss Army knife of linear algebra. It's used in recommender systems (Netflix), image compression, noise reduction, and as the foundation of PCA.
:::

### Low-Rank Approximation

By keeping only the top $k$ singular values, we get the best rank-$k$ approximation:

$$A \\approx U_k \\Sigma_k V_k^T$$

This is the mathematical basis of dimensionality reduction in ML.`,
      concepts: ['la-svd'], minutes: 12,
    },
    {
      id: 'lesson-la-pca', title: 'PCA: Dimensionality Reduction', subtitle: 'Finding the directions that matter',
      content: `## Principal Component Analysis

{{term:la-pca:PCA}} finds the directions of maximum variance in your data.

Given data matrix $X$ (centered), the covariance matrix is:

$$C = \\frac{1}{n-1}X^TX$$

The eigenvectors of $C$ are the **principal components**, and eigenvalues tell us how much variance each captures.

### PCA via SVD

In practice, PCA is computed using SVD of the centered data:

$$X = U\\Sigma V^T$$

The columns of $V$ are the principal components, and $\\sigma_i^2/(n-1)$ are the variances.

{{graph:exp(-x*x):-3:3}}

:::tip
PCA is often the first step in any ML pipeline. It reduces dimensionality while preserving the most important patterns. If you have 1000 features but the first 50 principal components capture 99% of variance, you can safely work in 50 dimensions.
:::

:::note
PCA assumes linear relationships. For nonlinear data, consider kernel PCA or autoencoders.
:::`,
      concepts: ['la-pca', 'la-svd', 'la-eigenvalue'], minutes: 10,
    },
  ]

  for (let i = 0; i < lessons4.length; i++) {
    const l = lessons4[i]
    db.run(`INSERT INTO lessons (id, module_id, title, subtitle, content, sort_order, status, estimated_minutes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [l.id, mod4, l.title, l.subtitle, l.content, i, 'published', l.minutes, now, now])
    for (const cid of l.concepts) {
      db.run(`INSERT OR IGNORE INTO lesson_concepts (lesson_id, concept_id) VALUES (?, ?)`, [l.id, cid])
    }
  }

  // --- SRS Cards ---
  const cards = [
    { id: 'srs-la-1', lesson: 'lesson-la-what-is-vector', type: 'definition', concept: 'la-vector',
      q: 'What is a **vector** in $\\mathbb{R}^n$?',
      a: '$$\\vec{v} = (v_1, v_2, \\ldots, v_n)$$\nAn ordered n-tuple of real numbers representing a point or direction in n-dimensional space.' },
    { id: 'srs-la-2', lesson: 'lesson-la-what-is-vector', type: 'theorem', concept: 'la-dot-product',
      q: 'State the **dot product** formula and its geometric interpretation.',
      a: '$$\\vec{a} \\cdot \\vec{b} = \\sum_{i=1}^n a_i b_i = |\\vec{a}||\\vec{b}|\\cos\\theta$$\nIt measures the projection of one vector onto another. Zero means orthogonal.' },
    { id: 'srs-la-3', lesson: 'lesson-la-independence', type: 'definition', concept: 'la-linear-independence',
      q: 'When are vectors **linearly independent**?',
      a: 'When the only solution to $c_1\\vec{v}_1 + \\cdots + c_k\\vec{v}_k = \\vec{0}$ is $c_1 = \\cdots = c_k = 0$. No vector is redundant.' },
    { id: 'srs-la-4', lesson: 'lesson-la-independence', type: 'definition', concept: 'la-basis',
      q: 'What is a **basis** of a vector space?',
      a: 'A linearly independent set that spans the entire space. In $\\mathbb{R}^n$, every basis has exactly $n$ vectors.' },
    { id: 'srs-la-5', lesson: 'lesson-la-matrix-basics', type: 'computation', concept: 'la-matrix-multiply',
      q: 'How is entry $C_{ij}$ computed in matrix multiplication $C = AB$?',
      a: '$$C_{ij} = \\sum_{k=1}^n A_{ik}B_{kj}$$\nDot product of row $i$ of $A$ with column $j$ of $B$.' },
    { id: 'srs-la-6', lesson: 'lesson-la-inverse-det', type: 'theorem', concept: 'la-determinant',
      q: 'What does $\\det(A) = 0$ tell us?',
      a: 'The matrix is **singular** — it has no inverse, squishes space into a lower dimension, and has at least one zero eigenvalue.' },
    { id: 'srs-la-7', lesson: 'lesson-la-eigenvalues', type: 'definition', concept: 'la-eigenvalue',
      q: 'State the **eigen-equation**.',
      a: '$$A\\vec{v} = \\lambda\\vec{v}$$\nwhere $\\lambda$ is the eigenvalue and $\\vec{v}$ is the eigenvector. The transformation only scales this direction.' },
    { id: 'srs-la-8', lesson: 'lesson-la-eigenvalues', type: 'theorem', concept: 'la-eigenvalue',
      q: 'How do you find eigenvalues of a matrix $A$?',
      a: 'Solve the **characteristic equation**: $\\det(A - \\lambda I) = 0$. This gives a polynomial of degree $n$.' },
    { id: 'srs-la-9', lesson: 'lesson-la-diagonalization', type: 'theorem', concept: 'la-diagonalization',
      q: 'State the **diagonalization** formula.',
      a: '$$A = PDP^{-1}$$\nwhere $P$ = matrix of eigenvectors, $D$ = diagonal matrix of eigenvalues. Makes $A^k = PD^kP^{-1}$ trivial.' },
    { id: 'srs-la-10', lesson: 'lesson-la-svd', type: 'theorem', concept: 'la-svd',
      q: 'State the **SVD** factorization.',
      a: '$$A = U\\Sigma V^T$$\n$U$ = left singular vectors (orthogonal), $\\Sigma$ = diagonal singular values, $V$ = right singular vectors (orthogonal). Works for any matrix.' },
    { id: 'srs-la-11', lesson: 'lesson-la-pca', type: 'definition', concept: 'la-pca',
      q: 'What does **PCA** find?',
      a: 'The directions of maximum variance in data. Computed from eigenvectors of the covariance matrix $C = \\frac{1}{n-1}X^TX$, or equivalently via SVD of centered data.' },
    { id: 'srs-la-12', lesson: 'lesson-la-pca', type: 'computation', concept: 'la-pca',
      q: 'How is PCA computed using SVD?',
      a: 'Center data $X$, compute $X = U\\Sigma V^T$. Columns of $V$ are principal components. Variance along each: $\\sigma_i^2/(n-1)$.' },
  ]

  for (const card of cards) {
    db.run(`INSERT OR IGNORE INTO math_srs_cards (id, path_id, lesson_id, card_type, question, answer, concept_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [card.id, pathId, card.lesson, card.type, card.q, card.a, card.concept])
  }

  console.log('[Math Seed] Linear Algebra: 4 modules, 8 lessons, 15 concepts, 12 SRS cards')
}
