import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface Props {
  visible: boolean;
  publicKey: string;
  onClose: () => void;
}

export default function QRDisplay({ visible, publicKey, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Your ID</Text>
          <View style={styles.qrWrapper}>
            <QRCode value={publicKey} size={220} backgroundColor="#fff" color="#000" />
          </View>
          <Text style={styles.keyText} selectable numberOfLines={2}>{publicKey}</Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    width: '85%',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  keyText: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});