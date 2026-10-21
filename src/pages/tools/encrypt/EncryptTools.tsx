import React from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, Shield, Key, Hash, Fingerprint, KeyRound, Type,
  CheckCircle, Code, Languages, Globe, Radio, Router,
  Archive, FileLock, Database, EyeOff, Mail,
} from 'lucide-react';

const TOOLS = [
  { path: '/encrypt/aes-des', icon: Lock, title: 'AES / DES', desc: 'Symmetric encryption: AES (CBC/ECB), DES, 3DES.' },
  { path: '/encrypt/sm4', icon: Shield, title: 'SM4', desc: 'Chinese national standard block cipher.' },
  { path: '/encrypt/rsa', icon: Key, title: 'RSA', desc: 'RSA encrypt/decrypt/sign/verify.' },
  { path: '/encrypt/md2-md4', icon: Hash, title: 'MD2 / MD4', desc: 'Legacy hash algorithms.' },
  { path: '/encrypt/keccak', icon: Fingerprint, title: 'Keccak / SHA3', desc: 'Keccak, SHA3, and Shake hash functions.' },
  { path: '/encrypt/sm3', icon: Hash, title: 'SM3', desc: 'Chinese national standard hash.' },
  { path: '/encrypt/scrypt', icon: KeyRound, title: 'Scrypt', desc: 'Memory-hard KDF hash and verify.' },
  { path: '/encrypt/base32', icon: Type, title: 'Base32', desc: 'RFC 4648 Base32 encode/decode.' },
  { path: '/encrypt/crc', icon: CheckCircle, title: 'CRC', desc: 'CRC-16 and CRC-32 checksums.' },
  { path: '/encrypt/escape', icon: Code, title: 'Escape', desc: 'JavaScript escape()/unescape().' },
  { path: '/encrypt/utf8', icon: Languages, title: 'UTF-8', desc: 'UTF-8 bytes ↔ text.' },
  { path: '/encrypt/punycode', icon: Globe, title: 'Punycode', desc: 'RFC 3492 IDN encode/decode.' },
  { path: '/encrypt/morse', icon: Radio, title: 'Morse', desc: 'Morse code ↔ text.' },
  { path: '/encrypt/type7', icon: Router, title: 'Type 7', desc: 'Cisco Type 7 password.' },
  { path: '/encrypt/gzip', icon: Archive, title: 'Gzip', desc: 'Gzip compress/decompress.' },
  { path: '/encrypt/htpasswd', icon: FileLock, title: 'htpasswd', desc: 'Apache htpasswd generator.' },
  { path: '/encrypt/db-passwords', icon: Database, title: 'DB Passwords', desc: 'MySQL/PostgreSQL/MariaDB hashes.' },
  { path: '/encrypt/js-obfuscator', icon: EyeOff, title: 'JS Obfuscator', desc: 'JavaScript string obfuscation.' },
  { path: '/encrypt/email-encode', icon: Mail, title: 'Email Encode', desc: 'HTML entity obfuscation for emails.' },
];

export default function EncryptTools() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Encryption & Encoding Suite</h1>
        <p className="text-gray-600">Client-side encryption, hashing, encoding, and password tools.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.path} to={tool.path}
              className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-300 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-gray-900">{tool.title}</h3>
              </div>
              <p className="text-sm text-gray-500">{tool.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}