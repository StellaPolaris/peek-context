mod commands;
mod models;
mod scanner;

use commands::{discover_projects, get_enabled_plugins, get_settings, read_tool, save_settings, save_tool, scan_all_tools};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            scan_all_tools,
            discover_projects,
            read_tool,
            save_tool,
            get_settings,
            save_settings,
            get_enabled_plugins,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
