import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { limitToLast, onValue, push, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { decrypt, encrypt, getMyKeys } from './crypto';
import { database } from './firebaseConfig';

export default function App() {
  const [myKeys, setMyKeys] = useState(null);
  const [partnerPublicKey, setPartnerPublicKey] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isSetup, setIsSetup] = useState(true);

  useEffect(() => {
    async function init() {
      const keys = await getMyKeys();
      setMyKeys(keys);
    }
    init();
  }, []);

  useEffect(() => {
    if (!partnerPublicKey || !myKeys) return;
    const chatRef = query(ref(database, 'messages/'), limitToLast(50));
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMsgs = Object.values(data).map(msg => {
          const decryptedText = decrypt(msg.data, myKeys.secret, partnerPublicKey);
          return { id: msg.timestamp, text: decryptedText, sender: msg.sender };
        });
        setChat(loadedMsgs.sort((a, b) => a.id - b.id));
      }
    });
    return () => unsubscribe();
  }, [partnerPublicKey, myKeys]);

  const sendMessage = () => {
    if (!message.trim() || !partnerPublicKey) return;
    const encryptedData = encrypt(message, myKeys.secret, partnerPublicKey);
    push(ref(database, 'messages/'), {
      data: encryptedData,
      sender: myKeys.publicK,
      timestamp: Date.now()
    });
    setMessage('');
  };

  const copyToClipboard = async () => {
    if (myKeys?.publicK) {
      await Clipboard.setStringAsync(myKeys.publicK);
      Alert.alert("Success", "Your Public ID has been copied to clipboard.");
    } else {
      Alert.alert("Error", "Identity not yet generated. Please wait a moment.");
    }
  };

  if (isSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.setupContainer}>
          <Text style={styles.title}>UnME</Text>
          <Text style={styles.subtitle}>END-TO-END ENCRYPTED VAULT</Text>
          <View style={styles.setupCard}>
            <Text style={styles.label}>YOUR PUBLIC IDENTITY</Text>
            <TouchableOpacity style={styles.btn} onPress={copyToClipboard}>
              <Text style={styles.btnText}>COPY MY ID</Text>
            </TouchableOpacity>
            <Text style={[styles.label, { marginTop: 30 }]}>PARTNER'S PUBLIC IDENTITY</Text>
            <TextInput 
              style={styles.inputBox}
              placeholder="Paste partner's key here..." 
              placeholderTextColor="#444"
              onChangeText={setPartnerPublicKey}
              value={partnerPublicKey}
            />
            {partnerPublicKey.length > 20 && (
              <TouchableOpacity style={styles.mainBtn} onPress={() => setIsSetup(false)}>
                <Text style={styles.mainBtnText}>ESTABLISH SECURE CHANNEL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SECURE SESSION</Text>
        <TouchableOpacity onPress={() => setIsSetup(true)}>
          <Text style={styles.resetText}>LOGOUT</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={chat}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === myKeys.publicK ? styles.me : styles.her]}>
            <Text style={styles.msgText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 10 }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.footer}>
          <TextInput 
            style={styles.chatInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type encrypted message..."
            placeholderTextColor="#444"
          />
          <TouchableOpacity onPress={sendMessage}>
            <Text style={styles.sendBtn}>SEND</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  setupContainer: { flex: 1, justifyContent: 'center', padding: 30 },
  title: { color: '#fff', fontSize: 42, fontWeight: '900', textAlign: 'center', letterSpacing: 8 },
  subtitle: { color: '#444', textAlign: 'center', marginBottom: 50, letterSpacing: 2, fontSize: 10 },
  setupCard: { backgroundColor: '#050505', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#111' },
  label: { color: '#888', fontSize: 10, marginBottom: 8, fontWeight: 'bold' },
  btn: { backgroundColor: '#111', padding: 15, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  inputBox: { backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 5, borderWidth: 1, borderColor: '#333' },
  mainBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 5, marginTop: 30, alignItems: 'center' },
  mainBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  header: { padding: 20, borderBottomWidth: 1, borderColor: '#111', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 40 },
  headerTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 4 },
  resetText: { color: '#ff4444', fontSize: 10, fontWeight: 'bold' },
  bubble: { padding: 12, borderRadius: 15, marginVertical: 4, maxWidth: '85%' },
  me: { alignSelf: 'flex-end', backgroundColor: '#1a1a1a', borderBottomRightRadius: 2, borderWidth: 1, borderColor: '#333' },
  her: { alignSelf: 'flex-start', backgroundColor: '#000', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#222' },
  msgText: { color: '#fff', fontSize: 15 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#111', alignItems: 'center', backgroundColor: '#000' },
  chatInput: { flex: 1, color: '#fff', backgroundColor: '#080808', padding: 12, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: '#222' },
  sendBtn: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 }
});