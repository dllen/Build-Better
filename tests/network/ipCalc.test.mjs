import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidIpv4,
  ipToInt,
  intToIp,
  isValidIpv6,
  ipv6ToBigint,
  bigintToIpv6,
  calcSubnet,
  classifyIpv4,
  randomIpv4,
  toBinary,
} from "../../src/lib/network/ipCalc.ts";

test("isValidIpv4 accepts dotted quads and rejects junk", () => {
  assert.equal(isValidIpv4("192.168.1.1"), true);
  assert.equal(isValidIpv4("0.0.0.0"), true);
  assert.equal(isValidIpv4("255.255.255.255"), true);
  assert.equal(isValidIpv4("256.1.1.1"), false);
  assert.equal(isValidIpv4("1.2.3"), false);
  assert.equal(isValidIpv4("1.2.3.4.5"), false);
  assert.equal(isValidIpv4("01.2.3.4"), false); // no leading zeros
});

test("ipToInt / intToIp round-trip", () => {
  assert.equal(ipToInt("0.0.0.0"), 0);
  assert.equal(ipToInt("255.255.255.255"), 4294967295);
  assert.equal(ipToInt("192.168.1.1"), 3232235777);
  assert.equal(intToIp(3232235777), "192.168.1.1");
  assert.equal(intToIp(ipToInt("8.8.8.8")), "8.8.8.8");
  assert.throws(() => intToIp(-1));
  assert.throws(() => intToIp(2 ** 32));
  assert.throws(() => ipToInt("300.1.1.1"));
});

test("isValidIpv6 handles full and compressed forms", () => {
  assert.equal(isValidIpv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334"), true);
  assert.equal(isValidIpv6("2001:db8::1"), true);
  assert.equal(isValidIpv6("::1"), true);
  assert.equal(isValidIpv6("::"), true);
  assert.equal(isValidIpv6("fe80::1%eth0"), false);
  assert.equal(isValidIpv6("2001:db8:::1"), false);
  assert.equal(isValidIpv6("hello"), false);
});

test("ipv6ToBigint / bigintToIpv6 round-trip with compression", () => {
  const v = ipv6ToBigint("2001:db8::1");
  assert.equal(v, 42540766411282592856903984951653826561n);
  assert.equal(bigintToIpv6(v), "2001:db8::1");
  assert.equal(bigintToIpv6(1n), "::1");
  assert.equal(bigintToIpv6(0n), "::");
  assert.equal(bigintToIpv6(ipv6ToBigint("::ffff:192.168.1.1")), "::ffff:c0a8:101");
  assert.throws(() => bigintToIpv6(-1n));
  assert.throws(() => bigintToIpv6(1n << 128n));
  assert.throws(() => ipv6ToBigint("not-an-ip"));
});

test("calcSubnet from CIDR", () => {
  const s = calcSubnet("192.168.1.13/24");
  assert.equal(s.prefix, 24);
  assert.equal(s.mask, "255.255.255.0");
  assert.equal(s.network, "192.168.1.0");
  assert.equal(s.broadcast, "192.168.1.255");
  assert.equal(s.firstHost, "192.168.1.1");
  assert.equal(s.lastHost, "192.168.1.254");
  assert.equal(s.usableHosts, 254);
  assert.equal(s.totalHosts, 256);
  assert.equal(s.isPrivate, true);
  assert.equal(s.wildcard, "0.0.0.255");
});

test("calcSubnet from netmask string", () => {
  const s = calcSubnet("10.0.0.7 255.255.0.0");
  assert.equal(s.prefix, 16);
  assert.equal(s.network, "10.0.0.0");
  assert.equal(s.broadcast, "10.0.255.255");
  assert.equal(s.usableHosts, 65534);
});

test("calcSubnet edge cases: /31 /32 /0 and non-contiguous mask", () => {
  const p31 = calcSubnet("10.0.0.0/31");
  assert.equal(p31.usableHosts, 2);
  assert.equal(p31.firstHost, "10.0.0.0");
  const p32 = calcSubnet("10.0.0.5/32");
  assert.equal(p32.usableHosts, 1);
  const p0 = calcSubnet("0.0.0.0/0");
  assert.equal(p0.network, "0.0.0.0");
  assert.equal(p0.broadcast, "255.255.255.255");
  assert.throws(() => calcSubnet("10.0.0.1 255.0.255.0"));
  assert.throws(() => calcSubnet("10.0.0.1/33"));
});

test("classifyIpv4", () => {
  assert.equal(classifyIpv4("10.1.2.3"), "private");
  assert.equal(classifyIpv4("172.16.0.1"), "private");
  assert.equal(classifyIpv4("172.32.0.1"), "public");
  assert.equal(classifyIpv4("192.168.0.1"), "private");
  assert.equal(classifyIpv4("8.8.8.8"), "public");
  assert.equal(classifyIpv4("127.0.0.1"), "loopback");
  assert.equal(classifyIpv4("169.254.1.1"), "link-local");
  assert.equal(classifyIpv4("224.0.0.1"), "multicast");
});

test("toBinary formats 32 bits in octet groups", () => {
  assert.equal(toBinary(0), "00000000 00000000 00000000 00000000");
  assert.equal(toBinary(ipToInt("255.255.255.0")), "11111111 11111111 11111111 00000000");
});

test("randomIpv4 respects count, kind and custom range", () => {
  const any = randomIpv4({ count: 20, kind: "any" });
  assert.equal(any.length, 20);
  assert.equal(new Set(any).size, 20); // unique by default

  const priv = randomIpv4({ count: 15, kind: "private" });
  priv.forEach((ip) => assert.equal(classifyIpv4(ip), "private"));

  const ranged = randomIpv4({ count: 10, from: "10.0.0.1", to: "10.0.0.50" });
  ranged.forEach((ip) => {
    const n = ipToInt(ip);
    assert.ok(n >= ipToInt("10.0.0.1") && n <= ipToInt("10.0.0.50"));
  });

  assert.throws(() => randomIpv4({ count: 0 }));
  assert.throws(() => randomIpv4({ count: 5, from: "10.0.0.1" }));
  // Unique set smaller than count must throw instead of looping forever.
  assert.throws(() => randomIpv4({ count: 5, from: "10.0.0.1", to: "10.0.0.2", unique: true }));
});
