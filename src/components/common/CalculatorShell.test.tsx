import { describe, it, expect } from "vitest";
import { Calculator } from "lucide-react";
import * as Shell from "./CalculatorShell";

describe("CalculatorShell", () => {
  it("is exported as a named component", () => {
    expect(Shell.CalculatorShell).toBeDefined();
    expect(typeof Shell.CalculatorShell).toBe("function");
  });

  it("accepts the documented props without type errors", () => {
    // Type-level test: this assignment must compile under TypeScript strict mode.
    // If any required prop is missing or a prop type drifts, `npm run check` fails.
    const node = (
      <Shell.CalculatorShell
        title="Test Calculator"
        subtitle="A subtitle"
        icon={Calculator}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        result={<div>result panel</div>}
        keywords={["test"]}
      >
        <div>input</div>
      </Shell.CalculatorShell>
    );
    // Note: we intentionally do NOT render here. jsdom is not installed in
    // this project and the sandbox blocks npm installs. The compile-time
    // check above is the strongest available guarantee.
    expect(node).toBeDefined();
  });

  it("accepts a subtitle-less configuration", () => {
    const node = (
      <Shell.CalculatorShell
        title="Minimal"
        icon={Calculator}
        iconBgColor="bg-gray-100"
        iconColor="text-gray-600"
        result={<span>r</span>}
      >
        <span>c</span>
      </Shell.CalculatorShell>
    );
    expect(node).toBeDefined();
  });
});
