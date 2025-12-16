import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Games from "@/pages/Games";
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
import NetworkTools from "@/pages/tools/NetworkTools";
import BaseConverter from "@/pages/tools/BaseConverter";
import ColorHunt from "@/pages/tools/ColorHunt";
import TextDeduper from "@/pages/tools/TextDeduper";
import DedupSortDiff from "@/pages/tools/DedupSortDiff";
import CronQuartz from "@/pages/tools/CronQuartz";
import CalculatorTool from "@/pages/tools/Calculator";
import BcryptTool from "@/pages/tools/BcryptTool";
import UlidTool from "@/pages/tools/UlidTool";
import TextCipher from "@/pages/tools/TextCipher";
import Bip39Tool from "@/pages/tools/Bip39Tool";
import HmacTool from "@/pages/tools/HmacTool";
import RsaKeygen from "@/pages/tools/RsaKeygen";
import KeycodeInfo from "@/pages/tools/KeycodeInfo";
import JsonDiffTool from "@/pages/tools/JsonDiffTool";
import ChmodCalculator from "@/pages/tools/ChmodCalculator";
import TextStats from "@/pages/tools/TextStats";
import UnitConverter from "@/pages/tools/UnitConverter";
import DateDiffCalculator from "@/pages/tools/DateDiffCalculator";
import ProgrammerNamingTool from "@/pages/tools/ProgrammerNamingTool";
import JwtDecodeTool from "@/pages/tools/JwtDecodeTool";
import ShortUrlTool from "@/pages/tools/ShortUrlTool";
import Snake from "@/pages/games/Snake";
import Tetris from "@/pages/games/Tetris";
import Gomoku from "@/pages/games/Gomoku";
import Dino from "@/pages/games/Dino";
import Minesweeper from "@/pages/games/Minesweeper";
import Game2048 from "@/pages/games/Game2048";
import LinkMatch from "@/pages/games/LinkMatch";
import Sudoku from "@/pages/games/Sudoku";
import PacVim from "@/pages/games/PacVim";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
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
          <Route path="/tools/network-tools" element={<NetworkTools />} />
          <Route path="/tools/base-converter" element={<BaseConverter />} />
          <Route path="/tools/color-hunt" element={<ColorHunt />} />
          <Route path="/tools/text-deduper" element={<TextDeduper />} />
          <Route path="/tools/dedup-sort-diff" element={<DedupSortDiff />} />
          <Route path="/tools/cron-quartz" element={<CronQuartz />} />
          <Route path="/tools/calculator" element={<CalculatorTool />} />
          <Route path="/tools/bcrypt" element={<BcryptTool />} />
          <Route path="/tools/ulid" element={<UlidTool />} />
          <Route path="/tools/text-cipher" element={<TextCipher />} />
          <Route path="/tools/bip39" element={<Bip39Tool />} />
          <Route path="/tools/hmac" element={<HmacTool />} />
          <Route path="/tools/rsa-keygen" element={<RsaKeygen />} />
          <Route path="/tools/keycode" element={<KeycodeInfo />} />
          <Route path="/tools/json-diff" element={<JsonDiffTool />} />
          <Route path="/tools/chmod" element={<ChmodCalculator />} />
          <Route path="/tools/text-stats" element={<TextStats />} />
          <Route path="/tools/unit-converter" element={<UnitConverter />} />
          <Route path="/tools/date-diff" element={<DateDiffCalculator />} />
          <Route path="/tools/naming" element={<ProgrammerNamingTool />} />
          <Route path="/tools/jwt-decode" element={<JwtDecodeTool />} />
          <Route path="/tools/short-url" element={<ShortUrlTool />} />
          <Route path="/games/snake" element={<Snake />} />
          <Route path="/games/tetris" element={<Tetris />} />
          <Route path="/games/gomoku" element={<Gomoku />} />
          <Route path="/games/dino" element={<Dino />} />
          <Route path="/games/minesweeper" element={<Minesweeper />} />
          <Route path="/games/2048" element={<Game2048 />} />
          <Route path="/games/link-match" element={<LinkMatch />} />
          <Route path="/games/sudoku" element={<Sudoku />} />
          <Route path="/games/pacvim" element={<PacVim />} />
        </Route>
      </Routes>
    </Router>
  );
}
