import React, { useEffect, useState } from 'react';
import './TelaTorneio.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  path: '/socket.io',
});

export default function TelaTorneio() {
  const [conectado, setConectado] = useState(false);
  const [partidasDoTorneio, setPartidasDoTorneio] = useState([]);

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

return (
    <div className="torneio-container">
      <div className="status-badge">
        <span className={conectado ? 'dot conectado' : 'dot desconectado'}></span>
        <p>{conectado ? 'Conectado ao servidor' : 'Conectando...'}</p>
      </div>

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
                          🎮 {jogador.name}
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