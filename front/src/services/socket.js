import { io } from 'socket.io-client';

// URL provisória (alterar quando for conectar ao back-end)
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const socket = io(SOCKET_URL, { 
  autoConnect: true, // Impede tentativas de conexão antes de você mandar
  reconnectionAttempts: 5, // Limita tentativas caso o back-end esteja offline
  transports: ['websocket'], // Força WebSocket direto, evitando polling desnecessário
});

// Exemplo de como conectar após o login da 42 redirecionar para o React:
export function conectarSocketComToken(token) {
  socket.auth = { token };
  socket.connect();

  socket.on('connect', () => {
    console.log('Conectado ao servidor do torneio! ID:', socket.id);
    socket.emit('ping_torneio', { status: 'pronto para correr' });
  });

  socket.on('pong_torneio', (resposta) => {
    console.log('Resposta do servidor:', resposta);
  });

  socket.on('connect_error', (err) => {
    console.error('Falha na autenticação do socket:', err.message);
  });
}