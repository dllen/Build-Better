import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link
              to="/"
              className="flex items-center gap-2 font-medium text-lg text-foreground hover:text-primary transition-colors"
              aria-label="Build Better"
            >
              <img src="/logo.svg" alt="" className="h-5 w-5" aria-hidden="true" />
              <span>Build Better</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A browser toolbox for the small jobs: format a body of text, read a
              hash, convert a number, check a date.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-4">
            <div className="flex flex-col gap-2">
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                About
              </Link>
              <Link
                to="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms of Use
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/settings"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
              <Link
                to="/games"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Games
              </Link>
              <Link
                to="/rss-read"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                RSS Read
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Build Better
          </p>
          <p className="text-xs text-muted-foreground measured">
            React, Tailwind CSS, Cloudflare
          </p>
        </div>
      </div>
    </footer>
  );
}
