import { useEffect, useState } from 'react';
import { socket } from '../services/socket'; // Ajuste o caminho se necessário

export function SocketStatus() {
  const [status, setStatus] = useState(socket.connected ? 'conectado' : 'conectando');
  const [socketId, setSocketId] = useState(socket.id || '');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const onConnect = () => {
      setStatus('conectado');
      setSocketId(socket.id);
      setErro('');
    };

    const onDisconnect = (reason) => {
      setStatus('desconectado');
      setSocketId('');
      setErro(reason);
    };

    const onConnectError = (err) => {
      setStatus('erro');
      setErro(err.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Garante que o estado inicial reflita a conexão atual
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  const cores = {
    conectado: { bg: '#16a34a', texto: '🟢 Socket Conectado' },
    conectando: { bg: '#ca8a04', texto: '🟡 Conectando ao Render...' },
    desconectado: { bg: '#dc2626', texto: '🔴 Desconectado' },
    erro: { bg: '#991b1b', texto: '⚠️ Erro de Conexão' },
  };

  const atual = cores[status];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        backgroundColor: atual.bg,
        color: '#fff',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '13px',
        fontFamily: 'sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        maxWidth: '300px',
      }}
    >
      <div style={{ fontWeight: 'bold' }}>{atual.texto}</div>
      {socketId && (
        <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '2px' }}>
          ID: {socketId}
        </div>
      )}
      {erro && (
        <div style={{ fontSize: '11px', marginTop: '4px', wordBreak: 'break-word' }}>
          Detalhe: {erro}
        </div>
      )}
    </div>
  );
}