use crate::models::{AppSettings, EnabledPluginsResponse, Tool};
use crate::scanner;
use std::fs;
use std::path::PathBuf;

const SETTINGS_FILE: &str = ".config/tool-viewer/settings.json";

fn get_settings_path() -> Option<PathBuf> {
    dirs::home_dir().map(|home| home.join(SETTINGS_FILE))
}

#[tauri::command]
pub fn scan_all_tools(project_roots: Vec<String>) -> Result<Vec<Tool>, String> {
    Ok(scanner::scan_all(&project_roots))
}

#[tauri::command]
pub fn discover_projects(roots: Option<Vec<String>>) -> Result<Vec<String>, String> {
    let paths: Vec<PathBuf> = roots
        .unwrap_or_default()
        .into_iter()
        .map(PathBuf::from)
        .collect();
    Ok(scanner::discover_projects(&paths))
}

#[tauri::command]
pub fn read_tool(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_tool(path: String, content: String) -> Result<(), String> {
    // Safety check: don't allow editing plugin files
    if path.contains(".claude/plugins/") {
        return Err("Cannot edit plugin tools - they are read-only".to_string());
    }

    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_settings() -> Result<AppSettings, String> {
    let path = get_settings_path().ok_or("Could not determine home directory")?;

    if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&content).map_err(|e| e.to_string())
    } else {
        Ok(AppSettings::default())
    }
}

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    let path = get_settings_path().ok_or("Could not determine home directory")?;

    // Create parent directory if needed
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_enabled_plugins(project_roots: Vec<String>) -> Result<EnabledPluginsResponse, String> {
    Ok(scanner::get_enabled_plugins(&project_roots))
}
