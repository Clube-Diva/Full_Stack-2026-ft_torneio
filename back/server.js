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
    nomeChave: "Fase Inicial",
    nomeDoGrupo: "Grupo A",
    partidas: [
      {
        id: 1,
        nome: "Partida 1",
        horario: "18:00",
        estado: "SCHEDULED",
        jogadores: [
          { id: 1, name: "Jogador 1", score: 0 },
          { id: 2, name: "Jogador 2", score: 0 },
          { id: 3, name: "Jogador 3", score: 0 },
          { id: 4, name: "Jogador 4", score: 0 }
        ]
      },
      {
        id: 2,
        nome: "Partida 2",
        horario: "18:15",
        estado: "SCHEDULED",
        jogadores: [
          { id: 5, name: "Jogador 5", score: 0 },
          { id: 6, name: "Jogador 6", score: 0 },
          { id: 7, name: "Jogador 7", score: 0 },
          { id: 8, name: "Jogador 8", score: 0 }
        ]
      },
      {
        id: 3,
        nome: "Partida 3",
        horario: "18:30",
        estado: "SCHEDULED",
        jogadores: [
          { id: 9, name: "Jogador 9", score: 0 },
          { id: 10, name: "Jogador 10", score: 0 },
          { id: 11, name: "Jogador 11", score: 0 },
          { id: 12, name: "Jogador 12", score: 0 }
        ]
      }
    ]
  },
  {
    id: 4,
    nomeChave: "Grupo B - Fase Inicial",
    partidas: [
      {
        id: 4,
        nome: "Partida 4",
        horario: "18:45",
        estado: "SCHEDULED",
        jogadores: [
          { id: 13, name: "Jogador 13", score: 0 },
          { id: 14, name: "Jogador 14", score: 0 },
          { id: 15, name: "Jogador 15", score: 0 },
          { id: 16, name: "Jogador 16", score: 0 }
        ]
      },
      {
        id: 5,
        nome: "Partida 5",
        horario: "19:00",
        estado: "SCHEDULED",
        jogadores: [
          { id: 17, name: "Jogador 17", score: 0 },
          { id: 18, name: "Jogador 18", score: 0 },
          { id: 19, name: "Jogador 19", score: 0 },
          { id: 20, name: "Jogador 20", score: 0 }
        ]
      },
      {
        id: 6,
        nome: "Partida 6",
        horario: "19:15",
        estado: "SCHEDULED",
        jogadores: [
          { id: 21, name: "Jogador 21", score: 0 },
          { id: 22, name: "Jogador 22", score: 0 },
          { id: 23, name: "Jogador 23", score: 0 },
          { id: 24, name: "Jogador 24", score: 0 }
        ]
      }
    ]
  }
];

io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.id}`);

  socket.emit('vagas_atualizadas', estadoDoTorneio);

  socket.on('atualizar_placar', (dadosDaPartida) => {
    const { partidaId, jogadorId, pontos } = dadosDaPartida;

    for (const grupo of estadoDoTorneio) {
      const partida = grupo.partidas.find(p => p.id === partidaId);
      if (!partida) continue;

      const jogador = partida.jogadores.find(j => j.id === jogadorId);
      if (jogador) {
        jogador.score += pontos;
      }
      break;
    }

    console.log('Placar atualizado:', dadosDaPartida);
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