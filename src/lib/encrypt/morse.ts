const MORSE: Record<string,string> = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--','?':'..--..',"'":'.----.','!':'-.-.--','/':'-..-.','(':'-.--.',')':'-.--.-','&':'.-...',':':'---...',';':'-.-.-.','=':'-...-','+':'.-.-.','-':'-....-','_':'..--.-','"':'.-..-.','$':'...-..-','@':'.--.-.',' ':'/'};

const REVERSE: Record<string,string> = {};
for (const [c, code] of Object.entries(MORSE)) REVERSE[code] = c;

export function morseEncode(text: string, dot='.', dash='-', sep=' '): string {
  return text.toUpperCase().split('').map(c => {
    const code = MORSE[c]; if (!code) return '?';
    return code.replace(/\./g, dot).replace(/-/g, dash);
  }).join(sep);
}

export function morseDecode(morse: string, dot='.', dash='-', sep=' '): string {
  if (!morse.trim()) return '';
  return morse.split(sep).map(t => {
    const n = t.replace(new RegExp(`\\${dot}`, 'g'), '.').replace(new RegExp(`\\${dash}`, 'g'), '-');
    return REVERSE[n] || '?';
  }).join('');
}
