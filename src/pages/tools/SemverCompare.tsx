import { useState, useMemo } from "react";
import { GitCompareArrows } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";
import semver from "semver";

export default function SemverCompare() {
  const [v1, setV1] = useState("1.2.3");
  const [v2, setV2] = useState("1.3.0");
  const [range, setRange] = useState("^1.0.0");
  const [testVersion, setTestVersion] = useState("1.2.5");

  const comparison = useMemo(() => {
    if (!semver.valid(v1) || !semver.valid(v2)) return null;
    const cmp = semver.compare(v1, v2);
    const diff = semver.diff(v1, v2);
    return {
      result: cmp === 0 ? "equal" : cmp < 0 ? "less" : "greater",
      diff: diff || "identical",
      v1Info: semver.parse(v1),
      v2Info: semver.parse(v2),
    };
  }, [v1, v2]);

  const rangeResult = useMemo(() => {
    try {
      const satisfies = semver.satisfies(testVersion, range);
      const validRange = semver.validRange(range);
      return { satisfies, validRange, error: null };
    } catch (e) {
      return { satisfies: false, validRange: null, error: (e as Error).message };
    }
  }, [range, testVersion]);

  const resultColor = comparison?.result === "equal" ? "text-blue-600" : comparison?.result === "less" ? "text-green-600" : "text-orange-600";
  const resultSymbol = comparison?.result === "equal" ? "=" : comparison?.result === "less" ? "<" : ">";

  return (
    <CalculatorShell
      title="Semver Compare"
      subtitle="Compare semantic version numbers and test version ranges."
      icon={GitCompareArrows}
      iconBgColor="bg-emerald-100"
      iconColor="text-emerald-600"
      keywords={["semver", "version compare", "semantic versioning", "npm version", "version range"]}
      children={
        <div className="space-y-6">
          {/* Compare two versions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Compare Two Versions</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Version A</label>
                <input
                  type="text" value={v1} onChange={(e) => setV1(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 ${
                    semver.valid(v1) ? "border-gray-300" : "border-red-300 bg-red-50"
                  }`}
                  placeholder="1.2.3"
                />
                {v1 && !semver.valid(v1) && <p className="text-xs text-red-500 mt-1">Invalid semver</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Version B</label>
                <input
                  type="text" value={v2} onChange={(e) => setV2(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500 ${
                    semver.valid(v2) ? "border-gray-300" : "border-red-300 bg-red-50"
                  }`}
                  placeholder="1.3.0"
                />
                {v2 && !semver.valid(v2) && <p className="text-xs text-red-500 mt-1">Invalid semver</p>}
              </div>
            </div>
          </div>

          {/* Range check */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Range Checker</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Range Expression</label>
                <input type="text" value={range} onChange={(e) => setRange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="^1.0.0 || >=2.0.0" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Test Version</label>
                <input type="text" value={testVersion} onChange={(e) => setTestVersion(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="1.2.5" />
              </div>
            </div>
          </div>
        </div>
      }
      result={
        <div className="space-y-5">
          {/* Comparison result */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Comparison</h3>
            {comparison ? (
              <div className="text-center">
                <div className={`text-3xl font-bold font-mono ${resultColor} mb-1`}>
                  {v1} <span className="text-gray-400">{resultSymbol}</span> {v2}
                </div>
                <div className="text-sm text-gray-500">
                  Diff type: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{comparison.diff}</span>
                </div>
                {comparison.v1Info && (
                  <div className="text-xs text-gray-400 mt-2">
                    v{v1}: major={comparison.v1Info.major} minor={comparison.v1Info.minor} patch={comparison.v1Info.patch}
                    {comparison.v1Info.prerelease.length > 0 && ` pre=${comparison.v1Info.prerelease.join(".")}`}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center">Enter two valid semver versions above.</p>
            )}
          </div>

          {/* Range result */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Range Check</h3>
            {rangeResult.error ? (
              <div className="text-xs text-red-500 bg-red-50 p-2 rounded">{rangeResult.error}</div>
            ) : (
              <div className="text-center">
                <div className={`text-2xl font-bold ${rangeResult.satisfies ? "text-green-600" : "text-red-500"}`}>
                  {rangeResult.satisfies ? "✅ Satisfies" : "❌ Does Not Satisfy"}
                </div>
                <div className="text-sm text-gray-500 mt-1 font-mono">
                  {testVersion} ∈ {rangeResult.validRange || range}
                </div>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}