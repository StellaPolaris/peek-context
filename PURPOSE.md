# Claude Tools Viewer - Purpose & Philosophy

## Why This App Exists

As Claude Code users work on projects, they naturally accumulate custom tools: slash commands that automate workflows, agents specialized for particular tasks, skills that extend Claude's capabilities, and hooks that respond to events. These tools represent accumulated knowledge and refined workflows.

But there's a problem: **these tools become invisible**.

## The Visibility Problem

Custom tools live in scattered locations:

- Some are global, available everywhere
- Some are project-specific, tied to a particular codebase
- Some come from installed plugins

Without a central view, users lose track of what they've built. A command created months ago for one project might solve today's problem in another—but if you can't see it, you can't use it.

## The Context Problem

Every custom tool costs context. When Claude works on a project, it loads the tools available in that context—and this includes tools inherited from multiple sources: global definitions, plugin tools, and project-local tools all stack together.

For users who want to optimize context usage, this creates friction. To understand what's actually being loaded for a given project, you'd need to check multiple directories and mentally combine them. Which tools are inherited from global? Which are local overrides? What's the total footprint?

The app provides a project-level view of tool inheritance: see exactly what tools a project has access to, understand where each one comes from, and make informed decisions about what to keep, remove, or consolidate.

## What We're Solving

**Discovery**: Surface all the tools a user has access to, regardless of where they're stored.

**Context**: Show which tools are available in which contexts. When working on a specific project, what commands, agents, and skills can you actually invoke?

**Inventory**: Provide a single place to see everything that exists—not to manage or orchestrate, but simply to know.

## The Information We Gather

The app scans for Claude Code tools across three scopes:

1. **Plugin tools** - Tools from installed marketplace plugins
2. **Global tools** - User-created tools available in all projects
3. **Project tools** - Tools specific to individual project directories

For each tool found, we read its definition (the markdown content and frontmatter metadata) to display what it does and how it's configured.

## Supporting the User

The core value is awareness. Users should be able to answer:

- "What tools do I have?"
- "What tools are available in this project?"
- "Where did this tool come from?"
- "What does this tool actually do?"

This is fundamentally about giving users visibility into their own tooling ecosystem—turning scattered files into a comprehensible inventory.
