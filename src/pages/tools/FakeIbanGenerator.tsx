import { useState } from "react";
import { Landmark, Copy, Check } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

// IBAN country data: [country name, country code, length, flag emoji]
const COUNTRIES: [string, string, number, string][] = [
  ["Albania", "AL", 28, "🇦🇱"],
  ["Andorra", "AD", 24, "🇦🇩"],
  ["Austria", "AT", 20, "🇦🇹"],
  ["Azerbaijan", "AZ", 28, "🇦🇿"],
  ["Bahrain", "BH", 22, "🇧🇭"],
  ["Belgium", "BE", 16, "🇧🇪"],
  ["Bosnia and Herzegovina", "BA", 20, "🇧🇦"],
  ["Brazil", "BR", 29, "🇧🇷"],
  ["Bulgaria", "BG", 22, "🇧🇬"],
  ["Costa Rica", "CR", 22, "🇨🇷"],
  ["Croatia", "HR", 21, "🇭🇷"],
  ["Cyprus", "CY", 28, "🇨🇾"],
  ["Czech Republic", "CZ", 24, "🇨🇿"],
  ["Denmark", "DK", 18, "🇩🇰"],
  ["Dominican Republic", "DO", 28, "🇩🇴"],
  ["Egypt", "EG", 29, "🇪🇬"],
  ["Estonia", "EE", 20, "🇪🇪"],
  ["Finland", "FI", 18, "🇫🇮"],
  ["France", "FR", 27, "🇫🇷"],
  ["Georgia", "GE", 22, "🇬🇪"],
  ["Germany", "DE", 22, "🇩🇪"],
  ["Greece", "GR", 27, "🇬🇷"],
  ["Hungary", "HU", 28, "🇭🇺"],
  ["Iceland", "IS", 26, "🇮🇸"],
  ["Ireland", "IE", 22, "🇮🇪"],
  ["Italy", "IT", 27, "🇮🇹"],
  ["Jordan", "JO", 30, "🇯🇴"],
  ["Kazakhstan", "KZ", 20, "🇰🇿"],
  ["Kuwait", "KW", 30, "🇰🇼"],
  ["Latvia", "LV", 21, "🇱🇻"],
  ["Lebanon", "LB", 28, "🇱🇧"],
  ["Liechtenstein", "LI", 21, "🇱🇮"],
  ["Lithuania", "LT", 20, "🇱🇹"],
  ["Luxembourg", "LU", 20, "🇱🇺"],
  ["Malta", "MT", 31, "🇲🇹"],
  ["Mauritania", "MR", 27, "🇲🇷"],
  ["Mauritius", "MU", 30, "🇲🇺"],
  ["Monaco", "MC", 27, "🇲🇨"],
  ["Montenegro", "ME", 22, "🇲🇪"],
  ["Netherlands", "NL", 18, "🇳🇱"],
  ["Norway", "NO", 15, "🇳🇴"],
  ["Pakistan", "PK", 24, "🇵🇰"],
  ["Poland", "PL", 28, "🇵🇱"],
  ["Portugal", "PT", 25, "🇵🇹"],
  ["Qatar", "QA", 29, "🇶🇦"],
  ["Romania", "RO", 24, "🇷🇴"],
  ["San Marino", "SM", 27, "🇸🇲"],
  ["Saudi Arabia", "SA", 24, "🇸🇦"],
  ["Serbia", "RS", 22, "🇷🇸"],
  ["Slovakia", "SK", 24, "🇸🇰"],
  ["Slovenia", "SI", 19, "🇸🇮"],
  ["Spain", "ES", 24, "🇪🇸"],
  ["Sweden", "SE", 24, "🇸🇪"],
  ["Switzerland", "CH", 21, "🇨🇭"],
  ["Timor-Leste", "TL", 23, "🇹🇱"],
  ["Tunisia", "TN", 24, "🇹🇳"],
  ["Turkey", "TR", 26, "🇹🇷"],
  ["UAE", "AE", 23, "🇦🇪"],
  ["UK", "GB", 22, "🇬🇧"],
];

