const KEY = [0x64,0x40,0x12,0x20,0x22,0x34,0x14,0x03,0x37,0x13,0x22,0x12,0x09,0x26,0x33,0x38];

export function type7Encode(password: string): string {
  const seed = Math.floor(Math.random()*16)+1;
  const enc = password.split('').map((c,i)=>{
    const k = KEY[(i+seed-1)%KEY.length];
    return (c.charCodeAt(0)^k).toString(16).padStart(2,'0').toUpperCase();
  }).join('');
  return seed.toString(16).padStart(2,'0').toUpperCase()+enc;
}

export function type7Decode(hash: string): string {
  if (hash.length<4) return '';
  const seed = parseInt(hash.slice(0,2),16);
  const hex = hash.slice(2), bytes: number[] = [];
  for (let i=0; i<hex.length; i+=2) bytes.push(parseInt(hex.slice(i,i+2),16));
  return bytes.map((b,i)=>String.fromCharCode(b^KEY[(i+seed-1)%KEY.length])).join('');
}
