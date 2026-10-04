import React, { useState, useMemo } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Scale, CheckCircle, AlertTriangle, XCircle, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

// Country-specific labor law rules
const COUNTRY_RULES = {
  saudi: {
    name: "Saudi Arabia",
    nameZh: "沙特阿拉伯",
    rules: {
      probation: { label: "试用期", labelZh: "试用期", min: 0, max: 90, unit: "天", pass: "≤ 90天" },
      annualLeave: { label: "年假天数", labelZh: "年假天数", min: 21, max: Infinity, unit: "天", pass: "≥ 21天" },
      overtime: { label: "加班工资倍数", labelZh: "加班工资倍数", min: 1.5, max: Infinity, unit: "倍", pass: "≥ 1.5倍" },
      socialInsurance: { label: "社保强制缴纳", labelZh: "社保强制缴纳", required: true, pass: "是" },
      terminationNotice: { label: "离职通知期", labelZh: "离职通知期", min: 30, max: Infinity, unit: "天", pass: "≥ 30天" },
      nonCompete: { label: "竞业限制条款", labelZh: "竞业限制条款", maxMonths: 12, pass: "≤ 12个月" },
    },
  },
  indonesia: {
    name: "Indonesia",
    nameZh: "印尼",
    rules: {
      probation: { label: "试用期", labelZh: "试用期", max: 3, unit: "个月", pass: "≤ 3个月" },
      annualLeave: { label: "年假天数", labelZh: "年假天数", min: 12, max: Infinity, unit: "工作日", pass: "≥ 12天" },
      overtime: { label: "加班工资倍数", labelZh: "加班工资倍数", min: 1.5, max: Infinity, unit: "倍", pass: "≥ 1.5倍" },
      socialInsurance: { label: "社保强制缴纳", labelZh: "社保强制缴纳", required: true, pass: "是 (BPJS)" },
      terminationNotice: { label: "离职通知期", labelZh: "离职通知期", min: 14, max: Infinity, unit: "工作日", pass: "≥ 14天" },
      nonCompete: { label: "竞业限制条款", labelZh: "竞业限制条款", maxMonths: 0, pass: "通常无效" },
    },
  },
  vietnam: {
    name: "Vietnam",
    nameZh: "越南",
    rules: {
      probation: { label: "试用期", labelZh: "试用期", max: 60, unit: "天", pass: "≤ 60天" },
      annualLeave: { label: "年假天数", labelZh: "年假天数", min: 12, max: Infinity, unit: "天", pass: "≥ 12天" },
      overtime: { label: "加班工资倍数", labelZh: "加班工资倍数", min: 1.5, max: Infinity, unit: "倍", pass: "≥ 1.5倍" },
      socialInsurance: { label: "社保强制缴纳", labelZh: "社保强制缴纳", required: true, pass: "是" },
      terminationNotice: { label: "离职通知期", labelZh: "离职通知期", min: 30, max: Infinity, unit: "天", pass: "≥ 30天" },
      nonCompete: { label: "竞业限制条款", labelZh: "竞业限制条款", maxMonths: 12, pass: "≤ 12个月" },
    },
  },
  uae: {
    name: "UAE",
    nameZh: "阿联酋",
    rules: {
      probation: { label: "试用期", labelZh: "试用期", max: 6, unit: "个月", pass: "≤ 6个月" },
      annualLeave: { label: "年假天数", labelZh: "年假天数", min: 30, max: Infinity, unit: "天", pass: "≥ 30天" },
      overtime: { label: "加班工资倍数", labelZh: "加班工资倍数", min: 1.5, max: Infinity, unit: "倍", pass: "≥ 1.5倍" },
      socialInsurance: { label: "社保强制缴纳", labelZh: "社保强制缴纳", required: false, pass: "非强制 (自由区)" },
      terminationNotice: { label: "离职通知期", labelZh: "离职通知期", min: 30, max: Infinity, unit: "天", pass: "≥ 30天" },
      nonCompete: { label: "竞业限制条款", labelZh: "竞业限制条款", maxMonths: 0, pass: "通常无效" },
    },
  },
  philippines: {
    name: "Philippines",
    nameZh: "菲律宾",
    rules: {
      probation: { label: "试用期", labelZh: "试用期", max: 6, unit: "个月", pass: "≤ 6个月" },
      annualLeave: { label: "年假天数", labelZh: "年假天数", min: 5, max: Infinity, unit: "天", pass: "≥ 5天" },
      overtime: { label: "加班工资倍数", labelZh: "加班工资倍数", min: 1.25, max: Infinity, unit: "倍", pass: "≥ 1.25倍" },
      socialInsurance: { label: "社保强制缴纳", labelZh: "社保强制缴纳", required: true, pass: "是 (SSS, PhilHealth, Pag-IBIG)" },
      terminationNotice: { label: "离职通知期", labelZh: "离职通知期", min: 30, max: Infinity, unit: "天", pass: "≥ 30天" },
      nonCompete: { label: "竞业限制条款", labelZh: "竞业限制条款", maxMonths: 0, pass: "通常无效" },
    },
  },
};

