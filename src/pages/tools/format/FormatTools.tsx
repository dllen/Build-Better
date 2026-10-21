import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  pythonConfig,
  javaConfig,
  phpConfig,
  rubyConfig,
  csharpConfig,
  cConfig,
  vbscriptConfig,
  perlConfig,
} from "./format-configs";

const formatTools = [
  { slug: "python-formatter", ...pythonConfig },
  { slug: "java-formatter", ...javaConfig },
  { slug: "php-formatter", ...phpConfig },
  { slug: "ruby-formatter", ...rubyConfig },
  { slug: "csharp-formatter", ...csharpConfig },
  { slug: "c-formatter", ...cConfig },
  { slug: "vbscript-formatter", ...vbscriptConfig },
  { slug: "perl-formatter", ...perlConfig },
];

export default function FormatTools() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {t("Code Formatters", "Code Formatters")}
        </h1>
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
              <div className={`inline-flex p-2.5 rounded-lg ${tool.iconColorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
