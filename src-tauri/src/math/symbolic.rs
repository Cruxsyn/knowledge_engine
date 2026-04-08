use serde::{Deserialize, Serialize};

/// A symbolic mathematical expression.
#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    Num(f64),
    Var(String),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Pow(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    /// Named function application: sin, cos, exp, ln
    Func(String, Box<Expr>),
}

/// A single step in a symbolic derivation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DerivationStep {
    pub rule: String,
    pub before_latex: String,
    pub after_latex: String,
}

// ---------------------------------------------------------------------------
// Parser — simple recursive descent
// ---------------------------------------------------------------------------

#[derive(Debug, Clone)]
enum Token {
    Num(f64),
    Ident(String),
    Plus,
    Minus,
    Star,
    Slash,
    Caret,
    LParen,
    RParen,
}

fn tokenize(input: &str) -> Result<Vec<Token>, String> {
    let mut tokens = Vec::new();
    let chars: Vec<char> = input.chars().collect();
    let mut i = 0;

    while i < chars.len() {
        match chars[i] {
            ' ' | '\t' | '\n' | '\r' => i += 1,
            '+' => { tokens.push(Token::Plus); i += 1; }
            '-' => { tokens.push(Token::Minus); i += 1; }
            '*' => { tokens.push(Token::Star); i += 1; }
            '/' => { tokens.push(Token::Slash); i += 1; }
            '^' => { tokens.push(Token::Caret); i += 1; }
            '(' => { tokens.push(Token::LParen); i += 1; }
            ')' => { tokens.push(Token::RParen); i += 1; }
            c if c.is_ascii_digit() || c == '.' => {
                let start = i;
                while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') {
                    i += 1;
                }
                let num: f64 = chars[start..i].iter().collect::<String>().parse()
                    .map_err(|_| "Invalid number".to_string())?;
                tokens.push(Token::Num(num));
            }
            c if c.is_ascii_alphabetic() || c == '_' => {
                let start = i;
                while i < chars.len() && (chars[i].is_ascii_alphanumeric() || chars[i] == '_') {
                    i += 1;
                }
                tokens.push(Token::Ident(chars[start..i].iter().collect()));
            }
            c => return Err(format!("Unexpected character: '{c}'")),
        }
    }
    Ok(tokens)
}

/// Parse a string into a symbolic expression using recursive descent.
pub fn parse_symbolic(input: &str) -> Result<Expr, String> {
    let tokens = tokenize(input)?;
    if tokens.is_empty() {
        return Err("Empty expression".into());
    }
    let (expr, pos) = parse_additive(&tokens, 0)?;
    if pos < tokens.len() {
        return Err(format!("Unexpected token at position {pos}"));
    }
    Ok(expr)
}

// expr = term (('+' | '-') term)*
fn parse_additive(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    let (mut left, mut pos) = parse_multiplicative(tokens, pos)?;
    while pos < tokens.len() {
        match &tokens[pos] {
            Token::Plus => {
                let (right, new_pos) = parse_multiplicative(tokens, pos + 1)?;
                left = Expr::Add(Box::new(left), Box::new(right));
                pos = new_pos;
            }
            Token::Minus => {
                let (right, new_pos) = parse_multiplicative(tokens, pos + 1)?;
                left = Expr::Add(Box::new(left), Box::new(Expr::Neg(Box::new(right))));
                pos = new_pos;
            }
            _ => break,
        }
    }
    Ok((left, pos))
}

// term = power (('*' | '/') power)*
fn parse_multiplicative(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    let (mut left, mut pos) = parse_power(tokens, pos)?;
    while pos < tokens.len() {
        match &tokens[pos] {
            Token::Star => {
                let (right, new_pos) = parse_power(tokens, pos + 1)?;
                left = Expr::Mul(Box::new(left), Box::new(right));
                pos = new_pos;
            }
            Token::Slash => {
                let (right, new_pos) = parse_power(tokens, pos + 1)?;
                left = Expr::Div(Box::new(left), Box::new(right));
                pos = new_pos;
            }
            _ => break,
        }
    }
    Ok((left, pos))
}

// power = unary ('^' power)?  (right-associative)
fn parse_power(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    let (base, pos) = parse_unary(tokens, pos)?;
    if pos < tokens.len() {
        if let Token::Caret = &tokens[pos] {
            let (exp, pos) = parse_power(tokens, pos + 1)?;
            return Ok((Expr::Pow(Box::new(base), Box::new(exp)), pos));
        }
    }
    Ok((base, pos))
}

