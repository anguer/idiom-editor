import CryptoJS from 'crypto-js';

export function md5 (word) {
  if (typeof word !== 'string') { return word; }
  return CryptoJS.MD5(word).toString();
}