// Random digits helper
function randDigits(count: number): string {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

// Random alphanumeric (digits + uppercase)
function randAlphaNum(count: number): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < count; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Mod 97 check digit calculation per ISO 13616
function mod97(iban: string): number {
  // Move first 4 chars to end, replace letters with numbers (A=10, B=11, ...)
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let block = "";
  for (const ch of rearranged) {
    if (/[A-Z]/.test(ch)) {
      block += (ch.charCodeAt(0) - 55).toString();
    } else {
      block += ch;
    }
  }
  // Process in chunks to avoid bigint overflow in JS
  let remainder = 0;
  for (let i = 0; i < block.length; i += 7) {
    remainder = Number(BigInt(remainder.toString() + block.slice(i, i + 7)) % 97n);
  }
  return remainder;
}

function calcCheckDigits(bban: string, countryCode: string): string {
  const checkReplacement = countryCode + "00" + bban;
  const remainder = mod97(checkReplacement);
  return (98 - remainder).toString().padStart(2, "0");
}

function generateIban(countryCode: string, length: number): string {
  // BBAN length = total length - 4 (country code + check digits)
  const bbanLength = length - 4;
  // Generate random BBAN — use alphanumeric for most, digits-only for known numeric-only countries
  const numericOnly = ["DE", "FR", "ES", "IT", "PT", "PL", "NL", "BE", "AT", "SE", "NO", "DK", "FI", "CZ", "SK", "HU", "RO", "BG", "HR", "EE", "LV", "LT", "LU", "IS", "MT", "CY", "GR", "SI"];
  const bban = numericOnly.includes(countryCode) ? randDigits(bbanLength) : randAlphaNum(bbanLength);
  const checkDigits = calcCheckDigits(bban, countryCode);
  return countryCode + checkDigits + bban;
}

export default function FakeIbanGenerator() {
  const [countryIndex, setCountryIndex] = useState(28); // Germany default
  const [count, setCount] = useState(5);
  const [ibans, setIbans] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const selectedCountry = COUNTRIES[countryIndex];

  const handleGenerate = () => {
    const results: string[] = [];
    for (let i = 0; i < count; i++) {
      results.push(generateIban(selectedCountry[1], selectedCountry[2]));
    }
    setIbans(results);
  };

  const handleCopy = async (iban: string, idx: number) => {
    await navigator.clipboard.writeText(iban);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(ibans.join("\n"));
  };

  return (
    <CalculatorShell
      title="Fake IBAN Generator"
      subtitle="Generate structurally valid fake IBANs for 60+ countries with correct mod-97 check digits."
      icon={Landmark}
      iconBgColor="bg-indigo-100"
      iconColor="text-indigo-600"
      keywords={["iban", "bank", "account", "test", "fake"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
            <select
              value={countryIndex}
              onChange={(e) => setCountryIndex(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
            >
              {COUNTRIES.map((c, i) => (
                <option key={c[1]} value={i}>
                  {c[3]} {c[0]} ({c[1]})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              {selectedCountry[0]} IBANs are {selectedCountry[2]} characters long
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of IBANs: {count}
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1</span>
              <span>50</span>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate {count} IBAN{count > 1 ? "s" : ""}
          </button>
        </div>
      }
      result={
        <div>
          {ibans.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  {selectedCountry[3]} {selectedCountry[0]} · {ibans.length} IBAN{ibans.length > 1 ? "s" : ""}
                </span>
                <button
                  onClick={handleCopyAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Copy all
                </button>
              </div>
              <ul className="space-y-1.5 max-h-96 overflow-auto">
                {ibans.map((iban, i) => (
                  <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 group">
                    <code className="text-xs text-gray-800 font-mono select-all">{iban}</code>
                    <button
                      onClick={() => handleCopy(iban, i)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      {copiedIdx === i ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="text-center text-gray-400 text-sm py-8">
              <Landmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select a country and click Generate</p>
              <p className="text-xs mt-1 text-gray-300">IBANs are structurally valid but not linked to real accounts</p>
            </div>
          )}
        </div>
      }
    />
  );
}