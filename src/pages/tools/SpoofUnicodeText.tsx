import { useState, useCallback } from "react";
import { Type, Copy } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Unicode spoofing - uses homoglyphs / confusables to replace characters
const HOMOGLYPHS: Record<string, string[]> = {
  "a": ["а", "α", "⍺", "ａ", "𝐚", "𝑎", "𝒂", "𝒶", "𝓪", "𝔞", "𝕒", "𝖆", "𝖺", "𝗮", "𝘢", "𝙖", "𝚊"],
  "b": ["Ь", "Ꮟ", "ƅ", "ｂ", "𝐛", "𝑏", "𝒃", "𝒷", "𝓫", "𝔟", "𝕓", "𝖇", "𝖻", "𝗯", "𝘣", "𝙗", "𝚋"],
  "c": ["с", "ϲ", "ᴄ", "ⅽ", "ｃ", "𝐜", "𝑐", "𝒄", "𝒸", "𝓬", "𝔠", "𝕔", "𝖈", "𝖼", "𝗰", "𝘤", "𝙘", "𝚌"],
  "d": ["ԁ", "Ꮷ", "ⅾ", "ｄ", "𝐝", "𝑑", "𝒅", "𝒹", "𝓭", "𝔡", "𝕕", "𝖉", "𝖽", "𝗱", "𝘥", "𝙙", "𝚍"],
  "e": ["е", "ҽ", "℮", "ｅ", "𝐞", "𝑒", "𝒆", "𝓮", "𝔢", "𝕖", "𝖊", "𝖾", "𝗲", "𝘦", "𝙚", "𝚎"],
  "f": ["ꬴ", "ｆ", "𝐟", "𝑓", "𝒇", "𝒻", "𝓯", "𝔣", "𝕗", "𝖋", "𝖿", "𝗳", "𝘧", "𝙛", "𝚏"],
  "g": ["ɡ", "ġ", "ｇ", "𝐠", "𝑔", "𝒈", "𝓰", "𝔤", "𝕘", "𝖌", "𝗀", "𝗴", "𝘨", "𝙜", "𝚐"],
  "h": ["һ", "ｈ", "𝐡", "𝒉", "𝒽", "𝓱", "𝔥", "𝕙", "𝖍", "𝗁", "𝗵", "𝘩", "𝙝", "𝚑"],
  "i": ["і", "Ꭵ", "ⅰ", "ͺ", "ｉ", "𝐢", "𝑖", "𝒊", "𝒾", "𝓲", "𝔦", "𝕚", "𝖎", "𝗂", "𝗶", "𝘪", "𝙞", "𝚒"],
  "j": ["ј", "ϳ", "ｊ", "𝐣", "𝑗", "𝒋", "𝒿", "𝓳", "𝔧", "𝕛", "𝖏", "𝗃", "𝗷", "𝘫", "𝙟", "𝚓"],
  "k": ["κ", "ｋ", "𝐤", "𝑘", "𝒌", "𝓀", "𝓴", "𝔨", "𝕜", "𝖐", "𝗄", "𝗸", "𝘬", "𝙠", "𝚔"],
  "l": ["ӏ", "ⅼ", "ｌ", "𝐥", "𝑙", "𝒍", "𝓁", "𝓵", "𝔩", "𝕝", "𝖑", "𝗅", "𝗹", "𝘭", "𝙡", "𝚕"],
  "m": ["ｍ", "𝐦", "𝑚", "𝒎", "𝓂", "𝓶", "𝔪", "𝕞", "𝖒", "𝗆", "𝗺", "𝘮", "𝙢", "𝚖"],
  "n": ["ո", "ｎ", "𝐧", "𝑛", "𝒏", "𝓃", "𝓷", "𝔫", "𝕟", "𝖓", "𝗇", "𝗻", "𝘯", "𝙣", "𝚗"],
  "o": ["ο", "о", "σ", "ｏ", "𝐨", "𝑜", "𝒐", "𝓸", "𝔬", "𝕠", "𝖔", "𝗈", "𝗼", "𝘰", "𝙤", "𝚘"],
  "p": ["р", "ρ", "ｐ", "𝐩", "𝑝", "𝒑", "𝓅", "𝓹", "𝔭", "𝕡", "𝖕", "𝗉", "𝗽", "𝘱", "𝙥", "𝚙"],
  "q": ["ԛ", "ｑ", "𝐪", "𝑞", "𝒒", "𝓆", "𝓺", "𝔮", "𝕢", "𝖖", "𝗊", "𝗾", "𝘲", "𝙦", "𝚚"],
  "r": ["г", "ｒ", "𝐫", "𝑟", "𝒓", "𝓇", "𝓻", "𝔯", "𝕣", "𝖗", "𝗋", "𝗿", "𝘳", "𝙧", "𝚛"],
  "s": ["ѕ", "ｓ", "𝐬", "𝑠", "𝒔", "𝓈", "𝓼", "𝔰", "𝕤", "𝖘", "𝗌", "𝘀", "𝘴", "𝙨", "𝚜"],
  "t": ["τ", "ｔ", "𝐭", "𝑡", "𝒕", "𝓉", "𝓽", "𝔱", "𝕥", "𝖙", "𝗍", "𝘁", "𝘵", "𝙩", "𝚝"],
  "u": ["υ", "ｕ", "𝐮", "𝑢", "𝒖", "𝓊", "𝓾", "𝔲", "𝕦", "𝖚", "𝗎", "𝘂", "𝘶", "𝙪", "𝚞"],
  "v": ["ν", "ⅴ", "ｖ", "𝐯", "𝑣", "𝒗", "𝓋", "𝓿", "𝔳", "𝕧", "𝖛", "𝗏", "𝘃", "𝘷", "𝙫", "𝚟"],
  "w": ["ѡ", "ｗ", "𝐰", "𝑤", "𝒘", "𝓌", "𝔀", "𝔴", "𝕨", "𝖜", "𝗐", "𝘄", "𝘸", "𝙬", "𝚠"],
  "x": ["х", "ⅹ", "ｘ", "𝐱", "𝑥", "𝒙", "𝓍", "𝔁", "𝔵", "𝕩", "𝖝", "𝗑", "𝘅", "𝘹", "𝙭", "𝚡"],
  "y": ["у", "γ", "ｙ", "𝐲", "𝑦", "𝒚", "𝓎", "𝔂", "𝔶", "𝕪", "𝖞", "𝗒", "𝘆", "𝘺", "𝙮", "𝚢"],
  "z": ["ᴢ", "ｚ", "𝐳", "𝑧", "𝒛", "𝓏", "𝔃", "𝔷", "𝕫", "𝖟", "𝗓", "𝘇", "𝘻", "𝙯", "𝚣"],
  "A": ["А", "Α", "Ꭺ", "Ａ", "𝐀", "𝐴", "𝑨", "𝒜", "𝓐", "𝔄", "𝔸", "𝕬", "𝖠", "𝗔", "𝘈", "𝘼", "𝙰"],
  "B": ["Β", "В", "Ｂ", "𝐁", "𝐵", "𝑩", "𝓑", "𝔅", "𝔹", "𝕭", "𝖡", "𝗕", "𝘉", "𝘽", "𝙱"],
  "C": ["С", "Ⅽ", "Ｃ", "𝐂", "𝐶", "𝑪", "𝒞", "𝓒", "𝔠", "𝕮", "𝖢", "𝗖", "𝘊", "𝘾", "𝙲"],
  "E": ["Ε", "Е", "Ｅ", "𝐄", "𝐸", "𝑬", "𝓔", "𝔈", "𝔼", "𝕰", "𝖤", "𝗘", "𝘌", "𝙴"],
  "H": ["Η", "Н", "Ｈ", "𝐇", "𝐻", "𝑯", "𝓗", "𝕳", "𝖧", "𝗛", "𝘏", "𝙷"],
  "I": ["Ι", "І", "Ⅰ", "Ｉ", "𝐈", "𝐼", "𝑰", "𝓘", "𝕴", "𝖨", "𝗜", "𝘐", "𝙸"],
  "J": ["Ј", "Ｊ", "𝐉", "𝐽", "𝑱", "𝓙", "𝕵", "𝖩", "𝗝", "𝘑", "𝙹"],
  "K": ["Κ", "К", "Ｋ", "𝐊", "𝐾", "𝑲", "𝓚", "𝕶", "𝖪", "𝗞", "𝘒", "𝙺"],
  "M": ["Μ", "М", "Ｍ", "𝐌", "𝑀", "𝑴", "𝓜", "𝕸", "𝖬", "𝗠", "𝘔", "𝙼"],
  "N": ["Ν", "Ｎ", "𝐍", "𝑁", "𝑵", "𝓝", "𝕹", "𝖭", "𝗡", "𝘕", "𝙽"],
  "O": ["Ο", "О", "Ｏ", "𝐎", "𝑂", "𝑶", "𝒪", "𝓞", "𝕺", "𝖮", "𝗢", "𝘖", "𝙾"],
  "P": ["Ρ", "Р", "Ｐ", "𝐏", "𝑃", "𝑷", "𝓟", "𝕻", "𝖯", "𝗣", "𝘗", "𝙿"],
  "T": ["Τ", "Т", "Ｔ", "𝐓", "𝑇", "𝑻", "𝓣", "𝕿", "𝖳", "𝗧", "𝘛", "𝚃"],
  "X": ["Χ", "Х", "Ｘ", "𝐗", "𝑋", "𝑿", "𝓧", "𝖃", "𝖷", "𝗫", "𝘟", "𝚇"],
  "Y": ["Υ", "Ү", "Ｙ", "𝐘", "𝑌", "𝒀", "𝒴", "𝓨", "𝖄", "𝖸", "𝗬", "𝘠", "𝚈"],
  "Z": ["Ζ", "Ｚ", "𝐙", "𝑍", "𝒁", "𝓩", "𝖅", "𝖹", "𝗭", "𝘡", "𝚉"],
  "0": ["０", "𝟎", "𝟢", "𝟬", "𝟶"],
  "1": ["１", "𝟏", "𝟣", "𝟭", "𝟷"],
  "2": ["２", "𝟐", "𝟤", "𝟮", "𝟸"],
  "3": ["３", "𝟑", "𝟥", "𝟯", "𝟹"],
  "4": ["４", "𝟒", "𝟦", "𝟰", "𝟺"],
  "5": ["５", "𝟓", "𝟧", "𝟱", "𝟻"],
  "6": ["６", "𝟔", "𝟨", "𝟲", "𝟼"],
  "7": ["７", "𝟕", "𝟩", "𝟳", "𝟽"],
  "8": ["８", "𝟖", "𝟪", "𝟴", "𝟾"],
  "9": ["９", "𝟗", "𝟫", "𝟵", "𝟿"],
};

