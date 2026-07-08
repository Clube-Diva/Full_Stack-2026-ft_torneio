const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  path: "/socket.io",
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let estadoDoTorneio = [
  {
    id: 1,
    nextMatchId: 3,
    tournamentRoundText: "Semifinal 1",
    startTime: "14:00",
    state: "DONE",
    participants: [
      {
        id: "player-1",
        resultText: "2",
        isWinner: true,
        name: "Gabriel (FIFA Master)",
      },
      {
        id: "player-2",
        resultText: "1",
        isWinner: false,
        name: "Lucas do TI",
      },
    ],
  },
  {
    id: 2,
    nextMatchId: 3,
    tournamentRoundText: "Semifinal 2",
    startTime: "14:30",
    state: "DONE",
    participants: [
      {
        id: "player-3",
        resultText: "0",
        isWinner: false,
        name: "Professor de Redes",
      },
      {
        id: "player-4",
        resultText: "3",
        isWinner: true,
        name: "Ana (Veterana)",
      },
    ],
  },
  {
    id: 3,
    nextMatchId: null,
    tournamentRoundText: "Grande Final",
    startTime: "15:30",
    state: "SCHEDULED",
    participants: [
      {
        id: "player-1",
        resultText: null,
        isWinner: false,
        name: "Gabriel (FIFA Master)",
      },
      {
        id: "player-4",
        resultText: null,
        isWinner: false,
        name: "Ana (Veterana)",
      },
    ],
  },
];

let estadoDoTorneio2 = [
  {
    id: 1,
    nextMatchId: 3,
    tournamentRoundText: "Semifinal 1",
    startTime: "14:00",
    state: "DONE",
    participants: [
      {
        id: "player-1",
        resultText: "2",
        isWinner: true,
        name: "Gabriel (FIFA Master) estado 2",
      },
      {
        id: "player-2",
        resultText: "1",
        isWinner: false,
        name: "Lucas do TI",
      },
    ],
  },
  {
    id: 2,
    nextMatchId: 3,
    tournamentRoundText: "Semifinal 2",
    startTime: "14:30",
    state: "DONE",
    participants: [
      {
        id: "player-3",
        resultText: "0",
        isWinner: false,
        name: "Professor de Redes",
      },
      {
        id: "player-4",
        resultText: "3",
        isWinner: true,
        name: "Ana (Veterana)",
      },
    ],
  },
  {
    id: 3,
    nextMatchId: null,
    tournamentRoundText: "Grande Final",
    startTime: "15:30",
    state: "SCHEDULED",
    participants: [
      {
        id: "player-1",
        resultText: null,
        isWinner: false,
        name: "Gabriel (FIFA Master) estado 2",
      },
      {
        id: "player-4",
        resultText: null,
        isWinner: false,
        name: "Ana (Veterana)",
      },
    ],
  },
];

io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.id}`);

  socket.emit('vagas_atualizadas', estadoDoTorneio);

  socket.on('atualizar_placar', (dadosDaPartida) => {
    console.log('Placar atualizado recebido:', dadosDaPartida);
    io.emit('vagas_atualizadas', estadoDoTorneio2);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${socket.id}`);
  });
});

app.get('/', (req, res) => {
  res.send('Servidor do ft_torneio rodando com sucesso! 🏆');
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta http://localhost:${PORT}`);
});