interface SoftwareApplicationInput {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  ratingValue?: number;
  ratingCount?: number;
  featureList?: string[];
}

export interface JsonLdObject {
  "@type": string;
  [key: string]: unknown;
}

export function buildSoftwareApplicationLd(input: SoftwareApplicationInput): JsonLdObject {
  const ld: JsonLdObject = {
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: input.applicationCategory ?? "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  if (input.featureList) ld.featureList = input.featureList;
  if (input.ratingValue && input.ratingCount) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(input.ratingValue),
      ratingCount: String(input.ratingCount),
    };
  }
  return ld;
}

export function buildBreadcrumbLd(items: { name: string; href?: string }[]): JsonLdObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      ...(item.href ? { item: item.href } : {}),
    })),
  };
}

export function buildFAQPageLd(questions: { question: string; answer: string }[]): JsonLdObject {
  return {
    "@type": "FAQPage",
    mainEntity: questions.map(q => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  };
}

export function buildHowToLd(name: string, steps: string[]): JsonLdObject {
  return {
    "@type": "HowTo",
    name,
    step: steps.map((text, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      text,
    })),
  };
}
