use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ToolType {
    Command,
    Agent,
    Skill,
    Hook,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ToolScope {
    Global,  // From ~/.claude/ OR user-enabled plugins
    Project, // From <project>/.claude/ OR project-enabled plugins
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ToolFrontmatter {
    pub name: Option<String>,
    pub description: Option<String>,
    #[serde(rename = "argument-hint")]
    pub argument_hint: Option<String>,
    #[serde(rename = "allowed-tools")]
    pub allowed_tools: Option<Vec<String>>,
    pub tools: Option<String>,
    pub model: Option<String>,
    pub color: Option<String>,
    pub version: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tool {
    pub id: String,
    pub name: String,
    pub tool_type: ToolType,
    pub scope: ToolScope,
    pub path: String,
    pub project_root: Option<String>,
    pub plugin_name: Option<String>,
    pub marketplace: Option<String>,
    pub frontmatter: ToolFrontmatter,
    pub content: String,
    pub last_modified: u64,
    pub is_editable: bool,
    pub context_characters: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCounts {
    pub commands: u32,
    pub agents: u32,
    pub skills: u32,
    pub hooks: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub path: String,
    pub name: String,
    pub tool_count: ToolCounts,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Plugin {
    pub name: String,
    pub description: Option<String>,
    pub marketplace: String,
    pub path: String,
    pub tool_count: ToolCounts,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub project_roots: Vec<String>,
    pub last_scan_time: Option<u64>,
}

// Plugin enabled status tracking
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum PluginEnabledScope {
    User,      // Enabled globally in ~/.claude/settings.json
    Project,   // Enabled in project settings.json
    Local,     // Enabled in project settings.local.json
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnabledPluginInfo {
    pub plugin_id: String,           // e.g., "code-review@claude-plugins-official"
    pub plugin_name: String,         // e.g., "code-review"
    pub marketplace: String,         // e.g., "claude-plugins-official"
    pub scope: PluginEnabledScope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectEnabledPlugins {
    pub project_path: String,
    pub enabled_plugins: Vec<EnabledPluginInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnabledPluginsResponse {
    pub user_enabled: Vec<EnabledPluginInfo>,          // Global user-level
    pub project_enabled: Vec<ProjectEnabledPlugins>,   // Per-project
    pub available_plugins: Vec<String>,                // All plugin IDs in marketplace
}
