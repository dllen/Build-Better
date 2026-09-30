import { Helmet } from "react-helmet-async";
import type { ToolSEOData } from "./ToolPageSEO";

export interface JsonLdProps {
  /** Full URL of the page (used as @id) */
  url: string;
  /** Tool SEO data */
  data: ToolSEOData;
  /** Optional breadcrumb items */
  breadcrumb?: { name: string; url: string }[];
}

const SITE_NAME = "Build Better";

export function JsonLd({ url, data, breadcrumb }: JsonLdProps) {
  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": url,
    name: data.title.split(" - ")[0] || data.title,
    description: data.description,
    url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (Web Browser)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };

  const faqPage =
    data.faqs?.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: data.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }
      : null;

  const breadcrumbLd = breadcrumb
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }
    : null;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(softwareApp)}
      </script>
      {faqPage && (
        <script type="application/ld+json">
          {JSON.stringify(faqPage)}
        </script>
      )}
      {breadcrumbLd && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbLd)}
        </script>
      )}
    </Helmet>
  );
}
