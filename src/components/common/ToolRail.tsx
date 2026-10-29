import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toolToneClasses, type ToolMeta } from "@/data/tools";

export type RailTool = ToolMeta & { name: string; description: string };

interface ToolRailProps {
  title: string;
  count: number;
  tools: RailTool[];
}

/**
 * A paged run of equal tiles.
 *
 * Every tile is the same width and the same height, so one long tool name
 * never leaves a hole in the row. The run scrolls by touch, wheel and arrow
 * keys, snapping one tile at a time; the two controls page it a screen at a
 * time and the page count says where the reader is.
 */
export function ToolRail({ title, count, tools }: ToolRailProps) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLUListElement>(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  /**
   * The scroll geometry, read once per layout change.
   *
   * The run bleeds past the container edge, so it carries an inline padding:
   * the scroll origin is the first tile's edge, not the padding's. Every
   * measurement here is taken from that origin, so the page count and the
   * two controls agree with what the reader sees.
   *
   * The content width is read from the last tile's edge rather than from
   * `scrollWidth`: a long run is laid out over several frames, and
   * `scrollWidth` reports the width of whatever has been placed so far.
   */
  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const style = getComputedStyle(track);
    const padStart = parseFloat(style.paddingInlineStart) || 0;
    const padEnd = parseFloat(style.paddingInlineEnd) || 0;
    const viewport = track.clientWidth - padStart - padEnd;

    // The content past the first tile's edge, to the last tile's edge.
    const last = track.lastElementChild as HTMLElement | null;
    const first = track.firstElementChild as HTMLElement | null;
    const contentWidth =
      last && first
        ? last.getBoundingClientRect().right - first.getBoundingClientRect().left
        : Math.max(0, track.scrollWidth - padStart - padEnd);

    const maxScroll = Math.max(0, contentWidth - viewport);
    const scrollLeft = track.scrollLeft - padStart;

    // The furthest the run can actually travel: the browser stops at the
    // padding, so the last tile rests against the trailing edge.
    const travel = Math.max(0, track.scrollWidth - track.clientWidth - padStart);

    const pages = Math.max(1, Math.round(maxScroll / Math.max(viewport, 1)) + 1);
    setPageCount(pages);
    setPage(Math.max(0, Math.min(pages - 1, Math.round(scrollLeft / Math.max(viewport, 1)))));
    setAtStart(scrollLeft <= 1);
    setAtEnd(scrollLeft >= travel - 1);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    /** Measure on the next frame, once the layout has settled. */
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();

    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    for (const child of Array.from(track.children)) observer.observe(child);

    track.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      track.removeEventListener("scroll", measure);
    };
  }, [measure, tools.length]);

  /** Page by one screen, the way a reader turns a page. */
  const pageBy = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const style = getComputedStyle(track);
    const padStart = parseFloat(style.paddingInlineStart) || 0;
    const padEnd = parseFloat(style.paddingInlineEnd) || 0;
    const viewport = track.clientWidth - padStart - padEnd;
    const travel = Math.max(0, track.scrollWidth - track.clientWidth - padStart);
    const next = Math.max(0, Math.min(travel, track.scrollLeft - padStart + direction * viewport));
    track.scrollTo({ left: next + padStart, behavior: "smooth" });
  }, []);

  const label = useMemo(
    () => t("home.rail_page", "{{current}} / {{total}}", { current: page + 1, total: pageCount }),
    [t, page, pageCount]
  );

  const headingId = `rail-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="section-s">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
        <h2 id={headingId} className="text-section font-medium text-foreground">
          {title}
        </h2>
        <div className="flex items-center gap-4">
          <span className="measured text-sm text-muted-foreground">{count}</span>
          <div className="rail-controls">
            <button
              type="button"
              className="rail-btn"
              onClick={() => pageBy(-1)}
              disabled={atStart}
              aria-label={t("home.rail_prev", "Previous tools")}
            >
              <ChevronLeft className="h-4 w-4 rtl:hidden" aria-hidden="true" />
              <ChevronRight className="hidden h-4 w-4 rtl:block" aria-hidden="true" />
            </button>
            <span className="rail-page" aria-live="polite" aria-atomic="true">
              {label}
            </span>
            <button
              type="button"
              className="rail-btn"
              onClick={() => pageBy(1)}
              disabled={atEnd}
              aria-label={t("home.rail_next", "Next tools")}
            >
              <ChevronRight className="h-4 w-4 rtl:hidden" aria-hidden="true" />
              <ChevronLeft className="hidden h-4 w-4 rtl:block" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={trackRef}
        className="tool-rail tool-rail--faded -mx-4 px-4"
        tabIndex={0}
        aria-labelledby={headingId}
      >
        {tools.map((tool) => (
          <li key={tool.id}>
            <ToolTile tool={tool} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** One tile. The height is fixed and the type is clamped, so the row is even. */
function ToolTile({ tool }: { tool: RailTool }) {
  const tone = toolToneClasses(tool.category);
  return (
    <Link
      to={tool.path}
      className="tool-tile group focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
    >
      <div
        className={`inline-flex p-2.5 rounded-pill ${tone.tile} self-start transition-colors duration-short ease-out`}
      >
        <tool.icon className={`h-5 w-5 ${tone.glyph}`} aria-hidden="true" />
      </div>
      <h3 className="tool-tile__name text-title font-medium text-foreground text-balance">
        {tool.name}
      </h3>
      <p className="tool-tile__desc text-sm text-muted-foreground leading-relaxed">
        {tool.description}
      </p>
    </Link>
  );
}
