import type { Tool } from '../../types/rust-bindings';
import { ToolCard } from './ToolCard';
import { useToolsStore } from '../../features/tools/stores/toolsStore';

interface ToolListProps {
  tools: Tool[];
  onSelectTool: (tool: Tool) => void;
}

export function ToolList({ tools, onSelectTool }: ToolListProps) {
  const { selectedTool, dirtyTools } = useToolsStore();

  if (tools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <p className="text-lg">No tools found</p>
        <p className="text-sm mt-1">Try adjusting your filters or adding project roots</p>
      </div>
    );
  }

  return (
    <div className="tool-list-container">
      <div className="tool-grid">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            isSelected={selectedTool?.id === tool.id}
            isDirty={dirtyTools.has(tool.id)}
            onClick={() => onSelectTool(tool)}
          />
        ))}
      </div>
    </div>
  );
}
