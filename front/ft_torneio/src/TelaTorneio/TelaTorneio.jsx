import React, { useEffect, useState } from 'react';
import './TelaTorneio.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4001', {
  path: '/socket.io',
});

const normalizarDadosDoServidor = (dados) => {
  if (Array.isArray(dados)) {
    return dados;
  }

  return dados ? [dados] : [];
};

const criarJogadoresBase = (quantidade, dadosDoServidor = []) => {
  const jogadoresDoServidor = (dadosDoServidor ?? []).flatMap((chave) =>
    (chave.partidas ?? []).flatMap((partida) =>
      (partida.jogadores ?? []).map((jogador) => ({
        ...jogador,
        partidaOrigem: partida.nome,
      }))
    )
  );

  if (jogadoresDoServidor.length >= quantidade) {
    return jogadoresDoServidor.slice(0, quantidade).map((jogador, index) => ({
      ...jogador,
      id: jogador.id ?? index + 1,
      name: jogador.name ?? `Jogador ${index + 1}`,
      score: jogador.score ?? 0,
    }));
  }

  const jogadoresGerados = Array.from({ length: quantidade - jogadoresDoServidor.length }, (_, index) => ({
    id: 1000 + index + 1,
    name: `Jogador ${jogadoresDoServidor.length + index + 1}`,
    score: 0,
    partidaOrigem: 'Entrada automática',
  }));

  return [
    ...jogadoresDoServidor.map((jogador, index) => ({
      ...jogador,
      id: jogador.id ?? index + 1,
      name: jogador.name ?? `Jogador ${index + 1}`,
      score: jogador.score ?? 0,
    })),
    ...jogadoresGerados,
  ];
};

const criarBracketDoTorneio = (participantes) => {
  const jogadores = participantes.map((jogador, index) => ({
    ...jogador,
    id: jogador.id ?? index + 1,
    name: jogador.name ?? `Jogador ${index + 1}`,
    score: jogador.score ?? 0,
  }));

  const partidasDaPrimeiraFase = [];
  for (let index = 0; index < jogadores.length; index += 4) {
    const grupo = jogadores.slice(index, index + 4);

    partidasDaPrimeiraFase.push({
      id: `rodada-1-${partidasDaPrimeiraFase.length + 1}`,
      round: 1,
      nome: `Partida ${partidasDaPrimeiraFase.length + 1}`,
      jogadores: grupo,
      estado: 'PENDING',
      vencedores: [],
      vencedorId: null,
      vencedorName: null,
    });
  }

  const rodadas = [partidasDaPrimeiraFase];
  let partidasAtuais = partidasDaPrimeiraFase;
  let rodadaAtual = 1;

  while (partidasAtuais.length > 1) {
    rodadaAtual += 1;
    const proximaRodada = Array.from({ length: Math.ceil(partidasAtuais.length / 2) }, (_, index) => ({
      id: `rodada-${rodadaAtual}-${index + 1}`,
      round: rodadaAtual,
      nome: `Partida ${index + 1}`,
      jogadores: [null, null, null, null],
      estado: 'PENDING',
      vencedores: [],
      vencedorId: null,
      vencedorName: null,
    }));

    rodadas.push(proximaRodada);
    partidasAtuais = proximaRodada;
  }

  return rodadas;
};

