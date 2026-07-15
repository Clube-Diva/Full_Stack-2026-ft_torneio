import React, { useEffect, useState } from 'react';
import './TelaTorneio.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4001', {
  path: '/socket.io',
});

export default function TelaTorneio() {
  const [conectado, setConectado] = useState(false);
  const [partidasDoTorneio, setPartidasDoTorneio] = useState([]);
  const [partidaId, setPartidaId] = useState('1');
  const [jogadorId, setJogadorId] = useState('1');
  const [pontos, setPontos] = useState('1');
  const [statusEnvio, setStatusEnvio] = useState('');

  useEffect(() => {
    const onConnect = () => {
      setConectado(true);
      console.log('⚡ Conectado ao servidor Socket.io!');
    };

    const onVagasAtualizadas = (dados) => {
      console.log('Dados recebidos do servidor:', dados);

      if (Array.isArray(dados)) {
        setPartidasDoTorneio(dados);
      } else if (dados) {
        setPartidasDoTorneio([dados]);
      } else {
        setPartidasDoTorneio([]);
      }
      console.log('Estado atualizado das partidas:', partidasDoTorneio);
    };

    socket.on('connect', onConnect);
    socket.on('vagas_atualizadas', onVagasAtualizadas);

    return () => {
      socket.off('connect', onConnect);
      socket.off('vagas_atualizadas', onVagasAtualizadas);
    };
  }, []);

  const enviarTesteDePlacar = () => {
    const payload = {
      partidaId: Number(partidaId),
      jogadorId: Number(jogadorId),
      pontos: Number(pontos),
    };

    if (!Number.isFinite(payload.partidaId) || !Number.isFinite(payload.jogadorId) || !Number.isFinite(payload.pontos)) {
      setStatusEnvio('Preencha partida, jogador e pontos com números válidos.');
      return;
    }

    socket.emit('atualizar_placar', payload);
    setStatusEnvio(`Enviado: partida ${payload.partidaId}, jogador ${payload.jogadorId}, +${payload.pontos}`);
  };

return (
    <div className="torneio-container">
      <div className="status-badge">
        <span className={conectado ? 'dot conectado' : 'dot desconectado'}></span>
        <p>{conectado ? 'Conectado ao servidor' : 'Conectando...'}</p>
      </div>

      <section className="painel-teste">
        <h2>Teste rápido do socket</h2>
        <p>Use este painel para mandar um placar de teste ao backend Python.</p>

        <div className="painel-campos">
          <label>
            Partida
            <input
              type="number"
              min="1"
              value={partidaId}
              onChange={(event) => setPartidaId(event.target.value)}
            />
          </label>

          <label>
            Jogador
            <input
              type="number"
              min="1"
              value={jogadorId}
              onChange={(event) => setJogadorId(event.target.value)}
            />
          </label>

          <label>
            Pontos
            <input
              type="number"
              value={pontos}
              onChange={(event) => setPontos(event.target.value)}
            />
          </label>
        </div>

        <div className="painel-acoes">
          <button type="button" onClick={enviarTesteDePlacar}>
            Enviar atualização
          </button>
          <button
            type="button"
            className="botao-secundario"
            onClick={() => {
              setPartidaId('1');
              setJogadorId('1');
              setPontos('1');
              setStatusEnvio('Campos resetados para o teste padrão.');
            }}
          >
            Resetar campos
          </button>
        </div>

        {statusEnvio ? <p className="status-envio">{statusEnvio}</p> : null}
      </section>

      <h1 className="torneio-titulo">🏆 Chaves do Torneio</h1>

      {partidasDoTorneio.length === 0 ? (
        <p className="sem-dados">Nenhuma partida recebida ainda.</p>
      ) : (
        <div className="chaves-grid">
          {partidasDoTorneio.map((chave) => (
            <div key={chave.id} className="chave-card">
              {/* CORRIGIDO: NomeChave com N maiúsculo conforme o seu JSON */}
              <h3 className="chave-nome">{chave.nomeChave}</h3> 
              
              <div className="partidas-lista">
                {chave.partidas?.map((partida) => (
                  <div key={partida.id} className={`partida-card ${partida.estado.toLowerCase()}`}>
                    <div className="partida-header">
                      <strong>{partida.nome}</strong>
                      <span className="partida-horario">{partida.horario}</span>
                    </div>
                    
                    <span className={`status-tag ${partida.estado.toLowerCase()}`}>
                      {partida.estado} 
                    </span>
                    
                    <ul className="jogadores-lista">
                      {partida.jogadores?.map((jogador) => (
                        <li key={jogador.id} className="jogador-item">
                          🎮 {jogador.name} <span className="jogador-score">{jogador.score}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}