import { useEffect, type ReactNode } from "react";
import { useFillViewport } from "@/contexts/FillViewportContext";

interface MergeLayoutProps {
  title?: ReactNode;
  toolbar?: ReactNode;
  leftLabel: ReactNode;
  leftActions?: ReactNode;
  left: ReactNode;
  rightLabel: ReactNode;
  rightActions?: ReactNode;
  right: ReactNode;
  outputLabel: ReactNode;
  outputActions?: ReactNode;
  output: ReactNode;
  footer?: ReactNode;
}

export function MergeLayout({
  title,
  toolbar,
  leftLabel,
  leftActions,
  left,
  rightLabel,
  rightActions,
  right,
  outputLabel,
  outputActions,
  output,
  footer,
}: MergeLayoutProps) {
  const { setFillViewport } = useFillViewport();
  useEffect(() => {
    setFillViewport(true);
    return () => setFillViewport(false);
  }, [setFillViewport]);

  return (
    <div className="flex flex-col h-[calc(100dvh-14rem)] min-h-[500px] -mx-2">
      {title && <div className="px-2 pb-2">{title}</div>}
      {toolbar && <div className="px-2 pb-2 border-b">{toolbar}</div>}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 min-h-0">
        <div className="flex flex-col border rounded min-h-0">
          <div className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium">
            <span>{leftLabel}</span>
            {leftActions}
          </div>
          <div className="flex-1 min-h-0">{left}</div>
        </div>
        <div className="flex flex-col border rounded min-h-0">
          <div className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium">
            <span>{rightLabel}</span>
            {rightActions}
          </div>
          <div className="flex-1 min-h-0">{right}</div>
        </div>
        <div className="flex flex-col border rounded min-h-0">
          <div className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium">
            <span>{outputLabel}</span>
            {outputActions}
          </div>
          <div className="flex-1 min-h-0">{output}</div>
        </div>
      </div>
      {footer && <div className="px-2 pt-2 border-t">{footer}</div>}
    </div>
  );
}
