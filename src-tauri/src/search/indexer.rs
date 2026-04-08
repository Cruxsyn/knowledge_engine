use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tantivy::collector::TopDocs;
use tantivy::query::QueryParser;
use tantivy::schema::*;
use tantivy::{doc, Index, IndexReader, IndexWriter, ReloadPolicy, TantivyDocument};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub title: String,
    pub snippet: String,
    pub entity_type: String,
    pub score: f32,
}

/// Full-text search index backed by tantivy.
pub struct SearchIndex {
    index: Index,
    reader: IndexReader,
    writer: Mutex<IndexWriter>,
    // Schema field handles for fast access
    f_id: Field,
    f_title: Field,
    f_body: Field,
    f_entity_type: Field,
    f_tags: Field,
    f_created_at: Field,
}

impl SearchIndex {
    /// Create or open a tantivy index at the given directory path.
    pub fn new(index_path: PathBuf) -> Self {
        std::fs::create_dir_all(&index_path).expect("Failed to create search index directory");

        let mut schema_builder = Schema::builder();
        let f_id = schema_builder.add_text_field("id", STRING | STORED);
        let f_title = schema_builder.add_text_field("title", TEXT | STORED);
        let f_body = schema_builder.add_text_field("body", TEXT | STORED);
        let f_entity_type = schema_builder.add_text_field("entity_type", STRING | STORED);
        let f_tags = schema_builder.add_text_field("tags", TEXT | STORED);
        let f_created_at = schema_builder.add_text_field("created_at", STRING | STORED);
        let schema = schema_builder.build();

        let index = Index::open_or_create(
            tantivy::directory::MmapDirectory::open(&index_path)
                .expect("Failed to open mmap directory for search index"),
            schema,
        )
        .expect("Failed to open or create tantivy index");

        let reader = index
            .reader_builder()
            .reload_policy(ReloadPolicy::OnCommitWithDelay)
            .try_into()
            .expect("Failed to create index reader");

        let writer = index
            .writer(50_000_000) // 50 MB heap
            .expect("Failed to create index writer");

        SearchIndex {
            index,
            reader,
            writer: Mutex::new(writer),
            f_id,
            f_title,
            f_body,
            f_entity_type,
            f_tags,
            f_created_at,
        }
    }

    /// Add (or replace) a document in the index.
    pub fn add_document(
        &self,
        id: &str,
        title: &str,
        body: &str,
        entity_type: &str,
        tags: &str,
        created_at: &str,
    ) {
        let mut writer = self.writer.lock().expect("Failed to lock index writer");

        // Remove any existing document with this id first
        let id_term = tantivy::Term::from_field_text(self.f_id, id);
        writer.delete_term(id_term);

        writer
            .add_document(doc!(
                self.f_id => id,
                self.f_title => title,
                self.f_body => body,
                self.f_entity_type => entity_type,
                self.f_tags => tags,
                self.f_created_at => created_at,
            ))
            .expect("Failed to add document to index");

        writer.commit().expect("Failed to commit index writer");
    }

    /// Remove a document from the index by id.
    pub fn remove_document(&self, id: &str) {
        let mut writer = self.writer.lock().expect("Failed to lock index writer");
        let id_term = tantivy::Term::from_field_text(self.f_id, id);
        writer.delete_term(id_term);
        writer.commit().expect("Failed to commit index writer");
    }

    /// Run a full-text search query across title, body, and tags.
    ///
    /// Optionally filter by `entity_type` (e.g. "concept", "note", "capture").
    /// Returns at most `limit` results ordered by relevance score.
    pub fn search(
        &self,
        query: &str,
        entity_type_filter: Option<&str>,
        limit: usize,
    ) -> Vec<SearchResult> {
        let searcher = self.reader.searcher();

        let query_parser =
            QueryParser::for_index(&self.index, vec![self.f_title, self.f_body, self.f_tags]);

        let parsed_query = match query_parser.parse_query(query) {
            Ok(q) => q,
            Err(e) => {
                log::warn!("Failed to parse search query '{}': {}", query, e);
                return Vec::new();
            }
        };

        let top_docs = match searcher.search(&parsed_query, &TopDocs::with_limit(limit)) {
            Ok(docs) => docs,
            Err(e) => {
                log::error!("Search execution failed: {}", e);
                return Vec::new();
            }
        };

        let mut results = Vec::new();

        for (score, doc_address) in top_docs {
            let retrieved: TantivyDocument = match searcher.doc(doc_address) {
                Ok(d) => d,
                Err(_) => continue,
            };

            let id = field_text(&retrieved, self.f_id);
            let title = field_text(&retrieved, self.f_title);
            let body = field_text(&retrieved, self.f_body);
            let entity_type = field_text(&retrieved, self.f_entity_type);

            // Apply entity_type filter if specified
            if let Some(filter) = entity_type_filter {
                if entity_type != filter {
                    continue;
                }
            }

            // Build a snippet: take the first 200 characters of the body
            let snippet = if body.len() > 200 {
                format!("{}...", &body[..body.char_indices().take(200).last().map(|(i, _)| i).unwrap_or(body.len())])
            } else {
                body
            };

            results.push(SearchResult {
                id,
                title,
                snippet,
                entity_type,
                score,
            });
        }

        results
    }

