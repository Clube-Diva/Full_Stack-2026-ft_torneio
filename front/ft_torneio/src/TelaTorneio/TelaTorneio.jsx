import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

import './TelaTorneio.css'

const CHAVES_BASE = ['Chave A', 'Chave B', 'Chave C', 'Chave D']

const getNextPhaseName = (currentName = '') => {
  const normalized = currentName.toLowerCase()

  if (normalized.includes('oitavas')) return 'Quartas'
  if (normalized.includes('quartas')) return 'Semis'
  if (normalized.includes('semis')) return 'Final'
  return 'Quartas'
}

const getPhaseName = (value = '') => {
  const normalized = value.toLowerCase()

  if (normalized.includes('final')) return 'Final'
  if (normalized.includes('semis')) return 'Semis'
  if (normalized.includes('quartas')) return 'Quartas'
  if (normalized.includes('oitavas')) return 'Oitavas'
  return ''
}

const getPhaseRank = (value = '') => {
  const phaseName = getPhaseName(value)

  if (phaseName === 'Oitavas') return 1
  if (phaseName === 'Quartas') return 2
  if (phaseName === 'Semis') return 3
  if (phaseName === 'Final') return 4
  return 0
}

const normalizeState = (value) => (Array.isArray(value) ? value : [])

function TelaTorneio() {
  const [torneio, setTorneio] = useState([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io('http://localhost:4001', {
      path: '/socket.io',
      transports: ['websocket'],
    })

    socketRef.current = socket

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)
    const handleState = (payload) => {
      setTorneio(normalizeState(payload))
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('vagas_atualizadas', handleState)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('vagas_atualizadas', handleState)
      socket.disconnect()
    }
  }, [])

  const emitState = (nextState) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('atualizar_placar', nextState)
    }
  }

  const atualizarEstadoLocal = (updater) => {
    setTorneio((prev) => {
      const nextState = updater(prev)
      emitState(nextState)
      return nextState
    })
  }

  const handleScoreChange = (chaveIndex, partidaIndex, jogadorIndex, value) => {
    atualizarEstadoLocal((prev) =>
      normalizeState(prev).map((chave, index) => {
        if (index !== chaveIndex) return chave

        return {
          ...chave,
          partidas: (chave.partidas || []).map((partida, partidaIdx) => {
            if (partidaIdx !== partidaIndex) return partida

            return {
              ...partida,
              jogadores: (partida.jogadores || []).map((jogador, jogIdx) => {
                if (jogIdx !== jogadorIndex) return jogador

                return {
                  ...jogador,
                  score: Math.max(0, Number(value) || 0),
                }
              }),
            }
          }),
        }
      })
    )
  }

  const handleScoreDelta = (chaveIndex, partidaIndex, jogadorIndex, delta) => {
    const currentChave = torneio?.[chaveIndex]
    const partida = currentChave?.partidas?.[partidaIndex]
    const jogador = partida?.jogadores?.[jogadorIndex]

    if (!jogador) return

    handleScoreChange(chaveIndex, partidaIndex, jogadorIndex, (jogador.score || 0) + delta)
  }

  const handleEncerrarPartida = (chaveIndex, partidaIndex) => {
    atualizarEstadoLocal((prev) =>
      normalizeState(prev).map((chave, index) => {
        if (index !== chaveIndex) return chave

        return {
          ...chave,
          partidas: (chave.partidas || []).map((partida, partidaIdx) => {
            if (partidaIdx !== partidaIndex) return partida

            const jogadores = (partida.jogadores || []).map((jogador) => ({ ...jogador }))
            const [primeiro, segundo] = jogadores
            const vencedor = primeiro?.score >= (segundo?.score || 0) ? primeiro : segundo

            return {
              ...partida,
              estado: 'DONE',
              vencedor: vencedor?.name || 'Sem vencedor',
              jogadores: jogadores.map((jogador) => ({
                ...jogador,
                isWinner: jogador.id === vencedor?.id,
              })),
            }
          }),
        }
      })
    )
  }

  const gerarProximaFase = () => {
    const estadoAtual = normalizeState(torneio)

    if (!estadoAtual.length) return

    const faseAtual = [...estadoAtual]
      .filter((chave) => normalizeState(chave?.partidas).length > 0)
      .sort((a, b) => getPhaseRank(b?.NomeChave || '') - getPhaseRank(a?.NomeChave || ''))[0]

    if (!faseAtual) return

    const partidas = estadoAtual
      .filter((chave) => getPhaseName(chave?.NomeChave || '') === getPhaseName(faseAtual?.NomeChave || ''))
      .flatMap((chave) => normalizeState(chave?.partidas))

    const todasEncerradas = partidas.length > 0 && partidas.every((partida) => partida?.estado === 'DONE')

    if (!todasEncerradas) return

    const vencedores = []

    partidas.forEach((partida) => {
      const jogadores = normalizeState(partida?.jogadores)
      if (!jogadores.length) return

      const vencedor = jogadores.reduce((melhor, atual) => {
        if (!melhor) return atual
        return (atual?.score || 0) > (melhor?.score || 0) ? atual : melhor
      }, null)

      if (vencedor) {
        vencedores.push({
          id: vencedor.id,
          name: vencedor.name,
          score: vencedor.score || 0,
          bye: Boolean(vencedor.bye),
        })
      }
    })

    if (!vencedores.length) return

    const nomeProximaFase = getNextPhaseName(faseAtual?.NomeChave || '')

    const novasChaves = CHAVES_BASE.map((chaveNome, index) => ({
      id: Date.now() + index + 1,
      NomeChave: `${chaveNome} - ${nomeProximaFase}`,
      partidas: [],
    }))

    const partidasGeradas = []
    let fila = [...vencedores]

    while (fila.length > 1) {
      const primeiro = fila.shift()
      const segundo = fila.shift()
      partidasGeradas.push({
        id: Date.now() + partidasGeradas.length + 1,
        nome: `Jogo ${partidasGeradas.length + 1}`,
        horario: '--',
        estado: 'LIVE',
        jogadores: [
          { id: primeiro?.id || `p-${partidasGeradas.length + 1}`, name: primeiro?.name || 'Jogador', score: 0 },
          { id: segundo?.id || `p-${partidasGeradas.length + 2}`, name: segundo?.name || 'Jogador', score: 0 },
        ],
      })
    }

    if (fila.length === 1) {
      const restante = fila[0]
      partidasGeradas.push({
        id: Date.now() + partidasGeradas.length + 1,
        nome: `Jogo ${partidasGeradas.length + 1}`,
        horario: '--',
        estado: 'LIVE',
        jogadores: [
          { id: restante?.id || 'bye-1', name: restante?.name || 'Jogador', score: 0 },
          { id: `bye-${Date.now()}`, name: 'BYE', score: 0, bye: true },
        ],
      })
    }

    partidasGeradas.forEach((partida, index) => {
      const chaveIndex = index % novasChaves.length
      novasChaves[chaveIndex].partidas.push(partida)
    })

    const nextState = [...estadoAtual, ...novasChaves]
    setTorneio(nextState)
    emitState(nextState)
  }

  return (
    <div className="torneio-shell">
      <header className="torneio-header">
        <div>
          <p className="eyebrow">Painel do administrador</p>
          <h1>FT_TORNEIO</h1>
          <p className="subtitle">Gerenciamento em tempo real do 1x1</p>
        </div>

        <div className={`status-badge ${connected ? 'online' : 'offline'}`}>
          {connected ? '🟢 Conectado' : '🔴 Desconectado'}
        </div>
      </header>

      <div className="toolbar">
        <button type="button" className="advance-btn" onClick={gerarProximaFase}>
          Avançar fase
        </button>
        <p className="helper-text">Encerrando todas as partidas da fase atual, os vencedores geram a próxima rodada automaticamente.</p>
      </div>

      <div className="chaves-grid">
        {torneio?.length ? (
          torneio.map((chave, chaveIndex) => (
            <section key={chave.id || `${chave.NomeChave}-${chaveIndex}`} className="chave-card">
              <div className="chave-header">
                <h2>{chave.NomeChave}</h2>
                <span>{(chave.partidas || []).length} partidas</span>
              </div>

              <div className="partidas-list">
                {(chave.partidas || []).length ? (
                  (chave.partidas || []).map((partida, partidaIndex) => (
                    <article key={partida.id || `${chaveIndex}-${partidaIndex}`} className={`partida-card ${partida.estado === 'DONE' ? 'done' : 'live'}`}>
                      <div className="partida-top">
                        <strong>{partida.nome}</strong>
                        <span className={`status-pill ${partida.estado === 'DONE' ? 'done' : 'live'}`}>
                          {partida.estado === 'DONE' ? 'DONE' : 'LIVE'}
                        </span>
                      </div>

                      <div className="jogadores-list">
                        {(partida.jogadores || []).map((jogador, jogadorIndex) => (
                          <div key={jogador.id || `${partida.id}-${jogadorIndex}`} className="jogador-row">
                            <div className="jogador-info">
                              <span className="player-name">{jogador.name}</span>
                              {jogador.bye ? <span className="bye-pill">Bye</span> : null}
                            </div>

                            <div className="score-controls">
                              <button type="button" onClick={() => handleScoreDelta(chaveIndex, partidaIndex, jogadorIndex, -1)}>
                                −
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={jogador.score || 0}
                                onChange={(event) => handleScoreChange(chaveIndex, partidaIndex, jogadorIndex, event.target.value)}
                              />
                              <button type="button" onClick={() => handleScoreDelta(chaveIndex, partidaIndex, jogadorIndex, 1)}>
                                +
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {partida.estado === 'DONE' && partida.vencedor ? (
                        <p className="winner-text">Vencedor: {partida.vencedor}</p>
                      ) : null}

                      <button type="button" className="finish-btn" onClick={() => handleEncerrarPartida(chaveIndex, partidaIndex)}>
                        Encerrar partida
                      </button>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">Nenhuma partida cadastrada nesta chave ainda.</p>
                )}
              </div>
            </section>
          ))
        ) : (
          <div className="empty-state-card">
            <h2>Aguardando dados do backend</h2>
            <p>As chaves aparecerão aqui assim que o servidor enviar o estado do torneio.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TelaTorneio
