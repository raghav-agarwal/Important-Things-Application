import CryptoJS from "crypto-js";

/**
 * Faithful port of services/AES.java + firebase/services/AESHelper.java
 *
 * Original Java scheme:
 *   key = SHA-1(secret.getBytes("UTF-8"))   -> 20 bytes
 *   key = Arrays.copyOf(key, 16)            -> truncated to first 16 bytes (AES-128)
 *   Cipher: AES/ECB/PKCS5Padding
 *   hide(): Base64( AES_ECB_Encrypt(plaintext, key) )
 *   unHide(): AES_ECB_Decrypt( Base64_decode(ciphertext), key )
 *
 * NOTE: This is intentionally kept identical to the original app (by request),
 * including the fact that the "secret" is not really secret (see README for
 * details on what this means and how to upgrade it later).
 */

function deriveKey(secret) {
  const hash = CryptoJS.SHA1(secret); // WordArray, 5 words / 20 bytes
  // Arrays.copyOf(key, 16) -> keep first 4 words (16 bytes), truncating the 5th
  const truncatedWords = hash.words.slice(0, 4);
  return CryptoJS.lib.WordArray.create(truncatedWords, 16);
}

export function hide(plainText, secret) {
  if (plainText === null || plainText === undefined) plainText = "";
  const key = deriveKey(secret);
  const encrypted = CryptoJS.AES.encrypt(String(plainText), key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString(); // base64 ciphertext, matches Base64.getEncoder()
}

export function unHide(cipherText, secret) {
  if (!cipherText) return "";
  try {
    const key = deriveKey(secret);
    const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    console.warn("Error while un-hiding:", e);
    return "";
  }
}
