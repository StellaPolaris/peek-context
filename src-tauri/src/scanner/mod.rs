use crate::models::{
    EnabledPluginInfo, EnabledPluginsResponse, PluginEnabledScope, ProjectEnabledPlugins, Tool,
    ToolFrontmatter, ToolScope, ToolType,
};
use serde_json::Value;
use gray_matter::{engine::YAML, Matter};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

/// Represents where a plugin is enabled and with what scope
#[derive(Debug, Clone)]
struct PluginEnablement {
    scope: ToolScope,
    project_root: Option<String>,
}

/// Scan all tool sources: enabled plugins, global user tools, and project tools
pub fn scan_all(project_roots: &[String]) -> Vec<Tool> {
    let mut tools = Vec::new();

    // 1. Get enabled plugins first to know what to scan
    let enabled_plugins = get_enabled_plugins(project_roots);

    // Build lookup: plugin_id -> list of enablements (scope + project_root)
    let mut plugin_enablements: HashMap<String, Vec<PluginEnablement>> = HashMap::new();

    // User-enabled plugins -> Global scope
    for plugin in &enabled_plugins.user_enabled {
        plugin_enablements
            .entry(plugin.plugin_id.clone())
            .or_default()
            .push(PluginEnablement {
                scope: ToolScope::Global,
                project_root: None,
            });
    }

    // Project-enabled plugins -> Project scope with project_root
    for project in &enabled_plugins.project_enabled {
        for plugin in &project.enabled_plugins {
            plugin_enablements
                .entry(plugin.plugin_id.clone())
                .or_default()
                .push(PluginEnablement {
                    scope: ToolScope::Project,
                    project_root: Some(project.project_path.clone()),
                });
        }
    }

    // 2. Scan enabled plugin tools only
    if let Some(home) = dirs::home_dir() {
        let plugins_dir = home.join(".claude/plugins/marketplaces");
        if plugins_dir.exists() {
            tools.extend(scan_plugins(&plugins_dir, &plugin_enablements));
        }

        // 3. Scan user global tools (editable)
        let global_claude = home.join(".claude");
        if global_claude.exists() {
            tools.extend(scan_directory_tools(&global_claude, ToolScope::Global, None, None, None));
        }
    }

    // 4. Scan project tools (editable)
    for root in project_roots {
        let root_path = PathBuf::from(root);
        let claude_dir = root_path.join(".claude");
        if claude_dir.exists() {
            let project_name = root_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string();
            tools.extend(scan_directory_tools(
                &claude_dir,
                ToolScope::Project,
                Some(root.clone()),
                None,
                Some(project_name),
            ));
        }
    }

    tools
}

/// Scan the plugins directory structure, only including enabled plugins
fn scan_plugins(plugins_dir: &Path, plugin_enablements: &HashMap<String, Vec<PluginEnablement>>) -> Vec<Tool> {
    let mut tools = Vec::new();

    // Iterate through marketplaces
    for marketplace_entry in WalkDir::new(plugins_dir)
        .min_depth(1)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if !marketplace_entry.file_type().is_dir() {
            continue;
        }

        let marketplace_name = marketplace_entry
            .file_name()
            .to_str()
            .unwrap_or("unknown")
            .to_string();

        let plugins_path = marketplace_entry.path().join("plugins");
        if !plugins_path.exists() {
            continue;
        }

        // Iterate through plugins
        for plugin_entry in WalkDir::new(&plugins_path)
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if !plugin_entry.file_type().is_dir() {
                continue;
            }

            let plugin_name = plugin_entry
                .file_name()
                .to_str()
                .unwrap_or("unknown")
                .to_string();

            // Build the plugin_id to check against enabled plugins
            let plugin_id = format!("{}@{}", plugin_name, marketplace_name);

            // Only scan if this plugin is enabled somewhere
            if let Some(enablements) = plugin_enablements.get(&plugin_id) {
                // Determine the scope: if enabled globally (user-level), use Global
                // If only project-enabled, use Project scope with project_root
                // We prefer Global since it makes the tool available everywhere
                let has_global = enablements.iter().any(|e| e.scope == ToolScope::Global);

                if has_global {
                    // Plugin is user-enabled globally - scan once with Global scope
                    tools.extend(scan_directory_tools(
                        plugin_entry.path(),
                        ToolScope::Global,
                        None,
                        Some(plugin_name.clone()),
                        Some(marketplace_name.clone()),
                    ));
                } else {
                    // Plugin is only project-enabled - create tool entries for each project
                    for enablement in enablements {
                        if enablement.scope == ToolScope::Project {
                            tools.extend(scan_directory_tools(
                                plugin_entry.path(),
                                ToolScope::Project,
                                enablement.project_root.clone(),
                                Some(plugin_name.clone()),
                                Some(marketplace_name.clone()),
                            ));
                        }
                    }
                }
            }
            // If plugin is not in enablements, skip it entirely
        }
    }

    tools
}

