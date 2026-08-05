import { useState } from "react";
import { ChevronDown, HelpCircle, X } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hidden SEO content for search engines */}
      <section className="hidden" aria-hidden="true">
        <h1>{title}</h1>
        <p>{description}</p>
        {features.length > 0 && (
          <ul>
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
        {faqs.length > 0 && (
          <dl>
            {faqs.map((faq, i) => (
              <div key={i}>
                <dt>{faq.q}</dt>
                <dd>{faq.a}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Floating help button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 z-40 p-3 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 group"
        title="使用帮助"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-popover border border-border rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          使用帮助
        </span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[10vh] px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[75vh] overflow-auto animate-in zoom-in-95 fade-in-0">
            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-border/50 bg-card/95 backdrop-blur-sm rounded-t-xl">
              <div>
                <h2 className="text-base font-semibold">{title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-6">
              {/* How to Use */}
              {howToSteps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    使用步骤
                  </h3>
                  <ol className="space-y-2">
                    {howToSteps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-medium flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <strong className="font-medium text-sm">{step.title}</strong>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.body}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    功能特性
                  </h3>
                  <ul className="grid grid-cols-1 gap-1.5">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-400 mt-0.5 shrink-0">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* FAQ */}
              {faqs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    常见问题
                  </h3>
                  <div className="space-y-1.5">
                    {faqs.map((faq, i) => (
                      <details key={i} className="group rounded-lg border border-border/50 bg-muted/20 overflow-hidden">
                        <summary className="flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer list-none text-sm">
                          <span>{faq.q}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="px-3 pb-3 text-sm text-muted-foreground border-t border-border/30 pt-2.5">
                          {faq.a}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-5 py-3 border-t border-border/50 bg-muted/20 rounded-b-xl">
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-muted-foreground">
                  按 <kbd className="px-1 py-0.5 text-[10px] font-mono bg-muted/50 border border-border/30 rounded">?</kbd> 查看快捷键
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
