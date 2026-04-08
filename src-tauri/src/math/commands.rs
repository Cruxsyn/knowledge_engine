use crate::math::evaluator::{self, EvalResult, MathScope};
use crate::math::symbolic::{
    parse_symbolic, simplify, to_latex, derive_steps,
    DerivationStep, Expr,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

/// Managed state holding named math scopes.
pub struct MathState {
    pub scopes: Mutex<HashMap<String, MathScope>>,
}

impl MathState {
    pub fn new() -> Self {
        MathState {
            scopes: Mutex::new(HashMap::new()),
        }
    }
}

impl Default for MathState {
    fn default() -> Self {
        Self::new()
    }
}

/// JSON-friendly evaluation result returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum EvalResultJson {
    #[serde(rename = "scalar")]
    Scalar { value: f64 },
    #[serde(rename = "matrix")]
    Matrix { value: Vec<Vec<f64>> },
    #[serde(rename = "vector")]
    Vector { value: Vec<f64> },
    #[serde(rename = "assignment")]
    Assignment {
        name: String,
        result: Box<EvalResultJson>,
    },
    #[serde(rename = "error")]
    Error { message: String },
}

impl From<EvalResult> for EvalResultJson {
    fn from(r: EvalResult) -> Self {
        match r {
            EvalResult::Scalar(v) => EvalResultJson::Scalar { value: v },
            EvalResult::Matrix(m) => EvalResultJson::Matrix { value: m },
            EvalResult::Vector(v) => EvalResultJson::Vector { value: v },
            EvalResult::Assignment(name, inner) => EvalResultJson::Assignment {
                name,
                result: Box::new((*inner).into()),
            },
            EvalResult::Error(msg) => EvalResultJson::Error { message: msg },
        }
    }
}

/// Evaluate a math expression, optionally within a named scope.
/// If no scope_id is provided, uses the "default" scope.
#[tauri::command]
pub fn math_eval(
    state: State<MathState>,
    expr: String,
    scope_id: Option<String>,
) -> EvalResultJson {
    let scope_key = scope_id.unwrap_or_else(|| "default".into());
    let mut scopes = state.scopes.lock().expect("Failed to lock math scopes");
    let scope = scopes.entry(scope_key).or_insert_with(MathScope::new);
    let result = evaluator::eval(&expr, scope);
    result.into()
}

/// Return step-by-step symbolic differentiation.
#[tauri::command]
pub fn math_derive_steps(expr: String, var: String) -> Result<Vec<DerivationStep>, String> {
    let parsed = parse_symbolic(&expr)?;
    Ok(derive_steps(&parsed, &var))
}

/// Simplify a symbolic expression and return LaTeX.
#[tauri::command]
pub fn math_simplify(expr: String) -> Result<String, String> {
    let parsed = parse_symbolic(&expr)?;
    let simplified = simplify(&parsed);
    Ok(to_latex(&simplified))
}

/// Solve simple equations (linear and quadratic) for the given variable.
/// Accepts forms like "2*x + 3 = 7" or "x^2 - 4" (interpreted as "expr = 0").
#[tauri::command]
pub fn math_solve(equation: String, var: String) -> Result<Vec<String>, String> {
    // Split on '=' to get lhs and rhs; if no '=', treat as "expr = 0"
    let (lhs_str, rhs_str) = if let Some(eq_pos) = equation.find('=') {
        let l = equation[..eq_pos].trim().to_string();
        let r = equation[eq_pos + 1..].trim().to_string();
        (l, r)
    } else {
        (equation.trim().to_string(), "0".to_string())
    };

    // Parse both sides
    let lhs = parse_symbolic(&lhs_str)?;
    let rhs = parse_symbolic(&rhs_str)?;

    // Build combined = lhs - rhs  (solve combined = 0)
    let combined = simplify(&Expr::Add(
        Box::new(lhs),
        Box::new(Expr::Neg(Box::new(rhs))),
    ));

    // Extract polynomial coefficients by numerical evaluation
    let coeffs = extract_polynomial_coefficients(&combined, &var, 3)
        .ok_or_else(|| {
            "Cannot solve: only linear and quadratic equations are supported".to_string()
        })?;

    if coeffs.len() >= 3 && coeffs[2].abs() > 1e-15 {
        // Quadratic: a*x^2 + b*x + c = 0
        let a = coeffs[2];
        let b = coeffs[1];
        let c = coeffs[0];
        let discriminant = b * b - 4.0 * a * c;
        if discriminant < -1e-15 {
            Ok(vec![format!(
                "No real solutions (discriminant = {:.4})",
                discriminant
            )])
        } else if discriminant.abs() < 1e-15 {
            let x = -b / (2.0 * a);
            Ok(vec![format!("{var} = {x}")])
        } else {
            let sqrt_d = discriminant.sqrt();
            let x1 = (-b + sqrt_d) / (2.0 * a);
            let x2 = (-b - sqrt_d) / (2.0 * a);
            Ok(vec![format!("{var} = {x1}"), format!("{var} = {x2}")])
        }
    } else if coeffs.len() >= 2 && coeffs[1].abs() > 1e-15 {
        // Linear: b*x + c = 0
        let x = -coeffs[0] / coeffs[1];
        Ok(vec![format!("{var} = {x}")])
    } else if !coeffs.is_empty() && coeffs[0].abs() < 1e-15 {
        Ok(vec!["Identity (true for all values)".into()])
    } else {
        Err("No solution found".into())
    }
}

