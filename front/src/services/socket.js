import { io } from 'socket.io-client';

// URL provisória (alterar quando for conectar ao back-end)
const SOCKET_URL = 'http://localhost:3000';

export const socket = io(SOCKET_URL, { 
  autoConnect: false, // Impede tentativas de conexão antes de você mandar
  reconnectionAttempts: 5, // Limita tentativas caso o back-end esteja offline
  transports: ['websocket'], // Força WebSocket direto, evitando polling desnecessário
});