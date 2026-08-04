import React, { useState } from 'react';
import { Wand2, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STYLES = [
  { name: 'Bold', map: '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Italic', map: '𝐴𝐵𝐶𝐷𝐸𝐉𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Bold Italic', map: '𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Script', map: '𝒜ℬ𝒞𝒟𝐸𝐹𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏0123456789' },
  { name: 'Bold Script', map: '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Fraktur', map: '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷0123456789' },
  { name: 'Bold Fraktur', map: '𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Double Struck', map: '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Sans Serif', map: '𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗' },
  { name: 'Sans Bold', map: '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵' },
  { name: 'Monospace', map: '𝙰𝖡𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿' },
  { name: 'Bubble', map: 'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ0123456789' },
  { name: 'Inverted Bubble', map: '🅐𝑩𝔆𝔇𝔈𝔉𝔊𝔋𝔌𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔𝔕𝔖𝔗𝔘𝔙𝔚𝔛𝔜𝔝🅐𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷0123456789' }, // Incomplete mapping in standard unicode, using approximation or just skipping
  // Better approach for mapping:
];

// Helper to map chars
const NORMAL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const convert = (text: string, styleIndex: number) => {
  const target = STYLES[styleIndex].map;
  return text.split('').map(char => {
    const idx = NORMAL.indexOf(char);
    return idx !== -1 && target[idx*2] ? target.substring(idx*2, idx*2+2) : (idx !== -1 ? target[idx] : char); 
    // The above logic is flawed because unicode surrogates can be 1 or 2 chars. 
    // We need real array indexing for unicode strings.
  }).join('');
};

const convertSafe = (text: string, styleIndex: number) => {
  const targetStr = STYLES[styleIndex].map;
  // Convert string to array of code points (strings)
  const target = [...targetStr]; 
  const source = [...NORMAL];
  
  return text.split('').map(char => {
    const idx = source.indexOf(char);
    return idx !== -1 && target[idx] ? target[idx] : char;
  }).join('');
};

export default function FancyTextGenerator() {
  const { t } = useTranslation();
  const [text, setText] = useState('Hello World 123');
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopied(index);
    setTimeout(() => setCopied(null), 1000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
          <Wand2 size={24} />
        </div>
        <h1 className="text-2xl font-bold">Fancy Text Generator</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Text</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
          />
        </div>

        <div className="grid gap-4">
          {STYLES.map((style, index) => {
            const result = convertSafe(text, index);
            return (
              <div key={style.name} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors group">
                <div className="w-32 text-xs text-gray-500 font-medium">{style.name}</div>
                <div className="flex-1 font-medium text-lg truncate">{result}</div>
                <button
                  onClick={() => handleCopy(result, index)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  {copied === index ? <Check size={20} /> : <Copy size={20} />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
