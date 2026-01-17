import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToolsStore } from '../features/tools/stores/toolsStore';
import type { ToolType, ToolScope } from '../types/rust-bindings';

const VALID_TYPES: ToolType[] = ['command', 'agent', 'skill', 'hook'];
const VALID_SCOPES: ToolScope[] = ['global', 'project'];

/**
 * Hook to sync tool filters with URL query parameters.
 * Supports: /tools?type=command,agent&scope=global,project
 */
export function useToolFiltersQueryParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { typeFilters, scopeFilters, setTypeFilters, setScopeFilters } = useToolsStore();

  // Sync URL → store on mount (only once)
  useEffect(() => {
    const typeParam = searchParams.get('type');
    const scopeParam = searchParams.get('scope');

    if (typeParam) {
      const types = typeParam.split(',').filter((t): t is ToolType =>
        VALID_TYPES.includes(t as ToolType)
      );
      if (types.length > 0) {
        setTypeFilters(types);
      }
    }

    if (scopeParam) {
      const scopes = scopeParam.split(',').filter((s): s is ToolScope =>
        VALID_SCOPES.includes(s as ToolScope)
      );
      if (scopes.length > 0) {
        setScopeFilters(scopes);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when filters change (call this explicitly after filter changes if desired)
  const syncToUrl = useCallback(() => {
    const params = new URLSearchParams();

    // Only add type param if not all types selected
    if (typeFilters.length > 0 && typeFilters.length < VALID_TYPES.length) {
      params.set('type', typeFilters.join(','));
    }

    // Only add scope param if not all scopes selected
    if (scopeFilters.length > 0 && scopeFilters.length < VALID_SCOPES.length) {
      params.set('scope', scopeFilters.join(','));
    }

    setSearchParams(params, { replace: true });
  }, [typeFilters, scopeFilters, setSearchParams]);

  return { syncToUrl };
}
