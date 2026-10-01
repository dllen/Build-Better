import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CommandPalette } from "@/components/CommandPalette";
import { AdSlot } from "@/components/ads";
import { useHistory } from "@/hooks/useHistory";

/** Detect "this is a tool detail page" so we only render ads where intended. */
function isToolDetail(pathname: string): boolean {
  return (
    pathname.startsWith("/tools/") &&
    pathname !== "/tools" &&
    pathname !== "/tools/"
  );
}

export function Layout() {
  const location = useLocation();
  const { addToHistory } = useHistory();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Track tool and game usage
  useEffect(() => {
    const path = location.pathname;
    if (
      (path.startsWith("/tools/") || path.startsWith("/games/")) &&
      path !== "/games" &&
      path !== "/tools"
    ) {
      addToHistory(path);
    }
  }, [location.pathname, addToHistory]);

  // Global keyboard shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    // Listen for custom event from Navbar button
    const handleToggle = () => {
      setIsCommandPaletteOpen((prev) => !prev);
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("toggle-command-palette", handleToggle);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-command-palette", handleToggle);
    };
  }, []);

  const showToolAd = isToolDetail(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      {showToolAd && (
        <aside
          aria-label="Advertisement"
          className="container mx-auto px-4 pb-6"
        >
          <AdSlot format="auto" minHeight={90} className="mx-auto max-w-3xl" />
        </aside>
      )}
      <Footer />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
