import { Link } from "react-router-dom";
import { Terminal, Code, QrCode, Search, FileText, Lock, GitCompare, Dice6, Hash, Calendar, Globe } from "lucide-react";

const tools = [
  {
    id: "api-debugger",
    name: "API Debugger",
    description: "Test and debug HTTP requests with ease. Support for GET, POST, PUT, DELETE.",
    icon: Terminal,
    path: "/tools/api-debugger",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    id: "code-formatter",
    name: "Code Formatter",
    description: "Format your code to standard styles. Supports JS, TS, HTML, CSS, JSON.",
    icon: Code,
    path: "/tools/code-formatter",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    id: "qr-generator",
    name: "QR Code Generator",
    description: "Generate QR codes for URLs, text, and more. Customizable size and color.",
    icon: QrCode,
    path: "/tools/qr-generator",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
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
    id: "date-time",
    name: "Date & Time Tools",
    description: "时间戳转换、格式化、区间差值、相对时间。",
    icon: Calendar,
    path: "/tools/date-time",
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
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          Developer Micro-Tools Collection
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A suite of essential tools for developers, Fast, reliable, and easy to use.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <Link
            key={tool.id}
            to={tool.path}
            className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
          >
            <div className={`inline-flex p-3 rounded-lg ${tool.bgColor} ${tool.color} mb-4 group-hover:scale-110 transition-transform`}>
              <tool.icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
              {tool.name}
            </h2>
            <p className="text-gray-600">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
