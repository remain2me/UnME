const { WebSocketServer } = require('ws');

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

const clients = new Map();

wss.on('connection', (socket) => {
  console.log('A client connected');

  let registeredKey = null;

  socket.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (err) {
      console.log('Received invalid JSON, ignoring');
      return;
    }

    if (message.type === 'register') {
      registeredKey = message.publicKey;
      clients.set(registeredKey, socket);
      console.log(`Registered client: ${registeredKey}`);
      return;
    }

    if (message.type === 'send') {
      const recipientSocket = clients.get(message.to);
      if (recipientSocket) {
        recipientSocket.send(JSON.stringify({
          type: 'message',
          from: message.from,
          senderName: message.senderName,
          ciphertext: message.ciphertext,
          nonce: message.nonce,
        }));
        console.log(`Relayed message from ${message.from} to ${message.to}`);
      } else {
        console.log(`Recipient ${message.to} not connected`);
      }
      return;
    }
  });

  socket.on('close', () => {
    if (registeredKey) {
      clients.delete(registeredKey);
      console.log(`Client disconnected: ${registeredKey}`);
    }
  });
});

console.log(`UnME relay server running on ws://localhost:${PORT}`);