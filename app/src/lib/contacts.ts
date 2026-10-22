import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = 'unme_contacts';

export interface Contact {
  publicKey: string;
  displayName: string;
  lastMessage?: string;
  lastMessageAt?: number;
}

export async function getContacts(): Promise<Contact[]> {
  const stored = await AsyncStorage.getItem(CONTACTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export async function saveContacts(contacts: Contact[]): Promise<void> {
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

// Adds a contact if new, or updates their display name / last message if they already exist
export async function upsertContact(
  publicKey: string,
  displayName: string,
  lastMessage?: string
): Promise<Contact[]> {
  const contacts = await getContacts();
  const existingIndex = contacts.findIndex((c) => c.publicKey === publicKey);

  const updatedContact: Contact = {
    publicKey,
    displayName,
    lastMessage: lastMessage ?? contacts[existingIndex]?.lastMessage,
    lastMessageAt: lastMessage ? Date.now() : contacts[existingIndex]?.lastMessageAt,
  };

  if (existingIndex >= 0) {
    contacts[existingIndex] = updatedContact;
  } else {
    contacts.push(updatedContact);
  }

  await saveContacts(contacts);
  return contacts;
}