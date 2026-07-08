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

let estadoDoTorneio =
  [
  {
    id: 1,
    nomeChave: "Fase Inicial",
    nomeDoGrupo: "Grupo A",
    partidas: [
      {
        id: 1,
        nome: "Partida 1",
        horario: "18:00",
        estado: "SCHEDULED",
        jogadores: [
          { id: 1, name: "Jogador 1" },
          { id: 2, name: "Jogador 2" },
          { id: 3, name: "Jogador 3" },
          { id: 4, name: "Jogador 4" }
        ]
      },
      {
        id: 2,
        nome: "Partida 2",
        horario: "18:15",
        estado: "SCHEDULED",
        jogadores: [
          { id: 5, name: "Jogador 5" },
          { id: 6, name: "Jogador 6" },
          { id: 7, name: "Jogador 7" },
          { id: 8, name: "Jogador 8" }
        ]
      },
      {
        id: 3,
        nome: "Partida 3",
        horario: "18:30",
        estado: "SCHEDULED",
        jogadores: [
          { id: 9, name: "Jogador 9" },
          { id: 10, name: "Jogador 10" },
          { id: 11, name: "Jogador 11" },
          { id: 12, name: "Jogador 12" }
        ]
      }
    ]
  },
  {
    id: 4,
    NomeChave: "Grupo B - Fase Inicial",
    partidas: [
      {
        id: 4,
        nome: "Partida 4",
        horario: "18:45",
        estado: "SCHEDULED",
        jogadores: [
          { id: 13, name: "Jogador 13" },
          { id: 14, name: "Jogador 14" },
          { id: 15, name: "Jogador 15" },
          { id: 16, name: "Jogador 16" }
        ]
      },
      {
        id: 5,
        nome: "Partida 5",
        horario: "19:00",
        estado: "SCHEDULED",
        jogadores: [
          { id: 17, name: "Jogador 17" },
          { id: 18, name: "Jogador 18" },
          { id: 19, name: "Jogador 19" },
          { id: 20, name: "Jogador 20" }
        ]
      },
      {
        id: 6,
        nome: "Partida 6",
        horario: "19:15",
        estado: "SCHEDULED",
        jogadores: [
          { id: 21, name: "Jogador 21" },
          { id: 22, name: "Jogador 22" },
          { id: 23, name: "Jogador 23" },
          { id: 24, name: "Jogador 24" }
        ]
      }
    ]
  },
]

io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.id}`);

  socket.emit('vagas_atualizadas', estadoDoTorneio);

  socket.on('atualizar_placar', (dadosDaPartida) => {
    console.log('Placar atualizado recebido:', dadosDaPartida);
    io.emit('vagas_atualizadas', estadoDoTorneio);
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