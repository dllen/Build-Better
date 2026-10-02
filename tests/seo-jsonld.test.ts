import { test } from "node:test";
import { strict as assert } from "node:assert";
import {
  buildSoftwareApplicationLd,
  buildBreadcrumbLd,
  buildFAQPageLd,
  buildHowToLd,
} from "../src/components/seo/jsonLdBuilders.ts";

test("buildSoftwareApplicationLd emits required fields", () => {
  const ld = buildSoftwareApplicationLd({
    name: "VAT Calculator",
    description: "Calculate VAT instantly",
    url: "https://bb4bb.me/vat-calculator/",
  });
  assert.equal(ld["@type"], "SoftwareApplication");
  assert.equal(ld.name, "VAT Calculator");
  assert.equal(ld.offers.price, "0");
  assert.equal(ld.operatingSystem, "Web");
});

test("buildSoftwareApplicationLd omits aggregateRating without rating data", () => {
  const ld = buildSoftwareApplicationLd({ name: "X", description: "y", url: "z" });
  assert.equal(ld.aggregateRating, undefined);
});

test("buildSoftwareApplicationLd includes aggregateRating when given", () => {
  const ld = buildSoftwareApplicationLd({
    name: "X", description: "y", url: "z", ratingValue: 4.8, ratingCount: 100,
  });
  assert.equal(ld.aggregateRating.ratingValue, "4.8");
  assert.equal(ld.aggregateRating.ratingCount, "100");
});

test("buildBreadcrumbLd produces sequential positions", () => {
  const ld = buildBreadcrumbLd([
    { name: "Home", href: "https://bb4bb.me/" },
    { name: "Tools", href: "https://bb4bb.me/tools/" },
    { name: "VAT Calculator" },
  ]);
  const items = ld.itemListElement;
  assert.equal(items[0].position, 1);
  assert.equal(items[1].position, 2);
  assert.equal(items[2].position, 3);
  assert.equal(items[2].item, undefined);
});

test("buildFAQPageLd wraps each q&a in Question/Answer", () => {
  const ld = buildFAQPageLd([
    { question: "Q1", answer: "A1" },
    { question: "Q2", answer: "A2" },
  ]);
  assert.equal(ld.mainEntity.length, 2);
  assert.equal(ld.mainEntity[0].name, "Q1");
  assert.equal(ld.mainEntity[0].acceptedAnswer.text, "A1");
});

test("buildHowToLd numbers steps sequentially", () => {
  const ld = buildHowToLd("Calculate VAT", ["Step one", "Step two"]);
  assert.equal(ld.step[0].position, 1);
  assert.equal(ld.step[1].position, 2);
  assert.equal(ld.step[0].text, "Step one");
});
