import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { CommandPalette } from "@/components/CommandPalette";
import { AdSlot } from "@/components/ads";
import { CookieConsent } from "@/components/common/CookieConsent";
import { useHistory } from "@/hooks/useHistory";
import { FillViewportContext } from "@/contexts/FillViewportContext";

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
  const [fillViewport, setFillViewport] = useState(false);

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
    <FillViewportContext.Provider value={{ setFillViewport }}>
      <div
        className={`flex flex-col bg-background text-foreground font-sans ${
          fillViewport
            ? "min-h-screen lg:h-dvh lg:overflow-hidden"
            : "min-h-screen"
        }`}
      >
        <Navbar />
        <main
          className={`flex-1 container mx-auto px-4 w-full ${
            fillViewport
              ? "py-4 lg:flex lg:min-h-0 lg:flex-col"
              : "py-8"
          }`}
        >
          <Outlet />
        </main>
        {!fillViewport && showToolAd && (
          <aside
            aria-label="Advertisement"
            className="container mx-auto px-4 pb-6"
          >
            <AdSlot format="auto" minHeight={90} className="mx-auto max-w-3xl" />
          </aside>
        )}
        {!fillViewport && <Footer />}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
        />
        <CookieConsent />
      </div>
    </FillViewportContext.Provider>
  );
}
