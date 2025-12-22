import { useState, useEffect } from "react";
import { Monitor, Smartphone, Cpu, Globe, Maximize, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";

interface DeviceInfoItem {
  key: string;
  label: string;
  value: string | number | boolean;
  icon?: any;
}

export default function DeviceInfo() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<DeviceInfoItem[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const getInfo = () => {
      const items: DeviceInfoItem[] = [
        {
          key: "screen_resolution",
          label: t("tools.device-info.screen_resolution", "Screen Resolution"),
          value: `${window.screen.width} x ${window.screen.height}`,
          icon: Monitor,
        },
        {
          key: "available_resolution",
          label: t("tools.device-info.available_resolution", "Available Resolution"),
          value: `${window.screen.availWidth} x ${window.screen.availHeight}`,
          icon: Maximize,
        },
        {
          key: "pixel_ratio",
          label: t("tools.device-info.pixel_ratio", "Pixel Ratio"),
          value: window.devicePixelRatio,
          icon: Monitor,
        },
        {
          key: "color_depth",
          label: t("tools.device-info.color_depth", "Color Depth"),
          value: `${window.screen.colorDepth}-bit`,
          icon: Monitor,
        },
        {
          key: "user_agent",
          label: t("tools.device-info.user_agent", "User Agent"),
          value: navigator.userAgent,
          icon: Globe,
        },
        {
          key: "platform",
          label: t("tools.device-info.platform", "Platform"),
          value: navigator.platform,
          icon: Cpu,
        },
        {
          key: "language",
          label: t("tools.device-info.language", "Language"),
          value: navigator.language,
          icon: Globe,
        },
        {
          key: "cores",
          label: t("tools.device-info.cores", "CPU Cores"),
          value: navigator.hardwareConcurrency || t("tools.device-info.unknown", "Unknown"),
          icon: Cpu,
        },
        {
          key: "touch_points",
          label: t("tools.device-info.touch_points", "Max Touch Points"),
          value: navigator.maxTouchPoints || 0,
          icon: Smartphone,
        },
        {
          key: "online",
          label: t("tools.device-info.online", "Online Status"),
          value: navigator.onLine ? "Online" : "Offline",
          icon: Globe,
        },
      ];
      setInfo(items);
    };

    getInfo();
    window.addEventListener("resize", getInfo);
    return () => window.removeEventListener("resize", getInfo);
  }, [t]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(String(text));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title={t("tools.device-info.title", "Device Information")}
        description={t("tools.device-info.description", "Get detailed information about your current device, screen, and browser.")}
        keywords={["device info", "screen resolution", "user agent", "pixel ratio", "browser info"]}
      />

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {t("tools.device-info.title", "Device Information")}
          </h1>
          <p className="text-gray-600">
            {t("tools.device-info.description", "Get detailed information about your current device, screen, and browser.")}
          </p>
        </div>

        <div className="grid gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="grid gap-4">
                {info.map((item) => {
                  const Icon = item.icon || Monitor;
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-500">{item.label}</p>
                          <p className="text-gray-900 font-mono text-sm break-all truncate">
                            {String(item.value)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(String(item.value), item.key)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title={t("tools.device-info.copy", "Copy")}
                      >
                        {copiedKey === item.key ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
