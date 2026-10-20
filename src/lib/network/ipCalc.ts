/**
 * Pure IPv4/IPv6 + subnet math shared by the network tools.
 * No DOM, no deps — imported by tool pages and by tests/network/*.test.mjs.
 */

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) >= 0 && Number(p) <= 255 && String(Number(p)) === p);
}

/** IPv4 dotted quad -> unsigned 32-bit int. Throws on invalid input. */
export function ipToInt(ip: string): number {
  if (!isValidIpv4(ip)) throw new Error(`Invalid IPv4 address: ${ip}`);
  const [a, b, c, d] = ip.split(".").map(Number);
  return ((a << 24) >>> 0) + (b << 16) + (c << 8) + d;
}

/** Unsigned 32-bit int -> IPv4 dotted quad. Throws on out-of-range. */
export function intToIp(int: number): string {
  if (!Number.isInteger(int) || int < 0 || int > 0xffffffff) {
    throw new Error(`Integer out of IPv4 range: ${int}`);
  }
  return [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join(".");
}

/** Hextet slots a group list occupies (dotted-quad tails count as 2). */
function slotCount(groups: string[]): number {
  return groups.reduce((n, g) => n + (g.includes(".") ? 2 : 1), 0);
}

/** Basic IPv6 validation (full + compressed forms, optional IPv4-mapped tail). */
export function isValidIpv6(ip: string): boolean {
  const s = ip.trim();
  if (!s.includes(":")) return false;
  if ((s.match(/::/g) || []).length > 1) return false;
  const parts = s.split("::");
  const groups = parts.flatMap((p) => (p === "" ? [] : p.split(":")));
  const slots = slotCount(groups);
  if (parts.length === 2 && slots >= 8) return false;
  if (parts.length === 1 && slots !== 8) return false;
  return groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g) || (g.includes(".") && isValidIpv4(g)));
}

/** IPv6 -> 128-bit bigint. Throws on invalid input. */
export function ipv6ToBigint(ip: string): bigint {
  const s = ip.trim();
  if (!isValidIpv6(s)) throw new Error(`Invalid IPv6 address: ${s}`);
  const [head, tail] = s.split("::");
  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];
  const fill = 8 - slotCount(headGroups) - slotCount(tailGroups);
  const groups = [...headGroups, ...Array(fill).fill("0"), ...tailGroups];
  let value = 0n;
  for (const g of groups) {
    if (g.includes(".")) {
      const n = ipToInt(g);
      value = (value << 32n) | BigInt(n);
    } else {
      value = (value << 16n) | BigInt(parseInt(g || "0", 16));
    }
  }
  return value;
}

/** 128-bit bigint -> compressed IPv6 string. Throws on out-of-range. */
export function bigintToIpv6(value: bigint): string {
  if (value < 0n || value > (1n << 128n) - 1n) throw new Error(`Integer out of IPv6 range: ${value}`);
  const groups: string[] = [];
  for (let i = 7; i >= 0; i--) {
    groups.push(((value >> BigInt(i * 16)) & 0xffffn).toString(16));
  }
  // Compress the longest run of zero hextets (RFC 5952 style, minimal form).
  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;
  groups.forEach((g, i) => {
    if (g === "0") {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  });
  if (bestLen >= 2) {
    const head = groups.slice(0, bestStart).join(":");
    const tail = groups.slice(bestStart + bestLen).join(":");
    return `${head}::${tail}`;
  }
  return groups.join(":");
}

export interface SubnetInfo {
  cidr: string;
  ip: string;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  networkBinary: string;
  maskBinary: string;
  isPrivate: boolean;
}

/** "192.168.1.13/24" or "192.168.1.13 255.255.255.0" -> subnet facts. */
export function calcSubnet(input: string): SubnetInfo {
  const s = input.trim();
  let ip: string;
  let prefix: number;
  if (s.includes("/")) {
    const [ipPart, prefixPart] = s.split("/");
    ip = ipPart.trim();
    prefix = Number(prefixPart);
    if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      throw new Error(`Invalid prefix length: ${prefixPart}`);
    }
  } else {
    const [ipPart, maskPart] = s.split(/\s+/);
    ip = ipPart;
    if (!isValidIpv4(maskPart)) throw new Error(`Invalid netmask: ${maskPart}`);
    const maskInt = ipToInt(maskPart);
    // Mask must be contiguous 1s followed by 0s.
    const inverted = ~maskInt >>> 0;
    if (maskInt !== 0 && ((inverted + 1) & inverted) !== 0) {
      throw new Error(`Non-contiguous netmask: ${maskPart}`);
    }
    prefix = maskInt === 0 ? 0 : 32 - Math.log2(inverted + 1);
  }
  if (!isValidIpv4(ip)) throw new Error(`Invalid IPv4 address: ${ip}`);

  const ipInt = ipToInt(ip);
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0;
  const size = 2 ** (32 - prefix);
  const usable = prefix >= 31 ? (prefix === 32 ? 1 : 2) : size - 2;

  return {
    cidr: `${intToIp(networkInt)}/${prefix}`,
    ip,
    prefix,
    mask: intToIp(maskInt),
    wildcard: intToIp(~maskInt >>> 0),
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    firstHost: prefix >= 31 ? intToIp(networkInt) : intToIp(networkInt + 1),
    lastHost: prefix >= 31 ? intToIp(broadcastInt) : intToIp(broadcastInt - 1),
    totalHosts: size,
    usableHosts: usable,
    networkBinary: toBinary(networkInt),
    maskBinary: toBinary(maskInt),
    isPrivate: isPrivateIpv4(ip),
  };
}

