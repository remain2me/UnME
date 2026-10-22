import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// Encrypts a plaintext message so only the intended recipient can read it
export function encryptMessage(
  plaintext: string,
  myPrivateKeyB64: string,
  theirPublicKeyB64: string
): { ciphertext: string; nonce: string } {
  const myPrivateKey = decodeBase64(myPrivateKeyB64);
  const theirPublicKey = decodeBase64(theirPublicKeyB64);
  const messageBytes = new TextEncoder().encode(plaintext);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const encrypted = nacl.box(messageBytes, nonce, theirPublicKey, myPrivateKey);

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

// Decrypts a message that was encrypted for us
export function decryptMessage(
  ciphertextB64: string,
  nonceB64: string,
  myPrivateKeyB64: string,
  theirPublicKeyB64: string
): string | null {
  const myPrivateKey = decodeBase64(myPrivateKeyB64);
  const theirPublicKey = decodeBase64(theirPublicKeyB64);
  const ciphertext = decodeBase64(ciphertextB64);
  const nonce = decodeBase64(nonceB64);

  const decrypted = nacl.box.open(ciphertext, nonce, theirPublicKey, myPrivateKey);

  if (!decrypted) {
    return null; // decryption failed — wrong keys or tampered data
  }

  return new TextDecoder().decode(decrypted);
}