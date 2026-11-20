import { useEffect, useState } from 'react';
import { socket } from '../services/socket';

const BACKEND_URL = 'http://localhost:3000';

const CORES_SLOTS = [
  { bg: 'rgba(244, 114, 182, 0.16)', border: '#f472b6' },
  { bg: 'rgba(74, 222, 128, 0.16)', border: '#4ade80' },
  { bg: 'rgba(96, 165, 250, 0.16)', border: '#60a5fa' },
  { bg: 'rgba(250, 204, 21, 0.16)', border: '#facc15' },
];

export default function ChavesPage({ usuario }) {
  const [partidasMap, setPartidasMap] = useState({});
  const [inscritos, setInscritos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregarChaves = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chaves`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao buscar chaves');

      const mapa = {};
      (data.fases || []).forEach((fase) => {
        fase.partidas.forEach((p) => {
          mapa[p.match_code || p.codigo] = p;
        });
      });

      setPartidasMap(mapa);
	  console.log(data);
      setInscritos(data.inscritos || []);
      setErro(null);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarChaves();
    socket.on('chaves_atualizadas', () => carregarChaves());
    socket.on('novo_inscrito', () => carregarChaves());
    return () => {
      socket.off('chaves_atualizadas');
      socket.off('novo_inscrito');
    };
  }, []);

  const handleGerarChaves = async () => {
    const token = localStorage.getItem('ft_token');
    if (!token) {
      setErro('Faça login com a Intra 42 para sortear os 64 jogadores.');
      return;
    }

    setGerando(true);
    setErro(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chaves/gerar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao sortear chaves.');
        return;
      }
      await carregarChaves();
    } catch {
      setErro('Falha de comunicação com o servidor.');
    } finally {
      setGerando(false);
    }
  };

  const renderPartidaCard = (codigo, titulo, cc, destaqueFinal = false) => {
    const partida = partidasMap[codigo] || { pilotos: [], status: 'aguardando' };
    const slots = [...(partida.pilotos || [])];

    while (slots.length < 4) {
      slots.push({ vazia: true });
    }

    return (
      <div
        style={{
          ...styles.matchCard,
          border: destaqueFinal ? '2px solid #eab308' : '1px solid #334155',
          boxShadow: destaqueFinal ? '0 0 24px rgba(234, 179, 8, 0.15)' : 'none',
        }}
      >
        <div style={styles.ccBadge}>{cc}</div>
        <div style={styles.matchHeader}>
          <span style={styles.matchTitle}>{titulo}</span>
          {partida.status === 'em_andamento' && <span style={styles.liveDot}>🔴 AO VIVO</span>}
          {partida.status === 'finalizada' && <span style={styles.doneDot}>✔</span>}
        </div>

        <div style={styles.slotsContainer}>
          {slots.map((piloto, idx) => {
            const chaveSlot = piloto.user_id ? `piloto-${piloto.user_id}` : `vazia-${codigo}-${idx}`;

            if (piloto.vazia) {
              return (
                <div key={chaveSlot} style={styles.emptySlot}>
                  <span>Vaga disponível</span>
                </div>
              );
            }

            const cor = CORES_SLOTS[idx % CORES_SLOTS.length];
            const souEu = usuario?.login === piloto.login;

            return (
              <div
                key={chaveSlot}
                style={{
                  ...styles.filledSlot,
                  backgroundColor: cor.bg,
                  borderColor: piloto.avancou ? '#22c55e' : souEu ? '#00babc' : cor.border,
                  borderWidth: piloto.avancou || souEu ? '2px' : '1px',
                }}
              >
                <div style={styles.pilotInfo}>
                  {piloto.avatar_url && (
                    <img src={piloto.avatar_url} alt={piloto.login} style={styles.avatar} />
                  )}
                  <span style={styles.pilotLogin}>
                    {piloto.login} {souEu && '(Você)'}
                  </span>
                </div>
                <span style={styles.points}>{piloto.pontos ?? 0}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.topHeader}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px' }}>🏁 Chaveamento Oficial (64 Vagas)</h2>
          <p style={styles.subtitle}>
            Inscritos confirmados: <strong>{inscritos.length} / 64</strong> • Apenas o 1º avança por bateria
          </p>
        </div>

        {usuario && (
          <button
            onClick={handleGerarChaves}
            disabled={gerando || inscritos.length < 2}
            style={gerando || inscritos.length < 2 ? styles.btnDisabled : styles.btnPrimary}
          >
            {gerando ? 'Sorteando...' : '🎲 Sortear 64 Vagas'}
          </button>
        )}
      </div>

      {erro && <div style={styles.errorBox}>{erro}</div>}

      {carregando ? (
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>Carregando árvore do torneio...</p>
      ) : (
        <div style={styles.scrollContainer}>
          <div style={styles.bracketCanvas}>
            {/* COLUNA 1: Lado Esquerdo - 100cc (P1 a P8) */}
            <div style={styles.column}>
              <div style={styles.colHeader}>100cc (Esquerda)</div>
              <div style={styles.colMatchesGrid}>
                {Array.from({ length: 8 }, (_, i) => {
                  const codigo = `P${i + 1}`;
                  return (
                    <div key={codigo}>
                      {renderPartidaCard(codigo, `Partida ${i + 1}`, '100cc')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* COLUNA 2: Semifinais Esquerda - 150cc (SF1, SF2) */}
            <div style={styles.column}>
              <div style={styles.colHeader}>Semi Finais</div>
              <div style={styles.colMatchesCenter}>
                <div key="SF1">{renderPartidaCard('SF1', 'Semi Esq 1', '150cc')}</div>
                <div key="SF2">{renderPartidaCard('SF2', 'Semi Esq 2', '150cc')}</div>
              </div>
            </div>

            {/* COLUNA 3: Centro - Grande FINAL - 200cc */}
            <div style={styles.columnCenter}>
              <div style={{ ...styles.colHeader, color: '#facc15', fontSize: '16px' }}>
                🏆 Grande FINAL
              </div>
              <div style={styles.colMatchesCenter}>
                <div key="FINAL">{renderPartidaCard('FINAL', 'Grande Final', '200cc', true)}</div>
              </div>
            </div>

            {/* COLUNA 4: Semifinais Direita - 150cc (SF3, SF4) */}
            <div style={styles.column}>
              <div style={styles.colHeader}>Semi Finais</div>
              <div style={styles.colMatchesCenter}>
                <div key="SF3">{renderPartidaCard('SF3', 'Semi Dir 1', '150cc')}</div>
                <div key="SF4">{renderPartidaCard('SF4', 'Semi Dir 2', '150cc')}</div>
              </div>
            </div>

            {/* COLUNA 5: Lado Direito - 100cc (P9 a P16) */}
            <div style={styles.column}>
              <div style={styles.colHeader}>100cc (Direita)</div>
              <div style={styles.colMatchesGrid}>
                {Array.from({ length: 8 }, (_, i) => {
                  const codigo = `P${i + 9}`;
                  return (
                    <div key={codigo}>
                      {renderPartidaCard(codigo, `Partida ${i + 9}`, '100cc')}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageWrapper: { width: '100%', maxWidth: '1650px', margin: '0 auto' },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    backgroundColor: '#1e293b',
    padding: '16px 24px',
    borderRadius: '12px',
    border: '1px solid #334155',
    marginBottom: '24px',
  },
  subtitle: { margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' },
  btnPrimary: {
    padding: '10px 18px',
    borderRadius: '8px',
    backgroundColor: '#00babc',
    color: '#0f172a',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
  },
  btnDisabled: {
    padding: '10px 18px',
    borderRadius: '8px',
    backgroundColor: '#334155',
    color: '#64748b',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'not-allowed',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#fecaca',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  scrollContainer: {
    width: '100%',
    overflowX: 'auto',
    paddingBottom: '20px',
  },
  bracketCanvas: {
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: '24px',
    minWidth: '1500px',
    padding: '20px',
    backgroundColor: '#0b1120',
    borderRadius: '16px',
    border: '1px solid #1e293b',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    width: '240px',
    flexShrink: 0,
  },
  columnCenter: {
    display: 'flex',
    flexDirection: 'column',
    width: '260px',
    flexShrink: 0,
    justifyContent: 'center',
  },
  colHeader: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  colMatchesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  colMatchesCenter: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '48px',
    flex: 1,
  },
  matchCard: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '10px',
    position: 'relative',
  },
  ccBadge: {
    textAlign: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: '2px',
  },
  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    paddingBottom: '4px',
    borderBottom: '1px solid #334155',
  },
  matchTitle: { fontSize: '12px', fontWeight: 'bold', color: '#f8fafc' },
  liveDot: { fontSize: '9px', fontWeight: 'bold', color: '#facc15' },
  doneDot: { fontSize: '10px', fontWeight: 'bold', color: '#22c55e' },
  slotsContainer: { display: 'flex', flexDirection: 'column', gap: '6px' },
  emptySlot: {
    height: '30px',
    borderRadius: '6px',
    border: '1px dashed #475569',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  filledSlot: {
    height: '30px',
    borderRadius: '6px',
    borderStyle: 'solid',
    padding: '0 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11px',
  },
  pilotInfo: { display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' },
  avatar: { width: '18px', height: '18px', borderRadius: '50%', objectFit: 'cover' },
  pilotLogin: {
    color: '#f8fafc',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  points: { fontFamily: 'monospace', fontWeight: 'bold', color: '#cbd5e1', fontSize: '11px' },
};