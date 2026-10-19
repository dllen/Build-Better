import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Build Better. All rights reserved.</p>
        <p className="mt-2 space-x-4">
          <Link
            to="/about"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Terms of Use
          </Link>
        </p>
        <p className="mt-2">Built with React, Tailwind CSS, and Cloudflare.</p>
      </div>
    </footer>
  );
}
