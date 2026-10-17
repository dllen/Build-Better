import { useState, useCallback } from "react";
import { FileText, Copy, Check, RefreshCw } from "lucide-react";
import { CalculatorShell } from "@/components/common/CalculatorShell";

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
  "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
  "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud",
  "exercitation", "ullamco", "laboris", "nisi", "aliquip", "ex", "ea", "commodo",
  "consequat", "duis", "aute", "irure", "in", "reprehenderit", "voluptate",
  "velit", "esse", "cillum", "fugiat", "nulla", "pariatur", "excepteur", "sint",
  "occaecat", "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
  "deserunt", "mollit", "anim", "id", "est", "laborum",
];

function randomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function generateWords(count: number): string {
  const words: string[] = [];
  for (let i = 0; i < count; i++) words.push(randomWord());
  // Capitalize first word
  if (words.length > 0) words[0] = words[0][0].toUpperCase() + words[0].slice(1);
  return words.join(" ") + ".";
}

function generateParagraphs(count: number, wordsPerParagraph: number): string {
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    paragraphs.push(generateWords(wordsPerParagraph));
  }
  return paragraphs.join("\n\n");
}

type OutputType = "paragraphs" | "words" | "sentences";

export default function LoremIpsumGenerator() {
  const [outputType, setOutputType] = useState<OutputType>("paragraphs");
  const [count, setCount] = useState(3);
  const [wordsPerParagraph, setWordsPerParagraph] = useState(50);
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [text, setText] = useState(() => generateParagraphs(3, 50));
  const [copied, setCopied] = useState(false);

  const generate = useCallback(() => {
    let result: string;
    if (outputType === "paragraphs") {
      result = generateParagraphs(count, wordsPerParagraph);
    } else if (outputType === "words") {
      const words: string[] = [];
      for (let i = 0; i < count; i++) words.push(randomWord());
      if (words.length > 0) words[0] = words[0][0].toUpperCase() + words[0].slice(1);
      result = words.join(" ");
    } else {
      // sentences: ~10-20 words per sentence
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) {
        const len = 10 + Math.floor(Math.random() * 11);
        sentences.push(generateWords(len));
      }
      result = sentences.join(" ");
    }
    if (startWithLorem && outputType !== "words") {
      result = result.replace(/^[^.]+/, "Lorem ipsum dolor sit amet, consectetur adipiscing elit");
    }
    setText(result);
  }, [outputType, count, wordsPerParagraph, startWithLorem]);

  const copyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;

  return (
    <CalculatorShell
      title="Lorem Ipsum Generator"
      subtitle="Generate placeholder text for your designs and mockups."
      icon={FileText}
      iconBgColor="bg-slate-100"
      iconColor="text-slate-600"
      keywords={["lorem ipsum", "placeholder text", "dummy text", "filler text", "random text"]}
      children={
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Output Type</label>
            <select
              value={outputType}
              onChange={(e) => setOutputType(e.target.value as OutputType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            >
              <option value="paragraphs">Paragraphs</option>
              <option value="sentences">Sentences</option>
              <option value="words">Words</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Count: {count}
            </label>
            <input
              type="range"
              min={1}
              max={outputType === "paragraphs" ? 20 : outputType === "sentences" ? 50 : 200}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-slate-600"
            />
          </div>
          {outputType === "paragraphs" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Words per paragraph: {wordsPerParagraph}
              </label>
              <input
                type="range"
                min={20}
                max={100}
                value={wordsPerParagraph}
                onChange={(e) => setWordsPerParagraph(Number(e.target.value))}
                className="w-full accent-slate-600"
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="rounded text-slate-600 focus:ring-slate-500"
            />
            Start with "Lorem ipsum dolor sit amet..."
          </label>
          <button
            onClick={generate}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm active:scale-95"
          >
            <RefreshCw className="h-5 w-5" />
            Generate
          </button>
        </div>
      }
      result={
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-500">
              {wordCount} words · {charCount} chars
            </div>
            <button
              onClick={copyText}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
              {text}
            </pre>
          </div>
        </div>
      }
    />
  );
}