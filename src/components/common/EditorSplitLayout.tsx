import { useEffect, type ReactNode } from "react";
import { useFillViewport } from "@/contexts/FillViewportContext";
import { AdSlot } from "@/components/ads";

interface EditorSplitLayoutProps {
  /** Page header row (icon + title), rendered above the toolbar. */
  title?: ReactNode;
  /** Options / buttons row rendered above the panes (json.cn style toolbar). */
  toolbar?: ReactNode;
  inputLabel: ReactNode;
  /** Optional actions rendered at the right of the input pane header. */
  inputActions?: ReactNode;
  /** Editor content. Use `h-full w-full resize-none` on textareas to fill the pane. */
  input: ReactNode;
  outputLabel: ReactNode;
  /** Optional actions rendered at the right of the output pane header. */
  outputActions?: ReactNode;
  /** Result content. Use `h-full overflow-auto` on pre/div to scroll inside the pane. */
  output: ReactNode;
  /** Hints / errors rendered below the panes. */
  footer?: ReactNode;
}

/**
 * Shared two-pane editor page layout (json.cn style): input on the left,
 * output on the right, equal width on desktop (stacked on mobile).
 *
 * Use it as the page's ROOT element. It registers "fill viewport" mode with
 * the global Layout, which locks the page to the viewport height (no page
 * scrolling, footer/ad hidden) — the panes fill the remaining space and
 * scroll internally.
 */
export function EditorSplitLayout({
  title,
  toolbar,
  inputLabel,
  inputActions,
  input,
  outputLabel,
  outputActions,
  output,
  footer,
}: EditorSplitLayoutProps) {
  const { setFillViewport } = useFillViewport();

  useEffect(() => {
    setFillViewport(true);
    return () => setFillViewport(false);
  }, [setFillViewport]);

  return (
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      {title ? <div className="flex items-center gap-2">{title}</div> : null}
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {toolbar}
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
        <Pane label={inputLabel} actions={inputActions}>
          {input}
        </Pane>
        <Pane label={outputLabel} actions={outputActions}>
          {output}
        </Pane>
      </div>
      <AdSlot format="auto" minHeight={90} />
      {footer ? <div className="space-y-2">{footer}</div> : null}
    </div>
  );
}

function Pane({
  label,
  actions,
  children,
}: {
  label: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex h-[40vh] min-h-[280px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white lg:h-auto lg:min-h-0">
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
