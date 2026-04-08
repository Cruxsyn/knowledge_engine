use crate::db::connection::DbState;
use rusqlite::params_from_iter;
use serde_json::Value;
use tauri::State;

/// Convert a rusqlite row to a JSON object using column names.
fn row_to_json(
    row: &rusqlite::Row,
    columns: &[String],
) -> Result<Value, rusqlite::Error> {
    let mut map = serde_json::Map::new();
    for (i, col_name) in columns.iter().enumerate() {
        let val: Value = match row.get_ref(i)? {
            rusqlite::types::ValueRef::Null => Value::Null,
            rusqlite::types::ValueRef::Integer(n) => Value::Number(n.into()),
            rusqlite::types::ValueRef::Real(f) => {
                serde_json::Number::from_f64(f)
                    .map(Value::Number)
                    .unwrap_or(Value::Null)
            }
            rusqlite::types::ValueRef::Text(s) => {
                Value::String(String::from_utf8_lossy(s).into_owned())
            }
            rusqlite::types::ValueRef::Blob(b) => {
                Value::String(base64_encode(b))
            }
        };
        map.insert(col_name.clone(), val);
    }
    Ok(Value::Object(map))
}

fn base64_encode(data: &[u8]) -> String {
    use std::fmt::Write;
    let mut s = String::with_capacity(data.len() * 4 / 3 + 4);
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        let _ = write!(s, "{}", CHARS[((triple >> 18) & 0x3F) as usize] as char);
        let _ = write!(s, "{}", CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            let _ = write!(s, "{}", CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            s.push('=');
        }
        if chunk.len() > 2 {
            let _ = write!(s, "{}", CHARS[(triple & 0x3F) as usize] as char);
        } else {
            s.push('=');
        }
    }
    s
}

/// Execute a query and return results as JSON array of objects.
#[tauri::command]
pub fn db_query(
    state: State<DbState>,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Value>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    // Get column names
    let columns: Vec<String> = stmt
        .column_names()
        .iter()
        .map(|s| s.to_string())
        .collect();

    // Convert JSON params to rusqlite params
    let params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = params
        .iter()
        .map(|v| -> Box<dyn rusqlite::types::ToSql> {
            match v {
                Value::Null => Box::new(rusqlite::types::Null),
                Value::Bool(b) => Box::new(*b as i32),
                Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        Box::new(i)
                    } else if let Some(f) = n.as_f64() {
                        Box::new(f)
                    } else {
                        Box::new(rusqlite::types::Null)
                    }
                }
                Value::String(s) => Box::new(s.clone()),
                _ => Box::new(v.to_string()),
            }
        })
        .collect();

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    let rows = stmt
        .query_map(params_from_iter(param_refs.iter().copied()), |row| {
            row_to_json(row, &columns)
        })
        .map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for row in rows {
        results.push(row.map_err(|e| e.to_string())?);
    }

    Ok(results)
}

/// Execute a statement (INSERT, UPDATE, DELETE) with no return value.
#[tauri::command]
pub fn db_execute(
    state: State<DbState>,
    sql: String,
    params: Vec<Value>,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = params
        .iter()
        .map(|v| -> Box<dyn rusqlite::types::ToSql> {
            match v {
                Value::Null => Box::new(rusqlite::types::Null),
                Value::Bool(b) => Box::new(*b as i32),
                Value::Number(n) => {
                    if let Some(i) = n.as_i64() {
                        Box::new(i)
                    } else if let Some(f) = n.as_f64() {
                        Box::new(f)
                    } else {
                        Box::new(rusqlite::types::Null)
                    }
                }
                Value::String(s) => Box::new(s.clone()),
                _ => Box::new(v.to_string()),
            }
        })
        .collect();

    let param_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    conn.execute(&sql, params_from_iter(param_refs.iter().copied()))
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Execute multiple statements in a transaction.
#[tauri::command]
pub fn db_transaction(
    state: State<DbState>,
    statements: Vec<(String, Vec<Value>)>,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let tx = conn
        .unchecked_transaction()
        .map_err(|e| e.to_string())?;

    for (sql, params) in &statements {
        let params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = params
            .iter()
            .map(|v| -> Box<dyn rusqlite::types::ToSql> {
                match v {
                    Value::Null => Box::new(rusqlite::types::Null),
                    Value::Bool(b) => Box::new(*b as i32),
                    Value::Number(n) => {
                        if let Some(i) = n.as_i64() {
                            Box::new(i)
                        } else if let Some(f) = n.as_f64() {
                            Box::new(f)
                        } else {
                            Box::new(rusqlite::types::Null)
                        }
                    }
                    Value::String(s) => Box::new(s.clone()),
                    _ => Box::new(v.to_string()),
                }
            })
            .collect();

        let param_refs: Vec<&dyn rusqlite::types::ToSql> =
            params_vec.iter().map(|p| p.as_ref()).collect();

        tx.execute(sql, params_from_iter(param_refs.iter().copied()))
            .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}
