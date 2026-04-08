use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub mass: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdge {
    pub source: usize,
    pub target: usize,
    pub weight: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutParams {
    pub repulsion: f64,
    pub attraction: f64,
    pub damping: f64,
    pub iterations: usize,
}

impl Default for LayoutParams {
    fn default() -> Self {
        LayoutParams {
            repulsion: 1000.0,
            attraction: 0.01,
            damping: 0.9,
            iterations: 300,
        }
    }
}

// ---------------------------------------------------------------------------
// Quadtree for Barnes-Hut
// ---------------------------------------------------------------------------

/// Axis-aligned bounding box.
#[derive(Debug, Clone, Copy)]
struct BBox {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

impl BBox {
    fn contains(&self, px: f64, py: f64) -> bool {
        px >= self.x
            && px < self.x + self.width
            && py >= self.y
            && py < self.y + self.height
    }

    /// Return the four child quadrants: NW, NE, SW, SE.
    fn subdivide(&self) -> [BBox; 4] {
        let hw = self.width / 2.0;
        let hh = self.height / 2.0;
        [
            BBox { x: self.x, y: self.y, width: hw, height: hh },             // NW
            BBox { x: self.x + hw, y: self.y, width: hw, height: hh },        // NE
            BBox { x: self.x, y: self.y + hh, width: hw, height: hh },        // SW
            BBox { x: self.x + hw, y: self.y + hh, width: hw, height: hh },   // SE
        ]
    }
}

/// A quadtree node used by the Barnes-Hut algorithm.
struct QuadNode {
    /// Centre of mass x.
    cx: f64,
    /// Centre of mass y.
    cy: f64,
    /// Total mass.
    total_mass: f64,
    /// Bounding box.
    bounds: BBox,
    /// Children (NW, NE, SW, SE). `None` means leaf.
    children: Option<Box<[Option<QuadNode>; 4]>>,
    /// If this is a leaf with a single body, its index.
    body: Option<usize>,
}

impl QuadNode {
    fn new(bounds: BBox) -> Self {
        QuadNode {
            cx: 0.0,
            cy: 0.0,
            total_mass: 0.0,
            bounds,
            children: None,
            body: None,
        }
    }

    /// Insert a body into the tree.
    fn insert(&mut self, idx: usize, px: f64, py: f64, mass: f64, nodes: &[GraphNode]) {
        if self.total_mass == 0.0 && self.body.is_none() {
            // Empty leaf — just store the body.
            self.body = Some(idx);
            self.cx = px;
            self.cy = py;
            self.total_mass = mass;
            return;
        }

        // If currently a single-body leaf, split it.
        if self.children.is_none() {
            let quads = self.bounds.subdivide();
            self.children = Some(Box::new([
                Some(QuadNode::new(quads[0])),
                Some(QuadNode::new(quads[1])),
                Some(QuadNode::new(quads[2])),
                Some(QuadNode::new(quads[3])),
            ]));

            // Re-insert the existing body into the appropriate child.
            if let Some(existing) = self.body.take() {
                let ex = nodes[existing].x;
                let ey = nodes[existing].y;
                let em = nodes[existing].mass;
                self.insert_into_child(existing, ex, ey, em, nodes);
            }
        }

        // Insert the new body into the appropriate child.
        self.insert_into_child(idx, px, py, mass, nodes);

        // Update centre of mass.
        let new_total = self.total_mass + mass;
        self.cx = (self.cx * self.total_mass + px * mass) / new_total;
        self.cy = (self.cy * self.total_mass + py * mass) / new_total;
        self.total_mass = new_total;
    }

    fn insert_into_child(
        &mut self,
        idx: usize,
        px: f64,
        py: f64,
        mass: f64,
        nodes: &[GraphNode],
    ) {
        if let Some(ref mut children) = self.children {
            for child_opt in children.iter_mut() {
                if let Some(ref mut child) = child_opt {
                    if child.bounds.contains(px, py) {
                        child.insert(idx, px, py, mass, nodes);
                        return;
                    }
                }
            }
            // Fallback: if the point sits exactly on a boundary, insert into the first child.
            if let Some(ref mut child) = children[0] {
                child.insert(idx, px, py, mass, nodes);
            }
        }
    }

    /// Compute the repulsive force on node `idx` using Barnes-Hut approximation.
    /// `theta` is the opening angle threshold (typically 0.5–1.0).
    fn compute_force(
        &self,
        idx: usize,
        px: f64,
        py: f64,
        repulsion: f64,
        theta: f64,
    ) -> (f64, f64) {
        if self.total_mass == 0.0 {
            return (0.0, 0.0);
        }

        let dx = self.cx - px;
        let dy = self.cy - py;
        let dist_sq = dx * dx + dy * dy;

        // Avoid self-interaction for single-body leaves.
        if let Some(body_idx) = self.body {
            if body_idx == idx {
                return (0.0, 0.0);
            }
        }

        let s = self.bounds.width.max(self.bounds.height);

        // If the node is far enough away or is a leaf, treat as single body.
        let is_leaf = self.children.is_none();
        if is_leaf || (s * s / dist_sq) < (theta * theta) {
            // Coulomb-like repulsion: F = repulsion * m1 * m2 / dist^2
            let dist = dist_sq.sqrt().max(1.0);
            let force = repulsion * self.total_mass / (dist * dist);
            let fx = -dx / dist * force;
            let fy = -dy / dist * force;
            return (fx, fy);
        }

        // Otherwise, recurse into children.
        let mut fx = 0.0;
        let mut fy = 0.0;
        if let Some(ref children) = self.children {
            for child_opt in children.iter() {
                if let Some(ref child) = child_opt {
                    let (cfx, cfy) = child.compute_force(idx, px, py, repulsion, theta);
                    fx += cfx;
                    fy += cfy;
                }
            }
        }

        (fx, fy)
    }
}

// ---------------------------------------------------------------------------
// Force-directed layout
// ---------------------------------------------------------------------------

/// Compute a force-directed layout using the Barnes-Hut algorithm.
///
/// Mutates node positions in-place over `params.iterations` steps.
pub fn compute_layout(nodes: &mut [GraphNode], edges: &[GraphEdge], params: &LayoutParams) {
    let n = nodes.len();
    if n == 0 {
        return;
    }

    let theta = 0.8; // Barnes-Hut opening angle
    let mut vx = vec![0.0f64; n];
    let mut vy = vec![0.0f64; n];

    for _iter in 0..params.iterations {
        // ---- Determine bounding box ----
        let mut min_x = f64::MAX;
        let mut min_y = f64::MAX;
        let mut max_x = f64::MIN;
        let mut max_y = f64::MIN;
        for node in nodes.iter() {
            min_x = min_x.min(node.x);
            min_y = min_y.min(node.y);
            max_x = max_x.max(node.x);
            max_y = max_y.max(node.y);
        }
        // Add a small margin so all points sit strictly inside.
        let margin = 1.0;
        let bbox = BBox {
            x: min_x - margin,
            y: min_y - margin,
            width: (max_x - min_x) + 2.0 * margin,
            height: (max_y - min_y) + 2.0 * margin,
        };

        // ---- Build quadtree ----
        let mut root = QuadNode::new(bbox);
        for (i, node) in nodes.iter().enumerate() {
            root.insert(i, node.x, node.y, node.mass, nodes);
        }

        // ---- Repulsive forces (Barnes-Hut) ----
        let mut fx = vec![0.0f64; n];
        let mut fy = vec![0.0f64; n];

        for i in 0..n {
            let (rfx, rfy) =
                root.compute_force(i, nodes[i].x, nodes[i].y, params.repulsion, theta);
            fx[i] += rfx;
            fy[i] += rfy;
        }

        // ---- Attractive forces (Hooke's law along edges) ----
        for edge in edges {
            let s = edge.source;
            let t = edge.target;
            if s >= n || t >= n {
                continue;
            }

            let dx = nodes[t].x - nodes[s].x;
            let dy = nodes[t].y - nodes[s].y;
            let dist = (dx * dx + dy * dy).sqrt().max(0.01);

            let force = params.attraction * edge.weight * dist;
            let afx = dx / dist * force;
            let afy = dy / dist * force;

            fx[s] += afx;
            fy[s] += afy;
            fx[t] -= afx;
            fy[t] -= afy;
        }

        // ---- Update velocities and positions ----
        for i in 0..n {
            vx[i] = (vx[i] + fx[i]) * params.damping;
            vy[i] = (vy[i] + fy[i]) * params.damping;

            // Clamp velocity to prevent explosions
            let speed = (vx[i] * vx[i] + vy[i] * vy[i]).sqrt();
            let max_speed = 50.0;
            if speed > max_speed {
                vx[i] = vx[i] / speed * max_speed;
                vy[i] = vy[i] / speed * max_speed;
            }

            nodes[i].x += vx[i];
            nodes[i].y += vy[i];
        }
    }
}

// ---------------------------------------------------------------------------
// Community detection — label propagation
// ---------------------------------------------------------------------------

/// Simple community detection using the label propagation algorithm.
///
/// Returns a vector of clusters where each inner vector contains node indices
/// that belong to the same community.
pub fn cluster_detection(nodes: &[GraphNode], edges: &[GraphEdge]) -> Vec<Vec<usize>> {
    let n = nodes.len();
    if n == 0 {
        return Vec::new();
    }

    // Build adjacency list with weights.
    let mut adj: Vec<Vec<(usize, f64)>> = vec![Vec::new(); n];
    for edge in edges {
        if edge.source < n && edge.target < n {
            adj[edge.source].push((edge.target, edge.weight));
            adj[edge.target].push((edge.source, edge.weight));
        }
    }

    // Each node starts with its own label.
    let mut labels: Vec<usize> = (0..n).collect();

    let max_iterations = 50;
    for _iter in 0..max_iterations {
        let mut changed = false;

        for i in 0..n {
            if adj[i].is_empty() {
                continue;
            }

            // Count weighted votes for each neighbouring label.
            let mut votes: std::collections::HashMap<usize, f64> =
                std::collections::HashMap::new();
            for &(neighbour, weight) in &adj[i] {
                *votes.entry(labels[neighbour]).or_insert(0.0) += weight;
            }

            // Pick the label with the highest weight.
            let best_label = votes
                .into_iter()
                .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
                .map(|(label, _)| label)
                .unwrap_or(labels[i]);

            if best_label != labels[i] {
                labels[i] = best_label;
                changed = true;
            }
        }

        if !changed {
            break;
        }
    }

    // Group node indices by label.
    let mut clusters: std::collections::HashMap<usize, Vec<usize>> =
        std::collections::HashMap::new();
    for (i, &label) in labels.iter().enumerate() {
        clusters.entry(label).or_default().push(i);
    }

    clusters.into_values().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_layout() {
        let mut nodes = vec![
            GraphNode { id: "a".into(), x: 0.0, y: 0.0, mass: 1.0 },
            GraphNode { id: "b".into(), x: 1.0, y: 0.0, mass: 1.0 },
            GraphNode { id: "c".into(), x: 0.0, y: 1.0, mass: 1.0 },
        ];
        let edges = vec![
            GraphEdge { source: 0, target: 1, weight: 1.0 },
            GraphEdge { source: 1, target: 2, weight: 1.0 },
        ];
        let params = LayoutParams {
            repulsion: 100.0,
            attraction: 0.05,
            damping: 0.8,
            iterations: 50,
        };

        compute_layout(&mut nodes, &edges, &params);

        // After layout, nodes should have moved away from their initial positions.
        assert!(nodes[0].x != 0.0 || nodes[0].y != 0.0);
    }

    #[test]
    fn test_cluster_detection() {
        let nodes: Vec<GraphNode> = (0..6)
            .map(|i| GraphNode {
                id: format!("n{}", i),
                x: 0.0,
                y: 0.0,
                mass: 1.0,
            })
            .collect();

        // Two cliques: {0,1,2} and {3,4,5}
        let edges = vec![
            GraphEdge { source: 0, target: 1, weight: 1.0 },
            GraphEdge { source: 1, target: 2, weight: 1.0 },
            GraphEdge { source: 0, target: 2, weight: 1.0 },
            GraphEdge { source: 3, target: 4, weight: 1.0 },
            GraphEdge { source: 4, target: 5, weight: 1.0 },
            GraphEdge { source: 3, target: 5, weight: 1.0 },
        ];

        let clusters = cluster_detection(&nodes, &edges);
        assert_eq!(clusters.len(), 2);
    }
}
