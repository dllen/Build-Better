import { Link } from "react-router-dom";
import { Terminal, Code, QrCode, Search, FileText, Lock, GitCompare } from "lucide-react";

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
