import * as Clipboard from 'expo-clipboard';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { limitToLast, onValue, push, query, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { decrypt, encrypt, getMyKeys } from './crypto';
import { database } from './firebaseConfig';

export default function App() {
  const [myKeys, setMyKeys] = useState(null);
  const [contactName, setContactName] = useState(''); // Name you assign to the other person
  const [peerPublicKey, setPeerPublicKey] = useState('');
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
    if (!peerPublicKey || !myKeys) return;
    const chatRef = query(ref(database, 'messages/'), limitToLast(50));
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMsgs = Object.values(data).map(msg => {
          const decryptedText = decrypt(msg.data, myKeys.secret, peerPublicKey);
          return {
            id: msg.timestamp,
            text: decryptedText,
            sender: msg.sender,
            // Logic: If sender is me, show 'Me'. If not, show the name I assigned them.
            display: msg.sender === myKeys.publicK ? 'Me' : contactName 
          };
        });
        setChat(loadedMsgs.sort((a, b) => a.id - b.id));
      }
    });
    return () => unsubscribe();
  }, [peerPublicKey, myKeys, contactName]);

  const sendMessage = () => {
    if (!message.trim() || !peerPublicKey || !myKeys?.secret) {
      Alert.alert("Handshake Incomplete", "Ensure peer key is set and message is not empty.");
      return;
    }

    const encryptedData = encrypt(message, myKeys.secret, peerPublicKey);

    push(ref(database, 'messages/'), {
      data: encryptedData,
      sender: myKeys.publicK,
      timestamp: Date.now()
    });
    
    setMessage('');
  };

  if (isSetup) {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" backgroundColor="#000" />
        <View style={styles.setupContainer}>
          <Text style={styles.title}>UnME</Text>
          <Text style={styles.subtitle}>END-TO-END ENCRYPTED</Text>

          <View style={styles.setupCard}>
            <Text style={styles.label}>1. YOUR UNIQUE KEY</Text>
            <TouchableOpacity 
              style={styles.btn} 
              onPress={() => {
                if(myKeys?.publicK) {
                  Clipboard.setStringAsync(myKeys.publicK);
                  Alert.alert("System", "Key copied to clipboard.");
                } else {
                  Alert.alert("System", "Generating keys... please wait.");
                }
              }}
            >
              <Text style={styles.btnText}>COPY MY KEY</Text>
            </TouchableOpacity>

            <Text style={[styles.label, { marginTop: 25 }]}>2. ASSIGN CONTACT NAME</Text>
            <TextInput 
              style={styles.inputBox}
              placeholder="Display name for this peer..." 
              placeholderTextColor="#444"
              onChangeText={setContactName}
              value={contactName}
            />

            <Text style={[styles.label, { marginTop: 20 }]}>3. PASTE PEER KEY</Text>
            <TextInput 
              style={styles.inputBox}
              placeholder="Paste public key here..." 
              placeholderTextColor="#444"
              onChangeText={setPeerPublicKey}
              value={peerPublicKey}
            />

            {peerPublicKey.length > 20 && contactName.length > 0 && (
              <TouchableOpacity style={styles.mainBtn} onPress={() => setIsSetup(false)}>
                <Text style={styles.mainBtnText}>INITIALIZE CHANNEL</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent={false} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>UnME</Text>
        <TouchableOpacity onPress={() => setIsSetup(true)}>
          <Text style={styles.resetText}>SESSION SETTINGS</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chat}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[
            styles.bubble, 
            item.display === 'Me' ? styles.me : styles.her
          ]}>
            <Text style={styles.nameLabel}>{item.display}</Text>
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
            placeholder="Write a message..."
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
  subtitle: { color: '#444', textAlign: 'center', marginBottom: 50, letterSpacing: 2 },
  setupCard: { backgroundColor: '#050505', padding: 20, borderRadius: 10, borderWidth: 1, borderColor: '#111' },
  label: { color: '#888', fontSize: 10, marginBottom: 8 },
  btn: { backgroundColor: '#111', padding: 15, borderRadius: 5, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  inputBox: { backgroundColor: '#000', color: '#fff', padding: 15, borderRadius: 5, borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  mainBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 5, marginTop: 30, alignItems: 'center' },
  mainBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  header: { 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10, 
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1, 
    borderColor: '#111', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#000'
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 4 },
  resetText: { color: '#444', fontSize: 10 },
  bubble: { padding: 12, borderRadius: 12, marginVertical: 4, maxWidth: '80%' },
  nameLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 4 },
  me: { alignSelf: 'flex-end', backgroundColor: '#111', borderBottomRightRadius: 2, borderWidth: 1, borderColor: '#222' },
  her: { alignSelf: 'flex-start', backgroundColor: '#000', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#222' },
  msgText: { color: '#fff', fontSize: 15 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderColor: '#111', alignItems: 'center' },
  chatInput: { flex: 1, color: '#fff', backgroundColor: '#080808', padding: 12, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: '#222' },
  sendBtn: { color: '#fff', fontWeight: 'bold', letterSpacing: 1 }
});