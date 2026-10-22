import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PRIVATE_KEY_STORAGE_KEY = 'unme_private_key';

export interface Identity {
  publicKey: string;
  privateKey: string;
}

// Storage that works on both native (SecureStore) and web (localStorage)
async function getStoredKey(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  }
  return SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
}

async function setStoredKey(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, value);
}

function generateKeypair(): Identity {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey),
  };
}

export async function getOrCreateIdentity(): Promise<Identity> {
  const storedPrivateKey = await getStoredKey();

  if (storedPrivateKey) {
    const secretKey = decodeBase64(storedPrivateKey);
    const keypair = nacl.box.keyPair.fromSecretKey(secretKey);
    return {
      publicKey: encodeBase64(keypair.publicKey),
      privateKey: storedPrivateKey,
    };
  }

  const newIdentity = generateKeypair();
  await setStoredKey(newIdentity.privateKey);
  return newIdentity;
}