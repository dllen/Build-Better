import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Code2, Braces, FileCode } from "lucide-react";

const formatTools = [
  { slug: "python-formatter", label: "Python Formatter", desc: "Indent Python code with colon-based detection", icon: Code2, color: "bg-blue-100 text-blue-600" },
  { slug: "java-formatter", label: "Java Formatter", desc: "Indent Java code with brace-based detection", icon: Braces, color: "bg-orange-100 text-orange-600" },
  { slug: "php-formatter", label: "PHP Formatter", desc: "Indent PHP code with brace-based detection", icon: FileCode, color: "bg-indigo-100 text-indigo-600" },
  { slug: "ruby-formatter", label: "Ruby Formatter", desc: "Indent Ruby code with keyword-based detection", icon: FileCode, color: "bg-red-100 text-red-600" },
  { slug: "csharp-formatter", label: "C# Formatter", desc: "Indent C# code with brace-based detection", icon: Braces, color: "bg-purple-100 text-purple-600" },
  { slug: "c-formatter", label: "C Formatter", desc: "Indent C code with brace detection + preprocessor support", icon: Braces, color: "bg-gray-100 text-gray-600" },
  { slug: "vbscript-formatter", label: "VBScript Formatter", desc: "Indent VBScript with keyword-based detection", icon: FileCode, color: "bg-sky-100 text-sky-600" },
  { slug: "perl-formatter", label: "Perl Formatter", desc: "Indent Perl code with brace-based detection", icon: FileCode, color: "bg-teal-100 text-teal-600" },
];

export default function FormatTools() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t("Code Formatters", "Code Formatters")}</h1>
        <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          {t("format.desc", "Simple indent-based code formatters — paste messy code, get consistent indentation.")}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {formatTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.slug}
              to={`/format/${tool.slug}`}
              className="group border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800"
            >
              <div className={`inline-flex p-2.5 rounded-lg ${tool.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{tool.label}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tool.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}