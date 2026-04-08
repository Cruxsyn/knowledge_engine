use regex::Regex;
use std::collections::HashMap;
use yaml_rust2::YamlLoader;

/// A wikilink found in the document body, e.g. `[[target]]` or `[[target|display]]`.
#[derive(Debug, Clone, serde::Serialize)]
pub struct WikiLink {
    pub target: String,
    pub display: Option<String>,
    /// Byte offset in the **body** (after frontmatter) where the link starts.
    pub position: usize,
}

/// Result of parsing a markdown document with optional YAML frontmatter.
#[derive(Debug, Clone, serde::Serialize)]
pub struct ParsedDocument {
    pub frontmatter: HashMap<String, String>,
    pub body: String,
    pub wikilinks: Vec<WikiLink>,
    pub tags: Vec<String>,
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/// Parse a markdown string that may begin with YAML frontmatter delimited by
/// `---`.  Extracts frontmatter key/value pairs (flattened to strings),
/// wikilinks, and tags from the body.
pub fn parse_document(content: &str) -> ParsedDocument {
    let (frontmatter, body) = split_frontmatter(content);
    let wikilinks = extract_wikilinks(&body);
    let tags = extract_tags(&body);

    ParsedDocument {
        frontmatter,
        body,
        wikilinks,
        tags,
    }
}

/// Reconstruct the markdown text from a `ParsedDocument`, re-serializing the
/// frontmatter block if it is non-empty.
pub fn to_markdown(doc: &ParsedDocument) -> String {
    let mut out = String::new();

    if !doc.frontmatter.is_empty() {
        out.push_str("---\n");
        // Sort keys for deterministic output.
        let mut keys: Vec<&String> = doc.frontmatter.keys().collect();
        keys.sort();
        for key in keys {
            let value = &doc.frontmatter[key];
            // If the value contains special YAML characters, quote it.
            if value.contains(':') || value.contains('#') || value.contains('\n') {
                out.push_str(&format!("{}: \"{}\"\n", key, value.replace('"', "\\\"")));
            } else {
                out.push_str(&format!("{}: {}\n", key, value));
            }
        }
        out.push_str("---\n");
    }

    out.push_str(&doc.body);
    out
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Split content into (frontmatter, body).  Frontmatter must start on the
/// very first line with `---` and end with another `---` line.
fn split_frontmatter(content: &str) -> (HashMap<String, String>, String) {
    let trimmed = content.trim_start_matches('\u{feff}'); // strip BOM if present
    if !trimmed.starts_with("---") {
        return (HashMap::new(), content.to_string());
    }

    // Find the closing `---` (must be on its own line after the opening one).
    let after_open = &trimmed[3..];
    let close_pos = after_open.find("\n---");
    match close_pos {
        Some(pos) => {
            let yaml_str = &after_open[..pos];
            let body_start = 3 + pos + 4; // skip opening "---", yaml, "\n---"
            let body = trimmed[body_start..].trim_start_matches('\n').to_string();
            let fm = parse_yaml_frontmatter(yaml_str);
            (fm, body)
        }
        None => (HashMap::new(), content.to_string()),
    }
}

/// Parse a YAML string into a flat HashMap<String, String>.  Only top-level
/// scalar values are kept; nested structures are serialized to their YAML
/// string representation.
fn parse_yaml_frontmatter(yaml_str: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    let docs = match YamlLoader::load_from_str(yaml_str) {
        Ok(docs) => docs,
        Err(e) => {
            log::warn!("Failed to parse YAML frontmatter: {}", e);
            return map;
        }
    };

    if let Some(doc) = docs.into_iter().next() {
        if let yaml_rust2::Yaml::Hash(hash) = doc {
            for (k, v) in hash {
                let key = match k {
                    yaml_rust2::Yaml::String(s) => s,
                    yaml_rust2::Yaml::Integer(i) => i.to_string(),
                    _ => continue,
                };
                let value = yaml_value_to_string(&v);
                map.insert(key, value);
            }
        }
    }

    map
}

fn yaml_value_to_string(v: &yaml_rust2::Yaml) -> String {
    match v {
        yaml_rust2::Yaml::String(s) => s.clone(),
        yaml_rust2::Yaml::Integer(i) => i.to_string(),
        yaml_rust2::Yaml::Real(r) => r.clone(),
        yaml_rust2::Yaml::Boolean(b) => b.to_string(),
        yaml_rust2::Yaml::Array(arr) => {
            let items: Vec<String> = arr.iter().map(yaml_value_to_string).collect();
            format!("[{}]", items.join(", "))
        }
        yaml_rust2::Yaml::Null => String::new(),
        _ => format!("{:?}", v),
    }
}

/// Extract all `[[target]]` and `[[target|display]]` wikilinks from text.
fn extract_wikilinks(body: &str) -> Vec<WikiLink> {
    let re = Regex::new(r"\[\[([^\]]+)\]\]").expect("invalid wikilink regex");
    let mut links = Vec::new();

    for cap in re.captures_iter(body) {
        let full_match = cap.get(0).unwrap();
        let inner = cap.get(1).unwrap().as_str();
        let (target, display) = if let Some(pipe_pos) = inner.find('|') {
            (
                inner[..pipe_pos].trim().to_string(),
                Some(inner[pipe_pos + 1..].trim().to_string()),
            )
        } else {
            (inner.trim().to_string(), None)
        };

        links.push(WikiLink {
            target,
            display,
            position: full_match.start(),
        });
    }

    links
}

/// Extract `#tagname` tags from text.  Tags must start after whitespace or at
/// the beginning of a line and consist of word characters.  We skip anything
/// inside code fences or inline code.
fn extract_tags(body: &str) -> Vec<String> {
    let re = Regex::new(r"(?:^|[\s])#([A-Za-z][A-Za-z0-9_/\-]*)").expect("invalid tag regex");
    let mut tags: Vec<String> = Vec::new();

    // Simple approach: skip code blocks
    let stripped = strip_code_blocks(body);

    for cap in re.captures_iter(&stripped) {
        let tag = cap.get(1).unwrap().as_str().to_string();
        if !tags.contains(&tag) {
            tags.push(tag);
        }
    }

    tags
}

/// Remove fenced code blocks (``` ... ```) and inline code (` ... `) so we
/// don't accidentally extract tags/links from code.
fn strip_code_blocks(text: &str) -> String {
    // Remove fenced code blocks first
    let fenced = Regex::new(r"(?ms)^```.*?^```").expect("invalid fenced code regex");
    let without_fenced = fenced.replace_all(text, "");
    // Remove inline code
    let inline = Regex::new(r"`[^`]+`").expect("invalid inline code regex");
    inline.replace_all(&without_fenced, "").to_string()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_frontmatter() {
        let input = "---\ntitle: Hello World\ndate: 2026-01-15\n---\nBody text here.";
        let doc = parse_document(input);
        assert_eq!(doc.frontmatter.get("title").unwrap(), "Hello World");
        assert_eq!(doc.frontmatter.get("date").unwrap(), "2026-01-15");
        assert_eq!(doc.body, "Body text here.");
    }

    #[test]
    fn test_no_frontmatter() {
        let input = "Just a plain document.";
        let doc = parse_document(input);
        assert!(doc.frontmatter.is_empty());
        assert_eq!(doc.body, "Just a plain document.");
    }

    #[test]
    fn test_wikilinks() {
        let input = "Link to [[Concept A]] and [[Concept B|display text]].";
        let doc = parse_document(input);
        assert_eq!(doc.wikilinks.len(), 2);
        assert_eq!(doc.wikilinks[0].target, "Concept A");
        assert!(doc.wikilinks[0].display.is_none());
        assert_eq!(doc.wikilinks[1].target, "Concept B");
        assert_eq!(doc.wikilinks[1].display.as_deref(), Some("display text"));
    }

    #[test]
    fn test_tags() {
        let input = "Some text #math and #linear-algebra here.";
        let doc = parse_document(input);
        assert!(doc.tags.contains(&"math".to_string()));
        assert!(doc.tags.contains(&"linear-algebra".to_string()));
    }

    #[test]
    fn test_roundtrip() {
        let input = "---\ntitle: Test\n---\nBody content.";
        let doc = parse_document(input);
        let output = to_markdown(&doc);
        assert!(output.contains("title: Test"));
        assert!(output.contains("Body content."));
    }
}