/// Scan a directory for tools (commands, agents, skills, hooks)
fn scan_directory_tools(
    base_path: &Path,
    scope: ToolScope,
    project_root: Option<String>,
    plugin_name: Option<String>,
    marketplace_or_project: Option<String>,
) -> Vec<Tool> {
    let mut tools = Vec::new();

    // Scan commands/
    let commands_dir = base_path.join("commands");
    if commands_dir.exists() {
        tools.extend(scan_markdown_files(
            &commands_dir,
            ToolType::Command,
            scope.clone(),
            project_root.clone(),
            plugin_name.clone(),
            marketplace_or_project.clone(),
        ));
    }

    // Scan agents/
    let agents_dir = base_path.join("agents");
    if agents_dir.exists() {
        tools.extend(scan_markdown_files(
            &agents_dir,
            ToolType::Agent,
            scope.clone(),
            project_root.clone(),
            plugin_name.clone(),
            marketplace_or_project.clone(),
        ));
    }

    // Scan skills/*/SKILL.md
    let skills_dir = base_path.join("skills");
    if skills_dir.exists() {
        for skill_entry in WalkDir::new(&skills_dir)
            .min_depth(1)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if !skill_entry.file_type().is_dir() {
                continue;
            }

            let skill_md = skill_entry.path().join("SKILL.md");
            if skill_md.exists() {
                if let Some(tool) = parse_tool_file(
                    &skill_md,
                    ToolType::Skill,
                    scope.clone(),
                    project_root.clone(),
                    plugin_name.clone(),
                    marketplace_or_project.clone(),
                ) {
                    tools.push(tool);
                }
            }
        }
    }

    // Scan hooks/hooks.json
    let hooks_file = base_path.join("hooks").join("hooks.json");
    if hooks_file.exists() {
        if let Some(tool) = parse_hook_file(
            &hooks_file,
            scope.clone(),
            project_root.clone(),
            plugin_name.clone(),
            marketplace_or_project.clone(),
        ) {
            tools.push(tool);
        }
    }

    tools
}

/// Scan a directory for markdown files
fn scan_markdown_files(
    dir: &Path,
    tool_type: ToolType,
    scope: ToolScope,
    project_root: Option<String>,
    plugin_name: Option<String>,
    marketplace_or_project: Option<String>,
) -> Vec<Tool> {
    let mut tools = Vec::new();

    for entry in WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
    {
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            if let Some(tool) = parse_tool_file(
                path,
                tool_type.clone(),
                scope.clone(),
                project_root.clone(),
                plugin_name.clone(),
                marketplace_or_project.clone(),
            ) {
                tools.push(tool);
            }
        }
    }

    tools
}

/// Parse a markdown tool file with frontmatter
fn parse_tool_file(
    path: &Path,
    tool_type: ToolType,
    scope: ToolScope,
    project_root: Option<String>,
    plugin_name: Option<String>,
    marketplace_or_project: Option<String>,
) -> Option<Tool> {
    let content = fs::read_to_string(path).ok()?;
    let matter = Matter::<YAML>::new();
    let result = matter.parse(&content);

    let frontmatter: ToolFrontmatter = result
        .data
        .and_then(|d| d.deserialize().ok())
        .unwrap_or_default();

    // For skills, use the parent directory name as fallback (e.g., "my-skill" from skills/my-skill/SKILL.md)
    // For commands/agents, use the filename stem
    let name = if tool_type == ToolType::Skill {
        path.parent()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string()
    } else {
        path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("unknown")
            .to_string()
    };

    let last_modified = fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let path_str = path.to_string_lossy().to_string();
    let id = generate_id(&path_str);

    // Calculate context characters from name + description (these go into Claude's context window)
    let context_characters = frontmatter.name.as_ref().map_or(0, |n| n.len())
        + frontmatter.description.as_ref().map_or(0, |d| d.len());

    Some(Tool {
        id,
        name: frontmatter.name.clone().unwrap_or(name),
        tool_type,
        scope: scope.clone(),
        path: path_str,
        project_root,
        plugin_name: plugin_name.clone(),
        marketplace: marketplace_or_project,
        frontmatter,
        content,
        last_modified,
        is_editable: plugin_name.is_none(),  // Plugin-sourced tools are read-only
        context_characters: context_characters as u32,
    })
}

