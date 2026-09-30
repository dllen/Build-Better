import { SEO } from "@/components/seo";

export default function Privacy() {
  const lastUpdated = new Date().toISOString().split("T")[0];

  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Privacy policy for Build Better developer tools. Covers Google AdSense cookies, Cloudflare KV/D1 storage, and user data handling."
      />
      <article className="max-w-3xl mx-auto space-y-8 text-foreground">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </header>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Google AdSense</h2>
          <p className="text-muted-foreground leading-relaxed">
            Build Better uses Google AdSense, a web advertising service provided by Google.
            AdSense uses cookies to serve ads based on a user&apos;s prior visits to our site
            or other sites. Google&apos;s use of advertising cookies enables it and its
            partners to serve ads based on visits to this and/or other sites.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Users may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Google Ads Settings
            </a>
            .
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Cookies We Use</h2>
          <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <strong className="text-foreground">Google DART cookie</strong>: Used by
              Google AdSense to serve ads based on your visit to this site and other sites.
            </li>
            <li>
              <strong className="text-foreground">Local storage</strong>: Stores user
              preferences (theme, language, favorites, history) in your browser. Not
              transmitted to any server.
            </li>
            <li>
              <strong className="text-foreground">Short link cookies</strong>: For the URL
              shortener feature (Cloudflare KV-backed), we use cookies to track recent
              links.
            </li>
          </ul>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Data Storage</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cloudflare KV is used for short URL generation. Cloudflare D1 (the SharePool
            database) stores user-submitted content in the share pool. We do not sell your
            data to third parties.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Your Rights (GDPR / CCPA)</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you are in the EEA, UK, or California, you have the right to request access
            to, correction of, or deletion of any personal data we hold about you. Contact
            us at the address below and we will respond within 30 days.
          </p>
        </section>

        <section className="space-y-3 bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For privacy concerns or questions, contact:{" "}
            <a
              href="mailto:privacy@buildbetter.app"
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              privacy@buildbetter.app
            </a>
          </p>
        </section>
      </article>
    </>
  );
}