export function toBinary(int: number): string {
  return (int >>> 0).toString(2).padStart(32, "0").replace(/(.{8})/g, "$1 ").trim();
}

export function isPrivateIpv4(ip: string): boolean {
  const n = ipToInt(ip);
  const a = (n >>> 24) & 0xff;
  const b = (n >>> 16) & 0xff;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export type IpKind = "public" | "private" | "loopback" | "link-local" | "multicast" | "reserved";

export function classifyIpv4(ip: string): IpKind {
  const n = ipToInt(ip);
  const a = (n >>> 24) & 0xff;
  const b = (n >>> 16) & 0xff;
  if (isPrivateIpv4(ip)) return "private";
  if (a === 127) return "loopback";
  if (a === 169 && b === 254) return "link-local";
  if (a >= 224 && a <= 239) return "multicast";
  if (a === 0 || a >= 240) return "reserved";
  return "public";
}

export interface RandomIpOptions {
  count?: number;
  kind?: "public" | "private" | "any";
  /** Inclusive custom range as IPv4 bounds; overrides kind when set. */
  from?: string;
  to?: string;
  /** Generate unique addresses (default true). */
  unique?: boolean;
}

/** Inclusive RFC1918 integer ranges [min, max]. */
const PRIVATE_RANGES: [number, number][] = [
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
];
const PRIVATE_SPAN = PRIVATE_RANGES.reduce((n, [a, b]) => n + (b - a + 1), 0);

function randomPrivateIpv4(): string {
  let r = randomUint32() % PRIVATE_SPAN;
  for (const [a, b] of PRIVATE_RANGES) {
    const span = b - a + 1;
    if (r < span) return intToIp(a + r);
    r -= span;
  }
  return "10.0.0.0"; // unreachable
}

export function randomIpv4(options: RandomIpOptions = {}): string[] {
  const { count = 10, kind = "any", from, to, unique = true } = options;
  if (count < 1 || count > 10000) throw new Error("count must be 1..10000");
  const list: string[] = [];
  const seen = new Set<string>();

  let min = 0;
  let max = 0xffffffff;
  if (from || to) {
    if (!from || !to) throw new Error("both from and to are required for a custom range");
    if (!isValidIpv4(from) || !isValidIpv4(to)) throw new Error("invalid custom range");
    min = ipToInt(from);
    max = ipToInt(to);
    if (min > max) [min, max] = [max, min];
  }

  // Private is only ~0.4% of the IPv4 space — sample the RFC1918 ranges
  // directly instead of rejection-sampling the whole 32-bit space.
  const pick = (): string => {
    if (from) {
      const span = max - min + 1;
      return intToIp(min + (span <= 0xffffffff ? randomUint32() % span : randomUint32()));
    }
    if (kind === "private") return randomPrivateIpv4();
    if (kind === "public") {
      // Rejection sampling is fine here — public covers ~87% of the space.
      for (let i = 0; i < 64; i++) {
        const ip = intToIp(randomUint32());
        if (classifyIpv4(ip) === "public") return ip;
      }
      throw new Error("failed to sample a public address");
    }
    return intToIp(randomUint32());
  };

  const attemptsLimit = unique ? Math.max(count * 50, 250) : count;
  let attempts = 0;
  while (list.length < count && attempts < attemptsLimit) {
    attempts++;
    const ip = pick();
    if (unique) {
      if (seen.has(ip)) continue;
      seen.add(ip);
    }
    list.push(ip);
  }
  if (list.length < count) {
    throw new Error(`Could only generate ${list.length} unique addresses for the given constraints`);
  }
  return list;
}

function randomUint32(): number {
  // crypto when available (browsers + modern Node), fallback otherwise.
  const g = globalThis as { crypto?: { getRandomValues?: (a: Uint32Array) => Uint32Array } };
  if (g.crypto?.getRandomValues) {
    return g.crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
