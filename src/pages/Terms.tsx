import { SEO } from "@/components/seo";

export default function Terms() {
  const lastUpdated = new Date().toISOString().split("T")[0];

  return (
    <>
      <SEO
        title="Terms of Use"
        description="Terms of use for Build Better developer tools. Covers warranties, liability, intellectual property, and user responsibilities."
      />
      <article className="max-w-3xl mx-auto space-y-8 text-foreground">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Acceptance of Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            By accessing or using Build Better (<strong className="text-foreground">buildbetter.tools</strong>), you agree to be bound by these Terms of Use. If you do not agree, please do not use the site.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">"As Is" Disclaimer</h2>
          <p className="text-muted-foreground leading-relaxed">
            All tools on Build Better are provided on an <strong className="text-foreground">"as is" and "as available"</strong> basis, without warranties of any kind, either express or implied. We do not guarantee that any tool will be available, error-free, or suitable for your specific needs.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">No Professional Advice</h2>
          <p className="text-muted-foreground leading-relaxed">
            Results from calculators, converters, generators, and all other tools on this site are <strong className="text-foreground">estimates only</strong>. They do not constitute financial, legal, tax, investment, or professional advice of any kind. You should consult a qualified professional before making decisions based on any output from these tools.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">User Responsibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are solely responsible for <strong className="text-foreground">verifying the accuracy</strong> of any results produced by the tools before relying on them. Build Better is not responsible for any errors, omissions, or inaccuracies in tool outputs, or for any consequences arising from your use of or reliance on any tool.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">No Account Required</h2>
          <p className="text-muted-foreground leading-relaxed">
            Build Better does not require you to create an account. Most tools run entirely in your browser, and <strong className="text-foreground">no user data is stored on our servers</strong> unless explicitly stated for specific features (for example, short URLs stored in Cloudflare KV, or shared content in the SharePool D1 database). See our{" "}
            <a
              href="/privacy"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Privacy Policy
            </a>{" "}
            for more details.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Intellectual Property</h2>
          <p className="text-muted-foreground leading-relaxed">
            All tools, content, design, code, and materials on Build Better are the <strong className="text-foreground">intellectual property</strong> of the site owner, unless otherwise noted. You may use the tools for their intended purpose, but you may not copy, redistribute, or republish the tools or site content without permission.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Limitation of Liability</h2>
          <p className="text-muted-foreground leading-relaxed">
            To the fullest extent permitted by applicable law, Build Better and its owner shall not be liable for any <strong className="text-foreground">direct, indirect, incidental, consequential, or punitive damages</strong> arising from your use of or inability to use the site or any of its tools. This includes, without limitation, loss of data, loss of profits, business interruption, or any other commercial damages or losses.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Changes to These Terms</h2>
          <p className="text-muted-foreground leading-relaxed">
            We reserve the right to <strong className="text-foreground">update or modify these terms</strong> at any time without prior notice. Changes take effect immediately upon posting. Your continued use of the site after any changes constitutes acceptance of the revised terms. We encourage you to review this page periodically.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            Questions about these terms? Reach out via the{" "}
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