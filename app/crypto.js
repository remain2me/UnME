import * as SecureStore from 'expo-secure-store';
import nacl from 'tweetnacl';
import { decode as decodeBase64, encode as encodeBase64 } from 'tweetnacl-util';

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
  const msg = decodeBase64(encodeBase64(text));
  const box = nacl.box(msg, nonce, decodeBase64(herPublic), decodeBase64(mySecret));
  return JSON.stringify({ c: encodeBase64(box), n: encodeBase64(nonce) });
};

export const decrypt = (encryptedStr, mySecret, herPublic) => {
  try {
    const data = JSON.parse(encryptedStr);
    const box = decodeBase64(data.c);
    const nonce = decodeBase64(data.n);
    const opened = nacl.box.open(box, nonce, decodeBase64(herPublic), decodeBase64(mySecret));
    return opened ? encodeBase64(opened) : "🔒 Encrypted";
  } catch (e) { return "🔒 Encrypted"; }
};