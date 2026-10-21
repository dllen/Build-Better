function crc16Table(poly: number): number[] {
  const t: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i << 8;
    for (let j = 0; j < 8; j++) c = c & 0x8000 ? (c << 1) ^ poly : c << 1;
    t.push(c & 0xFFFF);
  }
  return t;
}

function crc32Table(): number[] {
  const t: number[] = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
}

const CRC16_CFG: Record<string,{poly:number;init:number}> = {
  ccitt:{poly:0x1021,init:0xFFFF}, modbus:{poly:0x8005,init:0xFFFF}, xmodem:{poly:0x1021,init:0x0000}
};
const CRC32_TABLE = crc32Table();

export function crc16(data: string, variant: 'ccitt'|'modbus'|'xmodem' = 'ccitt'): string {
  const {poly,init} = CRC16_CFG[variant], table = crc16Table(poly);
  const bytes = new TextEncoder().encode(data);
  let crc = init;
  for (const b of bytes) crc = ((crc << 8) ^ table[((crc >>> 8) ^ b) & 0xFF]) & 0xFFFF;
  return '0x' + crc.toString(16).padStart(4, '0');
}

export function crc32(data: string): string {
  const bytes = new TextEncoder().encode(data);
  let crc = 0xFFFFFFFF;
  for (const b of bytes) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ b) & 0xFF];
  return '0x' + ((crc ^ 0xFFFFFFFF) >>> 0).toString(16).padStart(8, '0');
}
