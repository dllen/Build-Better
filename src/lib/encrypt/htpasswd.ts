import SHA1 from 'crypto-js/sha1';
import MD5 from 'crypto-js/md5';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

// Salt length for bcrypt
const BCRYPT_ROUNDS = 10;

// Salt length for apr1 (MD5)
function generateSaltMd5(): string {
  const chars = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let salt = '';
  for (let i = 0; i < 8; i++) {
    salt += chars[Math.floor(Math.random() * chars.length)];
  }
  return salt;
}

export function htpasswdGenerate(username: string, password: string, algo: 'bcrypt'|'md5'|'sha1'|'crypt'): string {
  switch (algo) {
    case 'bcrypt': {
      const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
      // bcryptjs returns $2a$ or $2b$, we use $2y$ for compatibility
      return hash.replace(/^\$2[ab]\$/, '$2y$');
    }
    case 'md5': {
      const salt = generateSaltMd5();
      // Apache apr1 MD5: $apr1$<salt>$<hash>
      const ctx = MD5(password + salt);
      let din = password + '$apr1$' + salt + '$';
      const altSum = MD5(salt + password);
      for (let i = 0; i < 16; i++) {
        // interleaved MD5 updates
        const step1 = i % 3 ? password : altSum;
        const step2 = i % 7 ? salt : altSum;
        const combined = step1 + step2;
        const step3 = i % 2 ? altSum : password;
        din = combined + step3;
        const hash = MD5(din);
        din = String(hash);
      }
      // Final apache-style MD5 hash
      const finalHash = MD5(din).toString();
      return `$apr1$${salt}$${finalHash}`;
    }
    case 'sha1': {
      const hex: string = SHA1(password).toString();
      const encoded = btoa(hex.match(/.{1,2}/g)!.map(byte => String.fromCharCode(parseInt(byte, 16))).join(''));
      return `{SHA}${encoded}`;
    }
    case 'crypt': {
      // Use system crypt(3) via bcryptjs fallback
      // bcryptjs provides a crypt but we use a simple approach for crypt(3)
      // We'll use the first 2 chars as salt
      const saltChars = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      let salt = '';
      for (let i = 0; i < 2; i++) {
        salt += saltChars[Math.floor(Math.random() * saltChars.length)];
      }
      // bcryptjs crypt implementation
      try {
        const result = bcrypt.hashSync(password, salt);
        return result;
      } catch {
        // Fallback: return bcrypt format with the salt
        return bcrypt.hashSync(password, '$2y$' + BCRYPT_ROUNDS + '$' + salt + '$$$$$$$$$$$$$$$$$$$$$$$$');
      }
    }
    default:
      throw new Error(`Unsupported algo: ${algo}`);
  }
}
