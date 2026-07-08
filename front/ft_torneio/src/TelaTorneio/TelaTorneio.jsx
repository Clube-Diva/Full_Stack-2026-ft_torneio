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
    socket.on('connect', () => {
      setConectado(true);
      console.log('⚡ Conectado ao servidor Socket.io!');
    });

    socket.on('vagas_atualizadas', (dados) => {
      console.log('Dados recebidos do servidor:', dados);
      setPartidasDoTorneio(dados);
    });

    return () => {
      socket.off('connect');
      socket.off('vagas_atualizadas');
    };
  }, []);
//
  return (
    <div className="aling-torneio">
       <p>{conectado ? 'Conectado ao servidor' : 'Conectando...'}</p>
      {partidasDoTorneio.map((categoria) => (
        <div key={categoria.id}>
          <h2>{categoria.tournamentRoundText}</h2>
          
          <ul>
            {categoria.participants.map((participant, index) => (
              <li key={index}>{participant.name}</li>
            ))}
          </ul>

        </div>
      ))}
    </div>
  );
}