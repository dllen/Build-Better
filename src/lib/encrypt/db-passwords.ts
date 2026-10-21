import SHA1 from 'crypto-js/sha1';
import MD5 from 'crypto-js/md5';

function wordToHex(word: number): string {
  return (word >>> 0).toString(16).padStart(8, '0');
}

function _hexToWord(hex: string): number {
  return parseInt(hex, 16) >>> 0;
}

function wordsToHex(words: number[]): string {
  return words.map(w => wordToHex(w)).join('');
}

// MySQL 4.1+ password: SHA1(SHA1(password)) with uppercase hex, prefixed with *
export function mysqlPassword(password: string): string {
  const sha1a = SHA1(password);
  const sha1aWords = sha1a.words as number[];
  const sha1aHex = wordsToHex(sha1aWords);
  const sha1b = SHA1(sha1aHex);
  return `*${sha1b.toString().toUpperCase()}`;
}

// PostgreSQL MD5: MD5(password + username), prefixed with "md5"
export function postgresMd5(password: string, username: string): string {
  const combined = password + username;
  return `md5${MD5(combined).toString()}`;
}

// MariaDB < 10.1: SHA1(SHA1(password)) uppercase, prefixed with *
// Same as MySQL old format, but we use the same implementation
export function mariadbPassword(password: string): string {
  const sha1a = SHA1(password);
  const sha1aWords = sha1a.words as number[];
  const sha1aHex = wordsToHex(sha1aWords);
  const sha1b = SHA1(sha1aHex);
  return `*${sha1b.toString().toUpperCase()}`;
}