// unary = '-' unary | primary
fn parse_unary(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    if pos >= tokens.len() {
        return Err("Unexpected end of expression".into());
    }
    match &tokens[pos] {
        Token::Minus => {
            let (expr, pos) = parse_unary(tokens, pos + 1)?;
            Ok((Expr::Neg(Box::new(expr)), pos))
        }
        _ => parse_primary(tokens, pos),
    }
}

// primary = number | ident | ident '(' expr ')' | '(' expr ')'
fn parse_primary(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    if pos >= tokens.len() {
        return Err("Unexpected end of expression".into());
    }
    match &tokens[pos] {
        Token::Num(n) => Ok((Expr::Num(*n), pos + 1)),
        Token::Ident(name) => {
            // Check for function call
            if pos + 1 < tokens.len() {
                if let Token::LParen = &tokens[pos + 1] {
                    let (arg, end_pos) = parse_additive(tokens, pos + 2)?;
                    if end_pos < tokens.len() {
                        if let Token::RParen = &tokens[end_pos] {
                            return Ok((Expr::Func(name.clone(), Box::new(arg)), end_pos + 1));
                        }
                    }
                    return Err("Missing closing parenthesis".into());
                }
            }
            Ok((Expr::Var(name.clone()), pos + 1))
        }
        Token::LParen => {
            let (expr, pos) = parse_additive(tokens, pos + 1)?;
            if pos < tokens.len() {
                if let Token::RParen = &tokens[pos] {
                    return Ok((expr, pos + 1));
                }
            }
            Err("Missing closing parenthesis".into())
        }
        _ => Err(format!("Unexpected token at position {pos}")),
    }
}

// ---------------------------------------------------------------------------
// Symbolic differentiation
// ---------------------------------------------------------------------------

/// Symbolically differentiate `expr` with respect to `var`.
pub fn differentiate(expr: &Expr, var: &str) -> Expr {
    match expr {
        Expr::Num(_) => Expr::Num(0.0),

        Expr::Var(name) => {
            if name == var {
                Expr::Num(1.0)
            } else {
                Expr::Num(0.0)
            }
        }

        Expr::Add(a, b) => Expr::Add(
            Box::new(differentiate(a, var)),
            Box::new(differentiate(b, var)),
        ),

        Expr::Neg(a) => Expr::Neg(Box::new(differentiate(a, var))),

        // Product rule: d(uv) = u'v + uv'
        Expr::Mul(u, v) => Expr::Add(
            Box::new(Expr::Mul(
                Box::new(differentiate(u, var)),
                v.clone(),
            )),
            Box::new(Expr::Mul(
                u.clone(),
                Box::new(differentiate(v, var)),
            )),
        ),

        // Quotient rule: d(u/v) = (u'v - uv') / v^2
        Expr::Div(u, v) => Expr::Div(
            Box::new(Expr::Add(
                Box::new(Expr::Mul(
                    Box::new(differentiate(u, var)),
                    v.clone(),
                )),
                Box::new(Expr::Neg(Box::new(Expr::Mul(
                    u.clone(),
                    Box::new(differentiate(v, var)),
                )))),
            )),
            Box::new(Expr::Pow(v.clone(), Box::new(Expr::Num(2.0)))),
        ),

        // Power rule + chain rule
        Expr::Pow(base, exp) => {
            if !contains_var(exp, var) {
                // d(f^n) = n * f^(n-1) * f'
                Expr::Mul(
                    Box::new(Expr::Mul(
                        exp.clone(),
                        Box::new(Expr::Pow(
                            base.clone(),
                            Box::new(Expr::Add(
                                exp.clone(),
                                Box::new(Expr::Neg(Box::new(Expr::Num(1.0)))),
                            )),
                        )),
                    )),
                    Box::new(differentiate(base, var)),
                )
            } else if !contains_var(base, var) {
                // d(a^g) = a^g * ln(a) * g'
                Expr::Mul(
                    Box::new(Expr::Mul(
                        Box::new(Expr::Pow(base.clone(), exp.clone())),
                        Box::new(Expr::Func("ln".into(), base.clone())),
                    )),
                    Box::new(differentiate(exp, var)),
                )
            } else {
                // General: d(f^g) = f^g * (g' * ln(f) + g * f'/f)
                let f = base;
                let g = exp;
                Expr::Mul(
                    Box::new(Expr::Pow(f.clone(), g.clone())),
                    Box::new(Expr::Add(
                        Box::new(Expr::Mul(
                            Box::new(differentiate(g, var)),
                            Box::new(Expr::Func("ln".into(), f.clone())),
                        )),
                        Box::new(Expr::Mul(
                            g.clone(),
                            Box::new(Expr::Div(
                                Box::new(differentiate(f, var)),
                                f.clone(),
                            )),
                        )),
                    )),
                )
            }
        }

        // Chain rule for named functions
        Expr::Func(name, inner) => {
            let inner_deriv = differentiate(inner, var);
            let outer_deriv = match name.as_str() {
                "sin" => Expr::Func("cos".into(), inner.clone()),
                "cos" => Expr::Neg(Box::new(Expr::Func("sin".into(), inner.clone()))),
                "exp" => Expr::Func("exp".into(), inner.clone()),
                "ln" => Expr::Div(Box::new(Expr::Num(1.0)), inner.clone()),
                "sqrt" => Expr::Div(
                    Box::new(Expr::Num(1.0)),
                    Box::new(Expr::Mul(
                        Box::new(Expr::Num(2.0)),
                        Box::new(Expr::Func("sqrt".into(), inner.clone())),
                    )),
                ),
                "tan" => Expr::Pow(
                    Box::new(Expr::Func("cos".into(), inner.clone())),
                    Box::new(Expr::Neg(Box::new(Expr::Num(2.0)))),
                ),
                _ => Expr::Func(format!("{name}'"), inner.clone()),
            };
            Expr::Mul(Box::new(outer_deriv), Box::new(inner_deriv))
        }
    }
}