/// Parse a hooks.json file
fn parse_hook_file(
    path: &Path,
    scope: ToolScope,
    project_root: Option<String>,
    plugin_name: Option<String>,
    marketplace_or_project: Option<String>,
) -> Option<Tool> {
    let content = fs::read_to_string(path).ok()?;

    // Try to parse as JSON to get description
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;
    let description = json
        .get("description")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    let last_modified = fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let path_str = path.to_string_lossy().to_string();
    let id = generate_id(&path_str);

    let name = plugin_name.clone().unwrap_or_else(|| "hooks".to_string());

    // Calculate context characters from description (hooks only have description)
    let context_characters = description.as_ref().map_or(0, |d| d.len()) as u32;

    Some(Tool {
        id,
        name: format!("{} hooks", name),
        tool_type: ToolType::Hook,
        scope: scope.clone(),
        path: path_str,
        project_root,
        plugin_name: plugin_name.clone(),
        marketplace: marketplace_or_project,
        frontmatter: ToolFrontmatter {
            description,
            ..Default::default()
        },
        content,
        last_modified,
        is_editable: plugin_name.is_none(),  // Plugin-sourced tools are read-only
        context_characters,
    })
}

/// Generate a unique ID from a path
fn generate_id(path: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Discover projects by scanning for .claude directories
pub fn discover_projects(roots: &[PathBuf]) -> Vec<String> {
    let mut projects = Vec::new();

    // Search common locations if no roots provided
    let search_roots: Vec<PathBuf> = if roots.is_empty() {
        if let Some(home) = dirs::home_dir() {
            vec![
                home.join("Projects"),
                home.join("Developer"),
                home.join("Code"),
                home.join("repos"),
                home.join("dev"),
            ]
        } else {
            vec![]
        }
    } else {
        roots.to_vec()
    };

    for root in search_roots {
        if !root.exists() {
            continue;
        }

        for entry in WalkDir::new(&root)
            .max_depth(4)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_str().unwrap_or("");
                // Allow .claude through, filter other hidden dirs
                name == ".claude" || (!name.starts_with('.') && name != "node_modules" && name != "target")
            })
            .filter_map(|e| e.ok())
        {
            if entry.file_name() == ".claude" && entry.file_type().is_dir() {
                if let Some(parent) = entry.path().parent() {
                    projects.push(parent.to_string_lossy().to_string());
                }
            }
        }
    }

    projects
}

/// Parse enabled plugins from a settings JSON object
fn parse_enabled_plugins_from_json(
    json: &Value,
    marketplace_default: &str,
    scope: PluginEnabledScope,
) -> Vec<EnabledPluginInfo> {
    let mut plugins = Vec::new();

    if let Some(enabled) = json.get("enabledPlugins").and_then(|v| v.as_object()) {
        for (plugin_id, value) in enabled {
            // Only include if enabled (value is true)
            if value.as_bool().unwrap_or(false) {
                // Parse plugin_id format: "plugin-name@marketplace"
                let parts: Vec<&str> = plugin_id.split('@').collect();
                let (plugin_name, marketplace) = if parts.len() >= 2 {
                    (parts[0].to_string(), parts[1].to_string())
                } else {
                    (plugin_id.clone(), marketplace_default.to_string())
                };

                plugins.push(EnabledPluginInfo {
                    plugin_id: plugin_id.clone(),
                    plugin_name,
                    marketplace,
                    scope: scope.clone(),
                });
            }
        }
    }

    plugins
}

