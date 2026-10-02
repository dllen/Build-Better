import React from "react";
import {
  buildSoftwareApplicationLd,
  buildBreadcrumbLd,
  buildFAQPageLd,
  buildHowToLd,
  type JsonLdObject,
} from "./jsonLdBuilders";

export {
  buildSoftwareApplicationLd,
  buildBreadcrumbLd,
  buildFAQPageLd,
  buildHowToLd,
  type JsonLdObject,
};

export function JsonLd({ graphs }: { graphs: JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graphs }) }}
    />
  );
}
