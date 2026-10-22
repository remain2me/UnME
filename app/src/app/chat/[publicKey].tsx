import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';

import { getOrCreateIdentity, Identity } from '@/lib/identity';
import { getDisplayName } from '@/lib/profile';
import { getContacts, upsertContact } from '@/lib/contacts';
import { getMessages, addMessage, StoredMessage } from '@/lib/messages';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { sendEncrypted } from '@/lib/network';
import { on, off } from '@/lib/eventBus';
import { fromUrlSafeKey } from '@/lib/keyEncoding';

export default function ChatScreen() {
  const { publicKey } = useLocalSearchParams<{ publicKey: string }>();
  const contactKey = fromUrlSafeKey(publicKey);

  const [identity, setIdentity] = useState<Identity | null>(null);
  const [contactName, setContactName] = useState('');
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getOrCreateIdentity().then(setIdentity);
  }, []);

  useFocusEffect(
    useCallback(() => {
      getMessages(contactKey).then(setMessages);
      getContacts().then((contacts) => {
        const contact = contacts.find((c) => c.publicKey === contactKey);
        if (contact) setContactName(contact.displayName);
      });
    }, [contactKey])
  );

  useEffect(() => {
    if (!identity) return;

    const handleIncoming = async (msg: {
      from: string;
      senderName: string;
      ciphertext: string;
      nonce: string;
    }) => {
      if (msg.from !== contactKey) return;

      const plaintext = decryptMessage(msg.ciphertext, msg.nonce, identity.privateKey, msg.from);
      if (plaintext === null) return;

      const updated = await addMessage(contactKey, {
        id: `${Date.now()}-${Math.random()}`,
        from: msg.from,
        to: identity.publicKey,
        text: plaintext,
        timestamp: Date.now(),
        outgoing: false,
      });
      setMessages(updated);
    };

    on('message', handleIncoming);
    return () => off('message', handleIncoming);
  }, [identity, contactKey]);

  const handleSend = async () => {
    if (!identity || !draft.trim()) return;

    const myName = await getDisplayName();
    const { ciphertext, nonce } = encryptMessage(draft, identity.privateKey, contactKey);
    sendEncrypted(identity.publicKey, myName, contactKey, ciphertext, nonce);

    const updated = await addMessage(contactKey, {
      id: `${Date.now()}-${Math.random()}`,
      from: identity.publicKey,
      to: contactKey,
      text: draft,
      timestamp: Date.now(),
      outgoing: true,
    });
    setMessages(updated);
    await upsertContact(contactKey, contactName || 'New Contact', draft);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={{ title: contactName || 'Chat', headerStyle: { backgroundColor: '#000' }, headerTintColor: '#fff' }} />

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.outgoing ? styles.bubbleOut : styles.bubbleIn]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message..."
          placeholderTextColor="#888"
        />
        <Pressable style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  messageList: { padding: 16, gap: 8 },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 16, marginBottom: 4 },
  bubbleOut: { alignSelf: 'flex-end', backgroundColor: '#2563eb' },
  bubbleIn: { alignSelf: 'flex-start', backgroundColor: '#222' },
  bubbleText: { color: '#fff' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#222' },
  input: { flex: 1, borderWidth: 1, borderColor: '#444', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff' },
  sendButton: { backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 20, justifyContent: 'center' },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});