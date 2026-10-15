import type { JsonLdObject } from "./jsonLdBuilders";

export function JsonLd({ graphs }: { graphs: JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graphs }) }}
    />
  );
}