fn contains_var(expr: &Expr, var: &str) -> bool {
    match expr {
        Expr::Num(_) => false,
        Expr::Var(name) => name == var,
        Expr::Add(a, b) | Expr::Mul(a, b) | Expr::Pow(a, b) | Expr::Div(a, b) => {
            contains_var(a, var) || contains_var(b, var)
        }
        Expr::Neg(a) | Expr::Func(_, a) => contains_var(a, var),
    }
}

// ---------------------------------------------------------------------------
// Simplification
// ---------------------------------------------------------------------------

/// Algebraic simplification (applied iteratively until stable).
pub fn simplify(expr: &Expr) -> Expr {
    let mut current = expr.clone();
    for _ in 0..20 {
        let next = simplify_once(&current);
        if next == current {
            break;
        }
        current = next;
    }
    current
}

fn simplify_once(expr: &Expr) -> Expr {
    match expr {
        Expr::Num(v) => Expr::Num(*v),
        Expr::Var(name) => Expr::Var(name.clone()),

        Expr::Neg(inner) => {
            let inner_s = simplify_once(inner);
            match &inner_s {
                Expr::Num(v) => Expr::Num(-v),
                Expr::Neg(x) => *x.clone(),
                _ => Expr::Neg(Box::new(inner_s)),
            }
        }

        Expr::Add(a, b) => {
            let a_s = simplify_once(a);
            let b_s = simplify_once(b);
            match (&a_s, &b_s) {
                (Expr::Num(v), _) if *v == 0.0 => b_s,
                (_, Expr::Num(v)) if *v == 0.0 => a_s,
                (Expr::Num(x), Expr::Num(y)) => Expr::Num(x + y),
                (_, Expr::Neg(inner)) => match inner.as_ref() {
                    Expr::Num(v) if *v == 0.0 => a_s,
                    _ => Expr::Add(Box::new(a_s), Box::new(b_s)),
                },
                _ => Expr::Add(Box::new(a_s), Box::new(b_s)),
            }
        }

        Expr::Mul(a, b) => {
            let a_s = simplify_once(a);
            let b_s = simplify_once(b);
            match (&a_s, &b_s) {
                (Expr::Num(v), _) if *v == 0.0 => Expr::Num(0.0),
                (_, Expr::Num(v)) if *v == 0.0 => Expr::Num(0.0),
                (Expr::Num(v), _) if *v == 1.0 => b_s,
                (_, Expr::Num(v)) if *v == 1.0 => a_s,
                (Expr::Num(x), Expr::Num(y)) => Expr::Num(x * y),
                _ => Expr::Mul(Box::new(a_s), Box::new(b_s)),
            }
        }

        Expr::Div(a, b) => {
            let a_s = simplify_once(a);
            let b_s = simplify_once(b);
            match (&a_s, &b_s) {
                (Expr::Num(v), _) if *v == 0.0 => Expr::Num(0.0),
                (_, Expr::Num(v)) if *v == 1.0 => a_s,
                (Expr::Num(x), Expr::Num(y)) if *y != 0.0 => Expr::Num(x / y),
                _ => Expr::Div(Box::new(a_s), Box::new(b_s)),
            }
        }

        Expr::Pow(base, exp) => {
            let base_s = simplify_once(base);
            let exp_s = simplify_once(exp);
            match (&base_s, &exp_s) {
                (_, Expr::Num(v)) if *v == 0.0 => Expr::Num(1.0),
                (_, Expr::Num(v)) if *v == 1.0 => base_s,
                (Expr::Num(v), Expr::Num(n)) if *v == 0.0 && *n > 0.0 => Expr::Num(0.0),
                (Expr::Num(v), _) if *v == 1.0 => Expr::Num(1.0),
                (Expr::Num(x), Expr::Num(y)) => Expr::Num(x.powf(*y)),
                _ => Expr::Pow(Box::new(base_s), Box::new(exp_s)),
            }
        }

        Expr::Func(name, inner) => {
            let inner_s = simplify_once(inner);
            Expr::Func(name.clone(), Box::new(inner_s))
        }
    }
}

