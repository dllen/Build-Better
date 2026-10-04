import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Fingerprint, Copy, Check, Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  generateCPF,
  formatCPF,
  validateCPF,
  generateCNPJ,
  formatCNPJ,
  validateCNPJ,
} from "@/utils/tax-id-brazil";

type TabType = "generateCPF" | "generateCNPJ" | "validateCPF" | "validateCNPJ";

// Helper function to extract only digits
const digitsOnly = (s: string): string => {
  return s.replace(/\D/g, "");
};

export default function BrazilTaxIdTool() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("generateCPF");

  // Generate CPF state
  const [cpfBirthDate, setCpfBirthDate] = useState("");
  const [generatedCPF, setGeneratedCPF] = useState<{ raw: string; formatted: string } | null>(null);
  const [cpfCopied, setCpfCopied] = useState(false);

  // Generate CNPJ state
  const [cnpjRegDate, setCnpjRegDate] = useState("");
  const [generatedCNPJ, setGeneratedCNPJ] = useState<{ raw: string; formatted: string } | null>(null);
  const [cnpjCopied, setCnpjCopied] = useState(false);

  // Validate CPF state
  const [cpfInput, setCpfInput] = useState("");
  const [cpfValidation, setCpfValidation] = useState<{ valid: boolean; formatted?: string; raw?: string } | null>(null);

  // Validate CNPJ state
  const [cnpjInput, setCnpjInput] = useState("");
  const [cnpjValidation, setCnpjValidation] = useState<{ valid: boolean; formatted?: string; raw?: string } | null>(null);

  // Batch generation state
  const [batchCount, setBatchCount] = useState(10);
  const [batchResults, setBatchResults] = useState<string[]>([]);

  const handleGenerateCPF = () => {
    const raw = generateCPF(cpfBirthDate);
    setGeneratedCPF({ raw, formatted: formatCPF(raw) });
  };

  const handleGenerateCNPJ = () => {
    const raw = generateCNPJ(cnpjRegDate);
    setGeneratedCNPJ({ raw, formatted: formatCNPJ(raw) });
  };

  const handleValidateCPF = () => {
    const raw = digitsOnly(cpfInput);
    const valid = validateCPF(cpfInput);
    setCpfValidation({
      valid,
      formatted: valid ? formatCPF(raw) : undefined,
      raw: valid ? raw : undefined,
    });
  };

  const handleValidateCNPJ = () => {
    const raw = digitsOnly(cnpjInput);
    const valid = validateCNPJ(cnpjInput);
    setCnpjValidation({
      valid,
      formatted: valid ? formatCNPJ(raw) : undefined,
      raw: valid ? raw : undefined,
    });
  };

  const handleBatchGenerate = (type: "CPF" | "CNPJ") => {
    const count = Math.min(Math.max(batchCount, 1), 100);
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      if (type === "CPF") {
        results.push(generateCPF(""));
      } else {
        results.push(generateCNPJ(""));
      }
    }
    setBatchResults(results);
  };

  const handleDownloadCSV = () => {
    const csvContent = "id\n" + batchResults.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brazil_tax_ids_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, setCopied: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "generateCPF", label: t("brazilTaxId.generate_cpf") },
    { key: "generateCNPJ", label: t("brazilTaxId.generate_cnpj") },
    { key: "validateCPF", label: t("brazilTaxId.validate_cpf") },
    { key: "validateCNPJ", label: t("brazilTaxId.validate_cnpj") },
  ];

  const renderTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.key
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const renderGenerateCPF = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("brazilTaxId.birth_date")} <span className="text-gray-400">({t("brazilTaxId.optional")})</span>
        </label>
        <input
          type="text"
          value={cpfBirthDate}
          onChange={(e) => setCpfBirthDate(e.target.value)}
          placeholder="DD/MM/YYYY"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        />
      </div>
      <button
        onClick={handleGenerateCPF}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        {t("brazilTaxId.generate")}
      </button>
      {generatedCPF && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t("brazilTaxId.formatted")}</span>
            <span className="font-mono text-lg font-bold text-green-700">{generatedCPF.formatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t("brazilTaxId.digits")}</span>
            <span className="font-mono text-sm text-gray-500">{generatedCPF.raw}</span>
          </div>
          <button
            onClick={() => copyToClipboard(generatedCPF.raw, setCpfCopied)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {cpfCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {cpfCopied ? t("common.copied") : t("brazilTaxId.copy")}
          </button>
        </div>
      )}
    </div>
  );

  const renderGenerateCNPJ = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("brazilTaxId.registration_date")} <span className="text-gray-400">({t("brazilTaxId.optional")})</span>
        </label>
        <input
          type="text"
          value={cnpjRegDate}
          onChange={(e) => setCnpjRegDate(e.target.value)}
          placeholder="DD/MM/YYYY"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        />
      </div>
      <button
        onClick={handleGenerateCNPJ}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        {t("brazilTaxId.generate")}
      </button>
      {generatedCNPJ && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t("brazilTaxId.formatted")}</span>
            <span className="font-mono text-lg font-bold text-green-700">{generatedCNPJ.formatted}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t("brazilTaxId.digits")}</span>
            <span className="font-mono text-sm text-gray-500">{generatedCNPJ.raw}</span>
          </div>
          <button
            onClick={() => copyToClipboard(generatedCNPJ.raw, setCnpjCopied)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {cnpjCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {cnpjCopied ? t("common.copied") : t("brazilTaxId.copy")}
          </button>
        </div>
      )}
    </div>
  );

  const renderValidateCPF = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("brazilTaxId.cpf_input")}</label>
        <input
          type="text"
          value={cpfInput}
          onChange={(e) => setCpfInput(e.target.value)}
          placeholder="XXX.XXX.XXX-XX"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        />
      </div>
      <button
        onClick={handleValidateCPF}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        {t("brazilTaxId.validate")}
      </button>
      {cpfValidation && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            cpfValidation.valid ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-lg font-bold ${
                cpfValidation.valid ? "text-green-700" : "text-red-700"
              }`}
            >
              {cpfValidation.valid ? t("brazilTaxId.valid") : t("brazilTaxId.invalid")}
            </span>
          </div>
          {cpfValidation.valid && cpfValidation.formatted && cpfValidation.raw && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("brazilTaxId.formatted")}</span>
                <span className="font-mono font-bold text-green-700">{cpfValidation.formatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("brazilTaxId.digits")}</span>
                <span className="font-mono text-sm text-gray-500">{cpfValidation.raw}</span>
              </div>
              <button
                onClick={() => copyToClipboard(cpfValidation.raw!, setCpfCopied)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-3"
              >
                {cpfCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {cpfCopied ? t("common.copied") : t("brazilTaxId.copy")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderValidateCNPJ = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t("brazilTaxId.cnpj_input")}</label>
        <input
          type="text"
          value={cnpjInput}
          onChange={(e) => setCnpjInput(e.target.value)}
          placeholder="XX.XXX.XXX/XXXX-XX"
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        />
      </div>
      <button
        onClick={handleValidateCNPJ}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        {t("brazilTaxId.validate")}
      </button>
      {cnpjValidation && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            cnpjValidation.valid ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-lg font-bold ${
                cnpjValidation.valid ? "text-green-700" : "text-red-700"
              }`}
            >
              {cnpjValidation.valid ? t("brazilTaxId.valid") : t("brazilTaxId.invalid")}
            </span>
          </div>
          {cnpjValidation.valid && cnpjValidation.formatted && cnpjValidation.raw && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("brazilTaxId.formatted")}</span>
                <span className="font-mono font-bold text-green-700">{cnpjValidation.formatted}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("brazilTaxId.digits")}</span>
                <span className="font-mono text-sm text-gray-500">{cnpjValidation.raw}</span>
              </div>
              <button
                onClick={() => copyToClipboard(cnpjValidation.raw!, setCnpjCopied)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 mt-3"
              >
                {cnpjCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {cnpjCopied ? t("common.copied") : t("brazilTaxId.copy")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderBatchGeneration = () => (
    <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
      <h3 className="text-sm font-medium text-gray-700">{t("brazilTaxId.batch_generate")}</h3>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          max="100"
          value={batchCount}
          onChange={(e) => setBatchCount(parseInt(e.target.value) || 10)}
          className="block w-24 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
        />
        <button
          onClick={() => handleBatchGenerate("CPF")}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          {t("brazilTaxId.generate_cpf_batch")}
        </button>
        <button
          onClick={() => handleBatchGenerate("CNPJ")}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
        >
          {t("brazilTaxId.generate_cnpj_batch")}
        </button>
      </div>
      {batchResults.length > 0 && (
        <div className="space-y-3">
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {batchResults.map((id, index) => (
              <div key={index} className="font-mono text-sm text-gray-600 py-1">
                {id}
              </div>
            ))}
          </div>
          <button
            onClick={handleDownloadCSV}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            {t("brazilTaxId.download_csv")}
          </button>
        </div>
      )}
    </div>
  );

  const renderInputArea = () => (
    <div>
      {renderTabs()}
      {activeTab === "generateCPF" && renderGenerateCPF()}
      {activeTab === "generateCNPJ" && renderGenerateCNPJ()}
      {activeTab === "validateCPF" && renderValidateCPF()}
      {activeTab === "validateCNPJ" && renderValidateCNPJ()}
      {renderBatchGeneration()}
    </div>
  );

  const renderResultArea = () => (
    <div className="text-center text-gray-400 py-12">
      <Fingerprint className="h-12 w-12 mx-auto mb-4 opacity-40" />
      <p className="text-lg">{t("brazilTaxId.select_tab")}</p>
    </div>
  );

  return (
    <CalculatorShell
      title={t("brazilTaxId.title")}
      subtitle={t("brazilTaxId.subtitle")}
      icon={Fingerprint}
      iconBgColor="bg-blue-100"
      iconColor="text-blue-600"
      keywords={[
        "Brazil CPF generator",
        "Brazil CNPJ generator",
        "CPF validator",
        "CNPJ validator",
        "Brazil tax ID",
        "CPF",
        "CNPJ",
      ]}
      result={renderResultArea()}
    >
      {renderInputArea()}
    </CalculatorShell>
  );
}
