import { ChevronDown } from "lucide-react";

interface HowToStep {
  title: string;
  body: string;
}

interface FAQ {
  q: string;
  a: string;
}

export interface ToolSEOData {
  title: string;
  description: string;
  slug: string;
  features: string[];
  howToSteps: HowToStep[];
  faqs: FAQ[];
}

interface ToolPageSEOProps {
  data: ToolSEOData;
}

export function ToolPageSEO({ data }: ToolPageSEOProps) {
  const { title, description, features, howToSteps, faqs } = data;

  return (
    <section className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-3">
          {title}
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* How to Use */}
      {howToSteps.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            How to Use
          </h2>
          <ol className="space-y-3">
            {howToSteps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <strong className="font-medium">{step.title}</strong>
                  <p className="text-sm text-muted-foreground mt-0.5">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Features
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-500 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            FAQ
          </h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-lg border border-border bg-card overflow-hidden">
                <summary className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer list-none font-medium text-sm">
                  <span>{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 text-sm text-muted-foreground border-t border-border pt-3">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
