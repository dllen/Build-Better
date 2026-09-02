import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./i18n/config"; // Import i18n config
import { Layout } from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Games from "@/pages/Games";
import ApiDebugger from "@/pages/tools/ApiDebugger";
import CodeFormatter from "@/pages/tools/CodeFormatter";
import HtmlToText from "@/pages/tools/HtmlToText";
import TokenGenerator from "@/pages/tools/TokenGenerator";
import FormatConverter from "@/pages/tools/FormatConverter";
import DeviceInfo from "@/pages/tools/DeviceInfo";
import QrGenerator from "@/pages/tools/QrGenerator";
import RegexTester from "@/pages/tools/RegexTester";
import MarkdownHtml from "@/pages/tools/MarkdownHtml";
import EmailMarkdown from "@/pages/tools/EmailMarkdown";
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
import PerpetualCalendar from "@/pages/tools/PerpetualCalendar";
import I18nManager from "@/pages/tools/I18nManager";
import HmacTool from "@/pages/tools/HmacTool";
import RsaKeygen from "@/pages/tools/RsaKeygen";
import KeycodeInfo from "@/pages/tools/KeycodeInfo";
import JsonDiffTool from "@/pages/tools/JsonDiffTool";
import ChmodCalculator from "@/pages/tools/ChmodCalculator";
import TextStats from "@/pages/tools/TextStats";
import UnitConverter from "@/pages/tools/UnitConverter";
import DateDiffCalculator from "@/pages/tools/DateDiffCalculator";
import ProgrammerNamingTool from "@/pages/tools/ProgrammerNamingTool";
import DomainValuation from "@/pages/tools/DomainValuation";
import NginxConfigGenerator from "@/pages/tools/NginxConfigGenerator";
import ApacheConfigGenerator from "@/pages/tools/ApacheConfigGenerator";
import HAProxyConfigGenerator from "@/pages/tools/HAProxyConfigGenerator";
import MortgageCalculator from "@/pages/tools/MortgageCalculator";
import InvestmentReturnCalculator from "@/pages/tools/InvestmentReturnCalculator";
import ROICalculator from "@/pages/tools/ROICalculator";
import OtpGenerator from "@/pages/tools/OtpGenerator";
import JwtDecodeTool from "@/pages/tools/JwtDecodeTool";
import ShortUrlTool from "@/pages/tools/ShortUrlTool";
import SharePool from "@/pages/tools/SharePool";
import Snake from "@/pages/games/Snake";
import Tetris from "@/pages/games/Tetris";
import Gomoku from "@/pages/games/Gomoku";
import Dino from "@/pages/games/Dino";
import Minesweeper from "@/pages/games/Minesweeper";
import Game2048 from "@/pages/games/Game2048";
import LinkMatch from "@/pages/games/LinkMatch";
import Sudoku from "@/pages/games/Sudoku";
import PacVim from "@/pages/games/PacVim";
import ChineseChess from "@/pages/games/ChineseChess";
import GoGame from "@/pages/games/GoGame";
import Jungle from "@/pages/games/Jungle";
import FlyingChess from "@/pages/games/FlyingChess";
import ChineseCheckers from "@/pages/games/ChineseCheckers";
import NesEmulatorPage from "@/pages/games/NesEmulator";
import WifiQrGenerator from "./pages/tools/WifiQrGenerator";
import P2pChat from "@/pages/tools/chat/P2pChat";
import ManualChat from "@/pages/tools/chat/ManualChat";
import EnglishNameGenerator from "./pages/tools/EnglishNameGenerator";
import ImageCompressor from "./pages/tools/ImageCompressor";
import ImageResizer from "./pages/tools/ImageResizer";
import ImageConverter from "./pages/tools/ImageConverter";
import ImageWatermark from "./pages/tools/ImageWatermark";
import ImageJoiner from "./pages/tools/ImageJoiner";
import ImageAsciiArt from "./pages/tools/ImageAsciiArt";
import TextTools from "./pages/tools/text/TextTools";
import TextCaseConverter from "./pages/tools/text/TextCaseConverter";
import TextReplacer from "./pages/tools/text/TextReplacer";
import TextSorter from "./pages/tools/text/TextSorter";
import TextLineNumber from "./pages/tools/text/TextLineNumber";
import TextToHtml from "./pages/tools/text/TextToHtml";
import SymbolPicker from "./pages/tools/text/SymbolPicker";
import EmojiPicker from "./pages/tools/text/EmojiPicker";
import FancyTextGenerator from "./pages/tools/text/FancyTextGenerator";
import TextTypesetter from "./pages/tools/text/TextTypesetter";
import TextSimilarity from "./pages/tools/text/TextSimilarity";
import TextWorkflow from "./pages/tools/text/TextWorkflow";
import TextRandomGenerator from "./pages/tools/text/TextRandomGenerator";
import KinshipCalculator from "./pages/tools/KinshipCalculator";
import JsonEditorTool from "./pages/tools/JsonEditor";
import DataConverter from "./pages/tools/DataConverter";
import MermaidRenderer from "./pages/tools/MermaidRenderer";
import RssReader from "./pages/RssReader";
import CommitMessageGenerator from "./pages/tools/CommitMessage";
import GitignoreGenerator from "./pages/tools/GitignoreGenerator";
import DrawingTool from "./pages/tools/DrawingTool";
import WebChat from "./pages/tools/WebChat";
import IndieDeveloper from "./pages/IndieDeveloper";
import NonIndieDeveloper from "./pages/NonIndieDeveloper";
import DataDeveloper from "@/pages/DataDeveloper";

