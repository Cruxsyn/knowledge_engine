use crate::graph::layout::{
    cluster_detection, compute_layout, GraphEdge, GraphNode, LayoutParams,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNodeInput {
    pub id: String,
    pub x: Option<f64>,
    pub y: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphEdgeInput {
    pub source: usize,
    pub target: usize,
    pub weight: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNodeOutput {
    pub id: String,
    pub x: f64,
    pub y: f64,
}

/// Compute a force-directed graph layout.
///
/// Accepts node and edge inputs, runs the Barnes-Hut force simulation,
/// and returns positioned nodes.
#[tauri::command]
pub fn graph_layout(
    nodes: Vec<GraphNodeInput>,
    edges: Vec<GraphEdgeInput>,
    params: Option<LayoutParams>,
) -> Result<Vec<GraphNodeOutput>, String> {
    let params = params.unwrap_or_default();

    // Convert inputs to internal graph nodes with initial positions.
    // Nodes without explicit positions are spread in a circle to avoid overlap.
    let n = nodes.len();
    let mut graph_nodes: Vec<GraphNode> = nodes
        .iter()
        .enumerate()
        .map(|(i, input)| {
            let angle = 2.0 * std::f64::consts::PI * (i as f64) / (n.max(1) as f64);
            let radius = 100.0;
            GraphNode {
                id: input.id.clone(),
                x: input.x.unwrap_or(angle.cos() * radius),
                y: input.y.unwrap_or(angle.sin() * radius),
                mass: 1.0,
            }
        })
        .collect();

    let graph_edges: Vec<GraphEdge> = edges
        .iter()
        .map(|e| GraphEdge {
            source: e.source,
            target: e.target,
            weight: e.weight.unwrap_or(1.0),
        })
        .collect();

    compute_layout(&mut graph_nodes, &graph_edges, &params);

    let output: Vec<GraphNodeOutput> = graph_nodes
        .into_iter()
        .map(|node| GraphNodeOutput {
            id: node.id,
            x: node.x,
            y: node.y,
        })
        .collect();

    Ok(output)
}

/// Detect communities/clusters in the graph using label propagation.
///
/// Returns a list of clusters, where each cluster is a list of node IDs.
#[tauri::command]
pub fn graph_cluster(
    nodes: Vec<GraphNodeInput>,
    edges: Vec<GraphEdgeInput>,
) -> Result<Vec<Vec<String>>, String> {
    let n = nodes.len();

    let graph_nodes: Vec<GraphNode> = nodes
        .iter()
        .enumerate()
        .map(|(i, input)| GraphNode {
            id: input.id.clone(),
            x: input.x.unwrap_or(i as f64),
            y: input.y.unwrap_or(0.0),
            mass: 1.0,
        })
        .collect();

    let graph_edges: Vec<GraphEdge> = edges
        .iter()
        .map(|e| GraphEdge {
            source: e.source,
            target: e.target,
            weight: e.weight.unwrap_or(1.0),
        })
        .collect();

    let clusters = cluster_detection(&graph_nodes, &graph_edges);

    // Map cluster indices back to node IDs.
    let result: Vec<Vec<String>> = clusters
        .into_iter()
        .map(|cluster| {
            cluster
                .into_iter()
                .filter_map(|idx| {
                    if idx < n {
                        Some(nodes[idx].id.clone())
                    } else {
                        None
                    }
                })
                .collect()
        })
        .collect();

    Ok(result)
}
