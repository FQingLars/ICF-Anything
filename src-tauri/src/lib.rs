mod db;

use std::path::PathBuf;
use tauri::Manager;

static EMBEDDED_DB: &[u8] = include_bytes!("../seed.db");

struct AppState {
    db_path: PathBuf,
}

#[tauri::command]
fn search_diagnoses(state: tauri::State<AppState>, query: String) -> Result<Vec<String>, String> {
    db::search_diagnoses(&state.db_path, &query)
}

#[tauri::command]
fn get_results(state: tauri::State<AppState>, diagnosis: String) -> Result<Vec<db::ResultRow>, String> {
    db::get_results(&state.db_path, &diagnosis)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to resolve app data dir");
            let db_dir = app_dir.join("icf-anything").join("db");
            std::fs::create_dir_all(&db_dir).expect("failed to create db directory");
            let db_path = db_dir.join("icf.db");
            db::init_db(&db_path, EMBEDDED_DB).expect("failed to initialize database");
            app.manage(AppState { db_path });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![search_diagnoses, get_results])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