import AiDevelopment from "@/pages/AiDevelopment";
import WalletAnalyzer from "@/pages/tools/web3/WalletAnalyzer";
import EnsLookup from "@/pages/tools/web3/EnsLookup";
import GasTracker from "@/pages/tools/web3/GasTracker";
import TxHashIdentifier from "@/pages/tools/web3/TxHashIdentifier";
import TokenApprovalChecker from "@/pages/tools/web3/TokenApprovalChecker";
import TokenRiskScanner from "@/pages/tools/web3/TokenRiskScanner";
import TxDecoder from "@/pages/tools/web3/TxDecoder";
import TokenHolderAnalyzer from "@/pages/tools/web3/TokenHolderAnalyzer";
import WalletPnL from "@/pages/tools/web3/WalletPnL";
import WhaleTracker from "@/pages/tools/web3/WhaleTracker";
import TokenCounter from "@/pages/tools/TokenCounter";
import PromptBuilder from "@/pages/tools/PromptBuilder";
import PromptDiff from "@/pages/tools/PromptDiff";
import RagChunkCalculator from "@/pages/tools/RagChunkCalculator";
import AiCostCalculator from "@/pages/tools/AiCostCalculator";
import LlmRequestBuilder from "@/pages/tools/LlmRequestBuilder";
import SqlColumnExtractor from "@/pages/tools/SqlColumnExtractor";
import SqlMermaid from "@/pages/tools/SqlMermaid";
import SqlReview from "@/pages/tools/SqlReview";
import JsonSchemaGenerator from "@/pages/tools/JsonSchemaGenerator";
import DataFaker from "@/pages/tools/DataFaker";
import DockerRunBuilder from "@/pages/tools/DockerRunBuilder";
import DockerComposeGenerator from "@/pages/tools/DockerComposeGenerator";
import K8sYamlGenerator from "@/pages/tools/K8sYamlGenerator";
import K8sResourceCalculator from "@/pages/tools/K8sResourceCalculator";
import SystemdGenerator from "@/pages/tools/SystemdGenerator";
import Base64Tool from "@/pages/tools/Base64Tool";
import UrlEncoder from "@/pages/tools/UrlEncoder";
import UuidGenerator from "@/pages/tools/UuidGenerator";
import SqlFormatter from "@/pages/tools/SqlFormatter";
import SqlTableExtractor from "@/pages/tools/SqlTableExtractor";
import LoopEngineering from "./pages/loop-engineering/LoopEngineering";
import GithubStars from "./pages/GithubStars";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/rss-read" element={<RssReader />} />
          <Route path="/indie-developer" element={<IndieDeveloper />} />
          <Route path="/non-indie-developer" element={<NonIndieDeveloper />} />
          <Route path="/data-developer" element={<DataDeveloper />} />
          <Route path="/ai-development" element={<AiDevelopment />} />
          <Route path="/loop-engineering" element={<LoopEngineering />} />
          <Route path="/github-stars" element={<GithubStars />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* ========== NEW TOP-LEVEL ROUTES (Week 2) ========== */}
          {/* Developer Tools */}
          <Route path="/api-debugger" element={<ApiDebugger />} />
          <Route path="/code-formatter" element={<CodeFormatter />} />
          <Route path="/html-to-text" element={<HtmlToText />} />
          <Route path="/token-generator" element={<TokenGenerator />} />
          <Route path="/format-converter" element={<FormatConverter />} />
          <Route path="/device-info" element={<DeviceInfo />} />
          <Route path="/json-editor" element={<JsonEditorTool />} />
          <Route path="/json-diff" element={<JsonDiffTool />} />
          <Route path="/regex-tester" element={<RegexTester />} />
          <Route path="/markdown-html" element={<MarkdownHtml />} />
          <Route path="/email-md" element={<EmailMarkdown />} />
          <Route path="/jwt-decode" element={<JwtDecodeTool />} />
          
          {/* Image Tools */}
          <Route path="/qr-generator" element={<QrGenerator />} />
          <Route path="/otp-generator" element={<OtpGenerator />} />
          <Route path="/wifi-qr-generator" element={<WifiQrGenerator />} />
          {/* Chat */}
          <Route path="/webchat" element={<WebChat />} />
          <Route path="/p2p-chat" element={<P2pChat />} />
          <Route path="/manual-chat" element={<ManualChat />} />
          <Route path="/english-name" element={<EnglishNameGenerator />} />
          <Route path="/image-compressor" element={<ImageCompressor />} />
          <Route path="/image-resizer" element={<ImageResizer />} />
          <Route path="/image-converter" element={<ImageConverter />} />
          <Route path="/image-watermark" element={<ImageWatermark />} />
          <Route path="/image-joiner" element={<ImageJoiner />} />
          <Route path="/image-ascii" element={<ImageAsciiArt />} />
          
          {/* Text Tools */}
          <Route path="/text" element={<TextTools />} />
          <Route path="/text/case" element={<TextCaseConverter />} />
          <Route path="/text/replace" element={<TextReplacer />} />
          <Route path="/text/sort" element={<TextSorter />} />
          <Route path="/text/numbers" element={<TextLineNumber />} />
          <Route path="/text/html" element={<TextToHtml />} />
          <Route path="/text/symbols" element={<SymbolPicker />} />
          <Route path="/text/emojis" element={<EmojiPicker />} />
          <Route path="/text/fancy" element={<FancyTextGenerator />} />
          <Route path="/text/typesetter" element={<TextTypesetter />} />
          <Route path="/text/similarity" element={<TextSimilarity />} />
          <Route path="/text/workflow" element={<TextWorkflow />} />
          <Route path="/text/random" element={<TextRandomGenerator />} />
          <Route path="/text/stats" element={<TextStats />} />
          <Route path="/text/deduplicate" element={<TextDeduper />} />
          <Route path="/text/diff" element={<DedupSortDiff />} />
          <Route path="/password-generator" element={<PasswordGenerator />} />
          <Route path="/text-diff" element={<TextDiff />} />
          <Route path="/text-deduper" element={<TextDeduper />} />
          <Route path="/dedup-sort-diff" element={<DedupSortDiff />} />
          <Route path="/text-stats" element={<TextStats />} />
          <Route path="/text-cipher" element={<TextCipher />} />
          
          {/* Data Tools */}
          <Route path="/csv-to-json" element={<CsvToJson />} />
          <Route path="/hash-tools" element={<HashTools />} />
          <Route path="/data-converter" element={<DataConverter />} />
          
          {/* Utility Tools */}
          <Route path="/date-time" element={<DateTimeTools />} />
          <Route path="/network-tools" element={<NetworkTools />} />
          <Route path="/base-converter" element={<BaseConverter />} />
          <Route path="/color-hunt" element={<ColorHunt />} />
          <Route path="/cron-quartz" element={<CronQuartz />} />
          <Route path="/calculator" element={<CalculatorTool />} />
          <Route path="/bcrypt" element={<BcryptTool />} />
          <Route path="/ulid" element={<UlidTool />} />
          <Route path="/bip39" element={<Bip39Tool />} />
          <Route path="/perpetual-calendar" element={<PerpetualCalendar />} />
          <Route path="/i18n-manager" element={<I18nManager />} />
          <Route path="/hmac" element={<HmacTool />} />
          <Route path="/rsa-keygen" element={<RsaKeygen />} />
          <Route path="/keycode" element={<KeycodeInfo />} />
          <Route path="/chmod" element={<ChmodCalculator />} />
          <Route path="/unit-converter" element={<UnitConverter />} />
          <Route path="/date-diff" element={<DateDiffCalculator />} />
          <Route path="/naming" element={<ProgrammerNamingTool />} />
          <Route path="/domain-valuation" element={<DomainValuation />} />
          <Route path="/kinship-calculator" element={<KinshipCalculator />} />
          <Route path="/lottery-ssq" element={<LotterySsq />} />
          <Route path="/mermaid-renderer" element={<MermaidRenderer />} />
          <Route path="/short-url" element={<ShortUrlTool />} />
          <Route path="/sharepool" element={<SharePool />} />
          <Route path="/sharepool/verify" element={<SharePool />} />
          <Route path="/commit-message" element={<CommitMessageGenerator />} />
          <Route path="/gitignore" element={<GitignoreGenerator />} />

          {/* Drawing */}
          <Route path="/drawing-tool" element={<DrawingTool />} />

          {/* Config Generators */}
          <Route path="/nginx-config" element={<NginxConfigGenerator />} />
          <Route path="/apache-config" element={<ApacheConfigGenerator />} />
          <Route path="/haproxy-config" element={<HAProxyConfigGenerator />} />

          {/* Phase B — MVP Tools */}
          <Route path="/base64" element={<Base64Tool />} />
          <Route path="/url-encoder" element={<UrlEncoder />} />
          <Route path="/uuid-generator" element={<UuidGenerator />} />
          <Route path="/sql-formatter" element={<SqlFormatter />} />
          <Route path="/sql-table-extractor" element={<SqlTableExtractor />} />
          
          {/* Finance Tools */}
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/investment-return" element={<InvestmentReturnCalculator />} />
          <Route path="/roi-calculator" element={<ROICalculator />} />
          
          {/* ========== GAMES ========== */}
          <Route path="/games/snake" element={<Snake />} />
          <Route path="/games/tetris" element={<Tetris />} />
          <Route path="/games/gomoku" element={<Gomoku />} />
          <Route path="/games/dino" element={<Dino />} />
          <Route path="/games/minesweeper" element={<Minesweeper />} />
          <Route path="/games/2048" element={<Game2048 />} />
          <Route path="/games/link-match" element={<LinkMatch />} />
          <Route path="/games/sudoku" element={<Sudoku />} />
          <Route path="/games/pacvim" element={<PacVim />} />
          <Route path="/games/chinese-chess" element={<ChineseChess />} />
          <Route path="/games/go" element={<GoGame />} />
          <Route path="/games/jungle" element={<Jungle />} />
          <Route path="/games/flying-chess" element={<FlyingChess />} />
          <Route path="/games/chinese-checkers" element={<ChineseCheckers />} />
          <Route path="/games/nes" element={<NesEmulatorPage />} />
          
          {/* ========== LEGACY ROUTES WITH 301 REDIRECT (Week 2) ========== */}
          {/* Developer Tools - Legacy */}
          <Route path="/tools/api-debugger" element={<Navigate to="/api-debugger" replace />} />
          <Route path="/tools/code-formatter" element={<Navigate to="/code-formatter" replace />} />
          <Route path="/tools/html-to-text" element={<Navigate to="/html-to-text" replace />} />
          <Route path="/tools/token-generator" element={<Navigate to="/token-generator" replace />} />
          <Route path="/tools/format-converter" element={<Navigate to="/format-converter" replace />} />
          <Route path="/tools/device-info" element={<Navigate to="/device-info" replace />} />
          <Route path="/tools/json-editor" element={<Navigate to="/json-editor" replace />} />
          <Route path="/tools/json-diff" element={<Navigate to="/json-diff" replace />} />
          <Route path="/tools/regex-tester" element={<Navigate to="/regex-tester" replace />} />
          <Route path="/tools/markdown-html" element={<Navigate to="/markdown-html" replace />} />
          <Route path="/tools/email-md" element={<Navigate to="/email-md" replace />} />
          <Route path="/tools/jwt-decode" element={<Navigate to="/jwt-decode" replace />} />
          
          {/* Image Tools - Legacy */}
          <Route path="/tools/qr-generator" element={<Navigate to="/qr-generator" replace />} />
          <Route path="/tools/otp-generator" element={<Navigate to="/otp-generator" replace />} />
          <Route path="/tools/wifi-qr-generator" element={<Navigate to="/wifi-qr-generator" replace />} />
          <Route path="/tools/p2p-chat" element={<Navigate to="/p2p-chat" replace />} />
          <Route path="/tools/manual-chat" element={<Navigate to="/manual-chat" replace />} />
          <Route path="/tools/english-name" element={<Navigate to="/english-name" replace />} />
          <Route path="/tools/image-compressor" element={<Navigate to="/image-compressor" replace />} />
          <Route path="/tools/image-resizer" element={<Navigate to="/image-resizer" replace />} />
          <Route path="/tools/image-converter" element={<Navigate to="/image-converter" replace />} />
          <Route path="/tools/image-watermark" element={<Navigate to="/image-watermark" replace />} />
          <Route path="/tools/image-joiner" element={<Navigate to="/image-joiner" replace />} />
          <Route path="/tools/image-ascii" element={<Navigate to="/image-ascii" replace />} />
          
          {/* Text Tools - Legacy */}
          <Route path="/tools/text" element={<Navigate to="/text" replace />} />
          <Route path="/tools/text/case" element={<Navigate to="/text/case" replace />} />
          <Route path="/tools/text/replace" element={<Navigate to="/text/replace" replace />} />
          <Route path="/tools/text/sort" element={<Navigate to="/text/sort" replace />} />
          <Route path="/tools/text/numbers" element={<Navigate to="/text/numbers" replace />} />
          <Route path="/tools/text/html" element={<Navigate to="/text/html" replace />} />
          <Route path="/tools/text/symbols" element={<Navigate to="/text/symbols" replace />} />
          <Route path="/tools/text/emojis" element={<Navigate to="/text/emojis" replace />} />
          <Route path="/tools/text/fancy" element={<Navigate to="/text/fancy" replace />} />
          <Route path="/tools/text/typesetter" element={<Navigate to="/text/typesetter" replace />} />
          <Route path="/tools/text/similarity" element={<Navigate to="/text/similarity" replace />} />
          <Route path="/tools/text/workflow" element={<Navigate to="/text/workflow" replace />} />
          <Route path="/tools/text/random" element={<Navigate to="/text/random" replace />} />
          <Route path="/tools/text/stats" element={<Navigate to="/text/stats" replace />} />
          <Route path="/tools/text/deduplicate" element={<Navigate to="/text/deduplicate" replace />} />
          <Route path="/tools/text/diff" element={<Navigate to="/text/diff" replace />} />
          <Route path="/tools/password-generator" element={<Navigate to="/password-generator" replace />} />
          <Route path="/tools/text-diff" element={<Navigate to="/text-diff" replace />} />
          <Route path="/tools/text-deduper" element={<Navigate to="/text-deduper" replace />} />
          <Route path="/tools/dedup-sort-diff" element={<Navigate to="/dedup-sort-diff" replace />} />
          <Route path="/tools/text-stats" element={<Navigate to="/text-stats" replace />} />
          <Route path="/tools/text-cipher" element={<Navigate to="/text-cipher" replace />} />
          
          {/* Data Tools - Legacy */}
          <Route path="/tools/csv-to-json" element={<Navigate to="/csv-to-json" replace />} />
          <Route path="/tools/hash-tools" element={<Navigate to="/hash-tools" replace />} />
          <Route path="/tools/data-converter" element={<Navigate to="/data-converter" replace />} />
          
          {/* Utility Tools - Legacy */}
          <Route path="/tools/date-time" element={<Navigate to="/date-time" replace />} />
          <Route path="/tools/network-tools" element={<Navigate to="/network-tools" replace />} />
          <Route path="/tools/base-converter" element={<Navigate to="/base-converter" replace />} />
          <Route path="/tools/color-hunt" element={<Navigate to="/color-hunt" replace />} />
          <Route path="/tools/cron-quartz" element={<Navigate to="/cron-quartz" replace />} />
          <Route path="/tools/calculator" element={<Navigate to="/calculator" replace />} />
          <Route path="/tools/bcrypt" element={<Navigate to="/bcrypt" replace />} />
          <Route path="/tools/ulid" element={<Navigate to="/ulid" replace />} />
          <Route path="/tools/bip39" element={<Navigate to="/bip39" replace />} />
          <Route path="/tools/perpetual-calendar" element={<Navigate to="/perpetual-calendar" replace />} />
          <Route path="/tools/i18n-manager" element={<Navigate to="/i18n-manager" replace />} />
          <Route path="/tools/hmac" element={<Navigate to="/hmac" replace />} />
          <Route path="/tools/rsa-keygen" element={<Navigate to="/rsa-keygen" replace />} />
          <Route path="/tools/keycode" element={<Navigate to="/keycode" replace />} />
          <Route path="/tools/chmod" element={<Navigate to="/chmod" replace />} />
          <Route path="/tools/unit-converter" element={<Navigate to="/unit-converter" replace />} />
          <Route path="/tools/date-diff" element={<Navigate to="/date-diff" replace />} />
          <Route path="/tools/naming" element={<Navigate to="/naming" replace />} />
          <Route path="/tools/domain-valuation" element={<Navigate to="/domain-valuation" replace />} />
          <Route path="/tools/kinship-calculator" element={<Navigate to="/kinship-calculator" replace />} />
          <Route path="/tools/lottery-ssq" element={<Navigate to="/lottery-ssq" replace />} />
          <Route path="/tools/mermaid-renderer" element={<Navigate to="/mermaid-renderer" replace />} />
          <Route path="/tools/short-url" element={<Navigate to="/short-url" replace />} />
          <Route path="/tools/commit-message" element={<Navigate to="/commit-message" replace />} />
          <Route path="/tools/gitignore" element={<Navigate to="/gitignore" replace />} />
          <Route path="/tools/drawing-tool" element={<Navigate to="/drawing-tool" replace />} />

          {/* Config Generators - Legacy */}
          <Route path="/tools/nginx-config" element={<Navigate to="/nginx-config" replace />} />
          <Route path="/tools/apache-config" element={<Navigate to="/apache-config" replace />} />
          <Route path="/tools/haproxy-config" element={<Navigate to="/haproxy-config" replace />} />

          {/* Phase B — MVP Legacy */}

          {/* Phase C — Data Tools */}
          <Route path="/sql-column-extractor" element={<SqlColumnExtractor />} />
          <Route path="/sql-mermaid" element={<SqlMermaid />} />
          <Route path="/sql-review" element={<SqlReview />} />
          <Route path="/json-schema-generator" element={<JsonSchemaGenerator />} />
          <Route path="/data-faker" element={<DataFaker />} />

          {/* Phase D — DevOps Tools */}
          <Route path="/docker-run-builder" element={<DockerRunBuilder />} />
          <Route path="/docker-compose-generator" element={<DockerComposeGenerator />} />
          <Route path="/k8s-yaml-generator" element={<K8sYamlGenerator />} />
          <Route path="/k8s-resource-calculator" element={<K8sResourceCalculator />} />
          <Route path="/systemd-generator" element={<SystemdGenerator />} />

          {/* Phase C+D Legacy */}

          {/* Phase E — AI Tools */}
          <Route path="/token-counter" element={<TokenCounter />} />
          <Route path="/prompt-builder" element={<PromptBuilder />} />
          <Route path="/prompt-diff" element={<PromptDiff />} />
          <Route path="/rag-chunk-calculator" element={<RagChunkCalculator />} />
          <Route path="/ai-cost-calculator" element={<AiCostCalculator />} />
          <Route path="/llm-request-builder" element={<LlmRequestBuilder />} />

          {/* Phase E Legacy */}

          {/* Web3 Tools */}
          <Route path="/web3/wallet-analyzer" element={<WalletAnalyzer />} />
          <Route path="/web3/ens-lookup" element={<EnsLookup />} />
          <Route path="/web3/gas-tracker" element={<GasTracker />} />
          <Route path="/web3/tx-hash-identifier" element={<TxHashIdentifier />} />
          <Route path="/web3/token-approval-checker" element={<TokenApprovalChecker />} />
          <Route path="/web3/token-risk-scanner" element={<TokenRiskScanner />} />
          <Route path="/web3/tx-decoder" element={<TxDecoder />} />
          <Route path="/web3/token-holder-analyzer" element={<TokenHolderAnalyzer />} />
          <Route path="/web3/wallet-pnl" element={<WalletPnL />} />
          <Route path="/web3/whale-tracker" element={<WhaleTracker />} />

          {/* Web3 Legacy */}
          <Route path="/tools/web3/wallet-analyzer" element={<Navigate to="/web3/wallet-analyzer" replace />} />
          <Route path="/tools/web3/ens-lookup" element={<Navigate to="/web3/ens-lookup" replace />} />
          <Route path="/tools/web3/gas-tracker" element={<Navigate to="/web3/gas-tracker" replace />} />
          <Route path="/tools/web3/tx-hash-identifier" element={<Navigate to="/web3/tx-hash-identifier" replace />} />
          <Route path="/tools/web3/token-approval-checker" element={<Navigate to="/web3/token-approval-checker" replace />} />
          <Route path="/tools/web3/token-risk-scanner" element={<Navigate to="/web3/token-risk-scanner" replace />} />
          <Route path="/tools/web3/tx-decoder" element={<Navigate to="/web3/tx-decoder" replace />} />
          <Route path="/tools/web3/token-holder-analyzer" element={<Navigate to="/web3/token-holder-analyzer" replace />} />
          <Route path="/tools/web3/wallet-pnl" element={<Navigate to="/web3/wallet-pnl" replace />} />
          <Route path="/tools/web3/whale-tracker" element={<Navigate to="/web3/whale-tracker" replace />} />

          <Route path="/tools/token-counter" element={<Navigate to="/token-counter" replace />} />
          <Route path="/tools/prompt-builder" element={<Navigate to="/prompt-builder" replace />} />
          <Route path="/tools/prompt-diff" element={<Navigate to="/prompt-diff" replace />} />
          <Route path="/tools/rag-chunk-calculator" element={<Navigate to="/rag-chunk-calculator" replace />} />
          <Route path="/tools/ai-cost-calculator" element={<Navigate to="/ai-cost-calculator" replace />} />
          <Route path="/tools/llm-request-builder" element={<Navigate to="/llm-request-builder" replace />} />

          <Route path="/tools/sql-column-extractor" element={<Navigate to="/sql-column-extractor" replace />} />
          <Route path="/tools/sql-mermaid" element={<Navigate to="/sql-mermaid" replace />} />
          <Route path="/tools/sql-review" element={<Navigate to="/sql-review" replace />} />
          <Route path="/tools/json-schema-generator" element={<Navigate to="/json-schema-generator" replace />} />
          <Route path="/tools/data-faker" element={<Navigate to="/data-faker" replace />} />
          <Route path="/tools/docker-run-builder" element={<Navigate to="/docker-run-builder" replace />} />
          <Route path="/tools/docker-compose-generator" element={<Navigate to="/docker-compose-generator" replace />} />
          <Route path="/tools/k8s-yaml-generator" element={<Navigate to="/k8s-yaml-generator" replace />} />
          <Route path="/tools/k8s-resource-calculator" element={<Navigate to="/k8s-resource-calculator" replace />} />
          <Route path="/tools/systemd-generator" element={<Navigate to="/systemd-generator" replace />} />

          <Route path="/tools/base64" element={<Navigate to="/base64" replace />} />
          <Route path="/tools/url-encoder" element={<Navigate to="/url-encoder" replace />} />
          <Route path="/tools/uuid-generator" element={<Navigate to="/uuid-generator" replace />} />
          <Route path="/tools/sql-formatter" element={<Navigate to="/sql-formatter" replace />} />
          <Route path="/tools/sql-table-extractor" element={<Navigate to="/sql-table-extractor" replace />} />
          
          {/* Finance Tools - Legacy */}
          <Route path="/tools/mortgage-calculator" element={<Navigate to="/mortgage-calculator" replace />} />
          <Route path="/tools/investment-return" element={<Navigate to="/investment-return" replace />} />
          <Route path="/tools/roi-calculator" element={<Navigate to="/roi-calculator" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
