use serde::Serialize;

/// Symbolic expression tree
#[derive(Debug, Clone)]
pub enum Expr {
    Num(f64),
    Var(String),
    Add(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Pow(Box<Expr>, Box<Expr>),
    Neg(Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
    Func(String, Box<Expr>), // sin, cos, exp, ln
}

#[derive(Debug, Clone, Serialize)]
pub struct DerivationStep {
    pub rule: String,
    pub before_latex: String,
    pub after_latex: String,
}

/// Symbolic differentiation with respect to a variable
pub fn differentiate(expr: &Expr, var: &str) -> Expr {
    match expr {
        Expr::Num(_) => Expr::Num(0.0),
        Expr::Var(name) => {
            if name == var { Expr::Num(1.0) } else { Expr::Num(0.0) }
        }
        Expr::Add(a, b) => Expr::Add(
            Box::new(differentiate(a, var)),
            Box::new(differentiate(b, var)),
        ),
        Expr::Neg(a) => Expr::Neg(Box::new(differentiate(a, var))),
        Expr::Mul(a, b) => {
            // Product rule: (fg)' = f'g + fg'
            Expr::Add(
                Box::new(Expr::Mul(Box::new(differentiate(a, var)), b.clone())),
                Box::new(Expr::Mul(a.clone(), Box::new(differentiate(b, var)))),
            )
        }
        Expr::Div(a, b) => {
            // Quotient rule: (f/g)' = (f'g - fg') / g^2
            Expr::Div(
                Box::new(Expr::Add(
                    Box::new(Expr::Mul(Box::new(differentiate(a, var)), b.clone())),
                    Box::new(Expr::Neg(Box::new(Expr::Mul(a.clone(), Box::new(differentiate(b, var)))))),
                )),
                Box::new(Expr::Pow(b.clone(), Box::new(Expr::Num(2.0)))),
            )
        }
        Expr::Pow(base, exp) => {
            // Power rule: d/dx[x^n] = n*x^(n-1) (for constant exponent)
            if let Expr::Num(n) = exp.as_ref() {
                Expr::Mul(
                    Box::new(Expr::Num(*n)),
                    Box::new(Expr::Mul(
                        Box::new(Expr::Pow(base.clone(), Box::new(Expr::Num(n - 1.0)))),
                        Box::new(differentiate(base, var)),
                    )),
                )
            } else {
                // General case: d/dx[f^g] = f^g * (g' * ln(f) + g * f'/f)
                Expr::Mul(
                    Box::new(expr.clone()),
                    Box::new(Expr::Add(
                        Box::new(Expr::Mul(
                            Box::new(differentiate(exp, var)),
                            Box::new(Expr::Func("ln".into(), base.clone())),
                        )),
                        Box::new(Expr::Mul(
                            exp.clone(),
                            Box::new(Expr::Div(
                                Box::new(differentiate(base, var)),
                                base.clone(),
                            )),
                        )),
                    )),
                )
            }
        }
        Expr::Func(name, arg) => {
            // Chain rule: d/dx[f(g(x))] = f'(g(x)) * g'(x)
            let outer_deriv = match name.as_str() {
                "sin" => Expr::Func("cos".into(), arg.clone()),
                "cos" => Expr::Neg(Box::new(Expr::Func("sin".into(), arg.clone()))),
                "exp" => Expr::Func("exp".into(), arg.clone()),
                "ln" => Expr::Div(Box::new(Expr::Num(1.0)), arg.clone()),
                "sqrt" => Expr::Div(
                    Box::new(Expr::Num(1.0)),
                    Box::new(Expr::Mul(
                        Box::new(Expr::Num(2.0)),
                        Box::new(Expr::Func("sqrt".into(), arg.clone())),
                    )),
                ),
                _ => Expr::Num(0.0),
            };
            Expr::Mul(Box::new(outer_deriv), Box::new(differentiate(arg, var)))
        }
    }
}

/// Simplify an expression
pub fn simplify(expr: &Expr) -> Expr {
    match expr {
        Expr::Add(a, b) => {
            let a = simplify(a);
            let b = simplify(b);
            match (&a, &b) {
                (Expr::Num(0.0), _) => b,
                (_, Expr::Num(0.0)) => a,
                (Expr::Num(x), Expr::Num(y)) => Expr::Num(x + y),
                _ => Expr::Add(Box::new(a), Box::new(b)),
            }
        }
        Expr::Mul(a, b) => {
            let a = simplify(a);
            let b = simplify(b);
            match (&a, &b) {
                (Expr::Num(0.0), _) | (_, Expr::Num(0.0)) => Expr::Num(0.0),
                (Expr::Num(1.0), _) => b,
                (_, Expr::Num(1.0)) => a,
                (Expr::Num(x), Expr::Num(y)) => Expr::Num(x * y),
                _ => Expr::Mul(Box::new(a), Box::new(b)),
            }
        }
        Expr::Pow(base, exp) => {
            let base = simplify(base);
            let exp = simplify(exp);
            match (&base, &exp) {
                (_, Expr::Num(0.0)) => Expr::Num(1.0),
                (_, Expr::Num(1.0)) => base,
                (Expr::Num(x), Expr::Num(y)) => Expr::Num(x.powf(*y)),
                _ => Expr::Pow(Box::new(base), Box::new(exp)),
            }
        }
        Expr::Neg(a) => {
            let a = simplify(a);
            match &a {
                Expr::Num(x) => Expr::Num(-x),
                Expr::Neg(inner) => simplify(inner),
                _ => Expr::Neg(Box::new(a)),
            }
        }
        Expr::Div(a, b) => {
            let a = simplify(a);
            let b = simplify(b);
            match (&a, &b) {
                (Expr::Num(0.0), _) => Expr::Num(0.0),
                (_, Expr::Num(1.0)) => a,
                (Expr::Num(x), Expr::Num(y)) if *y != 0.0 => Expr::Num(x / y),
                _ => Expr::Div(Box::new(a), Box::new(b)),
            }
        }
        _ => expr.clone(),
    }
}

/// Convert expression to LaTeX
pub fn to_latex(expr: &Expr) -> String {
    match expr {
        Expr::Num(n) => {
            if *n == n.floor() && n.abs() < 1e10 {
                format!("{}", *n as i64)
            } else {
                format!("{:.4}", n)
            }
        }
        Expr::Var(name) => name.clone(),
        Expr::Add(a, b) => format!("{} + {}", to_latex(a), to_latex(b)),
        Expr::Mul(a, b) => {
            let a_str = match a.as_ref() {
                Expr::Add(_, _) => format!("({})", to_latex(a)),
                _ => to_latex(a),
            };
            let b_str = match b.as_ref() {
                Expr::Add(_, _) => format!("({})", to_latex(b)),
                _ => to_latex(b),
            };
            format!("{} \\cdot {}", a_str, b_str)
        }
        Expr::Pow(base, exp) => {
            let base_str = match base.as_ref() {
                Expr::Add(_, _) | Expr::Mul(_, _) => format!("({})", to_latex(base)),
                _ => to_latex(base),
            };
            format!("{}^{{{}}}", base_str, to_latex(exp))
        }
        Expr::Neg(a) => format!("-{}", to_latex(a)),
        Expr::Div(a, b) => format!("\\frac{{{}}}{{{}}}", to_latex(a), to_latex(b)),
        Expr::Func(name, arg) => {
            let latex_name = match name.as_str() {
                "sin" => "\\sin",
                "cos" => "\\cos",
                "exp" => "e^",
                "ln" => "\\ln",
                "sqrt" => "\\sqrt",
                _ => name.as_str(),
            };
            if name == "exp" {
                format!("{}^{{{}}}", "e", to_latex(arg))
            } else if name == "sqrt" {
                format!("\\sqrt{{{}}}", to_latex(arg))
            } else {
                format!("{}({})", latex_name, to_latex(arg))
            }
        }
    }
}

/// Parse a simple symbolic expression
pub fn parse_symbolic(input: &str) -> Result<Expr, String> {
    let tokens = tokenize(input)?;
    let (expr, pos) = parse_additive(&tokens, 0)?;
    if pos < tokens.len() {
        return Err(format!("Unexpected token at position {}", pos));
    }
    Ok(expr)
}

/// Generate step-by-step derivation
pub fn derive_steps(expr: &Expr, var: &str) -> Vec<DerivationStep> {
    let mut steps = Vec::new();

    let before_latex = to_latex(expr);
    let derivative = differentiate(expr, var);
    steps.push(DerivationStep {
        rule: "Differentiate".into(),
        before_latex: format!("\\frac{{d}}{{d{}}}[{}]", var, before_latex),
        after_latex: to_latex(&derivative),
    });

    let simplified = simplify(&derivative);
    if to_latex(&simplified) != to_latex(&derivative) {
        steps.push(DerivationStep {
            rule: "Simplify".into(),
            before_latex: to_latex(&derivative),
            after_latex: to_latex(&simplified),
        });
    }

    steps
}

// --- Tokenizer ---

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
            ' ' | '\t' => i += 1,
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
            c if c.is_ascii_alphabetic() => {
                let start = i;
                while i < chars.len() && chars[i].is_ascii_alphanumeric() {
                    i += 1;
                }
                tokens.push(Token::Ident(chars[start..i].iter().collect()));
            }
            c => return Err(format!("Unexpected character: {}", c)),
        }
    }
    Ok(tokens)
}

// --- Recursive Descent Parser ---

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

fn parse_power(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    let (base, pos) = parse_unary(tokens, pos)?;
    if pos < tokens.len() {
        if let Token::Caret = &tokens[pos] {
            let (exp, pos) = parse_power(tokens, pos + 1)?; // right-associative
            return Ok((Expr::Pow(Box::new(base), Box::new(exp)), pos));
        }
    }
    Ok((base, pos))
}

fn parse_unary(tokens: &[Token], pos: usize) -> Result<(Expr, usize), String> {
    if pos >= tokens.len() {
        return Err("Unexpected end of expression".into());
    }
    match &tokens[pos] {
        Token::Minus => {
            let (expr, pos) = parse_primary(tokens, pos + 1)?;
            Ok((Expr::Neg(Box::new(expr)), pos))
        }
        _ => parse_primary(tokens, pos),
    }
}

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
        _ => Err(format!("Unexpected token at position {}", pos)),
    }
}
