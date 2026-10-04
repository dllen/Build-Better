import React, { useState, useEffect } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MarketConfig {
  name: string;
  countryCode: string;
}

interface PaymentTerm {
  id: string;
  name: string;
  type: "net" | "eom" | "fifteenth" | "prepayment";
  days?: number;
}

const MARKETS: Record<string, MarketConfig> = {
  saudi: { name: "Saudi Arabia", countryCode: "SA" },
  indonesia: { name: "Indonesia", countryCode: "ID" },
  vietnam: { name: "Vietnam", countryCode: "VN" },
  uae: { name: "UAE", countryCode: "AE" },
  philippines: { name: "Philippines", countryCode: "PH" },
  brazil: { name: "Brazil", countryCode: "BR" },
  kenya: { name: "Kenya", countryCode: "KE" },
  generic: { name: "Generic", countryCode: "XX" },
};

const PAYMENT_TERMS: PaymentTerm[] = [
  { id: "net7", name: "Net 7", type: "net", days: 7 },
  { id: "net15", name: "Net 15", type: "net", days: 15 },
  { id: "net30", name: "Net 30", type: "net", days: 30 },
  { id: "net45", name: "Net 45", type: "net", days: 45 },
  { id: "net60", name: "Net 60", type: "net", days: 60 },
  { id: "net90", name: "Net 90", type: "net", days: 90 },
  { id: "eom", name: "End of Month", type: "eom" },
  { id: "fifteenth", name: "15th of Following Month", type: "fifteenth" },
  { id: "prepayment", name: "Prepayment", type: "prepayment" },
];

function calculateDueDate(invoiceDate: Date, term: PaymentTerm): Date {
  switch (term.type) {
    case "net": {
      const result = new Date(invoiceDate);
      result.setDate(result.getDate() + (term.days || 0));
      return result;
    }
    case "eom": {
      const result = new Date(invoiceDate);
      result.setMonth(result.getMonth() + 1);
      result.setDate(0);
      return result;
    }
    case "fifteenth": {
      const result = new Date(invoiceDate);
      result.setMonth(result.getMonth() + 1);
      result.setDate(15);
      return result;
    }
    case "prepayment": {
      return invoiceDate;
    }
    default:
      return invoiceDate;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatus(dueDate: Date): {
  status: "overdue" | "due_today" | "upcoming";
  label: string;
  colorClass: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: "overdue", label: "Overdue", colorClass: "text-red-600 bg-red-50" };
  } else if (diffDays === 0) {
    return { status: "due_today", label: "Due Today", colorClass: "text-amber-600 bg-amber-50" };
  } else {
    return { status: "upcoming", label: "Upcoming", colorClass: "text-green-600 bg-green-50" };
  }
}

export default function PaymentDeadlineCalculator() {
  const { t } = useTranslation();
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [market, setMarket] = useState<string>("generic");
  const [paymentTerm, setPaymentTerm] = useState<string>("net30");
  const [result, setResult] = useState<{
    dueDate: Date;
    daysUntilDue: number;
    status: "overdue" | "due_today" | "upcoming";
    statusLabel: string;
    colorClass: string;
  } | null>(null);

  const calculate = () => {
    if (!invoiceDate) return;

    const term = PAYMENT_TERMS.find((t) => t.id === paymentTerm);
    if (!term) return;

    const invDate = new Date(invoiceDate);
    const dueDate = calculateDueDate(invDate, term);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const statusInfo = getStatus(dueDate);

    setResult({
      dueDate,
      daysUntilDue,
      status: statusInfo.status,
      statusLabel: statusInfo.label,
      colorClass: statusInfo.colorClass,
    });
  };

  useEffect(() => {
    if (invoiceDate && paymentTerm) {
      calculate();
    }
  }, [invoiceDate, market, paymentTerm]);

  const resultNode = (
    <div className="space-y-6">
      {result ? (
        <>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {t("paymentDeadline.due_date")}
            </p>
            <p className="text-4xl font-bold text-gray-900">
              {formatDate(result.dueDate)}
            </p>
          </div>

          <div className={`p-3 rounded-lg text-center ${result.colorClass}`}>
            <span className="font-semibold">{result.statusLabel}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">{t("paymentDeadline.days_until_due")}</p>
              <p className="text-3xl font-bold text-gray-900">
                {result.daysUntilDue < 0
                  ? Math.abs(result.daysUntilDue)
                  : result.daysUntilDue}
                <span className="text-lg font-normal text-gray-500 ml-1">
                  {result.daysUntilDue < 0
                    ? t("paymentDeadline.days_overdue")
                    : result.daysUntilDue === 0
                    ? t("paymentDeadline.days_today")
                    : t("paymentDeadline.days")}
                </span>
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="text-gray-600">
              <strong>{t("paymentDeadline.invoice_date")}:</strong>{" "}
              {formatDate(new Date(invoiceDate))}
            </p>
            <p className="text-gray-600 mt-1">
              <strong>{t("paymentDeadline.payment_terms")}:</strong>{" "}
              {PAYMENT_TERMS.find((t) => t.id === paymentTerm)?.name}
            </p>
            <p className="text-gray-600 mt-1">
              <strong>{t("paymentDeadline.market")}:</strong>{" "}
              {MARKETS[market]?.name}
            </p>
          </div>
        </>
      ) : (
        <div className="text-center text-gray-400 py-12">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-40" />
          <p className="text-lg">{t("paymentDeadline.enter_values")}</p>
        </div>
      )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("paymentDeadline.title")}
      subtitle={t("paymentDeadline.subtitle")}
      icon={Clock}
      iconBgColor="bg-cyan-100"
      iconColor="text-cyan-600"
      keywords={[
        "payment deadline",
        "invoice due date",
        "payment terms",
        "Net 30",
        "end of month",
        "payment calculator",
      ]}
      result={resultNode}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("paymentDeadline.invoice_date")}
          </label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2 px-3 border"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("paymentDeadline.market")}
          </label>
          <select
            value={market}
            onChange={(e) => setMarket(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2 px-3 border"
          >
            {Object.entries(MARKETS).map(([key, config]) => (
              <option key={key} value={key}>
                {config.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("paymentDeadline.payment_terms")}
          </label>
          <select
            value={paymentTerm}
            onChange={(e) => setPaymentTerm(e.target.value)}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2 px-3 border"
          >
            {PAYMENT_TERMS.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={calculate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
        >
          {t("paymentDeadline.calculate")}
        </button>
      </div>
    </CalculatorShell>
  );
}
