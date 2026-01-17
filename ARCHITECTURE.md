# Claude Tools Viewer - Technical Documentation

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Purpose & Goals](#purpose--goals)
3. [Features Implemented](#features-implemented)
4. [System Architecture](#system-architecture)
5. [Data Model](#data-model)
6. [Directory Structure](#directory-structure)
7. [Technology Stack](#technology-stack)
8. [Component Deep Dive](#component-deep-dive)
9. [Data Flow](#data-flow)
10. [IPC Communication](#ipc-communication)
11. [Styling System](#styling-system)
12. [Development Workflow](#development-workflow)
13. [Future Ideas](#future-ideas)
14. [Known Limitations](#known-limitations)

---

## Problem Statement

### The Challenge

Claude Code users create and accumulate **custom tools** over time:
- **Slash commands** - Custom commands triggered with `/command-name`
- **Agents/Subagents** - Specialized AI agents for specific tasks
- **Skills** - Contextual capabilities that Claude can invoke
- **Hooks** - Event-driven scripts that run on specific triggers

These tools are scattered across multiple locations:
1. **Global user scope**: `~/.claude/` directory
2. **Per-project scope**: `<project>/.claude/` directories
3. **Plugin-based**: `~/.claude/plugins/marketplaces/<marketplace>/plugins/<plugin>/`

### Pain Points

1. **Discovery Problem**: Users don't have visibility into what tools exist across all their projects
2. **Fragmentation**: Tools are spread across global directories, multiple project directories, and plugin installations
3. **No Central Inventory**: No single place to see all available tools, their types, and where they came from
4. **Edit Friction**: Editing tools requires navigating to the correct directory and opening files manually
5. **Scope Confusion**: Unclear which tools are global vs project-specific
6. **Git Tracking Inconsistency**: Some tools are git-tracked, others aren't, making it hard to manage

### Discovery: Actual Claude Directory Structure

During development, we explored the actual `~/.claude/` structure and discovered it differs from initial assumptions:

**What we expected:**
```
~/.claude/
├── commands/*.md          # User global commands
├── agents/*.md            # User global agents
└── skills/*/SKILL.md      # User global skills
```

**What actually exists:**
```
~/.claude/
├── settings.json
├── plugins/
│   ├── known_marketplaces.json
│   └── marketplaces/
│       └── claude-plugins-official/
│           └── plugins/
│               └── <plugin-name>/
│                   ├── .claude-plugin/plugin.json
│                   ├── commands/*.md
│                   ├── agents/*.md
│                   ├── skills/*/SKILL.md
│                   └── hooks/hooks.json
```

**Decision**: The app supports BOTH structures:
- Plugin-based tools (read-only)
- User-created global tools at `~/.claude/[commands|agents|skills]/` (even if currently empty)
- Project-specific tools at `<project>/.claude/[commands|agents|skills]/` (editable)

---

## Purpose & Goals

### Primary Goals

1. **Unified Discovery & Inventory**
   - Scan and index all custom tools across global and project scopes (including enabled plugin tools)
   - Provide a single interface to see everything that exists

2. **Browse, Filter & Search**
   - View all tools with filtering by type, scope, and project
   - Full-text search across tool names and content

3. **Clear Scope Representation**
   - Visual distinction between global and project tools
   - Plugin-sourced tools marked with `plugin:{plugin-name}` badge
   - Show which projects add tools beyond the global set

4. **Edit Capability**
   - Markdown editor with live preview for editable tools
   - Explicit save with Cmd+S
   - Visual indicator for unsaved changes (dirty state)

5. **Plugin Tool Visibility**
   - Plugin-sourced tools appear alongside regular tools with `plugin:{plugin-name}` badge
   - Only enabled plugins are scanned and displayed
   - Plugin tools are read-only

### Secondary Goals

- **Home Overview**: Visual representation of tool distribution across projects
- **Fast Scanning**: Rust-based filesystem operations for speed
- **macOS Native Feel**: Desktop app that feels at home on macOS

### Non-Goals (v1)

- Plugin package editing or marketplace interaction
- Windows/Linux support
- Advanced ignore rules (.gitignore parsing)
- Automatic tool synchronization

---

## Features Implemented

### Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Tool Discovery | ✅ | Scans plugins, global, and project directories |
| Tool Indexing | ✅ | Parses frontmatter and content from tool files |
| Type Filtering | ✅ | Filter by Command/Agent/Skill/Hook |
| Scope Filtering | ✅ | Filter by Global/Project |
| Search | ✅ | Search by name and content |
| Markdown Editor | ✅ | CodeMirror-based editor with syntax highlighting |
| Live Preview | ✅ | Real-time markdown preview alongside editor |
| Cmd+S Save | ✅ | Keyboard shortcut for saving |
| Dirty State | ✅ | Visual indicator for unsaved changes |
| Read-only Mode | ✅ | Plugin tools cannot be edited |
| Project Discovery | ✅ | Auto-discover projects with `.claude/` directories |
| Settings Persistence | ✅ | Save project roots and preferences |
| Resizable Panels | ✅ | Drag-to-resize between tool list/editor and editor/preview |
| Panel Layout Persistence | ✅ | Panel sizes saved to localStorage and restored on reload |
| Word Wrap | ✅ | Long lines wrap in the CodeMirror editor |
| Native Folder Picker | ✅ | System folder dialog for adding project roots |
| Responsive Card Layout | ✅ | Container queries for adaptive card grid with minimum widths |
| Enabled Plugin Scanning | ✅ | Only scans plugins that are enabled in settings |
| Discovery Feedback | ✅ | Visual feedback when scanning for projects (success/none/error) |
| Expandable Overview | ✅ | Hierarchical accordion view in Home View |
| Home Overview Panels | ✅ | Discovery status, scope breakdown, and conflict detection on Home |
| UI Animations | ✅ | Subtle animations for cards, buttons, and transitions |
| Cursor Styles | ✅ | Consistent cursor indicators for interactive elements |
| Sidebar Badge Counts | ✅ | Dynamic counts for Tools and Projects in sidebar |
| Breadcrumb Path Display | ✅ | Shows scope > type > filename when tool is selected |
| Project Context Filtering | ✅ | Filter to show all tools available in a project (inherited + local) |
| Effective Toolset View | ✅ | Flat searchable list showing all tools available in a project context |
| Project Tool Matrix | ✅ | Table view with projects as columns and tools as rows |
| View Mode Toggle | ✅ | Three-state toggle (editor-only, split, preview-only) with global persistence |
| File Timestamps | ✅ | Shows last modified date in tool header |
| Discard Changes | ✅ | Discard button to revert unsaved edits |
| Navigation Guards | ✅ | Prompts when navigating away with unsaved changes |
| Unsaved Changes Protection | ✅ | beforeunload handler warns on app close with dirty tools |
| Directory Status Indicators | ✅ | Shows tool type badges for scanned directories in Settings |
| Minimum Panel Widths | ✅ | Prevents panels from becoming too narrow with CSS min-width |
| Multi-Select Filters | ✅ | Checkbox-based type and scope filters with multiple selections |
| Auto-Refresh | ✅ | Tools view auto-refreshes every 60 seconds and on tab visibility |
| TypeSection Persistence | ✅ | Expand/collapse state persists across navigation and app restarts |
| URL Query Params | ✅ | Filter state syncs with URL for navigation from Home view |
| Welcome Screen | ✅ | Inline welcome message when no projects configured |
| Clickable Tool Counts | ✅ | Home view counts navigate to filtered Tools view |
| Plugin Source Badge | ✅ | Shows `plugin:{plugin-name}` badge on plugin-sourced tools |
| Context Character Count | ✅ | Shows frontmatter context usage (name + description chars) per tool and aggregated |
| Context Distribution Bar | ✅ | Visual stacked bar showing context by scope (amber=global, violet=project) |

### Views Implemented

1. **Home View** (`/`) - Overview dashboard with welcome screen (when no projects), clickable tool counts, context distribution bar, and expandable sections with SplitView for Global and Projects
2. **Tools View** (`/tools`) - Main view with tool list, checkbox filters, auto-refresh (60s), and editor
3. **Projects View** (`/projects`) - Overview of discovered projects with accordion-style expansion showing effective toolset, context distribution bar per project, persisted TypeSection states, and SplitView editor panel for selected tools
4. **Matrix View** (`/matrix`) - Table showing tool coverage across projects (tools as rows, projects as columns)
5. **Settings View** (`/settings`) - Configuration management with project discovery feedback

### UI Components

- Tool cards with type-colored glow effects and hover lift animation
- Type badges (Command/Agent/Skill/Hook)
- Scope badges (Global/Project)
- Split-view editor (CodeMirror + ReactMarkdown) with resizable panes, breadcrumb path display, and onClose callback
- Resizable panel dividers (drag to resize, layouts persisted)
- Sidebar navigation with dynamic badge counts
- Checkbox filter groups (type and scope with multi-select)
- `plugin:{plugin-name}` source badge on plugin-sourced tools
- Search input
- Native folder picker dialog (Settings)
- Expandable accordion sections (Home View)
- Home overview panels (discovery status, scope breakdown with context chars, context distribution bar)
- Discovery feedback alerts with animations (Settings)
- Accordion-style project cards with expandable effective toolset (Projects View)
- Effective tool row with type icon, name, scope badge, description, and selection state (Projects View)
- Tool breadcrumb component showing scope > type > filename
- Project tool matrix table with sticky headers (Matrix View)
- Confirmation dialog component for discard/navigation warnings
- View mode toggle buttons (editor/split/preview)
- Context bar component showing stacked context distribution by scope
- Context tag display for individual tools
- Tool metadata row with plugin badge, context tag, and last edited date

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Desktop Application                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Frontend                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │   Routes    │  │ Components  │  │  State (Zustand) │   │   │
│  │  │  - Tools    │  │  - ToolCard │  │  - toolsStore    │   │   │
│  │  │  - Projects │  │  - SplitView│  │  - settingsStore │   │   │
│  │  │  - Home     │  │  - Filters  │  │                  │   │   │
│  │  │  - Matrix   │  │  - Sidebar  │  │                  │   │   │
│  │  │  - Settings │  │  - Breadcrumb│ │                  │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  │                           │                               │   │
│  │                    Tauri IPC Layer                        │   │
│  │                    (invoke/listen)                        │   │
│  └───────────────────────────┼───────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐   │
│  │                    Rust Backend                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │   │
│  │  │  Commands   │  │   Scanner   │  │     Models      │   │   │
│  │  │  (IPC)      │  │  - Plugins  │  │  - Tool         │   │   │
│  │  │             │  │  - Global   │  │  - ToolType     │   │   │
│  │  │             │  │  - Project  │  │  - ToolScope    │   │   │
│  │  │             │  │  - Disk     │  │  - Frontmatter  │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘   │   │
│  │                           │                               │   │
│  │                    File System                            │   │
│  └───────────────────────────┼───────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │              File System                      │
        │  ~/.claude/plugins/...     (Plugin tools)    │
        │  ~/.claude/[commands|...]  (Global tools)    │
        │  <project>/.claude/...     (Project tools)   │
        └──────────────────────────────────────────────┘
```

### Component Responsibilities

#### Frontend (React + TypeScript)

| Component | Responsibility |
|-----------|----------------|
| `App.tsx` | Router setup, top-level component |
| Routes (`/routes/*`) | Page-level components for each view |
| Components (`/components/*`) | Reusable UI components |
| Stores (`/features/*/stores/*`) | State management with Zustand |
| `lib/tauri.ts` | IPC wrapper functions for Rust communication |

#### Backend (Rust)

| Module | Responsibility |
|--------|----------------|
| `lib.rs` | Tauri app setup, command registration |
| `main.rs` | Application entry point |
| `commands/mod.rs` | IPC command handlers |
| `scanner/mod.rs` | Filesystem scanning and tool discovery (only scans enabled plugins) |
| `models/mod.rs` | Data structures (Tool, ToolType, etc.) |

---

## Data Model

### Core Entities

#### Tool

The primary entity representing a custom tool (command, agent, skill, or hook).

```typescript
// TypeScript (Frontend)
interface Tool {
  id: string;              // Unique identifier (hash of path)
  name: string;            // Display name (from frontmatter or filename)
  toolType: ToolType;      // 'command' | 'agent' | 'skill' | 'hook'
  scope: ToolScope;        // 'global' | 'project'
  path: string;            // Absolute file path
  projectRoot?: string;    // If scope is 'project', the project directory
  pluginName?: string;     // If from a plugin, the plugin name (for `plugin:{name}` badge)
  marketplace?: string;    // Marketplace name (for plugins)
  frontmatter: ToolFrontmatter;  // Parsed YAML frontmatter
  content: string;         // Raw file content (includes frontmatter)
  lastModified: number;    // Unix timestamp
  isEditable: boolean;     // false for plugin tools
  contextCharacters: number; // Character count of name + description (context window usage)
}
```

```rust
// Rust (Backend)
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
    pub context_characters: u32,  // Character count of name + description
}
```

#### ToolType

```typescript
type ToolType = 'command' | 'agent' | 'skill' | 'hook';
```

Determined by the directory containing the tool:
- `commands/` → `command`
- `agents/` → `agent`
- `skills/*/SKILL.md` → `skill`
- `hooks/hooks.json` → `hook`

#### Tool Name Resolution

Tool names are determined with different fallback strategies depending on tool type:

**Commands & Agents:**
1. Use `name` field from YAML frontmatter (if present)
2. Fall back to filename without extension (e.g., `my-command.md` → "my-command")

**Skills:**
1. Use `name` field from SKILL.md frontmatter (if present)
2. Fall back to parent directory name (e.g., `skills/deploy-helper/SKILL.md` → "deploy-helper")

This distinction exists because skill files are always named `SKILL.md`, so the meaningful identifier is the containing directory name rather than the filename.

#### ToolScope

```typescript
type ToolScope = 'global' | 'project';
```

- **global**: Tools inside `~/.claude/[commands|agents|skills]/` OR from user-enabled plugins (editable for user tools, read-only for plugin tools)
- **project**: Tools inside `<project>/.claude/...` OR from project-enabled plugins (editable for project tools, read-only for plugin tools)

**Note:** Plugin-sourced tools are assigned scope based on where they are enabled:
- User-enabled plugins (`~/.claude/settings.json`) → `global` scope
- Project-enabled plugins (`<project>/.claude/settings.json`) → `project` scope with `projectRoot` set

Plugin tools are identified by the `pluginName` field and are always read-only (`isEditable: false`).

#### ToolFrontmatter

Parsed from YAML frontmatter at the top of tool files.

```typescript
interface ToolFrontmatter {
  name?: string;           // Override display name
  description?: string;    // Tool description (shown in cards)
  argumentHint?: string;   // For commands: argument syntax hint
  allowedTools?: string[]; // For commands: pre-approved tools
  tools?: string;          // For agents: comma-separated tool list
  model?: string;          // Model to use (haiku, sonnet, opus)
  color?: string;          // UI color hint
  version?: string;        // For skills: semantic version
}
```

#### AppSettings

Persisted user settings.

```typescript
interface AppSettings {
  projectRoots: string[];  // Directories to scan for projects
  lastScanTime?: number;   // Unix timestamp of last scan
}
```

### Tool File Formats

#### Commands (`commands/*.md`)

```yaml
---
description: Short description for /help
argument-hint: <required-arg> [optional-arg]
allowed-tools: [Read, Glob, Grep, Bash]
model: sonnet
---

# Command Instructions

Your markdown instructions here...
```

#### Agents (`agents/*.md`)

```yaml
---
name: agent-name
description: When this agent should be used
tools: Glob, Grep, Read, Write, Edit
model: sonnet
color: green
---

# Agent System Prompt

You are a specialized agent that...
```

#### Skills (`skills/*/SKILL.md`)

```yaml
---
name: skill-name
description: Trigger conditions - when Claude should use this skill
version: 1.0.0
---

# Skill Instructions

When activated, this skill...
```

#### Hooks (`hooks/hooks.json`)

```json
{
  "description": "Hook description",
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.sh"
          }
        ],
        "matcher": "Edit|Write|MultiEdit"
      }
    ]
  }
}
```

---

## Directory Structure

### Repository Layout

```
tool-viewer/
├── ARCHITECTURE.md              # This documentation file
├── package.json                 # NPM dependencies and scripts
├── package-lock.json            # NPM lockfile
├── tsconfig.json                # TypeScript config (references)
├── tsconfig.app.json            # TypeScript config for app
├── tsconfig.node.json           # TypeScript config for Node
├── vite.config.ts               # Vite bundler configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry point
│
├── src/                         # React Frontend Source
│   ├── main.tsx                 # Application entry point
│   ├── App.tsx                  # Root component with router
│   ├── index.css                # Global styles + Tailwind
│   │
│   ├── types/                   # TypeScript type definitions
│   │   └── rust-bindings.ts     # Types matching Rust structs
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── tauri.ts             # Tauri IPC wrapper functions
│   │   └── format.ts            # Number formatting and context aggregation utilities
│   │
│   ├── hooks/                   # Custom React hooks
│   │   └── useToolFiltersQueryParams.ts  # URL query param sync for filters
│   │
│   ├── features/                # Feature modules (domain logic)
│   │   ├── tools/
│   │   │   └── stores/
│   │   │       └── toolsStore.ts    # Tool state management
│   │   └── settings/
│   │       └── stores/
│   │           └── settingsStore.ts # Settings state management
│   │
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI primitives
│   │   │   ├── Badge.tsx        # Badge component
│   │   │   ├── ConfirmDialog.tsx # Reusable confirmation dialog
│   │   │   ├── ContextBar.tsx   # Context character distribution bar and count components
│   │   │   ├── PluginBadge.tsx  # Plugin source badge (plugin:{name})
│   │   │   ├── ResizeHandle.tsx # Reusable resize handle for panels
│   │   │   └── ToolBreadcrumb.tsx # Breadcrumb showing scope > type > filename
│   │   ├── layout/              # Layout components
│   │   │   ├── AppLayout.tsx    # Main app layout wrapper
│   │   │   └── SidebarNav.tsx   # Sidebar navigation with badge counts
│   │   ├── editor/              # Editor components
│   │   │   ├── SplitView.tsx    # Markdown editor + preview + breadcrumb
│   │   │   └── frontmatterHighlight.ts # Frontmatter line styling for CodeMirror
│   │   └── tools/               # Tool-specific components
│   │       ├── ToolCard.tsx     # Individual tool card
│   │       ├── ToolList.tsx     # Grid of tool cards
│   │       ├── ToolFilters.tsx  # Filter controls (type, scope, project)
│   │       ├── ToolMeta.tsx     # Shared tool metadata row (plugin/context/date)
│   │       ├── EffectiveToolRow.tsx # Tool row for effective toolset view
│   │       ├── TypeBadge.tsx    # Tool type badge
│   │       └── ScopeBadge.tsx   # Tool scope badge
│   │
│   └── routes/                  # Page components
│       ├── ToolsView.tsx        # Main tools list + editor
│       ├── ProjectsView.tsx     # Projects overview + effective toolset panel
│       ├── HomeView.tsx         # Home overview dashboard
│       ├── MatrixView.tsx       # Tool coverage matrix (tools × projects)
│       └── SettingsView.tsx     # Settings management
│
├── src-tauri/                   # Rust Backend Source
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # Tauri configuration
│   ├── build.rs                 # Build script
│   │
│   ├── capabilities/            # Tauri security capabilities
│   │   └── default.json         # Default window permissions
│   │
│   ├── icons/                   # Application icons
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   ├── 128x128@2x.png
│   │   ├── icon.icns            # macOS icon
│   │   └── icon.ico             # Windows icon
│   │
│   ├── gen/                     # Tauri generated files
│   │   └── schemas/             # JSON schemas for capabilities
│   │
│   └── src/                     # Rust source code
│       ├── main.rs              # Application entry point
│       ├── lib.rs               # Library entry, Tauri setup
│       ├── commands/            # IPC command handlers
│       │   └── mod.rs           # Command implementations
│       ├── models/              # Data structures
│       │   └── mod.rs           # Tool, ToolType, etc.
│       └── scanner/             # Filesystem scanning
│           └── mod.rs           # Scanner implementations
│
└── target/                      # Rust build output (gitignored)
    └── debug/
        └── tool-viewer          # Compiled binary
```

### Key File Descriptions

#### Frontend Files

| File | Purpose |
|------|---------|
| `src/main.tsx` | React DOM render, imports global CSS |
| `src/App.tsx` | BrowserRouter setup, route definitions |
| `src/index.css` | Tailwind v4 imports, custom theme variables, base styles, editor frontmatter styling |
| `src/types/rust-bindings.ts` | TypeScript interfaces matching Rust structs |
| `src/lib/tauri.ts` | Wrapper functions for `invoke()` calls to Rust |
| `src/lib/format.ts` | Abbreviated number formatting (1.2K) and context aggregation by scope (global/project) |
| `src/hooks/useToolFiltersQueryParams.ts` | Hook for syncing URL query params with filter state |
| `src/features/tools/stores/toolsStore.ts` | Zustand store for tool state, multi-select filtering (global/project scopes), dirty tracking, discard changes |
| `src/features/settings/stores/settingsStore.ts` | Zustand store for app settings, view mode, and TypeSection persistence |
| `src/components/editor/SplitView.tsx` | CodeMirror editor + ReactMarkdown preview + view mode toggle + timestamps |
| `src/components/editor/frontmatterHighlight.ts` | CodeMirror decorations to style frontmatter as plain text |
| `src/components/ui/ConfirmDialog.tsx` | Reusable confirmation dialog for warnings and prompts |
| `src/components/ui/ContextBar.tsx` | Stacked context bar (global/project) and inline ContextCount tag component |
| `src/components/ui/PluginBadge.tsx` | Plugin source badge rendered as `plugin:{name}` |
| `src/components/ui/ToolBreadcrumb.tsx` | Breadcrumb component showing tool location hierarchy |
| `src/components/layout/SidebarNav.tsx` | Sidebar navigation with dynamic badge counts |
| `src/routes/HomeView.tsx` | Home overview dashboard with welcome screen, clickable counts, context distribution bar, expandable sections with SplitView |
| `src/routes/ToolsView.tsx` | Main view combining list and editor with navigation guards, auto-refresh (60s) |
| `src/routes/ProjectsView.tsx` | Projects overview with effective toolset panel, context distribution bar, and navigation guards |
| `src/routes/SettingsView.tsx` | Settings with prominent discovery button, timestamps, directory indicators |
| `src/components/tools/ToolMeta.tsx` | Shared tool metadata row (plugin badge, context tag, last edited date) |
| `src/components/tools/EffectiveToolRow.tsx` | Tool row component for effective toolset view with shared metadata |
| `src/routes/MatrixView.tsx` | Tool coverage matrix (tools × projects) |

#### Backend Files

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Calls `tool_viewer_lib::run()` |
| `src-tauri/src/lib.rs` | Tauri Builder setup, command registration |
| `src-tauri/src/commands/mod.rs` | IPC handlers: `scan_all_tools`, `save_tool`, etc. |
| `src-tauri/src/models/mod.rs` | Rust structs with Serde derive for JSON serialization |
| `src-tauri/src/scanner/mod.rs` | Filesystem traversal, frontmatter parsing, enabled plugin detection |

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI component library |
| **TypeScript** | 5.9.x | Type-safe JavaScript |
| **Vite** | 7.x | Build tool and dev server |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Zustand** | 5.x | Lightweight state management |
| **React Router** | 7.x | Client-side routing |
| **CodeMirror** | 6.x | Code/markdown editor |
| **ReactMarkdown** | 10.x | Markdown rendering |
| **Lucide React** | 0.5.x | Icon library |
| **clsx** | 2.x | Conditional classname utility |
| **react-resizable-panels** | 4.x | Resizable panel layout with persistence via `useDefaultLayout` |
| **@tauri-apps/plugin-dialog** | 2.x | Native file/folder dialogs |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | 1.92.x | Systems programming language |
| **Tauri** | 2.x | Desktop app framework |
| **Serde** | 1.x | Serialization/deserialization |
| **Tokio** | 1.x | Async runtime |
| **walkdir** | 2.x | Recursive directory traversal |
| **notify** | 6.x | Filesystem watching (FSEvents on macOS) |
| **gray_matter** | 0.2.x | YAML frontmatter parsing |
| **dirs** | 5.x | Standard directory paths |
| **tauri-plugin-dialog** | 2.x | Native file/folder dialogs |

### Build Tools

| Tool | Purpose |
|------|---------|
| **npm** | Package management |
| **Cargo** | Rust package management |
| **PostCSS** | CSS processing |
| **ESLint** | JavaScript/TypeScript linting |

### Development

| Tool | Purpose |
|------|---------|
| **Vite HMR** | Hot module replacement for React |
| **Tauri Dev** | Combined frontend + backend dev server |
| **Cargo Watch** | Auto-recompile Rust on changes |

---

## Component Deep Dive

### State Management (Zustand)

#### toolsStore

The primary store managing tool data and UI state.

```typescript
interface ToolsState {
  // Data
  tools: Tool[];              // All discovered tools
  filteredTools: Tool[];      // After filters applied
  selectedTool: Tool | null;  // Currently selected for editing
  dirtyTools: Set<string>;    // IDs of tools with unsaved changes
  originalContent: Map<string, string>;  // Original content for discard

  // Filters (multi-select)
  typeFilters: ToolType[];    // Default: ['command', 'agent', 'skill', 'hook']
  scopeFilters: ToolScope[];  // Default: ['project', 'global']
  projectFilter: string | 'all';
  searchQuery: string;

  // Loading states
  isLoading: boolean;
  isScanning: boolean;
  error: string | null;

  // Actions
  loadTools: (projectRoots: string[]) => Promise<void>;
  selectTool: (tool: Tool | null) => void;
  updateToolContent: (toolId: string, content: string) => void;
  saveTool: (toolId: string) => Promise<void>;
  toggleTypeFilter: (type: ToolType) => void;      // Toggle single type in array
  toggleScopeFilter: (scope: ToolScope) => void;   // Toggle single scope in array
  setTypeFilters: (types: ToolType[]) => void;     // Set all type filters
  setScopeFilters: (scopes: ToolScope[]) => void;  // Set all scope filters
  setProjectFilter: (project: string | 'all') => void;
  setSearchQuery: (query: string) => void;
  clearDirty: (toolId: string) => void;
  discardChanges: (toolId: string) => void;  // Revert to original content
}
```

**Key behaviors:**
- `loadTools()`: Calls Rust `scan_all_tools`, stores results, applies filters
- `updateToolContent()`: Updates local state, marks tool as dirty, stores original content on first edit
- `saveTool()`: Calls Rust `save_tool`, clears dirty state on success
- `discardChanges()`: Restores original content, clears dirty state
- `toggleTypeFilter()` / `toggleScopeFilter()`: Toggle single filter in/out of array
- Filters are applied immediately when changed (supports multi-select via arrays)

#### settingsStore

Manages persistent application settings and UI preferences.

```typescript
type ViewMode = 'split' | 'editor' | 'preview';

interface SettingsState {
  settings: AppSettings;
  viewMode: ViewMode;           // Editor view mode (persisted to localStorage)
  typeSectionStates: Record<string, boolean>;  // TypeSection expand/collapse states (persisted)
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  addProjectRoot: (root: string) => Promise<void>;
  removeProjectRoot: (root: string) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;  // Persists to localStorage
  setTypeSectionState: (section: string, expanded: boolean) => void;  // Persists to localStorage
}
```

### UI Components

#### ToolCard

Displays a single tool as a card with:
- Type badge (colored by type)
- Tool name
- Dirty indicator (orange dot if unsaved)
- Scope badge
- `plugin:{plugin-name}` badge for plugin-sourced tools
- Description (truncated)
- Project info (if applicable)
- Context tag with abbreviated count (e.g., "context 234")
- Last edited date (date only)
- Glow effect on hover (color matches type)

#### SplitView

The editor component with:
- Three view modes: editor-only, split (editor + preview), preview-only
- View mode toggle buttons in header (using PanelLeft, Columns2, PanelRight icons)
- View mode persisted globally via settingsStore/localStorage
- Left pane: CodeMirror markdown editor (with word wrap enabled via `EditorView.lineWrapping`, frontmatter styled as plain text, smaller font size)
- Right pane: ReactMarkdown live preview
- Resizable divider between editor and preview (using `react-resizable-panels`)
- Panel sizes persisted to localStorage via `useDefaultLayout` hook
- Header: Tool name, last modified date, breadcrumb path, dirty indicator, view mode toggle, discard button, save button, close button
- Breadcrumb shows: scope icon > scope name > tool type folder > filename
- Cmd+S keyboard handler
- Read-only mode for plugin tools
- Discard button with confirmation dialog (only shows when dirty)
- Last modified timestamp displayed with Calendar icon
- Optional `onClose` callback prop for close button in header

#### ToolBreadcrumb

Displays the tool's location in the hierarchy:
- Global tools: `[Globe] Global > {toolType}s > {filename}` (with optional `plugin:{pluginName}` badge for plugin-sourced tools)
- Project tools: `[FolderGit2] Project: {projectName} > {toolType}s > {filename}` (with optional `plugin:{pluginName}` badge for plugin-sourced tools)
- Uses scope-appropriate icons and colors

#### ToolFilters

Filter controls including:
- Search input with icon
- Type checkbox group (Commands/Agents/Skills/Hooks with icons, all checked by default)
- Scope checkbox group (Project/Global with icons, all checked by default)
- Project context dropdown (shows tools available in selected project, including inherited)
- Always visible layout (no dropdowns for type/scope)

#### SidebarNav

Navigation sidebar with:
- Nav items for each view (Home, Tools, Projects, Matrix, Settings)
- Dynamic badge counts computed from tools store:
  - Tools: total tool count
  - Projects: unique project count
- Counts update reactively when tools are loaded

#### ExpandableSection (HomeView)

Accordion component for hierarchical tool display:
- Clickable header with expand/collapse toggle
- Shows scope icon, title, badge, tool type counts, and total context count
- Expands to reveal list of clickable tools with icons, descriptions, and metadata (context tag, plugin badge, last edited date)
- Tool clicks open SplitView panel on the right
- Animated expand/collapse transitions
- Used for Global and Project sections
- Plugin-sourced tools appear in their respective scope sections with `plugin:{plugin-name}` badge

#### Welcome Screen (HomeView)

Inline welcome card shown when no projects configured:
- Gradient background with welcome message
- "Add Project Directory" button navigates to Settings
- Automatically hidden once projects are added

#### Clickable Tool Counts (HomeView)

Type count cards (Commands/Agents/Skills/Hooks) are clickable:
- Click navigates to `/tools?type={type}`
- URL query params sync with filter state via `useToolFiltersQueryParams` hook
- Hover state with cursor pointer

#### ConfirmDialog

Reusable confirmation dialog using native `<dialog>` element:
- Modal overlay with backdrop
- Warning icon (AlertTriangle) with variant-based coloring (warning/danger)
- Title and message display
- Cancel and confirm buttons
- Click-outside-to-close behavior
- Used for discard changes and navigation warnings

#### ContextBar

Stacked horizontal bar showing context character distribution by scope:
- Two color-coded segments: Amber (global) → Violet (project)
- Segments sized proportionally to character counts
- Displays total abbreviated count (e.g., "context 2.1K")
- Hover tooltip shows breakdown by scope
- Used in HomeView (overview) and ProjectsView (per-project)

**ContextCount** (companion component):
- Inline tag display for individual tool context (e.g., "context 234")
- Used in ToolCard and EffectiveToolRow components

#### EffectiveToolRow (ProjectsView)

Row component displaying a single tool in the effective toolset:
- White background with rounded corners and subtle border
- Type icon (colored by type: blue/violet/emerald/amber)
- Tool name
- Scope badge (Project/Global with appropriate colors)
- `plugin:{plugin-name}` badge for plugin-sourced tools
- Context tag with abbreviated count
- Last edited date (date only)
- Description (truncated)
- Hover state with subtle background
- Click handler and selection state (teal highlight when selected)
- Opens SplitView editor when clicked

#### ProjectsView Layout

The Projects View uses a two-panel layout:
- **Left panel**: Vertically stacked project cards (single column)
- **Right panel**: SplitView editor (appears when a tool is selected)

Each project card is an accordion that expands to show:
- Context distribution bar showing plugin/global/project breakdown
- Search input for filtering tools
- TypeSection components grouping tools by type
- Summary footer with tool counts by scope and total context chars

State management:
- `expandedProject`: Which project's accordion is open (only one at a time)
- `selectedTool`: Which tool is selected for editing in SplitView
- `pendingTool` / `showNavWarning`: Navigation guard state for unsaved changes
- Collapsing a project clears the selected tool
- Navigation between tools prompts for unsaved changes

#### TypeSection (ProjectsView)

Collapsible section grouping tools by type:
- Header with expand/collapse chevron
- Type icon and label (Commands/Agents/Skills/Hooks)
- Tool count in parentheses
- Expands to show list of EffectiveToolRow components
- Visual hierarchy: left border and indentation for expanded content
- Subtle background gradient when expanded
- Sections with zero tools are hidden
- Passes selection state and click handler to EffectiveToolRow
- Expand/collapse state persisted via settingsStore.typeSectionStates (survives navigation and app restart)

#### MatrixView

Table component showing tool coverage across projects:
- Rows: unique tool names (grouped by type, sorted alphabetically)
- Columns: Global and each discovered project
- Cells: checkmark buttons indicating tool presence (colored by scope)
- Sticky first column for tool names
- Column headers show scope icons and tool counts
- Click cell to navigate to Tools view with filters pre-set
- Legend showing tool type colors

---

## Data Flow

### Application Startup

```
1. App.tsx mounts
   │
2. HomeView.tsx useEffect
   │
   ├─► settingsStore.loadSettings()
   │   └─► Rust: get_settings()
   │       └─► Read ~/.config/tool-viewer/settings.json
   │
   └─► toolsStore.loadTools(projectRoots)
       └─► Rust: scan_all_tools(projectRoots)
           │
           ├─► get_enabled_plugins()
           │   └─► Read settings.json files to find enabled plugins
           │
           ├─► scan_plugins(enabled_plugins)
           │   └─► Walk only enabled plugins in ~/.claude/plugins/marketplaces/*/plugins/*/
           │   └─► Assign scope based on where enabled (user → global, project → project)
           │
           ├─► scan_global()
           │   └─► Walk ~/.claude/[commands|agents|skills]/
           │
           └─► scan_projects(projectRoots)
               └─► Walk <project>/.claude/[commands|agents|skills]/
```

### Tool Selection & Editing

```
1. User clicks ToolCard
   │
2. toolsStore.selectTool(tool)
   │
3. SplitView renders with tool.content
   │
4. User edits in CodeMirror
   │
5. onChange → toolsStore.updateToolContent(id, newContent)
   │   └─► Marks tool as dirty
   │
6. User presses Cmd+S or clicks Save
   │
7. toolsStore.saveTool(id)
   │
8. Rust: save_tool(path, content)
   │   └─► fs::write(path, content)
   │
9. On success: toolsStore.clearDirty(id)
```

### Filtering

```
1. User toggles filter checkbox (type/scope) or changes search/project
   │
2. toolsStore.toggleTypeFilter('command') or toggleScopeFilter('global')
   │   (multi-select: adds/removes from typeFilters/scopeFilters arrays)
   │
3. applyFilters() runs immediately
   │   ├─► Filter by types (tool.toolType in typeFilters array)
   │   ├─► Filter by scopes (tool.scope in scopeFilters array)
   │   ├─► Filter by project context (shows inherited tools: global + project-specific)
   │   └─► Filter by search query (name + description + content)
   │
4. filteredTools updated
   │
5. ToolList re-renders with filtered results
```

**Project Context Filter Behavior:**
When a project is selected in the project filter dropdown, the filter shows all tools that would be available in that project's context:
- All global-scoped tools (including user-enabled plugin tools)
- Project-specific tools for the selected project (including project-enabled plugin tools)

This differs from a simple "show only this project's tools" filter - it answers "what tools can I use in this project?"

---

## IPC Communication

### Tauri Commands (Rust → TypeScript)

Commands are defined in Rust and called from TypeScript via `invoke()`.

#### scan_all_tools

```typescript
// Frontend call
const tools = await api.scanAllTools(projectRoots);

// Rust handler
#[tauri::command]
pub fn scan_all_tools(project_roots: Vec<String>) -> Result<Vec<Tool>, String>
```

Scans all tool sources and returns combined results.

#### discover_projects

```typescript
// Frontend call
const projects = await api.discoverProjects(roots);

// Rust handler
#[tauri::command]
pub fn discover_projects(roots: Option<Vec<String>>) -> Result<Vec<String>, String>
```

Discovers projects containing `.claude/` directories.

#### read_tool

```typescript
// Frontend call
const content = await api.readTool(path);

// Rust handler
#[tauri::command]
pub fn read_tool(path: String) -> Result<String, String>
```

Reads raw file content.

#### save_tool

```typescript
// Frontend call
await api.saveTool(path, content);

// Rust handler
#[tauri::command]
pub fn save_tool(path: String, content: String) -> Result<(), String>
```

Writes content to file. Includes safety check to prevent editing plugin files.

#### get_settings / save_settings

```typescript
// Frontend calls
const settings = await api.getSettings();
await api.saveSettings(settings);

// Rust handlers
#[tauri::command]
pub fn get_settings() -> Result<AppSettings, String>

#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String>
```

Settings are stored in `~/.config/tool-viewer/settings.json`.

### Event Listeners (Rust → TypeScript)

```typescript
// Listen for file changes (not yet implemented)
const unlisten = await onFileChanged((paths) => {
  console.log('Files changed:', paths);
  loadTools(projectRoots);
});
```

---

## Styling System

### Tailwind v4 Configuration

Tailwind v4 uses CSS-based configuration instead of `tailwind.config.js`.

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  /* Custom color palette */
  --color-sand-50: #fdfcfa;
  --color-sand-100: #f9f6f1;
  /* ... */

  /* Glow colors for tool types */
  --color-glow-command: #3b82f6;   /* Blue */
  --color-glow-agent: #8b5cf6;     /* Purple */
  --color-glow-skill: #10b981;     /* Green */
  --color-glow-hook: #f59e0b;      /* Amber */

  /* Custom shadows */
  --shadow-glow-command: 0 0 20px -5px #3b82f6;
  /* ... */
}
```

### Color System

| Element | Color | Hex |
|---------|-------|-----|
| Background | Sand 50 | `#fdfcfa` |
| Card background | White | `#ffffff` |
| Border | Sand 200 | `#f3ede3` |
| Command glow | Blue | `#3b82f6` |
| Agent glow | Purple | `#8b5cf6` |
| Skill glow | Green | `#10b981` |
| Hook glow | Amber | `#f59e0b` |
| Dirty indicator | Orange | `#f97316` |
| Context bar (global) | Amber 400 | `#fbbf24` |
| Context bar (project) | Violet 400 | `#a78bfa` |

### Custom CSS Classes

```css
/* Tool card glow effects */
.tool-card-command:hover {
  box-shadow: var(--shadow-glow-command);
}

.tool-card-agent:hover {
  box-shadow: var(--shadow-glow-agent);
}

.tool-card-skill:hover {
  box-shadow: var(--shadow-glow-skill);
}

.tool-card-hook:hover {
  box-shadow: var(--shadow-glow-hook);
}
```

### Container Queries for Responsive Layout

Both tool and plugin card grids use CSS container queries instead of viewport-based breakpoints, allowing the grid to adapt based on the actual container width (accounting for sidebar and detail panels). Cards have minimum widths to prevent them from becoming too small:

```css
/* Container queries for responsive tool grid */
.tool-list-container {
  container-type: inline-size;
  width: 100%;
}

.tool-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: 1fr;
}

@container (min-width: 500px) {
  .tool-grid {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}

@container (min-width: 800px) {
  .tool-grid {
    grid-template-columns: repeat(3, minmax(200px, 1fr));
  }
}

/* Container queries for responsive plugin grid */
.plugin-list-container {
  container-type: inline-size;
  width: 100%;
}

.plugin-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@container (min-width: 500px) {
  .plugin-grid {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@container (min-width: 800px) {
  .plugin-grid {
    grid-template-columns: repeat(3, minmax(220px, 1fr));
  }
}
```

### Animations

Subtle animations enhance the user experience:

```css
/* Card hover effect - slight lift */
.card-hover-effect {
  transition: transform 0.15s ease-out, box-shadow 0.2s ease-out;
}
.card-hover-effect:hover {
  transform: translateY(-2px);
}

/* Button loading state - pulsing glow */
.btn-loading {
  animation: pulse-glow 1.5s ease-in-out infinite;
}

/* Fade-in for notifications and expandable content */
.animate-fade-in, .expandable-content {
  animation: fade-in 0.15s-0.2s ease-out;
}
```

### Cursor Styles

Global cursor styles ensure consistent interactive feedback:

```css
/* Interactive elements */
a, button, [role="button"] {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

input, textarea {
  cursor: text;
}
```

---

## Development Workflow

### Prerequisites

1. **Node.js** (v18+)
2. **Rust** (install via rustup)
3. **Xcode Command Line Tools** (macOS)

### Setup

```bash
# Clone repository
cd /path/to/tool-viewer

# Install Node dependencies
npm install

# Install Rust (if not already)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

### Development

```bash
# Start development server
npm run tauri:dev
```

This command:
1. Starts Vite dev server at `http://localhost:5173`
2. Compiles Rust backend (first time takes ~1-2 minutes)
3. Opens the desktop app window
4. Watches for changes:
   - Frontend changes: instant HMR via Vite
   - Rust changes: auto-recompile (~1-2s incremental)

### Build

```bash
# Production build
npm run tauri:build
```

Creates distributable app bundle in `src-tauri/target/release/bundle/`.

### Scripts

```json
{
  "scripts": {
    "dev": "vite",                    // Frontend only
    "build": "tsc -b && vite build",  // Frontend build
    "tauri": "tauri",                 // Tauri CLI
    "tauri:dev": "tauri dev",         // Full dev mode
    "tauri:build": "tauri build"      // Production build
  }
}
```

---

## Future Ideas

### Discussed Features

1. **File Watcher Integration**
   - Use `notify` crate to watch `.claude/` directories
   - Emit events to frontend when files change
   - Auto-refresh tool list without manual rescan
   - Debounce events (200ms) to avoid excessive updates

2. **Full Disk Scan Mode**
   - Option to scan entire filesystem for `.claude/` directories
   - Progress indicator during scan
   - Respect permission errors gracefully
   - Cache results for faster subsequent scans

3. **Home View Enhancement** (Partially Implemented)
   - ✅ Hierarchical expandable sections implemented
   - Future: Force-directed graph visualization option
   - Future: Interactive filtering by clicking nodes
   - Consider using `react-force-graph-2d` or D3 for visual graph mode

4. **Onboarding Flow**
   - First-run wizard to explain the app
   - Smart scan vs full scan choice
   - Add initial project roots
   - Show progress during initial scan

5. **Skills Multi-File Support**
   - Skills are directories, not single files
   - Show file browser for skill directories
   - Navigate between SKILL.md and supporting files
   - View-only for non-markdown files

6. **Plugin Metadata Display**
   - Parse `.claude-plugin/plugin.json` for author info
   - Show plugin version, description
   - Display configured vs installed status

7. **Search Improvements**
   - Highlight matches in results
   - Search within frontmatter fields
   - Regex search option
   - Recent searches history

8. **Tool Creation**
   - Create new commands/agents/skills from within app
   - Template selection
   - Proper directory structure creation

9. **Ignore Rules**
    - Respect `.gitignore` patterns
    - Skip `node_modules`, `target`, etc.
    - Custom ignore patterns in settings

### Potential Technical Improvements

1. **Virtual Scrolling**
   - For large tool lists
   - Use `@tanstack/react-virtual`

2. **Syntax Highlighting in Preview**
   - Code blocks with proper highlighting
   - Use `react-syntax-highlighter`

3. **Conflict Detection**
   - Detect external file modifications
   - Offer reload/merge options

4. **Undo/Redo**
   - Editor history
   - Ctrl+Z / Ctrl+Shift+Z support

5. **Keyboard Navigation**
   - Arrow keys to navigate tool list
   - Enter to select
   - Escape to close editor

---

## Known Limitations

### Current Limitations

1. **No File Watcher Yet**
   - Must manually refresh to see external changes
   - Planned for future implementation

2. **Plugin Tools Read-Only**
   - By design, plugin tools cannot be edited
   - This prevents accidental corruption of marketplace plugins

3. **macOS Only**
   - Currently targets macOS only
   - Windows/Linux support not implemented

4. **No Git Integration**
   - Doesn't show git status of tool files
   - No commit/push functionality

5. **Single-File Editing**
   - Skills with multiple files only edit SKILL.md
   - Other files in skill directories are not accessible

6. **No Frontmatter Editing UI**
   - Must edit frontmatter as raw YAML
   - No form-based metadata editor

### Technical Debt

1. **Unused Rust Structs**
   - `ToolCounts`, `Project`, `Plugin` defined but not used
   - Will be used when corresponding features are implemented

2. **Error Handling**
   - Basic error handling in place
   - Could be more granular with specific error types

3. **Testing**
   - No unit or integration tests yet
   - Consider adding Vitest for frontend
   - Consider adding Rust tests

---

## Contributing

### Code Style

- **TypeScript**: Follow ESLint rules
- **Rust**: Follow `cargo fmt` and `cargo clippy`
- **CSS**: Use Tailwind utilities, avoid custom CSS when possible

### Commit Messages

Follow conventional commits:
```
feat: add file watcher support
fix: correct tool filtering logic
docs: update architecture documentation
refactor: simplify scanner module
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes with clear commits
3. Ensure `npm run build` succeeds
4. Ensure `cargo build` succeeds
5. Update documentation if needed
6. Submit PR with description of changes

---

## License

[To be determined]

---

## Acknowledgments

- Built with [Tauri](https://tauri.app/)
- UI components inspired by [Anthropic](https://anthropic.com/) design
- Icons from [Lucide](https://lucide.dev/)
