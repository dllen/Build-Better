export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Build Better. All rights reserved.</p>
        <p className="mt-2">Built with React, Tailwind CSS, and Cloudflare.</p>
      </div>
    </footer>
  );
}
