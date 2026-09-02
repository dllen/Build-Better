import { useEffect, useState } from "react";
import { Fuel, RefreshCw, Eraser } from "lucide-react";

interface GasData {
  slow: number;
  standard: number;
  fast: number;
  instant: number;
  slowTime: string;
  standardTime: string;
  fastTime: string;
  instantTime: string;
}

const DEFAULT_GAS: GasData = {
  slow: 0,
  standard: 0,
  fast: 0,
  instant: 0,
  slowTime: "",
  standardTime: "",
  fastTime: "",
  instantTime: "",
};

export default function GasTracker() {
  const [gasData, setGasData] = useState<GasData>(DEFAULT_GAS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  async function fetchGasData() {
    setLoading(true);
    setError(null);

    try {
      // Try ethgas.watch API first (CORS-friendly)
      const response = await fetch("https://api.ethgas.watch/api/gas");
      if (!response.ok) throw new Error("API error");
      const data = await response.json();

      // Map ethgas.watch response to our format
      // ethgas.watch returns gwei values directly
      const gas: GasData = {
        slow: data.data?.safelow ?? data.safelow ?? 0,
        standard: data.data?.standard ?? data.standard ?? 0,
        fast: data.data?.fast ?? data.fast ?? 0,
        instant: data.data?.fastest ?? data.fastest ?? 0,
        slowTime: "< 30 分钟",
        standardTime: "< 5 分钟",
        fastTime: "< 1 分钟",
        instantTime: "< 30 秒",
      };

      setGasData(gas);
      setLastUpdated(new Date().toLocaleString("zh-CN"));
    } catch {
      // Fallback: try etherscan proxy approach or static fallback
      try {
        // Try alternative API: blocknative
        const bnResponse = await fetch(
          "https://api.blocknative.com/gasprices/blockbounds"
        );
        if (bnResponse.ok) {
          const bnData = await bnResponse.json();
          // BlockNative returns estimated confirmation times
          const prices = bnData.data?.blockBounds?.prices ?? [];
          const gas: GasData = {
            slow: prices[0] ?? 20,
            standard: prices[1] ?? 30,
            fast: prices[2] ?? 50,
            instant: prices[3] ?? 80,
            slowTime: "< 30 分钟",
            standardTime: "< 5 分钟",
            fastTime: "< 1 分钟",
            instantTime: "< 30 秒",
          };
          setGasData(gas);
          setLastUpdated(new Date().toLocaleString("zh-CN"));
          setLoading(false);
          return;
        }
      } catch {
        // Continue to error
      }

      setError("当前无法获取 Gas 数据，请稍后重试或检查网络连接。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGasData();
  }, []);

  function clear() {
    setGasData(DEFAULT_GAS);
    setLastUpdated(null);
    setError(null);
  }

  const gasCards = [
    {
      label: "低速 (Slow)",
      gwei: gasData.slow,
      time: gasData.slowTime,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      badge: "最便宜",
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      label: "中速 (Standard)",
      gwei: gasData.standard,
      time: gasData.standardTime,
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      badge: "推荐",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      label: "高速 (Fast)",
      gwei: gasData.fast,
      time: gasData.fastTime,
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      badge: "快速",
      badgeColor: "bg-orange-100 text-orange-700",
    },
    {
      label: "极速 (Instant)",
      gwei: gasData.instant,
      time: gasData.instantTime,
      color: "bg-red-50 border-red-200",
      iconColor: "text-red-600",
      badge: "极速",
      badgeColor: "bg-red-100 text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-blue-100 text-blue-600">
          <Fuel className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">以太坊 Gas 追踪器</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            {lastUpdated && (
              <span>数据更新于: {lastUpdated}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white inline-flex items-center gap-2 disabled:opacity-50"
              onClick={fetchGasData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "加载中..." : "刷新"}
            </button>
            <button
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 inline-flex items-center gap-2"
              onClick={clear}
            >
              <Eraser className="h-4 w-4" />
              清空
            </button>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {gasCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-lg border p-4 ${card.color}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium ${card.iconColor}`}>
                    {card.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {loading ? (
                    <span className="opacity-50">--</span>
                  ) : (
                    card.gwei.toFixed(2)
                  )}
                  <span className="text-sm font-normal ml-1">Gwei</span>
                </div>
                <div className="text-sm text-gray-600">
                  预计时间: {loading ? "..." : card.time}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p className="flex items-start gap-1">
            <span>数据仅从公开 Gas API 获取，不会上传到其他服务器。请勿在此页面输入私钥或助记词。</span>
          </p>
          <p className="flex items-start gap-1">
            <span>Gas 价格由网络实时数据提供，可能与实际交易 Gas 费用有偏差。</span>
          </p>
        </div>
      </div>
    </div>
  );
}
