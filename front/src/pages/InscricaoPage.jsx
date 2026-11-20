export default function InscricaoPage({
  usuario,
  inscrito,
  inscricaoInfo,
  carregando,
  enviando,
  erro,
  mensagemSucesso,
  socketConnected,
  onLogin,
  onLogout,
  onConfirmarInscricao,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2>🏎️ Portal Oficial de Inscrição</h2>
        <p style={styles.subtitle}>Garanta sua vaga individual com seu login da Intra 42</p>
      </div>

      {carregando ? (
        <p style={styles.infoText}>Verificando credenciais da Intra 42...</p>
      ) : !usuario ? (
        <div style={styles.section}>
          <p style={styles.infoText}>
            Para garantir uma vaga única por cadete, a inscrição é vinculada diretamente ao seu login da Intra 42.
          </p>
          {erro && <div style={styles.errorBox}>{erro}</div>}
          <button onClick={onLogin} style={styles.primaryBtn}>
            Entrar com a Intra 42 para se inscrever
          </button>
        </div>
      ) : (
        <div style={styles.section}>
          <div style={styles.profileCard}>
            {usuario.avatar_url && (
              <img src={usuario.avatar_url} alt={usuario.login} style={styles.avatar} />
            )}
            <div>
              <div style={styles.profileName}>{usuario.display_name}</div>
              <div style={styles.profileLogin}>@{usuario.login}</div>
              <div style={styles.socketStatus}>
                Conexão ao vivo:{' '}
                <span style={{ color: socketConnected ? '#22c55e' : '#ef4444' }}>
                  {socketConnected ? '● Ativa' : '● Reconectando...'}
                </span>
              </div>
            </div>
          </div>

          {erro && <div style={styles.errorBox}>{erro}</div>}

          {inscrito ? (
            <div style={styles.successBox}>
              <h3>✅ Você está logado e inscrito no torneio!</h3>
              <p>
                Sua vaga está garantida exclusivamente para o login <strong>{usuario.login}</strong>.
              </p>
              {inscricaoInfo?.created_at && (
                <p style={styles.timestamp}>
                  Registrado em: {new Date(inscricaoInfo.created_at).toLocaleString('pt-BR')}
                </p>
              )}
              {mensagemSucesso && <p style={styles.highlightMsg}>{mensagemSucesso}</p>}
            </div>
          ) : (
            <div style={styles.pendingBox}>
              <p>
                Você está autenticado como <strong>{usuario.login}</strong>, mas sua inscrição ainda não foi confirmada.
              </p>
              <p style={styles.ruleNote}>
                * Cada conta da Intra 42 dá direito a apenas 1 inscrição individual.
              </p>
              <button
                onClick={onConfirmarInscricao}
                disabled={enviando}
                style={enviando ? styles.disabledBtn : styles.confirmBtn}
              >
                {enviando ? 'Confirmando inscrição...' : 'Confirmar Minha Inscrição'}
              </button>
            </div>
          )}

          <button onClick={onLogout} style={styles.logoutBtn}>
            Sair da conta ({usuario.login})
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    backgroundColor: '#1e293b',
    padding: '32px',
    borderRadius: '14px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  subtitle: { color: '#94a3b8', marginTop: '-6px', fontSize: '14px' },
  section: { display: 'flex', flexDirection: 'column', gap: '16px' },
  infoText: { color: '#cbd5e1', fontSize: '15px', lineHeight: '1.5', textAlign: 'center' },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#0f172a',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #334155',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #00babc',
  },
  profileName: { fontWeight: 'bold', fontSize: '16px' },
  profileLogin: { color: '#00babc', fontSize: '14px', fontWeight: '600' },
  socketStatus: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  successBox: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    border: '1px solid #22c55e',
    padding: '18px',
    borderRadius: '10px',
    color: '#dcfce7',
  },
  pendingBox: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    padding: '18px',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ruleNote: { fontSize: '12px', color: '#94a3b8', margin: 0 },
  timestamp: { fontSize: '12px', color: '#86efac', marginTop: '8px' },
  highlightMsg: { fontSize: '13px', fontWeight: 'bold', color: '#4ade80', marginTop: '8px' },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    border: '1px solid #ef4444',
    color: '#fecaca',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#00babc',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '15px',
  },
  confirmBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#22c55e',
    color: '#052e16',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '15px',
  },
  disabledBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#475569',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontSize: '15px',
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};