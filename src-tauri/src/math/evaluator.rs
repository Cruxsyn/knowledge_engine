use evalexpr::{eval_with_context_mut, HashMapContext, ContextWithMutableFunctions, ContextWithMutableVariables, Value as EvalValue};
use nalgebra::DMatrix;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Result of evaluating a math expression.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
pub enum EvalResult {
    Scalar(f64),
    Matrix(Vec<Vec<f64>>),
    Vector(Vec<f64>),
    Assignment(String, Box<EvalResult>),
    Error(String),
}

/// A persistent evaluation scope, analogous to a Jupyter kernel's namespace.
#[derive(Debug, Clone)]
pub struct MathScope {
    pub variables: HashMap<String, f64>,
    pub matrices: HashMap<String, Vec<Vec<f64>>>,
}

impl MathScope {
    pub fn new() -> Self {
        MathScope {
            variables: HashMap::new(),
            matrices: HashMap::new(),
        }
    }

    /// Build an evalexpr context populated with the scope's variables and
    /// common math functions.
    fn build_context(&self) -> HashMapContext {
        let mut ctx = HashMapContext::new();

        // Inject stored variables
        for (name, val) in &self.variables {
            let _ = ctx.set_value(name.clone(), EvalValue::Float(*val));
        }

        // Register common math functions
        let _ = ctx.set_function(
            "sin".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.sin()))
            }),
        );
        let _ = ctx.set_function(
            "cos".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.cos()))
            }),
        );
        let _ = ctx.set_function(
            "tan".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.tan()))
            }),
        );
        let _ = ctx.set_function(
            "exp".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.exp()))
            }),
        );
        let _ = ctx.set_function(
            "log".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.ln()))
            }),
        );
        let _ = ctx.set_function(
            "ln".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.ln()))
            }),
        );
        let _ = ctx.set_function(
            "sqrt".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.sqrt()))
            }),
        );
        let _ = ctx.set_function(
            "abs".into(),
            evalexpr::Function::new(|arg| {
                let v = arg.as_float().or_else(|_| arg.as_int().map(|i| i as f64))?;
                Ok(EvalValue::Float(v.abs()))
            }),
        );

        // Mathematical constants
        let _ = ctx.set_value("pi".into(), EvalValue::Float(std::f64::consts::PI));
        let _ = ctx.set_value("e".into(), EvalValue::Float(std::f64::consts::E));

        ctx
    }
}

impl Default for MathScope {
    fn default() -> Self {
        Self::new()
    }
}

/// Try to parse a matrix literal of the form `[[1,2],[3,4]]`.
fn try_parse_matrix(input: &str) -> Option<Vec<Vec<f64>>> {
    let trimmed = input.trim();
    if !trimmed.starts_with("[[") || !trimmed.ends_with("]]") {
        return None;
    }

    // Remove the outer brackets
    let inner = &trimmed[1..trimmed.len() - 1];

    let mut rows: Vec<Vec<f64>> = Vec::new();
    let mut depth = 0i32;
    let mut current_start = 0usize;

    for (i, ch) in inner.char_indices() {
        match ch {
            '[' => depth += 1,
            ']' => {
                depth -= 1;
                if depth == 0 {
                    let row_str = &inner[current_start..=i];
                    let row_inner = row_str
                        .trim()
                        .trim_start_matches('[')
                        .trim_end_matches(']');
                    let row: Vec<f64> = row_inner
                        .split(',')
                        .map(|s| s.trim().parse::<f64>())
                        .collect::<Result<Vec<_>, _>>()
                        .ok()?;
                    rows.push(row);
                }
            }
            ',' if depth == 0 => {
                current_start = i + 1;
            }
            _ => {}
        }
    }

    // Verify all rows have the same length
    if rows.is_empty() {
        return None;
    }
    let ncols = rows[0].len();
    if rows.iter().any(|r| r.len() != ncols) {
        return None;
    }

    Some(rows)
}

