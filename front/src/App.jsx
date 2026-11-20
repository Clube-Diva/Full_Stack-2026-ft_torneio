import { useEffect, useState } from 'react';
import { socket } from './services/socket';

const BACKEND_URL = 'http://localhost:3000';

export default function App() {
  const [userLogin, setUserLogin] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [serverLogs, setServerLogs] = useState([]);

  const addLog = (msg) => {
    setServerLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  useEffect(() => {
    // 1. Verifica se o backend redirecionou de volta com token e login na URL
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const loginFromUrl = params.get('login');

    if (tokenFromUrl) {
      localStorage.setItem('ft_token', tokenFromUrl);
      if (loginFromUrl) localStorage.setItem('ft_login', loginFromUrl);

      // Limpa os parâmetros sensíveis da barra de endereço
      window.history.replaceState({}, document.title, '/');
    }

    const savedToken = tokenFromUrl || localStorage.getItem('ft_token');
    const savedLogin = loginFromUrl || localStorage.getItem('ft_login');

    // 2. Se houver token salvo, autentica e conecta o WebSocket
    if (savedToken) {
      setUserLogin(savedLogin || 'Aluno 42');
      socket.auth = { token: savedToken };
      socket.connect();
    }

    // 3. Listeners dos eventos do Socket.IO
    const onConnect = () => {
      setSocketConnected(true);
      setSocketError(null);
      addLog(`Conectado ao Socket.IO! ID: ${socket.id}`);
    };

    const onDisconnect = (reason) => {
      setSocketConnected(false);
      addLog(`Desconectado (${reason})`);
    };

    const onConnectError = (err) => {
      setSocketConnected(false);
      setSocketError(err.message);
      addLog(`Erro de conexão: ${err.message}`);
    };

    const onPongTorneio = (data) => {
      addLog(`Resposta do servidor: ${JSON.stringify(data)}`);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('pong_torneio', onPongTorneio);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('pong_torneio', onPongTorneio);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_login');
    socket.disconnect();
    setUserLogin(null);
    setSocketConnected(false);
    setServerLogs([]);
  };

  const handlePing = () => {
    socket.emit('ping_torneio', { mensagem: 'Testando comunicação do front!' });
    addLog('Enviado: ping_torneio');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1>🏎️ Torneio Mario Kart 42</h1>
        <p style={styles.subtitle}>Painel inicial de autenticação e teste em tempo real</p>

        {!userLogin ? (
          <div style={styles.section}>
            <p>Faça login com sua conta da Intra para acessar sua chave e horários.</p>
            <button onClick={handleLogin} style={styles.primaryBtn}>
              Entrar com a Intra 42
            </button>
          </div>
        ) : (
          <div style={styles.section}>
            <div style={styles.statusBox}>
              <p>
                <strong>Piloto:</strong> {userLogin}
              </p>
              <p>
                <strong>Status WebSocket:</strong>{' '}
                <span style={{ color: socketConnected ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                  {socketConnected ? '● Online' : '● Offline'}
                </span>
              </p>
              {socketError && <p style={styles.errorText}>Erro: {socketError}</p>}
            </div>

            <div style={styles.buttonGroup}>
              <button
                onClick={handlePing}
                disabled={!socketConnected}
                style={socketConnected ? styles.primaryBtn : styles.disabledBtn}
              >
                Testar Ping no Servidor
              </button>

              <button onClick={handleLogout} style={styles.secondaryBtn}>
                Sair
              </button>
            </div>

            <div style={styles.logBox}>
              <strong>Logs do Socket:</strong>
              {serverLogs.length === 0 ? (
                <p style={styles.emptyLog}>Nenhum evento registrado ainda.</p>
              ) : (
                serverLogs.map((log, index) => (
                  <div key={index} style={styles.logLine}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: '#1e293b',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: '-8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statusBox: {
    backgroundColor: '#0f172a',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  primaryBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#00babc',
    color: '#0f172a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '15px',
  },
  disabledBtn: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#475569',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
    fontSize: '15px',
  },
  secondaryBtn: {
    padding: '12px 16px',
    backgroundColor: 'transparent',
    color: '#f87171',
    border: '1px solid #f87171',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  errorText: {
    color: '#f87171',
    fontSize: '13px',
    marginTop: '8px',
  },
  logBox: {
    backgroundColor: '#020617',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    maxHeight: '180px',
    overflowY: 'auto',
    border: '1px solid #334155',
  },
  emptyLog: {
    color: '#64748b',
    marginTop: '8px',
  },
  logLine: {
    marginTop: '6px',
    color: '#38bdf8',
    wordBreak: 'break-all',
  },
};