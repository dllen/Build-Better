import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { SEO } from "@/components/SEO";

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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SEO title={title} description={subtitle} keywords={keywords} />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${iconBgColor}`}>
              <Icon className={`h-8 w-8 ${iconColor}`} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">{title}</h1>
          {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input area */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">{children}</div>
          {/* Result area */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col justify-center">
            {result}
          </div>
        </div>
      </div>
    </div>
  );
};
