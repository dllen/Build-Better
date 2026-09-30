import { SEO } from "@/components/seo";

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact"
        description="Get in touch with Build Better. Bug reports, suggestions, partnership inquiries."
      />
      <article className="max-w-3xl mx-auto space-y-8 text-foreground">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
          <p className="text-muted-foreground">
            Bug reports, suggestions, and inquiries.
          </p>
        </header>

        <section className="space-y-4 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Bug reports or suggestions</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a
                href="mailto:hello@buildbetter.app"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                hello@buildbetter.app
              </a>
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Privacy concerns</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a
                href="mailto:privacy@buildbetter.app"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                privacy@buildbetter.app
              </a>
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Partnership and advertising</h2>
            <p className="text-muted-foreground leading-relaxed">
              <a
                href="mailto:partners@buildbetter.app"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                partners@buildbetter.app
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Response time</h2>
          <p className="text-muted-foreground leading-relaxed">
            Usually within 48 hours on weekdays.
          </p>
        </section>
      </article>
    </>
  );
}
