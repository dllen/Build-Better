import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { CreditCard, Check, X, Copy, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  validatePixKey,
  formatPixKey,
  generateCPF,
  generateCNPJ,
  PixKeyType,
} from "@/utils/tax-id-brazil";

const TAB_TYPES: { type: PixKeyType; label: string }[] = [
  { type: "cpf", label: "CPF" },
  { type: "cnpj", label: "CNPJ" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "evp", label: "EVP" },
];

export default function PixKeyValidator() {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState<PixKeyType>("cpf");
  const [inputValue, setInputValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [formattedValue, setFormattedValue] = useState<string>("");
  const [rawDigits, setRawDigits] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!inputValue.trim()) {
      setIsValid(null);
      setFormattedValue("");
      setRawDigits("");
      return;
    }

    const valid = validatePixKey(inputValue, activeType);
    setIsValid(valid);

    if (valid) {
      const formatted = formatPixKey(inputValue, activeType);
      setFormattedValue(formatted);
      setRawDigits(inputValue.replace(/\D/g, ""));
    } else {
      setFormattedValue("");
      setRawDigits("");
    }
  }, [inputValue, activeType]);

  const handleGenerate = () => {
    let generated = "";
    if (activeType === "cpf") {
      generated = generateCPF();
    } else if (activeType === "cnpj") {
      generated = generateCNPJ();
    }
    if (generated) {
      setInputValue(generated);
    }
  };

  const handleCopy = () => {
    if (formattedValue) {
      navigator.clipboard.writeText(formattedValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTypeChange = (type: PixKeyType) => {
    setActiveType(type);
    setInputValue("");
    setIsValid(null);
    setFormattedValue("");
    setRawDigits("");
  };

  const renderTabs = () => (
    <div className="flex flex-wrap rounded-lg bg-gray-100 p-1 mb-6">
      {TAB_TYPES.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => handleTypeChange(type)}
          className={`flex-1 min-w-[60px] py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeType === type
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const getPlaceholder = (): string => {
    switch (activeType) {
      case "cpf":
        return "000.000.000-00";
      case "cnpj":
        return "00.000.000/0000-00";
      case "email":
        return "email@example.com";
      case "phone":
        return "+5511988887777";
      case "evp":
        return "EVP (UUID v4)";
    }
  };

  const renderInput = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("pixKey.input_label")}
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholder()}
          className="block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
        />
      </div>

      {(activeType === "cpf" || activeType === "cnpj") && (
        <button
          onClick={handleGenerate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          {t("pixKey.generate")}
        </button>
      )}
    </div>
  );

  const renderResult = () => {
    if (isValid === null) {
      return (
        <div className="text-center text-gray-400 py-12">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("pixKey.enter_key")}</p>
        </div>
      );
    }

    if (isValid) {
      return (
        <div className="space-y-6">
          {/* Valid indicator */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <Check className="h-5 w-5" />
              <span className="font-medium">{t("pixKey.valid")}</span>
            </div>
          </div>

          {/* Type label for CPF/CNPJ */}
          {(activeType === "cpf" || activeType === "cnpj") && (
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                {activeType === "cpf"
                  ? t("pixKey.personal_cpf")
                  : t("pixKey.business_cnpj")}
              </span>
            </div>
          )}

          {/* Formatted value */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("pixKey.formatted")}
            </p>
            <p className="text-2xl font-bold text-gray-900 break-all">
              {formattedValue}
            </p>
          </div>

          {/* Raw digits for CPF/CNPJ */}
          {(activeType === "cpf" || activeType === "cnpj") && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">{t("pixKey.raw_digits")}</p>
              <p className="text-sm font-mono text-gray-700">{rawDigits}</p>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Copy className="h-4 w-4" />
            {copied ? t("pixKey.copied") : t("pixKey.copy")}
          </button>
        </div>
      );
    }

    // Invalid
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
            <X className="h-5 w-5" />
            <span className="font-medium">{t("pixKey.invalid")}</span>
          </div>
        </div>
        <div className="text-center text-gray-500">
          <p>{t("pixKey.invalid_message")}</p>
        </div>
      </div>
    );
  };

  return (
    <CalculatorShell
      title={t("pixKey.title")}
      subtitle={t("pixKey.subtitle")}
      icon={CreditCard}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={[
        "pix key validator",
        "brazil pix",
        "cpf validator",
        "cnpj validator",
        "pix key format",
      ]}
      result={renderResult()}
    >
      {renderTabs()}
      {renderInput()}
    </CalculatorShell>
  );
}
