import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { SEO } from "@/components/seo";
import { AdSlot } from "@/components/ads";

interface CalculatorShellProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  children: ReactNode;
  result: ReactNode;
  keywords?: string[];
}

export const CalculatorShell: React.FC<CalculatorShellProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor,
  children,
  result,
  keywords = [],
}) => {
  return (
    <div className="py-8">
      <SEO title={title} description={subtitle} keywords={keywords} />
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <div
            className={`inline-flex p-2.5 rounded-pill mb-4 ${iconBgColor}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-medium text-foreground text-balance">{title}</h1>
          {subtitle && <p className="lead mt-3 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input area */}
          <div className="bg-card rounded-card border border-border p-6 md:p-8">{children}</div>
          {/* Result area */}
          <div className="bg-card rounded-card border border-border p-6 md:p-8 flex flex-col justify-center">
            {result}
          </div>
        </div>
        <AdSlot format="auto" minHeight={90} />
      </div>
    </div>
  );
};
