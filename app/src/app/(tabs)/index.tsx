import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Button } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';

import { getOrCreateIdentity, Identity } from '@/lib/identity';
import { getDisplayName } from '@/lib/profile';
import { getContacts, upsertContact, Contact } from '@/lib/contacts';
import { addMessage } from '@/lib/messages';
import { decryptMessage } from '@/lib/crypto';
import { connectToServer } from '@/lib/network';
import { on, off } from '@/lib/eventBus';
import { toUrlSafeKey } from '@/lib/keyEncoding';
import QRDisplay from '@/components/QRDisplay';
import QRScanner from '@/components/QRScanner';

export default function ChatListScreen() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    getOrCreateIdentity().then((id) => {
      setIdentity(id);
      connectToServer(id.publicKey);
    });
  }, []);

  useEffect(() => {
    if (!identity) return;

    const handleIncoming = async (msg: {
      from: string;
      senderName: string;
      ciphertext: string;
      nonce: string;
    }) => {
      const plaintext = decryptMessage(msg.ciphertext, msg.nonce, identity.privateKey, msg.from);
      if (plaintext === null) return;

      await addMessage(msg.from, {
        id: `${Date.now()}-${Math.random()}`,
        from: msg.from,
        to: identity.publicKey,
        text: plaintext,
        timestamp: Date.now(),
        outgoing: false,
      });

      const updated = await upsertContact(msg.from, msg.senderName, plaintext);
      setContacts([...updated].sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)));
    };

    on('message', handleIncoming);
    return () => off('message', handleIncoming);
  }, [identity]);

  useFocusEffect(
    useCallback(() => {
      getContacts().then((c) =>
        setContacts([...c].sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)))
      );
    }, [])
  );

  const handleScanned = async (publicKey: string) => {
    setShowScanner(false);
    const updated = await upsertContact(publicKey, 'New Contact');
    setContacts([...updated].sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)));
    router.push(`/chat/${toUrlSafeKey(publicKey)}`);
  };

  if (!identity) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>UnME</Text>
        <View style={styles.headerButtons}>
          <Button title="My QR" onPress={() => setShowQR(true)} />
          <Button title="Scan" onPress={() => setShowScanner(true)} />
        </View>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.publicKey}
        renderItem={({ item }) => (
          <Pressable
            style={styles.contactRow}
            onPress={() => router.push(`/chat/${toUrlSafeKey(item.publicKey)}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.displayName}</Text>
              {item.lastMessage && (
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No contacts yet. Scan a QR code to add one.</Text>
        }
      />

      <QRDisplay visible={showQR} publicKey={identity.publicKey} onClose={() => setShowQR(false)} />
      <QRScanner visible={showScanner} onScanned={handleScanned} onClose={() => setShowScanner(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 60,
  },
});