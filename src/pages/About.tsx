import { SEO } from "@/components/seo";

export default function About() {
  return (
    <>
      <SEO
        title="About"
        description="Build Better is a free collection of 100+ online developer tools. No login. Privacy-friendly. Built by an indie developer."
      />
      <article className="max-w-3xl mx-auto space-y-8 text-foreground">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">About Build Better</h1>
          <p className="text-muted-foreground">
            A free, no-login toolkit for developers.
          </p>
        </header>

        <section className="space-y-4 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <p className="text-muted-foreground leading-relaxed">
            Build Better is a free collection of 100+ online developer tools: formatters,
            encoders, generators, calculators, Web3 utilities, image tools, regex testers,
            API debuggers, and more.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            All tools run locally in your browser. No login required. No data is sent to a
            server unless explicitly stated (for example, the short link generator uses
            Cloudflare KV, and the share pool uses Cloudflare D1).
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Built and maintained by an indie developer. Source available on request.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Principles</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Privacy first</strong>: Most tools run
              entirely in your browser. We do not track or log your activity.
            </li>
            <li>
              <strong className="text-foreground">No account required</strong>: Open the
              tool, use it, close the tab.
            </li>
            <li>
              <strong className="text-foreground">Fast and lightweight</strong>: No heavy
              bundles, no waiting. Pages load in under a second on most devices.
            </li>
            <li>
              <strong className="text-foreground">No ads in tools</strong>: AdSense units
              appear only on marketing and list pages, never inside a working tool.
            </li>
          </ul>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions or feedback? See the{" "}
            <a
              href="/contact"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              contact page
            </a>
            .
          </p>
        </section>
      </article>
    </>
  );
}
