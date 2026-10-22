import { emit } from './eventBus';

let socket: WebSocket | null = null;

const SERVER_URL = 'ws://192.168.0.183:8080';

export function connectToServer(myPublicKey: string) {
  socket = new WebSocket(SERVER_URL);

  socket.onopen = () => {
    console.log('Connected to server');
    socket?.send(JSON.stringify({ type: 'register', publicKey: myPublicKey }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'message') {
      emit('message', {
        from: data.from,
        senderName: data.senderName ?? 'Anonymous',
        ciphertext: data.ciphertext,
        nonce: data.nonce,
      });
    }
  };

  socket.onerror = (error) => {
    console.log('WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log('Disconnected from server');
  };
}

export function sendEncrypted(
  from: string,
  senderName: string,
  to: string,
  ciphertext: string,
  nonce: string
) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log('Not connected to server yet');
    return;
  }
  socket.send(JSON.stringify({ type: 'send', from, senderName, to, ciphertext, nonce }));
}