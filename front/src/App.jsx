import { useEffect, useState } from 'react';
import { socket } from './services/socket';

function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);

  useEffect(() => {
    // Funções de callback para atualizar o estado da interface
    function onConnect() {
      setIsConnected(true);
      console.log('Socket conectado! ID:', socket.id);
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log('Socket desconectado.');
    }

    // Registra os ouvintes de eventos
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Descomente a linha abaixo apenas quando o back-end estiver rodando:
    // socket.connect();

    // Limpeza obrigatória ao desmontar o componente (evita eventos duplicados)
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Painel Front-end</h1>
      <p>
        Status do Socket:{' '}
        <strong style={{ color: isConnected ? 'green' : 'gray' }}>
          {isConnected ? 'Conectado' : 'Aguardando Back-end (Standby)'}
        </strong>
      </p>
    </div>
  );
}

export default App;