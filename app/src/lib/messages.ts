import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredMessage {
  id: string;
  from: string;       // sender's public key
  to: string;          // recipient's public key
  text: string;
  timestamp: number;
  outgoing: boolean;   // true if this device sent it
}

function keyFor(contactPublicKey: string): string {
  return `unme_messages_${contactPublicKey}`;
}

export async function getMessages(contactPublicKey: string): Promise<StoredMessage[]> {
  const stored = await AsyncStorage.getItem(keyFor(contactPublicKey));
  return stored ? JSON.parse(stored) : [];
}

export async function addMessage(
  contactPublicKey: string,
  message: StoredMessage
): Promise<StoredMessage[]> {
  const messages = await getMessages(contactPublicKey);
  messages.push(message);
  await AsyncStorage.setItem(keyFor(contactPublicKey), JSON.stringify(messages));
  return messages;
}