/// Extract polynomial coefficients [c0, c1, c2, ...] by evaluating at
/// several points and solving the resulting Vandermonde system.
fn extract_polynomial_coefficients(
    expr: &Expr,
    var: &str,
    max_degree: usize,
) -> Option<Vec<f64>> {
    let n = max_degree + 1;
    let points: Vec<f64> = (0..n).map(|i| i as f64).collect();
    let values: Vec<f64> = points.iter().map(|&x| eval_expr_at(expr, var, x)).collect();

    // Build and solve Vandermonde system via Gaussian elimination
    let mut aug: Vec<Vec<f64>> = Vec::with_capacity(n);
    for (i, &x) in points.iter().enumerate() {
        let mut row = Vec::with_capacity(n + 1);
        let mut power = 1.0;
        for _ in 0..n {
            row.push(power);
            power *= x;
        }
        row.push(values[i]);
        aug.push(row);
    }

    for col in 0..n {
        let mut max_row = col;
        for row in col + 1..n {
            if aug[row][col].abs() > aug[max_row][col].abs() {
                max_row = row;
            }
        }
        aug.swap(col, max_row);
        if aug[col][col].abs() < 1e-15 {
            return None;
        }
        let pivot = aug[col][col];
        for j in col..=n {
            aug[col][j] /= pivot;
        }
        for row in 0..n {
            if row != col {
                let factor = aug[row][col];
                for j in col..=n {
                    aug[row][j] -= factor * aug[col][j];
                }
            }
        }
    }

    let coeffs: Vec<f64> = (0..n).map(|i| aug[i][n]).collect();

    // Verify at extra points to confirm polynomial of this degree
    for &test_x in &[0.5, 1.5, -1.0] {
        let expected = eval_expr_at(expr, var, test_x);
        let mut computed = 0.0;
        let mut power = 1.0;
        for c in &coeffs {
            computed += c * power;
            power *= test_x;
        }
        if (expected - computed).abs() > 1e-6 {
            return None;
        }
    }

    Some(coeffs)
}

/// Numerically evaluate a symbolic expression at var=value.
fn eval_expr_at(expr: &Expr, var: &str, value: f64) -> f64 {
    match expr {
        Expr::Num(v) => *v,
        Expr::Var(name) => {
            if name == var { value } else { 0.0 }
        }
        Expr::Add(a, b) => eval_expr_at(a, var, value) + eval_expr_at(b, var, value),
        Expr::Mul(a, b) => eval_expr_at(a, var, value) * eval_expr_at(b, var, value),
        Expr::Div(a, b) => {
            let denom = eval_expr_at(b, var, value);
            if denom.abs() < 1e-15 { f64::NAN } else { eval_expr_at(a, var, value) / denom }
        }
        Expr::Pow(base, exp) => {
            eval_expr_at(base, var, value).powf(eval_expr_at(exp, var, value))
        }
        Expr::Neg(inner) => -eval_expr_at(inner, var, value),
        Expr::Func(name, inner) => {
            let x = eval_expr_at(inner, var, value);
            match name.as_str() {
                "sin" => x.sin(),
                "cos" => x.cos(),
                "tan" => x.tan(),
                "exp" => x.exp(),
                "ln" | "log" => x.ln(),
                "sqrt" => x.sqrt(),
                "abs" => x.abs(),
                _ => f64::NAN,
            }
        }
    }
}
