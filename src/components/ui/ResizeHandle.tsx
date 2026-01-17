import { Separator } from 'react-resizable-panels';

interface ResizeHandleProps {
  className?: string;
}

export function ResizeHandle({ className }: ResizeHandleProps) {
  return (
    <Separator
      className={`w-1.5 bg-sand-200 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize ${className ?? ''}`}
    />
  );
}
