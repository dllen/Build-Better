import { Link } from "react-router-dom";
import {
  Terminal,
  Code,
  QrCode,
  Search,
  FileText,
  Lock,
  GitCompare,
  Dice6,
  Hash,
  Calendar,
  Globe,
  Box,
  Link2,
  Palette,
  Filter,
  Clock,
  Calculator,
  Fingerprint,
  KeyRound,
  Shield,
  Key,
  Keyboard,
  DollarSign,
  Server,
  Network,
  Landmark,
  RefreshCw,
  TrendingUp,
  Percent,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import { SearchInput } from "@/components/common/SearchInput";

export default function Home() {
  const { t } = useTranslation();

  const tools = [
    {
      id: "api-debugger",
      name: t("tools.api-debugger.name", "API Debugger"),
      description: t(
        "tools.api-debugger.desc",
        "Test and debug HTTP requests with ease. Support for GET, POST, PUT, DELETE."
      ),
      icon: Terminal,
      path: "/tools/api-debugger",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "code-formatter",
      name: t("tools.code-formatter.name", "Code Formatter"),
      description: t(
        "tools.code-formatter.desc",
        "Format your code to standard styles. Supports JS, TS, HTML, CSS, JSON."
      ),
      icon: Code,
      path: "/tools/code-formatter",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "qr-generator",
      name: t("tools.qr-generator.name", "QR Code Generator"),
      description: t(
        "tools.qr-generator.desc",
        "Generate QR codes for URLs, text, and more. Customizable size and color."
      ),
      icon: QrCode,
      path: "/tools/qr-generator",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      id: "perpetual-calendar",
      name: t("tools.perpetual-calendar.name", "Perpetual Calendar"),
      description: t(
        "tools.perpetual-calendar.desc",
        "Comprehensive calendar with Chinese Lunar date, Solar terms, and festivals."
      ),
      icon: Calendar,
      path: "/tools/perpetual-calendar",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      id: "domain-valuation",
      name: t("tools.domain-valuation.name", "Domain Valuation"),
      description: t(
        "tools.domain-valuation.desc",
        "Estimate domain market value based on length, TLD, and keywords."
      ),
      icon: DollarSign,
      path: "/tools/domain-valuation",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "nginx-config",
      name: t("tools.nginx-config.name", "Nginx Config"),
      description: t(
        "tools.nginx-config.desc",
        "Generate Nginx configuration files online with HTTPS, proxy, Gzip support."
      ),
      icon: Server,
      path: "/tools/nginx-config",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "apache-config",
      name: t("tools.apache-config.name", "Apache Config"),
      description: t(
        "tools.apache-config.desc",
        "Generate Apache VirtualHost configuration files online with HTTPS, redirects, logs."
      ),
      icon: Server,
      path: "/tools/apache-config",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      id: "haproxy-config",
      name: t("tools.haproxy-config.name", "HAProxy Config"),
      description: t(
        "tools.haproxy-config.desc",
        "Generate HAProxy load balancer configuration files with algorithms, health checks."
      ),
      icon: Network,
      path: "/tools/haproxy-config",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "mortgage-calculator",
      name: t("tools.mortgage-calculator.name", "Mortgage Calculator"),
      description: t(
        "tools.mortgage-calculator.desc",
        "Calculate mortgage payments for commercial, provident fund, and combination loans."
      ),
      icon: Landmark,
      path: "/tools/mortgage-calculator",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: "regex-tester",
      name: "Regex Tester",
      description: "Test regular expressions with flags and see matches and groups.",
      icon: Search,
      path: "/tools/regex-tester",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: "markdown-html",
      name: "Markdown ↔ HTML",
      description: "Convert Markdown to HTML and HTML back to Markdown.",
      icon: FileText,
      path: "/tools/markdown-html",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "password-generator",
      name: "Password Generator",
      description: "Generate strong passwords with customizable character sets and length.",
      icon: Lock,
      path: "/tools/password-generator",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      id: "text-diff",
      name: "Text Diff",
      description: "Compare two texts using characters, words, or lines diff.",
      icon: GitCompare,
      path: "/tools/text-diff",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "json-diff",
      name: "JSON Diff",
      description: "Compare two JSON objects structurally and pretty print changes.",
      icon: GitCompare,
      path: "/tools/json-diff",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "text-stats",
      name: "Text Stats",
      description: "统计文本字符数、字数、行数、字节大小与频率。",
      icon: FileText,
      path: "/tools/text-stats",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: "lottery-ssq",
      name: "福利彩票 · 双色球",
      description: "随机生成6红球(1-33)和1蓝球(1-16)。",
      icon: Dice6,
      path: "/tools/lottery-ssq",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      id: "csv-to-json",
      name: "CSV → JSON",
      description: "解析CSV为JSON数组，支持分隔符/引号、数字识别。",
      icon: FileText,
      path: "/tools/csv-to-json",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      id: "hash-tools",
      name: "Hash Tools",
      description: "计算 SHA-1/256/512、HMAC、CRC32。",
      icon: Hash,
      path: "/tools/hash-tools",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: "hmac",
      name: "HMAC Generator",
      description: "使用密钥与哈希函数计算 HMAC。",
      icon: Shield,
      path: "/tools/hmac",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "rsa-keygen",
      name: "RSA Keygen",
      description: "生成随机 RSA 私钥/公钥（PEM）。",
      icon: Key,
      path: "/tools/rsa-keygen",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      id: "keycode-info",
      name: "Keycode Info",
      description: "查看按键的 key/code/keyCode/位置/修饰符。",
      icon: Keyboard,
      path: "/tools/keycode",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
    {
      id: "date-time",
      name: "Date & Time Tools",
      description: "时间戳转换、格式化、区间差值、相对时间。",
      icon: Calendar,
      path: "/tools/date-time",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "date-diff",
      name: "Date Diff",
      description: "计算两个日期的差值：多少天与多少周。",
      icon: Calendar,
      path: "/tools/date-diff",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "network-tools",
      name: "Network Tools",
      description: "URL解析、HTTP延迟测试、IPv4 CIDR计算、客户端信息。",
      icon: Globe,
      path: "/tools/network-tools",
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
    },
    {
      id: "base-converter",
      name: "Base Converter",
      description: "进制转换：二/八/十/十六，支持 2-36 进制。",
      icon: Code,
      path: "/tools/base-converter",
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      id: "unit-converter",
      name: "Unit Converter",
      description: "长度、重量、温度、面积、存储单位转换。",
      icon: Box,
      path: "/tools/unit-converter",
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      id: "programmer-naming",
      name: "Programmer Naming",
      description: "根据关键词生成变量/函数/类/文件/包命名建议。",
      icon: Code,
      path: "/tools/naming",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: "jwt-decode",
      name: "JWT Decode",
      description: "解码JWT头与负载，查看标准声明与时间。",
      icon: Shield,
      path: "/tools/jwt-decode",
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
    {
      id: "short-url",
      name: "Short URL",
      description: "本地生成短码映射，支持哈希或随机，复制分享链接。",
      icon: Link2,
      path: "/tools/short-url",
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
    {
      id: "color-hunt",
      name: "Color Hunt",
      description: "Explore palettes, copy colors, CSS vars, and gradients.",
      icon: Palette,
      path: "/tools/color-hunt",
      color: "text-fuchsia-600",
      bgColor: "bg-fuchsia-100",
    },
    {
      id: "text-deduper",
      name: "Text Deduper",
      description: "文本去重：按行/分隔符，大小写、排序、统计。",
      icon: Filter,
      path: "/tools/text-deduper",
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      id: "dedup-sort-diff",
      name: "Dedup & Sort Diff",
      description: "文本去重后排序 DIFF：对比差异高亮。",
      icon: GitCompare,
      path: "/tools/dedup-sort-diff",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "cron-quartz",
      name: "Cron & Quartz",
      description: "编写/校验 Cron 与 Quartz，预览下次运行与配置。",
      icon: Clock,
      path: "/tools/cron-quartz",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "calculator",
      name: "Calculator",
      description: "基础/科学计算器：四则运算、函数、角度/弧度。",
      icon: Calculator,
      path: "/tools/calculator",
      color: "text-lime-600",
      bgColor: "bg-lime-100",
    },
    {
      id: "bcrypt",
      name: "Bcrypt",
      description: "使用bcrypt进行哈希与比较，支持轮次设置。",
      icon: Lock,
      path: "/tools/bcrypt",
      color: "text-gray-700",
      bgColor: "bg-gray-100",
    },
    {
      id: "ulid",
      name: "ULID Generator",
      description: "生成词典可排序的通用唯一标识符（ULID）。",
      icon: Fingerprint,
      path: "/tools/ulid",
      color: "text-violet-600",
      bgColor: "bg-violet-100",
    },
    {
      id: "text-cipher",
      name: "Text Cipher",
      description: "使用 AES/TripleDES/Rabbit/RC4 加密/解密文本。",
      icon: Lock,
      path: "/tools/text-cipher",
      color: "text-slate-700",
      bgColor: "bg-slate-100",
    },
    {
      id: "bip39",
      name: "BIP39 Generator",
      description: "随机或指定生成助记符，助记符+短语派生种子。",
      icon: KeyRound,
      path: "/tools/bip39",
      color: "text-sky-600",
      bgColor: "bg-sky-100",
    },
    {
      id: "chmod",
      name: "Chmod Calculator",
      description: "计算chmod权限与命令：r/w/x 与 setuid/setgid/sticky。",
      icon: Shield,
      path: "/tools/chmod",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      id: "investment-return",
      icon: TrendingUp,
      name: t("tools.investment-return.name"),
      description: t("tools.investment-return.desc"),
      path: "/tools/investment-return",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "roi-calculator",
      icon: Percent,
      name: t("tools.roi-calculator.name"),
      description: t("tools.roi-calculator.desc"),
      path: "/tools/roi-calculator",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
  ];

  const [searchTerm, setSearchTerm] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(tools, {
        keys: ["name", "description"],
        threshold: 0.3,
      }),
    [tools]
  );

  const filteredTools = useMemo(() => {
    if (!searchTerm) return tools;
    return fuse.search(searchTerm).map((result) => result.item);
  }, [searchTerm, fuse, tools]);

  return (
    <div className="space-y-12">
      <SEO />
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{t("home.title")}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">{t("home.subtitle")}</p>
      </div>

      <SearchInput value={searchTerm} onChange={setSearchTerm} />

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">
          {t("home.section_tools")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <Link
              key={tool.id}
              to={tool.path}
              className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
            >
              <div
                className={`inline-flex p-3 rounded-lg ${tool.bgColor} ${tool.color} mb-4 group-hover:scale-110 transition-transform`}
              >
                <tool.icon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                {tool.name}
              </h2>
              <p className="text-gray-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