export default function TelaTorneio() {
  const [conectado, setConectado] = useState(false);
  const [partidasDoTorneio, setPartidasDoTorneio] = useState([]);
  const [partidaId, setPartidaId] = useState('1');
  const [jogadorId, setJogadorId] = useState('1');
  const [pontos, setPontos] = useState('1');
  const [statusEnvio, setStatusEnvio] = useState('');
  const [quantidadeParticipantes, setQuantidadeParticipantes] = useState('24');
  const [bracket, setBracket] = useState([]);

  useEffect(() => {
    const onConnect = () => {
      setConectado(true);
      console.log('⚡ Conectado ao servidor Socket.io!');
    };

    const onVagasAtualizadas = (dados) => {
      console.log('Dados recebidos do servidor:', dados);

      const dadosNormalizados = normalizarDadosDoServidor(dados);
      setPartidasDoTorneio(dadosNormalizados);
    };

    socket.on('connect', onConnect);
    socket.on('vagas_atualizadas', onVagasAtualizadas);

    return () => {
      socket.off('connect', onConnect);
      socket.off('vagas_atualizadas', onVagasAtualizadas);
    };
  }, []);

  const gerarTorneio = () => {
    const quantidade = Number(quantidadeParticipantes);

    if (!Number.isFinite(quantidade) || quantidade < 2) {
      setStatusEnvio('Informe pelo menos 2 participantes para gerar o torneio.');
      return;
    }

    const participantes = criarJogadoresBase(quantidade, partidasDoTorneio);
    const estruturaGerada = criarBracketDoTorneio(participantes);

    setBracket(estruturaGerada);
    setStatusEnvio(`Torneio gerado para ${participantes.length} participantes.`);
  };

  const registrarVencedor = (partidaId, jogadorId) => {
    if (!partidaId || !jogadorId) {
      return;
    }

    setBracket((estadoAnterior) => {
      const rodadaAtualIndex = estadoAnterior.findIndex((rodada) =>
        rodada.some((partida) => partida.id === partidaId)
      );

      if (rodadaAtualIndex === -1) {
        return estadoAnterior;
      }

      const rodadaAtual = estadoAnterior[rodadaAtualIndex];
      const partidaAtualIndex = rodadaAtual.findIndex((partida) => partida.id === partidaId);
      const partidaAtual = rodadaAtual[partidaAtualIndex];

      if (!partidaAtual) {
        return estadoAnterior;
      }

      const jogadorSelecionado = partidaAtual.jogadores.find((jogador) => jogador?.id === jogadorId);
      if (!jogadorSelecionado) {
        return estadoAnterior;
      }

      const jaSelecionado = (partidaAtual.selecionados ?? []).some((jogador) => jogador.id === jogadorId);
      const proximosSelecionados = jaSelecionado
        ? (partidaAtual.selecionados ?? []).filter((jogador) => jogador.id !== jogadorId)
        : [...(partidaAtual.selecionados ?? []), jogadorSelecionado];

      if (proximosSelecionados.length > 2) {
        return estadoAnterior;
      }

      const rodadaAtualizada = rodadaAtual.map((partida) =>
        partida.id === partidaId
          ? {
              ...partida,
              estado: proximosSelecionados.length === 2 ? 'FINALIZADA' : 'EM_ANDAMENTO',
              selecionados: proximosSelecionados,
              vencedores: proximosSelecionados,
              vencedorId: proximosSelecionados.length === 2 ? jogadorId : null,
              vencedorName: proximosSelecionados.length === 2 ? jogadorSelecionado.name : null,
            }
          : partida
      );

      const rodadasAtualizadas = [...estadoAnterior];
      rodadasAtualizadas[rodadaAtualIndex] = rodadaAtualizada;

      const proximaRodada = rodadasAtualizadas[rodadaAtualIndex + 1];
      if (!proximaRodada || proximosSelecionados.length < 2) {
        return rodadasAtualizadas;
      }

      const indiceNaRodada = partidaAtualIndex;
      const indiceProximaPartida = Math.floor(indiceNaRodada / 2);
      const partidaDestino = proximaRodada[indiceProximaPartida];

      if (!partidaDestino) {
        return rodadasAtualizadas;
      }

      const jogadoresDestino = [...(partidaDestino.jogadores ?? [])];
      const slotIndex = (indiceNaRodada % 2) * 2;
      jogadoresDestino[slotIndex] = proximosSelecionados[0];
      jogadoresDestino[slotIndex + 1] = proximosSelecionados[1];

      rodadasAtualizadas[rodadaAtualIndex + 1] = proximaRodada.map((partida, index) =>
        index === indiceProximaPartida
          ? {
              ...partida,
              jogadores: jogadoresDestino,
              estado: jogadoresDestino.filter(Boolean).length === 4 ? 'EM_ANDAMENTO' : 'PENDING',
            }
          : partida
      );

      return rodadasAtualizadas;
    });

    setStatusEnvio(`Seleção atualizada para a partida ${partidaId}`);
  };

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

      <section className="painel-teste">
        <h2>Gerar bracket do torneio</h2>
        <p>Defina qualquer quantidade de participantes e o sistema cria as partidas automaticamente.</p>

        <div className="painel-campos">
          <label>
            Quantidade de participantes
            <input
              type="number"
              min="2"
              value={quantidadeParticipantes}
              onChange={(event) => setQuantidadeParticipantes(event.target.value)}
            />
          </label>
        </div>

        <div className="painel-acoes">
          <button type="button" onClick={gerarTorneio}>
            Gerar torneio
          </button>
        </div>
      </section>

      {bracket.length > 0 ? (
        <section className="painel-teste">
          <h2>Estrutura do torneio</h2>
          <div className="bracket-grid">
            {bracket.map((rodada, index) => (
              <div key={`rodada-${index + 1}`} className="fase-card">
                <h3>Rodada {index + 1}</h3>
                {rodada.map((partida) => (
                  <div key={partida.id} className={`partida-card ${partida.estado.toLowerCase()}`}>
                    <div className="partida-header">
                      <strong>{partida.nome}</strong>
                      <span className="partida-horario">{partida.estado}</span>
                    </div>

                    <div className="match-jogadores">
                      {partida.jogadores.map((jogador, jogadorIndex) => (
                        jogador ? (
                          <button
                            key={`${partida.id}-${jogador.id}`}
                            type="button"
                            className={`botao-jogador ${
                              (partida.selecionados ?? []).some((selecionado) => selecionado.id === jogador.id)
                                ? 'selecionado'
                                : ''
                            }`}
                            onClick={() => registrarVencedor(partida.id, jogador.id)}
                          >
                            {jogadorIndex + 1}. {jogador.name}
                          </button>
                        ) : (
                          <div key={`${partida.id}-vazio-${jogadorIndex}`} className="jogador-vazio">
                            Aguardando
                          </div>
                        )
                      ))}
                    </div>

                    {(partida.selecionados ?? []).length > 0 ? (
                      <div className="vencedor-badge">
                        Avançam: {(partida.selecionados ?? []).map((jogador) => jogador.name).join(', ')}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

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