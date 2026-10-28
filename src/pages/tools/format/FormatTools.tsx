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
        <h1 className="text-3xl font-bold text-foreground dark:text-muted-foreground">
          {t("Code Formatters", "Code Formatters")}
        </h1>
        <p className="mt-3 text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
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
              className="group border border-border dark:border-border rounded-xl p-5 hover:border-border dark:hover:border-border transition-colors duration-200 bg-card dark:bg-muted"
            >
              <div className={`inline-flex p-2.5 rounded-lg ${tool.iconColorClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-foreground dark:text-muted-foreground group-hover:text-primary dark:group-hover:text-primary">
                {tool.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">{tool.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