export default function SpoofUnicodeText() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [intensity, setIntensity] = useState(50);

  const handleSpoof = useCallback(() => {
    if (!input.trim()) { setOutput(""); return; }
    // Seed randomness per-character for reproducibility
    const seed = input.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    // Use a simple seeded random for reproducibility
    let s = seed;
    const seededRandom = () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };

    const replaceChance = intensity / 100;
    let result = "";
    for (const ch of input) {
      const variants = HOMOGLYPHS[ch] || HOMOGLYPHS[ch.toLowerCase()];
      if (variants && seededRandom() < replaceChance) {
        result += variants[Math.floor(seededRandom() * variants.length)];
      } else {
        result += ch;
      }
    }
    setOutput(result);
  }, [input, intensity]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Type className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Spoof Unicode Text</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <span>Intensity: {intensity}%</span>
            <input type="range" min={10} max={100} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-24 accent-purple-500" />
          </div>
          <button onClick={handleSpoof}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
            <Type className="h-3.5 w-3.5" />Spoof
          </button>
        </div>
      }
      inputLabel="Original Text"
      input={
        <textarea value={input} onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder="Enter text to spoof with Unicode homoglyphs..."
          className="h-full w-full resize-none rounded-lg border border-gray-200 bg-white p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
          spellCheck={false} />
      }
      outputLabel="Spoofed Text"
      outputActions={
        output ? (
          <button onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Copy className="h-3.5 w-3.5" />Copy
          </button>
        ) : undefined
      }
      output={
        <div className="h-full overflow-auto rounded-lg border border-gray-200 bg-white p-4">
          {output ? (
            <div className="space-y-2">
              <p className="text-lg font-mono text-gray-800 break-all leading-relaxed">{output}</p>
              <details className="text-xs text-gray-400">
                <summary className="cursor-pointer">Show hex codes</summary>
                <p className="font-mono mt-1">{Array.from(output).map(c => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`).join(" ")}</p>
              </details>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Spoofed text will appear here
            </div>
          )}
        </div>
      }
    />
  );
}