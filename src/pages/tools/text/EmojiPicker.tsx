import React, { useState } from 'react';
import { Smile, Check } from 'lucide-react';

// Reduced set for demo - normally would use a full dataset library or json
const EMOJI_CATEGORIES = {
  'Smileys': "😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖".split(" "),
  'People': "👋 Qw 🤚 Vk 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦵 🦿 🦶 👣 👂 🦻 👃 🫀 🫁 🧠 🦷 🦴 👀 👁️ 👅 👄".split(" "),
  'Animals': "🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍🦺 🐩 🐺 🦊 🦝 cat 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🐎 🦄 🦓 🦌 🦬 cow 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜".split(" "),
  'Food': "🍇 🍈 🍉 🍊 🍋 🍌 🍍 🥭 🍎 🍏 🍐 🍑 🍒 🍓 🫐 🥝 🍅 🫒 🥥 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🍄 🥜 🌰 🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫".split(" "),
  'Objects': "👓 🕶️ 🥽 🥼 🦺 👔 👕 👖 🧣 🧤 🧥 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 👛 👜 👝 🛍️ 🎒 🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 👑 👒 🎩 🎓 🧢 🪖 ⛑️ 📿 💄 💍 💎 🔇 🔈 🔉 🔊 📢 📣 📯 🔔 🔕 🎼 🎵 🎶 🎙️ 🎚️ 🎛️ 🎤 🎧 📻 🎷 🪗 🎸 🎹 🎺 🎻 🪕 🥁 🪘".split(" "),
};

export default function EmojiPicker() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (emoji: string) => {
    navigator.clipboard.writeText(emoji);
    setCopied(emoji);
    setTimeout(() => setCopied(null), 1000);
  };

  const filteredEmojis = Object.entries(EMOJI_CATEGORIES).flatMap(([cat, emojis]) => 
    emojis.map(e => ({ emoji: e, category: cat }))
  ).filter(({ category }) => {
    // In a real app each glyph would carry a searchable name.
    const matchesCategory = activeCategory === 'All' || activeCategory === category;
    return matchesCategory;
  });

  const uniqueEmojis = Array.from(new Set(filteredEmojis.map(e => e.emoji)));

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-destructive/10 text-destructive rounded-lg">
          <Smile size={24} />
        </div>
        <h1 className="text-2xl font-bold">Emoji Picker</h1>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide flex-1">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${ activeCategory === 'All' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:bg-muted' }`}
            >
              All
            </button>
            {Object.keys(EMOJI_CATEGORIES).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${ activeCategory === cat ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground hover:bg-muted' }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
          {uniqueEmojis.map((emoji, i) => (
            <button
              key={`${emoji}-${i}`}
              onClick={() => handleCopy(emoji)}
              className="aspect-square flex items-center justify-center text-2xl bg-muted hover:bg-destructive/10 border border-border hover:border-border rounded-lg transition-colors relative group"
            >
              <span role="img" aria-label={`Emoji ${emoji}`}>
                {emoji}
              </span>
              {copied === emoji && (
                <div className="absolute inset-0 bg-destructive/10 rounded-lg flex items-center justify-center animate-in fade-in zoom-in duration-200">
                  <Check size={16} className="text-destructive" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-primary/10 border border-border rounded-lg p-4 text-sm text-primary">
        Tip: Emojis may look different depending on your operating system and browser.
      </div>
    </div>
  );
}
