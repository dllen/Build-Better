import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ruler } from "lucide-react";
import { SEO } from "@/components/seo";

interface SizeRow {
  us: string;
  eu: string;
  uk: string;
  asia: string;
}

const SIZE_TABLES: Record<string, SizeRow[]> = {
  "shoe-women": [
    { us: "5", eu: "35", uk: "2.5", asia: "22" },
    { us: "6", eu: "36", uk: "3.5", asia: "23" },
    { us: "7", eu: "37.5", uk: "4.5", asia: "24" },
    { us: "8", eu: "38.5", uk: "5.5", asia: "25" },
    { us: "9", eu: "40", uk: "6.5", asia: "26" },
    { us: "10", eu: "41", uk: "7.5", asia: "27" },
    { us: "11", eu: "42.5", uk: "8.5", asia: "28" },
  ],
  "shoe-men": [
    { us: "7", eu: "40", uk: "6", asia: "25" },
    { us: "8", eu: "41", uk: "7", asia: "26" },
    { us: "9", eu: "42.5", uk: "8", asia: "27" },
    { us: "10", eu: "44", uk: "9", asia: "28" },
    { us: "11", eu: "45", uk: "10", asia: "29" },
    { us: "12", eu: "46.5", uk: "11", asia: "30" },
  ],
  "clothing-women": [
    { us: "XS (0-2)", eu: "32-34", uk: "4-6", asia: "155/76A" },
    { us: "S (4-6)", eu: "34-36", uk: "8-10", asia: "160/80A" },
    { us: "M (8-10)", eu: "38-40", uk: "12-14", asia: "165/84A" },
    { us: "L (12-14)", eu: "42-44", uk: "16-18", asia: "170/88A" },
    { us: "XL (16-18)", eu: "46-48", uk: "20-22", asia: "175/92A" },
  ],
};

const CATEGORIES = [
  { id: "shoe-women", label: "👠 Shoe - Women" },
  { id: "shoe-men", label: "👞 Shoe - Men" },
  { id: "clothing-women", label: "👗 Clothing - Women" },
];

const HEADERS = ["US", "EU", "UK", "Asia"];

export default function SizeConverter() {
  const { t } = useTranslation();
  const [category, setCategory] = useState("shoe-women");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const table = SIZE_TABLES[category] || [];

  const getCellValue = (row: SizeRow, header: string): string => {
    return row[header.toLowerCase() as keyof SizeRow] ?? "—";
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <SEO
        title={t("tools.size-converter.title")}
        description="Convert shoe and clothing sizes between US, EU, UK, and Asian sizing systems."
        keywords={["size converter", "shoe size", "clothing size", "international sizes"]}
      />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <Ruler className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">{t("tools.size-converter.title")}</h1>
          <p className="text-lg text-muted-foreground">{t("tools.size-converter.subtitle")}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${ category === cat.id ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground hover:bg-border" }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {HEADERS.map(h => (
                    <th key={h} className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-border transition-colors ${hoveredIdx === idx ? "bg-destructive/10" : "hover:bg-muted"}`}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {HEADERS.map(h => (
                      <td key={h} className="px-6 py-3 text-center font-medium">
                        <span className={hoveredIdx === idx ? "text-destructive font-bold" : "text-foreground"}>
                          {getCellValue(row, h)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>{t("tools.size-converter.more_coming")}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Sizes are approximate. Always check with the specific brand’s size chart.
        </p>
      </div>
    </div>
  );
}
