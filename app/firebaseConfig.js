import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyC9dDQTUNX8p08W__UoqM9hJpttCgeWydY",
  authDomain: "unme-chat-dbf0f.firebaseapp.com",
  databaseURL: "https://unme-chat-dbf0f-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "unme-chat-dbf0f",
  storageBucket: "unme-chat-dbf0f.firebasestorage.app",
  messagingSenderId: "791210722403",
  appId: "1:791210722403:web:f3ef764263c7e79198e456"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);