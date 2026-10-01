import React, { useState } from "react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import { FileText, Copy, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ContractTemplateGenerator() {
  const { t } = useTranslation();
  const [partyA, setPartyA] = useState("");
  const [partyB, setPartyB] = useState("");
  const [scope, setScope] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("");
  const [contract, setContract] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = () => {
    if (!partyA || !partyB || !scope) return;
    const text = `SERVICE AGREEMENT

Date: ${new Date().toISOString().split("T")[0]}

PARTY A (Client): ${partyA}
PARTY B (Contractor): ${partyB}

1. SCOPE OF WORK
${partyB} agrees to deliver the following services:
${scope}

2. PAYMENT
Total compensation: ${amount || "TBD"}
Payment terms: 50% upfront, 50% upon completion.

3. DURATION
This agreement is valid for: ${duration || "Until project is completed"}


4. INTELLECTUAL PROPERTY
All deliverables become the property of Party A upon full payment.

5. CONFIDENTIALITY
Both parties agree to maintain confidentiality of all proprietary information.

6. TERMINATION
Either party may terminate this agreement with 14 days written notice.

7. DISPUTE RESOLUTION
Any disputes shall be resolved through good-faith negotiation first, then mediation if needed.

By signing below, both parties agree to the terms above.

_____________________              _____________________
Party A: ${partyA}                Party B: ${partyB}
Date: __/__/____                  Date: __/__/____`;
    setContract(text);
  };

  const copy = () => {
    navigator.clipboard.writeText(contract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([contract], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resultNode = (
    <div className="space-y-3">
      {contract ? (
          <>
            <pre className="bg-gray-50 p-3 rounded-lg text-xs whitespace-pre-wrap max-h-72 overflow-y-auto border border-gray-200">{contract}</pre>
            <div className="flex gap-2">
              <button onClick={copy} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                <Copy className="h-4 w-4" />{copied ? t("common.copied") : t("tools.contract.copy")}
              </button>
              <button onClick={download} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                <Download className="h-4 w-4" />{t("tools.contract.download")}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{t("tools.contract.enter_values")}</p>
          </div>
        )}
    </div>
  );

  return (
    <CalculatorShell
      title={t("tools.contract.title")}
      subtitle={t("tools.contract.subtitle")}
      icon={FileText}
      iconBgColor="bg-slate-100"
      iconColor="text-slate-600"
      keywords={["contract template", "freelancer contract", "service agreement", "contract generator"]}
      result={resultNode}
    >
      <div className="space-y-3">
        <input value={partyA} onChange={e => setPartyA(e.target.value)} placeholder={t("tools.contract.party_a")} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border" />
        <input value={partyB} onChange={e => setPartyB(e.target.value)} placeholder={t("tools.contract.party_b")} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border" />
        <textarea value={scope} onChange={e => setScope(e.target.value)} rows={3} placeholder={t("tools.contract.scope")} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border" />
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder={t("tools.contract.amount")} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border" />
        <input value={duration} onChange={e => setDuration(e.target.value)} placeholder={t("tools.contract.duration")} className="block w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500 sm:text-sm py-2 px-3 border" />
        <button onClick={generate} className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">{t("tools.contract.generate")}</button>
      </div>
    </CalculatorShell>
  );
}
