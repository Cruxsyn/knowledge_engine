use notify::{
    Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher,
};
use std::path::PathBuf;
use std::sync::mpsc::Sender;
use std::time::{Duration, Instant};

/// Vault-level file event distilled from raw `notify` events.
#[derive(Debug, Clone, serde::Serialize)]
pub struct VaultEvent {
    pub kind: VaultEventKind,
    pub path: PathBuf,
}

#[derive(Debug, Clone, serde::Serialize)]
pub enum VaultEventKind {
    Created,
    Modified,
    Deleted,
}

/// Wraps a [`RecommendedWatcher`] to watch a vault directory for `.md` file
/// changes.  Events are debounced (500 ms) and forwarded over the provided
/// channel.
pub struct VaultWatcher {
    _watcher: RecommendedWatcher,
}

impl VaultWatcher {
    /// Start watching `vault_path` recursively.  Filtered, debounced
    /// [`VaultEvent`]s are sent to `tx`.
    ///
    /// The returned `VaultWatcher` keeps the underlying OS watcher alive;
    /// dropping it stops watching.
    pub fn start(vault_path: PathBuf, tx: Sender<VaultEvent>) -> Result<Self, String> {
        let debounce_ms = 500u128;

        // We keep a small hashmap of (path -> last_event_time) for debouncing.
        let debounce_state = std::sync::Arc::new(std::sync::Mutex::new(
            std::collections::HashMap::<PathBuf, Instant>::new(),
        ));

        let state = debounce_state.clone();
        let tx_clone = tx.clone();

        let mut watcher = RecommendedWatcher::new(
            move |result: Result<Event, notify::Error>| {
                let event = match result {
                    Ok(e) => e,
                    Err(e) => {
                        log::error!("Vault watcher error: {}", e);
                        return;
                    }
                };

                let kind = match event.kind {
                    EventKind::Create(_) => VaultEventKind::Created,
                    EventKind::Modify(_) => VaultEventKind::Modified,
                    EventKind::Remove(_) => VaultEventKind::Deleted,
                    _ => return,
                };

                for path in event.paths {
                    // Only care about markdown files
                    if path.extension().and_then(|e| e.to_str()) != Some("md") {
                        continue;
                    }

                    // Debounce: skip if we already sent an event for this path
                    // within the last `debounce_ms`.
                    let now = Instant::now();
                    let mut map = state.lock().unwrap();
                    if let Some(last) = map.get(&path) {
                        if now.duration_since(*last) < Duration::from_millis(debounce_ms as u64) {
                            continue;
                        }
                    }
                    map.insert(path.clone(), now);
                    drop(map);

                    let vault_event = VaultEvent {
                        kind: kind.clone(),
                        path,
                    };

                    if let Err(e) = tx_clone.send(vault_event) {
                        log::error!("Failed to send vault event: {}", e);
                    }
                }
            },
            Config::default(),
        )
        .map_err(|e| format!("Failed to create watcher: {}", e))?;

        watcher
            .watch(&vault_path, RecursiveMode::Recursive)
            .map_err(|e| format!("Failed to watch path {}: {}", vault_path.display(), e))?;

        log::info!("Vault watcher started on {}", vault_path.display());

        Ok(VaultWatcher {
            _watcher: watcher,
        })
    }
}
