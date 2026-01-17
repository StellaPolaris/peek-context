import type { Tool } from '../types/rust-bindings';

/**
 * Format a character count as an abbreviated string.
 * Examples: 234 → "234", 1234 → "1.2K", 15000 → "15K"
 */
export function formatCharCount(chars: number): string {
  if (chars < 1000) {
    return chars.toString();
  }
  const k = chars / 1000;
  // Show one decimal place if under 10K, otherwise round
  if (k < 10) {
    return `${k.toFixed(1)}K`;
  }
  return `${Math.round(k)}K`;
}

/**
 * Format a unix timestamp (seconds) as a short date string.
 */
export function formatDate(timestampSeconds: number): string {
  if (!timestampSeconds) return '';
  return new Date(timestampSeconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Aggregate context characters by scope from a tool array.
 */
export interface ContextByScope {
  global: number;
  project: number;
  total: number;
}

export function aggregateContextByScope(tools: Tool[]): ContextByScope {
  const result: ContextByScope = {
    global: 0,
    project: 0,
    total: 0,
  };

  for (const tool of tools) {
    const chars = tool.contextCharacters;
    result.total += chars;

    switch (tool.scope) {
      case 'global':
        result.global += chars;
        break;
      case 'project':
        result.project += chars;
        break;
    }
  }

  return result;
}

/**
 * Calculate aggregate context for a specific project's effective toolset.
 * This includes all global tools and project-specific tools.
 */
export function aggregateContextForProject(
  allTools: Tool[],
  projectRoot: string
): ContextByScope {
  // Get tools available in this project context:
  // - All global tools (inherited)
  // - Project-specific tools for this project
  const effectiveTools = allTools.filter(
    (tool) =>
      tool.scope === 'global' ||
      (tool.scope === 'project' && tool.projectRoot === projectRoot)
  );

  return aggregateContextByScope(effectiveTools);
}
