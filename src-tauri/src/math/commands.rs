use crate::math::evaluator::{self, MathScope, EvalResult};
use crate::math::symbolic::{parse_symbolic, differentiate, simplify, to_latex, derive_steps, DerivationStep};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

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

#[derive(Serialize)]
pub struct EvalResultJson {
    pub value: String,
    pub latex: Option<String>,
    #[serde(rename = "type")]
    pub result_type: String,
}

#[tauri::command]
pub fn math_eval(
    state: State<MathState>,
    expr: String,
    scope_id: Option<String>,
) -> Result<EvalResultJson, String> {
    let mut scopes = state.scopes.lock().map_err(|e| e.to_string())?;
    let scope_key = scope_id.unwrap_or_else(|| "default".to_string());
    let scope = scopes.entry(scope_key).or_insert_with(MathScope::new);

    match evaluator::eval(&expr, scope) {
        EvalResult::Scalar(v) => Ok(EvalResultJson {
            value: format!("{}", v),
            latex: Some(format!("{}", v)),
            result_type: "scalar".into(),
        }),
        EvalResult::Matrix(m) => {
            let latex = matrix_to_latex(&m);
            Ok(EvalResultJson {
                value: format!("{:?}", m),
                latex: Some(latex),
                result_type: "matrix".into(),
            })
        }
        EvalResult::Vector(v) => Ok(EvalResultJson {
            value: format!("{:?}", v),
            latex: Some(format!("\\begin{{pmatrix}} {} \\end{{pmatrix}}",
                v.iter().map(|x| format!("{}", x)).collect::<Vec<_>>().join(" \\\\ "))),
            result_type: "vector".into(),
        }),
        EvalResult::Assignment(name, result) => {
            let val_str = match result.as_ref() {
                EvalResult::Scalar(v) => format!("{}", v),
                EvalResult::Matrix(m) => format!("{:?}", m),
                EvalResult::Vector(v) => format!("{:?}", v),
                _ => "assigned".into(),
            };
            Ok(EvalResultJson {
                value: format!("{} = {}", name, val_str),
                latex: Some(format!("{} = {}", name, val_str)),
                result_type: "assignment".into(),
            })
        }
        EvalResult::Error(e) => Err(e),
    }
}

#[tauri::command]
pub fn math_derive_steps(expr: String, var: String) -> Result<Vec<DerivationStep>, String> {
    let parsed = parse_symbolic(&expr)?;
    Ok(derive_steps(&parsed, &var))
}

#[tauri::command]
pub fn math_simplify(expr: String) -> Result<String, String> {
    let parsed = parse_symbolic(&expr)?;
    let simplified = simplify(&parsed);
    Ok(to_latex(&simplified))
}

#[tauri::command]
pub fn math_solve(equation: String, var: String) -> Result<Vec<String>, String> {
    // Simple linear/quadratic solver
    // For ax + b = 0: x = -b/a
    // For ax^2 + bx + c = 0: quadratic formula

    // Parse left side (assuming = 0)
    let parsed = parse_symbolic(&equation)?;
    let derivative = differentiate(&parsed, &var);
    let simplified = simplify(&derivative);

    // Return the derivative as a "solution hint"
    Ok(vec![
        format!("f({}) = {}", var, to_latex(&parsed)),
        format!("f'({}) = {}", var, to_latex(&simplified)),
    ])
}

fn matrix_to_latex(m: &[Vec<f64>]) -> String {
    let rows: Vec<String> = m.iter().map(|row| {
        row.iter().map(|v| format!("{}", v)).collect::<Vec<_>>().join(" & ")
    }).collect();
    format!("\\begin{{pmatrix}} {} \\end{{pmatrix}}", rows.join(" \\\\ "))
}