// ---------------------------------------------------------------------------
// LaTeX rendering
// ---------------------------------------------------------------------------

/// Render a symbolic expression as a LaTeX string.
pub fn to_latex(expr: &Expr) -> String {
    match expr {
        Expr::Num(v) => {
            if *v == v.floor() && v.abs() < 1e10 {
                format!("{}", *v as i64)
            } else {
                format!("{v:.4}")
            }
        }
        Expr::Var(name) => name.clone(),

        Expr::Neg(inner) => {
            let inner_s = to_latex(inner);
            match inner.as_ref() {
                Expr::Add(_, _) | Expr::Mul(_, _) => format!("-({inner_s})"),
                _ => format!("-{inner_s}"),
            }
        }

        Expr::Add(a, b) => {
            let a_s = to_latex(a);
            let b_s = to_latex(b);
            // Handle addition of a negated term: x + (-y) => x - y
            match b.as_ref() {
                Expr::Neg(inner) => format!("{a_s} - {}", to_latex(inner)),
                _ => format!("{a_s} + {b_s}"),
            }
        }

        Expr::Mul(a, b) => {
            let a_s = wrap_if_additive(a);
            let b_s = wrap_if_additive(b);
            format!("{a_s} \\cdot {b_s}")
        }

        Expr::Div(a, b) => {
            format!("\\frac{{{}}}{{{}}}", to_latex(a), to_latex(b))
        }

        Expr::Pow(base, exp) => {
            let base_s = match base.as_ref() {
                Expr::Num(_) | Expr::Var(_) | Expr::Func(_, _) => to_latex(base),
                _ => format!("({})", to_latex(base)),
            };
            format!("{}^{{{}}}", base_s, to_latex(exp))
        }

        Expr::Func(name, inner) => {
            let inner_s = to_latex(inner);
            let latex_name = match name.as_str() {
                "sin" => "\\sin",
                "cos" => "\\cos",
                "tan" => "\\tan",
                "exp" => "\\exp",
                "ln" => "\\ln",
                "log" => "\\log",
                "sqrt" => "\\sqrt",
                other => other,
            };
            if name == "exp" {
                format!("e^{{{inner_s}}}")
            } else if name == "sqrt" {
                format!("\\sqrt{{{inner_s}}}")
            } else {
                format!("{latex_name}({inner_s})")
            }
        }
    }
}

fn wrap_if_additive(expr: &Expr) -> String {
    match expr {
        Expr::Add(_, _) | Expr::Neg(_) => format!("({})", to_latex(expr)),
        _ => to_latex(expr),
    }
}

// ---------------------------------------------------------------------------
// Step-by-step derivation
// ---------------------------------------------------------------------------

/// Produce a step-by-step differentiation trace with named rules.
pub fn derive_steps(expr: &Expr, var: &str) -> Vec<DerivationStep> {
    let mut steps = Vec::new();
    derive_steps_inner(expr, var, &mut steps);

    // Final simplification step
    let full_deriv = differentiate(expr, var);
    let simplified = simplify(&full_deriv);
    let deriv_latex = to_latex(&full_deriv);
    let simp_latex = to_latex(&simplified);
    if deriv_latex != simp_latex {
        steps.push(DerivationStep {
            rule: "Simplify".into(),
            before_latex: deriv_latex,
            after_latex: simp_latex,
        });
    }

    steps
}