/// Check if the expression is a matrix operation and handle it.
fn try_matrix_op(expr: &str, scope: &MathScope) -> Option<EvalResult> {
    let trimmed = expr.trim();

    // transpose(A)
    if trimmed.starts_with("transpose(") && trimmed.ends_with(')') {
        let name = trimmed[10..trimmed.len() - 1].trim();
        let mat = scope.matrices.get(name)?;
        let dm = vec_to_dmatrix(mat);
        let result = dm.transpose();
        return Some(EvalResult::Matrix(dmatrix_to_vec(&result)));
    }

    // det(A)
    if trimmed.starts_with("det(") && trimmed.ends_with(')') {
        let name = trimmed[4..trimmed.len() - 1].trim();
        let mat = scope.matrices.get(name)?;
        let dm = vec_to_dmatrix(mat);
        if dm.nrows() != dm.ncols() {
            return Some(EvalResult::Error("Determinant requires a square matrix".into()));
        }
        let det = dm.determinant();
        return Some(EvalResult::Scalar(det));
    }

    // inverse(A)
    if trimmed.starts_with("inverse(") && trimmed.ends_with(')') {
        let name = trimmed[8..trimmed.len() - 1].trim();
        let mat = scope.matrices.get(name)?;
        let dm = vec_to_dmatrix(mat);
        return match dm.clone().try_inverse() {
            Some(inv) => Some(EvalResult::Matrix(dmatrix_to_vec(&inv))),
            None => Some(EvalResult::Error("Matrix is not invertible".into())),
        };
    }

    // eigenvalues(A)
    if trimmed.starts_with("eigenvalues(") && trimmed.ends_with(')') {
        let name = trimmed[12..trimmed.len() - 1].trim();
        let mat = scope.matrices.get(name)?;
        let dm = vec_to_dmatrix(mat);
        if dm.nrows() != dm.ncols() {
            return Some(EvalResult::Error(
                "Eigenvalues require a square matrix".into(),
            ));
        }
        let eigen = dm.symmetric_eigen();
        let eigenvalues: Vec<f64> = eigen.eigenvalues.iter().copied().collect();
        return Some(EvalResult::Vector(eigenvalues));
    }

    // A * B (matrix multiplication)
    if let Some(pos) = trimmed.find('*') {
        let lhs_name = trimmed[..pos].trim();
        let rhs_name = trimmed[pos + 1..].trim();
        if let (Some(lhs), Some(rhs)) = (scope.matrices.get(lhs_name), scope.matrices.get(rhs_name))
        {
            let lm = vec_to_dmatrix(lhs);
            let rm = vec_to_dmatrix(rhs);
            if lm.ncols() != rm.nrows() {
                return Some(EvalResult::Error(format!(
                    "Incompatible matrix dimensions: {}x{} * {}x{}",
                    lm.nrows(),
                    lm.ncols(),
                    rm.nrows(),
                    rm.ncols()
                )));
            }
            let product = lm * rm;
            return Some(EvalResult::Matrix(dmatrix_to_vec(&product)));
        }
    }

    None
}

fn vec_to_dmatrix(data: &[Vec<f64>]) -> DMatrix<f64> {
    let nrows = data.len();
    let ncols = if nrows > 0 { data[0].len() } else { 0 };
    DMatrix::from_fn(nrows, ncols, |r, c| data[r][c])
}

fn dmatrix_to_vec(m: &DMatrix<f64>) -> Vec<Vec<f64>> {
    (0..m.nrows())
        .map(|r| (0..m.ncols()).map(|c| m[(r, c)]).collect())
        .collect()
}

