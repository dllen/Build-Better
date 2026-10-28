import { useState, useRef, useCallback } from "react";
import { Smile, Download } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

// Common emoji data (Twemoji-style rendering via system font)
const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Smileys": "😀 😃 😄 😁 😅 😂 🤣 😊 😇 🙂 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥴 😵 🤯 🥳 🥺".split(" "),
  "Animals": "🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🐔 🐧 🐦 🐤 🐣 🐥 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🪲 🪳 🦟 🦗 🕷 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦧 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🦮 🐕‍🦺 🐈 🐈‍⬛ 🪶 🐓 🦃 🦤 🦚 🦜 🦢 🦩 🕊 🐇 🦝 🦨 🦡 🦫 🦦 🦥 🐁 🐀 🐿 🦔 🐾".split(" "),
  "Food": "🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🥐 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🦴 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯".split(" "),
  "Travel": "🚗 🚕 🚙 🚌 🚎 🏎 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🏍 🛵 🚲 🛴 🛹 🛼 🚏 🛣 🛤 ⛽ 🚨 🚥 🚦 🛑 🚧 ⚓ ⛵ 🛶 🚤 🛳 ⛴ 🛥 🚢 ✈ 🛩 🛫 🛬 💺 🚁 🚟 🚠 🚡 🛰 🚀 🛸".split(" "),
  "Symbols": "❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣ 💕 💞 💓 💗 💖 💘 💝 💟 ☮ ✝ ☪ 🕉 ☸ ✡ 🔯 🕎 ☯ ☦ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛ 🉑 ☢ ☣ 📴 📳 🈶 🈚 🈸 🈺 🈷 ✴ 🆚 💮 🉐 ㊙ ㊗ 🈴 🈵 🈹 🈲 🅰 🅱 🆎 🆑 🅾 🆘 ⛔ 📛 🚫 💯 💢".split(" "),
};

export default function ConvertEmojiToImage() {
  const [emoji, setEmoji] = useState(() => Object.values(EMOJI_CATEGORIES)[0]?.[0] ?? "");
  const [size, setSize] = useState(128);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [output, setOutput] = useState<string | null>(null);
  const [customEmoji, setCustomEmoji] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const em = customEmoji.trim() || emoji;
    if (!em) return;

    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    const fontSize = Math.floor(size * 0.7);
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(em, size / 2, size / 2);

    setOutput(canvas.toDataURL("image/png"));
  }, [emoji, size, bgColor, customEmoji]);

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg"><Smile className="h-5 w-5" /></div>
          <h1 className="text-2xl font-bold text-foreground">Emoji to Image</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Size:</span>
            <input type="number" min={16} max={1024} value={size}
              onChange={(e) => setSize(Math.max(16, Math.min(1024, Number(e.target.value))))}
              className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm text-center focus:border-border focus:ring-1 focus:ring-ring outline-none" />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
          <label className="flex items-center gap-1 text-sm text-muted-foreground">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer" />
            BG
          </label>
          <button onClick={render}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary transition-colors">
            <Smile className="h-3.5 w-3.5" />Render
          </button>
        </div>
      }
      inputLabel="Select Emoji"
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card p-4">
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Custom emoji (or pick below)</label>
            <input type="text" value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)}
              placeholder="Paste any emoji here..."
              className="w-full rounded-lg border border-border px-3 py-2 text-lg focus:border-border focus:ring-1 focus:ring-ring outline-none" />
          </div>
          {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
            <div key={cat} className="mb-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">{cat}</p>
              <div className="flex flex-wrap gap-1">
                {emojis.map((e, i) => (
                  <button key={i} onClick={() => { setEmoji(e); setCustomEmoji(""); }}
                    className={`w-9 h-9 flex items-center justify-center text-lg rounded hover:bg-muted transition-colors ${emoji === e && !customEmoji ? "bg-primary/10 ring-2 ring-ring" : ""}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
      outputLabel="Image"
      outputActions={
        output ? (
          <button onClick={() => { const a = document.createElement("a"); a.href = output; a.download = `emoji.png`; a.click(); }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors">
            <Download className="h-3.5 w-3.5" />Download PNG
          </button>
        ) : undefined
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border border-border bg-muted/50 p-4">
          {output ? (
            <img src={output} alt="Rendered emoji" className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Click Render to generate image
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" role="img" aria-label="Drawing output"/>
        </div>
      }
    />
  );
}