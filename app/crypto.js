import * as Random from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { decodeBase64, decodeUTF8, encodeBase64, encodeUTF8 } from 'tweetnacl-util';

// This fixes the "No PRNG" error for good
nacl.setPRNG((x, n) => {
  const b = Random.getRandomBytes(n);
  for (let i = 0; i < n; i++) x[i] = b[i];
});

export const getMyKeys = async () => {
  let secret = await SecureStore.getItemAsync('mySecret');
  let publicK = await SecureStore.getItemAsync('myPublic');

  if (!secret) {
    const keyPair = nacl.box.keyPair();
    secret = encodeBase64(keyPair.secretKey);
    publicK = encodeBase64(keyPair.publicKey);
    await SecureStore.setItemAsync('mySecret', secret);
    await SecureStore.setItemAsync('myPublic', publicK);
  }
  return { secret, publicK };
};

export const encrypt = (text, mySecret, herPublic) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const msg = decodeUTF8(text); // Changed to UTF8
  const box = nacl.box(msg, nonce, decodeBase64(herPublic), decodeBase64(mySecret));
  return JSON.stringify({ c: encodeBase64(box), n: encodeBase64(nonce) });
};

export const decrypt = (encryptedStr, mySecret, herPublic) => {
  try {
    const data = JSON.parse(encryptedStr);
    const box = decodeBase64(data.c);
    const nonce = decodeBase64(data.n);
    const opened = nacl.box.open(box, nonce, decodeBase64(herPublic), decodeBase64(mySecret));
    return opened ? encodeUTF8(opened) : "🔒 Encrypted"; // Changed to UTF8
  } catch (e) { return "🔒 Encrypted"; }
};