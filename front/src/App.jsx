import { useEffect, useState } from 'react';
import { socket } from './services/socket';
import InscricaoPage from './pages/InscricaoPage';
import ChavesPage from './pages/ChavesPage';

const BACKEND_URL = 'http://localhost:3000';

export default function App() {
  const [abaAtiva, setAbaAtiva] = useState('inscricao'); // 'inscricao' | 'chaves'

  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [inscrito, setInscrito] = useState(false);
  const [inscricaoInfo, setInscricaoInfo] = useState(null);

  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const carregarStatusInscricao = async (authToken) => {
    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/inscricao/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) handleLogout();
        setErro(data.erro || 'Não foi possível verificar sua sessão.');
        return;
      }

      setUsuario(data.usuario);
      setInscrito(data.inscrito);
      setInscricaoInfo(data.inscricao);
    } catch {
      setErro('Falha ao conectar com o servidor do torneio.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');

    if (tokenFromUrl) {
      localStorage.setItem('ft_token', tokenFromUrl);
      window.history.replaceState({}, document.title, '/');
    }

    const activeToken = tokenFromUrl || localStorage.getItem('ft_token');

    if (activeToken) {
      setToken(activeToken);
      carregarStatusInscricao(activeToken);

      socket.auth = { token: activeToken };
      socket.connect();
    } else {
      setCarregando(false);
    }

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/login`;
  };

  const handleLogout = () => {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_login');
    socket.disconnect();
    setToken(null);
    setUsuario(null);
    setInscrito(false);
    setInscricaoInfo(null);
    setMensagemSucesso(null);
    setErro(null);
  };

  const handleConfirmarInscricao = async () => {
    if (!token || enviando) return;
    setEnviando(true);
    setErro(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/inscricao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || 'Não foi possível concluir a inscrição.');
        if (res.status === 409) await carregarStatusInscricao(token);
        return;
      }

      setInscrito(true);
      setInscricaoInfo(data.inscricao);
      setMensagemSucesso(data.mensagem);
    } catch {
      setErro('Erro de rede ao tentar confirmar sua inscrição.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Barra de Navegação Superior */}
      <nav style={styles.navbar}>
        <div style={styles.brand}>🏎️ Mario Kart 42</div>

        <div style={styles.navButtons}>
          <button
            onClick={() => setAbaAtiva('inscricao')}
            style={abaAtiva === 'inscricao' ? styles.navBtnActive : styles.navBtn}
          >
            Inscrição
          </button>
          <button
            onClick={() => setAbaAtiva('chaves')}
            style={abaAtiva === 'chaves' ? styles.navBtnActive : styles.navBtn}
          >
            Chaves do Torneio
          </button>
        </div>

        <div style={styles.navUser}>
          {usuario ? `@${usuario.login}` : 'Visitante'}
        </div>
      </nav>

      {/* Conteúdo da Tela Selecionada */}
      <main style={styles.mainContent}>
        {abaAtiva === 'inscricao' ? (
          <InscricaoPage
            usuario={usuario}
            inscrito={inscrito}
            inscricaoInfo={inscricaoInfo}
            carregando={carregando}
            enviando={enviando}
            erro={erro}
            mensagemSucesso={mensagemSucesso}
            socketConnected={socketConnected}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onConfirmarInscricao={handleConfirmarInscricao}
          />
        ) : (
          <ChavesPage usuario={usuario} />
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 28px',
    backgroundColor: '#020617',
    borderBottom: '1px solid #1e293b',
    flexWrap: 'wrap',
    gap: '12px',
  },
  brand: {
    fontWeight: 'bold',
    fontSize: '18px',
    color: '#00babc',
  },
  navButtons: {
    display: 'flex',
    gap: '10px',
  },
  navBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navBtnActive: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #00babc',
    backgroundColor: 'rgba(0, 186, 188, 0.15)',
    color: '#00babc',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navUser: {
    fontSize: '13px',
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 20px',
  },
};