/// Get all available plugin IDs from the marketplace directory
fn get_available_plugins() -> Vec<String> {
    let mut plugins = Vec::new();

    if let Some(home) = dirs::home_dir() {
        let marketplaces_dir = home.join(".claude/plugins/marketplaces");

        if marketplaces_dir.exists() {
            // Iterate through marketplaces
            for marketplace_entry in WalkDir::new(&marketplaces_dir)
                .min_depth(1)
                .max_depth(1)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if !marketplace_entry.file_type().is_dir() {
                    continue;
                }

                let marketplace_name = marketplace_entry
                    .file_name()
                    .to_str()
                    .unwrap_or("unknown")
                    .to_string();

                // Check plugins/ directory
                let plugins_path = marketplace_entry.path().join("plugins");
                if plugins_path.exists() {
                    for plugin_entry in WalkDir::new(&plugins_path)
                        .min_depth(1)
                        .max_depth(1)
                        .into_iter()
                        .filter_map(|e| e.ok())
                    {
                        if plugin_entry.file_type().is_dir() {
                            let plugin_name = plugin_entry
                                .file_name()
                                .to_str()
                                .unwrap_or("unknown")
                                .to_string();
                            plugins.push(format!("{}@{}", plugin_name, marketplace_name));
                        }
                    }
                }

                // Check external_plugins/ directory
                let external_path = marketplace_entry.path().join("external_plugins");
                if external_path.exists() {
                    for plugin_entry in WalkDir::new(&external_path)
                        .min_depth(1)
                        .max_depth(1)
                        .into_iter()
                        .filter_map(|e| e.ok())
                    {
                        if plugin_entry.file_type().is_dir() {
                            let plugin_name = plugin_entry
                                .file_name()
                                .to_str()
                                .unwrap_or("unknown")
                                .to_string();
                            plugins.push(format!("{}@{}", plugin_name, marketplace_name));
                        }
                    }
                }
            }
        }
    }

    plugins
}

/// Get enabled plugins for all projects and the user level
pub fn get_enabled_plugins(project_roots: &[String]) -> EnabledPluginsResponse {
    let mut user_enabled = Vec::new();
    let mut project_enabled = Vec::new();

    // 1. Read user-level enabled plugins from ~/.claude/settings.json
    if let Some(home) = dirs::home_dir() {
        let global_settings = home.join(".claude/settings.json");
        if global_settings.exists() {
            if let Ok(content) = fs::read_to_string(&global_settings) {
                if let Ok(json) = serde_json::from_str::<Value>(&content) {
                    user_enabled = parse_enabled_plugins_from_json(
                        &json,
                        "claude-plugins-official",
                        PluginEnabledScope::User,
                    );
                }
            }
        }
    }

    // 2. Read project-level enabled plugins for each project
    for root in project_roots {
        let root_path = PathBuf::from(root);
        let claude_dir = root_path.join(".claude");

        if !claude_dir.exists() {
            continue;
        }

        let mut project_plugins = Vec::new();

        // Check settings.json (project scope)
        let settings_json = claude_dir.join("settings.json");
        if settings_json.exists() {
            if let Ok(content) = fs::read_to_string(&settings_json) {
                if let Ok(json) = serde_json::from_str::<Value>(&content) {
                    project_plugins.extend(parse_enabled_plugins_from_json(
                        &json,
                        "claude-plugins-official",
                        PluginEnabledScope::Project,
                    ));
                }
            }
        }

        // Check settings.local.json (local scope)
        let settings_local = claude_dir.join("settings.local.json");
        if settings_local.exists() {
            if let Ok(content) = fs::read_to_string(&settings_local) {
                if let Ok(json) = serde_json::from_str::<Value>(&content) {
                    project_plugins.extend(parse_enabled_plugins_from_json(
                        &json,
                        "claude-plugins-official",
                        PluginEnabledScope::Local,
                    ));
                }
            }
        }

        if !project_plugins.is_empty() || claude_dir.exists() {
            project_enabled.push(ProjectEnabledPlugins {
                project_path: root.clone(),
                enabled_plugins: project_plugins,
            });
        }
    }

    // 3. Get all available plugins
    let available_plugins = get_available_plugins();

    EnabledPluginsResponse {
        user_enabled,
        project_enabled,
        available_plugins,
    }
}