    /// Drop all documents and re-index everything from the database.
    pub fn reindex_all(&self, conn: &Connection) {
        log::info!("Starting full reindex of search index...");

        {
            let mut writer = self.writer.lock().expect("Failed to lock index writer");
            writer.delete_all_documents().expect("Failed to clear index");
            writer.commit().expect("Failed to commit after clearing index");
        }

        // Index concepts
        let mut concept_count = 0u64;
        {
            let mut stmt = conn
                .prepare(
                    "SELECT c.id, c.name, c.definition, c.created_at,
                            COALESCE(GROUP_CONCAT(t.name, ', '), '') AS tags
                     FROM concepts c
                     LEFT JOIN entity_tags et ON et.entity_id = c.id AND et.entity_type = 'concept'
                     LEFT JOIN tags t ON t.id = et.tag_id
                     GROUP BY c.id",
                )
                .expect("Failed to prepare concept query for reindex");

            let rows = stmt
                .query_map([], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                    ))
                })
                .expect("Failed to query concepts for reindex");

            for row in rows {
                if let Ok((id, name, definition, created_at, tags)) = row {
                    self.add_document(&id, &name, &definition, "concept", &tags, &created_at);
                    concept_count += 1;
                }
            }
        }

        // Index atomic notes
        let mut note_count = 0u64;
        {
            let mut stmt = conn
                .prepare(
                    "SELECT n.id, n.title, n.content, n.created_at,
                            COALESCE(GROUP_CONCAT(t.name, ', '), '') AS tags
                     FROM atomic_notes n
                     LEFT JOIN entity_tags et ON et.entity_id = n.id AND et.entity_type = 'note'
                     LEFT JOIN tags t ON t.id = et.tag_id
                     GROUP BY n.id",
                )
                .expect("Failed to prepare notes query for reindex");

            let rows = stmt
                .query_map([], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                    ))
                })
                .expect("Failed to query notes for reindex");

            for row in rows {
                if let Ok((id, title, content, created_at, tags)) = row {
                    self.add_document(&id, &title, &content, "note", &tags, &created_at);
                    note_count += 1;
                }
            }
        }

        // Index captures
        let mut capture_count = 0u64;
        {
            let mut stmt = conn
                .prepare(
                    "SELECT c.id, c.title, c.content, c.created_at,
                            COALESCE(GROUP_CONCAT(t.name, ', '), '') AS tags
                     FROM captures c
                     LEFT JOIN entity_tags et ON et.entity_id = c.id AND et.entity_type = 'capture'
                     LEFT JOIN tags t ON t.id = et.tag_id
                     GROUP BY c.id",
                )
                .expect("Failed to prepare captures query for reindex");

            let rows = stmt
                .query_map([], |row| {
                    Ok((
                        row.get::<_, String>(0)?,
                        row.get::<_, String>(1)?,
                        row.get::<_, String>(2)?,
                        row.get::<_, String>(3)?,
                        row.get::<_, String>(4)?,
                    ))
                })
                .expect("Failed to query captures for reindex");

            for row in rows {
                if let Ok((id, title, content, created_at, tags)) = row {
                    self.add_document(&id, &title, &content, "capture", &tags, &created_at);
                    capture_count += 1;
                }
            }
        }

        log::info!(
            "Reindex complete: {} concepts, {} notes, {} captures",
            concept_count,
            note_count,
            capture_count
        );
    }
}

/// Extract the first text value for a field from a tantivy document.
fn field_text(doc: &TantivyDocument, field: Field) -> String {
    doc.get_first(field)
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}