type CountryKey = keyof typeof COUNTRY_RULES;

interface ClauseValues {
  probation: string;
  annualLeave: string;
  overtime: string;
  socialInsurance: boolean;
  terminationNotice: string;
  nonCompete: string;
}

interface CheckResult {
  clause: string;
  clauseZh: string;
  yourValue: string;
  legalLimit: string;
  status: "pass" | "warning" | "fail";
  recommendation: string;
}

export default function ContractClauseChecker() {
  const { t, i18n } = useTranslation();
  const isZh = i18n.language === "zh-CN" || i18n.language === "zh-TW";

  const [country, setCountry] = useState<CountryKey>("indonesia");
  const [values, setValues] = useState<ClauseValues>({
    probation: "",
    annualLeave: "",
    overtime: "",
    socialInsurance: false,
    terminationNotice: "",
    nonCompete: "",
  });

  const countryRule = COUNTRY_RULES[country];

  const handleValueChange = (field: keyof ClauseValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const results = useMemo<CheckResult[]>(() => {
    const rules = countryRule.rules;
    const res: CheckResult[] = [];

    // Probation check
    if (values.probation) {
      const inputVal = parseFloat(values.probation);
      const maxVal = rules.probation.max || rules.probation.unit === "天" ? rules.probation.max : 999;
      const isPass = inputVal <= maxVal;
      res.push({
        clause: rules.probation.label,
        clauseZh: rules.probation.labelZh,
        yourValue: `${values.probation} ${rules.probation.unit}`,
        legalLimit: rules.probation.pass,
        status: isPass ? "pass" : "fail",
        recommendation: isPass
          ? ""
          : isZh
          ? `试用期超过法定上限${maxVal}${rules.probation.unit}，建议修改为${maxVal}${rules.probation.unit}以内`
          : `Probation exceeds legal limit of ${maxVal} ${rules.probation.unit}. Recommend reducing to within ${maxVal} ${rules.probation.unit}.`,
      });
    }

    // Annual leave check
    if (values.annualLeave) {
      const inputVal = parseFloat(values.annualLeave);
      const minVal = rules.annualLeave.min;
      const isPass = inputVal >= minVal;
      res.push({
        clause: rules.annualLeave.label,
        clauseZh: rules.annualLeave.labelZh,
        yourValue: `${values.annualLeave} ${rules.annualLeave.unit}`,
        legalLimit: rules.annualLeave.pass,
        status: isPass ? "pass" : "warning",
        recommendation: isPass
          ? ""
          : isZh
          ? `年假少于法定最低${minVal}天，建议增加至${minVal}天或以上`
          : `Annual leave below minimum of ${minVal} days. Recommend increasing to at least ${minVal} days.`,
      });
    }

    // Overtime check
    if (values.overtime) {
      const inputVal = parseFloat(values.overtime);
      const minVal = rules.overtime.min;
      const isPass = inputVal >= minVal;
      res.push({
        clause: rules.overtime.label,
        clauseZh: rules.overtime.labelZh,
        yourValue: `${values.overtime} 倍`,
        legalLimit: rules.overtime.pass,
        status: isPass ? "pass" : "fail",
        recommendation: isPass
          ? ""
          : isZh
          ? `加班工资倍数低于法定最低${minVal}倍，请核实合同条款`
          : `Overtime multiplier below legal minimum of ${minVal}x. Please verify contract terms.`,
      });
    }

    // Social insurance check
    if (values.socialInsurance) {
      res.push({
        clause: rules.socialInsurance.label,
        clauseZh: rules.socialInsurance.labelZh,
        yourValue: "是",
        legalLimit: rules.socialInsurance.pass,
        status: "pass",
        recommendation: "",
      });
    } else if (rules.socialInsurance.required) {
      res.push({
        clause: rules.socialInsurance.label,
        clauseZh: rules.socialInsurance.labelZh,
        yourValue: "否",
        legalLimit: rules.socialInsurance.pass,
        status: "fail",
        recommendation: isZh
          ? "该国强制缴纳社保，未包含此条款可能违反劳动法"
          : "Social insurance is mandatory in this country. Not including this clause may violate labor laws.",
      });
    }

    // Termination notice check
    if (values.terminationNotice) {
      const inputVal = parseFloat(values.terminationNotice);
      const minVal = rules.terminationNotice.min;
      const isPass = inputVal >= minVal;
      res.push({
        clause: rules.terminationNotice.label,
        clauseZh: rules.terminationNotice.labelZh,
        yourValue: `${values.terminationNotice} ${rules.terminationNotice.unit}`,
        legalLimit: rules.terminationNotice.pass,
        status: isPass ? "pass" : "fail",
        recommendation: isPass
          ? ""
          : isZh
          ? `通知期低于法定最低${minVal}天，建议延长至${minVal}天`
          : `Notice period below minimum of ${minVal} days. Recommend extending to at least ${minVal} days.`,
      });
    }

    // Non-compete check
    if (values.nonCompete) {
      const inputVal = parseInt(values.nonCompete) || 0;
      const maxVal = rules.nonCompete.maxMonths;
      if (maxVal === 0) {
        res.push({
          clause: rules.nonCompete.label,
          clauseZh: rules.nonCompete.labelZh,
          yourValue: `${values.nonCompete} 个月`,
          legalLimit: rules.nonCompete.pass,
          status: "warning",
          recommendation: isZh
            ? "该国劳动法通常不承认竞业限制条款，建议删除或咨询当地律师"
            : "Non-compete clauses are generally not recognized in this country's labor law. Consider removing or consulting a local lawyer.",
        });
      } else {
        const isPass = inputVal <= maxVal;
        res.push({
          clause: rules.nonCompete.label,
          clauseZh: rules.nonCompete.labelZh,
          yourValue: `${values.nonCompete} 个月`,
          legalLimit: rules.nonCompete.pass,
          status: isPass ? "pass" : "warning",
          recommendation: isPass
            ? ""
            : isZh
            ? `竞业限制期限超过${maxVal}个月，建议缩短`
            : `Non-compete period exceeds ${maxVal} months. Consider reducing.`,
        });
      }
    }

    return res;
  }, [country, values, countryRule, isZh]);

  const riskLevel = useMemo(() => {
    if (results.some((r) => r.status === "fail")) return "high";
    if (results.some((r) => r.status === "warning")) return "medium";
    return "low";
  }, [results]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pass":
        return isZh ? "通过" : "Pass";
      case "warning":
        return isZh ? "警告" : "Warning";
      case "fail":
        return isZh ? "不通过" : "Fail";
      default:
        return "";
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case "high":
        return isZh ? "高风险" : "High Risk";
      case "medium":
        return isZh ? "中等风险" : "Medium Risk";
      case "low":
        return isZh ? "低风险" : "Low Risk";
      default:
        return "";
    }
  };

  const inputPanel = (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isZh ? "选择国家" : "Select Country"}
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value as CountryKey)}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border"
        >
          <option value="saudi">🇸🇦 {isZh ? "沙特阿拉伯" : "Saudi Arabia"}</option>
          <option value="indonesia">🇮🇩 {isZh ? "印尼" : "Indonesia"}</option>
          <option value="vietnam">🇻🇳 {isZh ? "越南" : "Vietnam"}</option>
          <option value="uae">🇦🇪 {isZh ? "阿联酋" : "UAE"}</option>
          <option value="philippines">🇵🇭 {isZh ? "菲律宾" : "Philippines"}</option>
        </select>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-4">
          {isZh ? "合同条款检查" : "Contract Clause Check"}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {isZh ? "试用期" : "Probation Period"} ({countryRule.rules.probation.unit})
            </label>
            <input
              type="number"
              min="0"
              value={values.probation}
              onChange={(e) => handleValueChange("probation", e.target.value)}
              placeholder={isZh ? `例如: ${countryRule.rules.probation.max}` : `e.g., ${countryRule.rules.probation.max}`}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {isZh ? "年假天数" : "Annual Leave Days"} ({countryRule.rules.annualLeave.unit})
            </label>
            <input
              type="number"
              min="0"
              value={values.annualLeave}
              onChange={(e) => handleValueChange("annualLeave", e.target.value)}
              placeholder={isZh ? `例如: ${countryRule.rules.annualLeave.min}` : `e.g., ${countryRule.rules.annualLeave.min}`}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {isZh ? "加班工资倍数" : "Overtime Pay Multiplier"}
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={values.overtime}
              onChange={(e) => handleValueChange("overtime", e.target.value)}
              placeholder={isZh ? `例如: 1.5` : `e.g., 1.5`}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.socialInsurance}
                onChange={(e) => handleValueChange("socialInsurance", e.target.checked)}
                className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
              />
              <span className="text-gray-700">
                {isZh ? "包含社保缴纳条款" : "Includes social insurance clause"}
              </span>
            </label>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {isZh ? "离职通知期" : "Termination Notice Period"} ({countryRule.rules.terminationNotice.unit})
            </label>
            <input
              type="number"
              min="0"
              value={values.terminationNotice}
              onChange={(e) => handleValueChange("terminationNotice", e.target.value)}
              placeholder={isZh ? `例如: ${countryRule.rules.terminationNotice.min}` : `e.g., ${countryRule.rules.terminationNotice.min}`}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {isZh ? "竞业限制期限" : "Non-Compete Period"} (个月 / months)
            </label>
            <input
              type="number"
              min="0"
              value={values.nonCompete}
              onChange={(e) => handleValueChange("nonCompete", e.target.value)}
              placeholder={isZh ? "例如: 6" : "e.g., 6"}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex items-start gap-2">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          {isZh
            ? "以上为常见劳动法条款检查，具体法规可能因情况而异。建议咨询当地劳动法律师获取准确信息。"
            : "These are common labor law clause checks. Specific regulations may vary. Consult a local labor lawyer for accurate information."}
        </span>
      </div>
    </div>
  );

  const resultPanel = (
    <div className="space-y-6">
      {results.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <Scale className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{isZh ? "请输入合同条款进行检测" : "Enter contract clauses to check"}</p>
        </div>
      ) : (
        <>
          {/* Risk Level Banner */}
          <div className={`p-4 rounded-lg border ${getRiskColor(riskLevel)}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{isZh ? "风险等级" : "Risk Level"}</span>
              <span className="font-bold">{getRiskLabel(riskLevel)}</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "条款" : "Clause"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "你的值" : "Your Value"}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "法定限制" : "Legal Limit"}
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    {isZh ? "状态" : "Status"}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {isZh ? result.clauseZh : result.clause}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{result.yourValue}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{result.legalLimit}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(result.status)}
                        <span className="text-xs">{getStatusLabel(result.status)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recommendations */}
          {results.some((r) => r.recommendation) && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">
                {isZh ? "改善建议" : "Recommendations"}
              </h4>
              {results
                .filter((r) => r.recommendation)
                .map((r, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      r.status === "fail"
                        ? "bg-red-50 text-red-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    <div className="font-medium">
                      {isZh ? r.clauseZh : r.clause}
                    </div>
                    <div className="mt-1">{r.recommendation}</div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("contractClause.title")}
      subtitle={t("contractClause.subtitle")}
      icon={Scale}
      iconBgColor="bg-slate-100"
      iconColor="text-slate-600"
      keywords={[
        "contract checker",
        "labor law",
        "employment contract",
        "海外劳动合同",
        "劳动法检查",
      ]}
      result={resultPanel}
    >
      {inputPanel}
    </CalculatorShell>
  );
}
