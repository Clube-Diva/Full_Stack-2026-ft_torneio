require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const supabase = require('./supabase');

const app = express();
const server = http.createServer(app);

const {
  FT_CLIENT_ID,
  FT_CLIENT_SECRET,
  FT_REDIRECT_URI,
  FRONTEND_URL = 'http://localhost:5173',
  PORT = 3000,
} = process.env;

// Configuração do CORS para rotas HTTP do Express
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Configuração do Socket.IO compatível com transports: ['websocket'] do seu front
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
});

// Middleware de Autenticação do Socket: identifica quem é o aluno pelo token
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Autenticação necessária: token não enviado.'));
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, intra_id, login, display_name, avatar_url, is_admin')
      .eq('access_token', token)
      .single();

    if (error || !user) {
      return next(new Error('Token inválido ou usuário não encontrado.'));
    }

    // Anexa os dados do aluno à instância do socket
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Erro interno ao validar sessão no socket.'));
  }
});

// Eventos do Socket.IO quando o aluno conecta
io.on('connection', (socket) => {
  const { login, display_name } = socket.user;
  console.log(`[Socket] Aluno conectado: ${login} (${socket.id})`);

  // Sala geral do torneio (para atualizações de chaves/placares ao vivo)
  socket.join('torneio_geral');

  // Sala individual do aluno (para avisar quando a partida dele for começar)
  socket.join(`user:${login}`);

  // Exemplo de evento que o front pode emitir para testar a conexão
  socket.on('ping_torneio', (dados) => {
    socket.emit('pong_torneio', {
      mensagem: `Conexão ativa, ${display_name}!`,
      seu_login: login,
      recebido: dados,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Aluno desconectado: ${login} (${reason})`);
  });
});

// ============================================================================
// ROTAS DE AUTENTICAÇÃO OAUTH2 DA 42
// ============================================================================

const pendingStates = new Set();

app.get('/login', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.add(state);

  const authorizeUrl = new URL('https://api.intra.42.fr/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', FT_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', FT_REDIRECT_URI);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'public');
  authorizeUrl.searchParams.set('state', state);

  res.redirect(authorizeUrl.toString());
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!state || !pendingStates.has(state)) {
    return res.status(403).json({ erro: 'State inválido ou expirado.' });
  }
  pendingStates.delete(state);

  if (!code) {
    return res.status(400).json({ erro: 'Código de autorização ausente.' });
  }

  try {
    const tokenRes = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: FT_CLIENT_ID,
        client_secret: FT_CLIENT_SECRET,
        code,
        redirect_uri: FT_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ erro: 'Erro ao obter token', detalhes: tokenData });
    }

    const meRes = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const meData = await meRes.json();
    if (!meRes.ok) {
      return res.status(meRes.status).json({ erro: 'Erro ao buscar perfil do aluno' });
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    const avatarUrl = meData.image?.versions?.medium || meData.image?.link || null;

    const { data: usuarioSalvo, error: dbError } = await supabase
      .from('users')
      .upsert(
        {
          intra_id: meData.id,
          login: meData.login,
          display_name: meData.usual_full_name || meData.displayname,
          avatar_url: avatarUrl,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'intra_id' }
      )
      .select('id, intra_id, login, display_name, avatar_url, is_admin')
      .single();

    if (dbError) {
      return res.status(500).json({ erro: 'Falha ao salvar usuário', detalhe: dbError.message });
    }

    // Redireciona de volta para o React levando o token para o front conectar o socket
    const redirectFront = new URL(`${FRONTEND_URL}/auth/callback`);
    redirectFront.searchParams.set('token', tokenData.access_token);
    redirectFront.searchParams.set('login', usuarioSalvo.login);

    res.redirect(redirectFront.toString());
  } catch (err) {
    console.error('Erro no callback:', err);
    res.status(500).json({ erro: 'Erro interno no servidor' });
  }
});

// IMPORTANTE: Usar server.listen em vez de app.listen
server.listen(PORT, () => {
  console.log(`Servidor HTTP + WebSocket rodando em http://localhost:${PORT}`);
});