fn derive_steps_inner(expr: &Expr, var: &str, steps: &mut Vec<DerivationStep>) {
    let before_latex = to_latex(expr);
    let derivative = differentiate(expr, var);
    let simplified = simplify(&derivative);

    let (rule, recurse_into): (String, Option<Vec<&Expr>>) = match expr {
        Expr::Num(_) => ("Constant rule".into(), None),
        Expr::Var(name) if name == var => ("Variable rule".into(), None),
        Expr::Var(_) => ("Constant rule".into(), None),
        Expr::Add(a, b) => ("Sum rule".into(), Some(vec![a.as_ref(), b.as_ref()])),
        Expr::Neg(inner) => ("Negation rule".into(), Some(vec![inner.as_ref()])),
        Expr::Mul(a, b) => ("Product rule".into(), Some(vec![a.as_ref(), b.as_ref()])),
        Expr::Div(a, b) => ("Quotient rule".into(), Some(vec![a.as_ref(), b.as_ref()])),
        Expr::Pow(base, _exp) => {
            if !contains_var(expr, var) {
                ("Constant rule".into(), None)
            } else {
                ("Power rule".into(), Some(vec![base.as_ref()]))
            }
        }
        Expr::Func(name, inner) => {
            (format!("Chain rule ({})", name), Some(vec![inner.as_ref()]))
        }
    };

    steps.push(DerivationStep {
        rule,
        before_latex: format!("\\frac{{d}}{{d{var}}}[{before_latex}]"),
        after_latex: to_latex(&simplified),
    });

    // Recursively show sub-derivations for compound sub-expressions
    if let Some(children) = recurse_into {
        for child in children {
            if contains_var(child, var) && !matches!(child, Expr::Var(_) | Expr::Num(_)) {
                derive_steps_inner(child, var, steps);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple() {
        let expr = parse_symbolic("x + 1").unwrap();
        assert_eq!(
            expr,
            Expr::Add(
                Box::new(Expr::Var("x".into())),
                Box::new(Expr::Num(1.0))
            )
        );
    }

    #[test]
    fn test_parse_function() {
        let expr = parse_symbolic("sin(x)").unwrap();
        assert_eq!(
            expr,
            Expr::Func("sin".into(), Box::new(Expr::Var("x".into())))
        );
    }

    #[test]
    fn test_differentiate_power() {
        let expr = parse_symbolic("x^3").unwrap();
        let deriv = differentiate(&expr, "x");
        let simplified = simplify(&deriv);
        let latex = to_latex(&simplified);
        assert!(latex.contains("3"));
    }

    #[test]
    fn test_differentiate_sin() {
        let expr = parse_symbolic("sin(x)").unwrap();
        let deriv = differentiate(&expr, "x");
        let simplified = simplify(&deriv);
        let latex = to_latex(&simplified);
        assert!(latex.contains("cos"));
    }

    #[test]
    fn test_simplify_zero_add() {
        let expr = Expr::Add(
            Box::new(Expr::Num(0.0)),
            Box::new(Expr::Var("x".into())),
        );
        let s = simplify(&expr);
        assert_eq!(s, Expr::Var("x".into()));
    }

    #[test]
    fn test_simplify_one_mul() {
        let expr = Expr::Mul(
            Box::new(Expr::Num(1.0)),
            Box::new(Expr::Var("x".into())),
        );
        let s = simplify(&expr);
        assert_eq!(s, Expr::Var("x".into()));
    }

    #[test]
    fn test_to_latex_fraction() {
        let expr = Expr::Div(
            Box::new(Expr::Var("x".into())),
            Box::new(Expr::Num(2.0)),
        );
        let latex = to_latex(&expr);
        assert_eq!(latex, "\\frac{x}{2}");
    }

    #[test]
    fn test_derive_steps_power() {
        let expr = parse_symbolic("x^2").unwrap();
        let steps = derive_steps(&expr, "x");
        assert!(!steps.is_empty());
        assert_eq!(steps[0].rule, "Power rule");
    }

    #[test]
    fn test_derive_steps_product() {
        let expr = parse_symbolic("x * sin(x)").unwrap();
        let steps = derive_steps(&expr, "x");
        assert!(steps.iter().any(|s| s.rule == "Product rule"));
    }

    #[test]
    fn test_simplify_constant_folding() {
        let expr = Expr::Add(
            Box::new(Expr::Num(2.0)),
            Box::new(Expr::Num(3.0)),
        );
        assert_eq!(simplify(&expr), Expr::Num(5.0));
    }

    #[test]
    fn test_simplify_pow_zero() {
        let expr = Expr::Pow(
            Box::new(Expr::Var("x".into())),
            Box::new(Expr::Num(0.0)),
        );
        assert_eq!(simplify(&expr), Expr::Num(1.0));
    }
}
