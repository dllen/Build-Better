import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useHistory } from "@/hooks/useHistory";

export function Layout() {
  const location = useLocation();
  const { addToHistory } = useHistory();

  useEffect(() => {
    const path = location.pathname;
    // Track tool and game usage
    // Exclude the main listing pages if desired, e.g. /games
    if (
      (path.startsWith("/tools/") || path.startsWith("/games/")) &&
      path !== "/games" &&
      path !== "/tools"
    ) {
      addToHistory(path);
    }
  }, [location.pathname, addToHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