/// Evaluate a math expression within the given scope.
pub fn eval(expr: &str, scope: &mut MathScope) -> EvalResult {
    let trimmed = expr.trim();

    if trimmed.is_empty() {
        return EvalResult::Error("Empty expression".into());
    }

    // Check for assignment: `name = value`
    if let Some(eq_pos) = trimmed.find('=') {
        // Make sure it's not == or !=
        let before_eq = if eq_pos > 0 {
            trimmed.as_bytes()[eq_pos - 1]
        } else {
            0
        };
        let after_eq = if eq_pos + 1 < trimmed.len() {
            trimmed.as_bytes()[eq_pos + 1]
        } else {
            0
        };

        if before_eq != b'!' && before_eq != b'<' && before_eq != b'>'
            && after_eq != b'='
        {
            let var_name = trimmed[..eq_pos].trim().to_string();
            let value_str = trimmed[eq_pos + 1..].trim();

            // Check if the variable name is a valid identifier
            if is_valid_identifier(&var_name) {
                // Try matrix literal
                if let Some(mat) = try_parse_matrix(value_str) {
                    scope.matrices.insert(var_name.clone(), mat.clone());
                    return EvalResult::Assignment(
                        var_name,
                        Box::new(EvalResult::Matrix(mat)),
                    );
                }

                // Try scalar evaluation
                let inner_result = eval_scalar(value_str, scope);
                match &inner_result {
                    EvalResult::Scalar(v) => {
                        scope.variables.insert(var_name.clone(), *v);
                    }
                    EvalResult::Error(_) => return inner_result,
                    _ => {}
                }
                return EvalResult::Assignment(var_name, Box::new(inner_result));
            }
        }
    }

    // Try matrix literal
    if let Some(mat) = try_parse_matrix(trimmed) {
        return EvalResult::Matrix(mat);
    }

    // Try matrix operations
    if let Some(result) = try_matrix_op(trimmed, scope) {
        return result;
    }

    // Fall through to scalar evaluation
    eval_scalar(trimmed, scope)
}

fn eval_scalar(expr: &str, scope: &MathScope) -> EvalResult {
    let mut ctx = scope.build_context();

    match eval_with_context_mut(expr, &mut ctx) {
        Ok(EvalValue::Float(f)) => EvalResult::Scalar(f),
        Ok(EvalValue::Int(i)) => EvalResult::Scalar(i as f64),
        Ok(EvalValue::Boolean(b)) => EvalResult::Scalar(if b { 1.0 } else { 0.0 }),
        Ok(other) => EvalResult::Error(format!("Unexpected result type: {other}")),
        Err(e) => EvalResult::Error(e.to_string()),
    }
}

fn is_valid_identifier(s: &str) -> bool {
    if s.is_empty() {
        return false;
    }
    let mut chars = s.chars();
    match chars.next() {
        Some(c) if c.is_ascii_alphabetic() || c == '_' => {}
        _ => return false,
    }
    chars.all(|c| c.is_ascii_alphanumeric() || c == '_')
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_eval() {
        let mut scope = MathScope::new();
        match eval("2 + 3", &mut scope) {
            EvalResult::Scalar(v) => assert!((v - 5.0).abs() < 1e-10),
            other => panic!("Expected Scalar, got {:?}", other),
        }
    }

    #[test]
    fn test_variable_assignment() {
        let mut scope = MathScope::new();
        match eval("x = 5", &mut scope) {
            EvalResult::Assignment(name, _) => assert_eq!(name, "x"),
            other => panic!("Expected Assignment, got {:?}", other),
        }
        assert!((scope.variables["x"] - 5.0).abs() < 1e-10);

        match eval("x + 3", &mut scope) {
            EvalResult::Scalar(v) => assert!((v - 8.0).abs() < 1e-10),
            other => panic!("Expected Scalar, got {:?}", other),
        }
    }

    #[test]
    fn test_matrix_literal() {
        let mut scope = MathScope::new();
        match eval("[[1,2],[3,4]]", &mut scope) {
            EvalResult::Matrix(m) => {
                assert_eq!(m.len(), 2);
                assert_eq!(m[0], vec![1.0, 2.0]);
                assert_eq!(m[1], vec![3.0, 4.0]);
            }
            other => panic!("Expected Matrix, got {:?}", other),
        }
    }

    #[test]
    fn test_math_functions() {
        let mut scope = MathScope::new();
        match eval("sin(0)", &mut scope) {
            EvalResult::Scalar(v) => assert!(v.abs() < 1e-10),
            other => panic!("Expected Scalar, got {:?}", other),
        }
        match eval("sqrt(4)", &mut scope) {
            EvalResult::Scalar(v) => assert!((v - 2.0).abs() < 1e-10),
            other => panic!("Expected Scalar, got {:?}", other),
        }
    }

    #[test]
    fn test_matrix_determinant() {
        let mut scope = MathScope::new();
        eval("A = [[1,2],[3,4]]", &mut scope);
        match eval("det(A)", &mut scope) {
            EvalResult::Scalar(v) => assert!((v - (-2.0)).abs() < 1e-10),
            other => panic!("Expected Scalar, got {:?}", other),
        }
    }
}
