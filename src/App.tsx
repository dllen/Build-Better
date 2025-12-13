import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import ApiDebugger from "@/pages/tools/ApiDebugger";
import CodeFormatter from "@/pages/tools/CodeFormatter";
import QrGenerator from "@/pages/tools/QrGenerator";
import RegexTester from "@/pages/tools/RegexTester";
import MarkdownHtml from "@/pages/tools/MarkdownHtml";
import PasswordGenerator from "@/pages/tools/PasswordGenerator";
import TextDiff from "@/pages/tools/TextDiff";
import LotterySsq from "@/pages/tools/LotterySsq";
import CsvToJson from "@/pages/tools/CsvToJson";
import HashTools from "@/pages/tools/HashTools";
import DateTimeTools from "@/pages/tools/DateTimeTools";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/tools/api-debugger" element={<ApiDebugger />} />
          <Route path="/tools/code-formatter" element={<CodeFormatter />} />
          <Route path="/tools/qr-generator" element={<QrGenerator />} />
          <Route path="/tools/regex-tester" element={<RegexTester />} />
          <Route path="/tools/markdown-html" element={<MarkdownHtml />} />
          <Route path="/tools/password-generator" element={<PasswordGenerator />} />
          <Route path="/tools/text-diff" element={<TextDiff />} />
          <Route path="/tools/lottery-ssq" element={<LotterySsq />} />
          <Route path="/tools/csv-to-json" element={<CsvToJson />} />
          <Route path="/tools/hash-tools" element={<HashTools />} />
          <Route path="/tools/date-time" element={<DateTimeTools />} />
        </Route>
      </Routes>
    </Router>
  );
}
