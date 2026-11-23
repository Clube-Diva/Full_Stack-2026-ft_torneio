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
  FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173',
  PORT = process.env.PORT || 3000,
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
  console.log("chamou callback")
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
  console.log(""+ avatarUrl);

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

async function autenticarAluno(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação ausente.' });
  }

  const token = authHeader.split(' ')[1];

  const { data: user, error } = await supabase
    .from('users')
    .select('id, intra_id, login, display_name, avatar_url, token_expires_at')
    .eq('access_token', token)
    .single();

  if (error || !user) {
    return res.status(401).json({ erro: 'Sessão inválida. Faça login novamente pela Intra 42.' });
  }

  // Verifica se o token da Intra já expirou
  if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
    return res.status(401).json({ erro: 'Sua sessão da Intra expirou. Faça login novamente.' });
  }

  req.user = user;
  next();
}

// 1. Consulta os dados do piloto logado e se ele já está inscrito
app.get('/api/inscricao/status', autenticarAluno, async (req, res) => {
  const { data: inscricao } = await supabase
    .from('registrations')
    .select('id, status, created_at')
    .eq('user_id', req.user.id)
    .maybeSingle();

  res.json({
    usuario: {
      login: req.user.login,
      display_name: req.user.display_name,
      avatar_url: req.user.avatar_url,
    },
    inscrito: Boolean(inscricao),
    inscricao: inscricao || null,
  });
});

// 2. Realiza a inscrição APENAS para o dono do token autenticado
app.post('/api/inscricao', autenticarAluno, async (req, res) => {
  try {
    const { data: novaInscricao, error } = await supabase
      .from('registrations')
      .insert({
        user_id: req.user.id, // Ignora qualquer dado do body; usa só o usuário do token
        status: 'confirmed',
      })
      .select('id, status, created_at')
      .single();

    if (error) {
      // Código 23505 no PostgreSQL = violação de chave UNIQUE (já inscrito)
      if (error.code === '23505') {
        return res.status(409).json({
          erro: 'Você já está inscrito neste torneio. Apenas uma inscrição por login é permitida.',
        });
      }
      throw error;
    }

    // Avisa em tempo real no Socket.IO que há um novo piloto inscrito
    io.to('torneio_geral').emit('novo_inscrito', {
      login: req.user.login,
      display_name: req.user.display_name,
    });

    res.status(201).json({
      mensagem: `Inscrição confirmada com sucesso para ${req.user.login}!`,
      inscricao: novaInscricao,
    });
  } catch (err) {
    console.error('Erro ao realizar inscrição:', err);
    res.status(500).json({ erro: 'Erro interno ao processar sua inscrição.' });
  }
});

// ============================================================================
// ROTAS DE CHAVES DO TORNEIO (REAIS + TEMPO REAL VIA SOCKET.IO)
// ============================================================================

// Função auxiliar para montar a estrutura completa das chaves a partir do Supabase
async function buscarEstruturaChaves() {
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      round_name,
      round_order,
      match_code,
      station,
      status,
      match_participants (
        id,
        points,
        advanced,
        users (
          id,
          login,
          display_name,
          avatar_url
        )
      )
    `)
    .order('round_order', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;

  // Agrupa as partidas por nome da rodada mantendo a ordem
  const rodadasMap = new Map();

  for (const m of matches || []) {
    if (!rodadasMap.has(m.round_name)) {
      rodadasMap.set(m.round_name, {
        rodada: m.round_name,
        partidas: [],
      });
    }

    const pilotos = (m.match_participants || [])
      .map((mp) => ({
        participant_id: mp.id,
        user_id: mp.users?.id,
        login: mp.users?.login || 'Desconhecido',
        display_name: mp.users?.display_name,
        avatar_url: mp.users?.avatar_url,
        pontos: mp.points,
        avancou: mp.advanced,
      }))
      .sort((a, b) => b.pontos - a.pontos);

    rodadasMap.get(m.round_name).partidas.push({
      db_id: m.id,
      id: m.match_code,
      mesa: m.station,
      status: m.status,
      pilotos,
    });
  }

  return Array.from(rodadasMap.values());
}


// 1. Lista as chaves atuais e o total de inscritos confirmados (acesso público)
app.get('/api/chaves', async (req, res) => {
  try {
    const fases = await buscarEstruturaChaves();

    const { data: inscritos, error: errInscritos } = await supabase
      .from('registrations')
      .select('id, status, users (id, login, display_name, avatar_url)')
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true });

    if (errInscritos) throw errInscritos;

    res.json({
      fases,
      inscritos: (inscritos || []).map((i) => i.users),
    });
  } catch (err) {
    console.error('Erro ao buscar chaves:', err);
    res.status(500).json({ erro: 'Erro ao carregar as chaves do torneio.' });
  }
});
app.post('/api/chaves/gerar', autenticarAluno, async (req, res) => {
  try {
    const { data: inscritos, error: errInsc } = await supabase
      .from('registrations')
      .select('user_id, users (login)')
      .eq('status', 'confirmed');

    if (errInsc) throw errInsc;

    if (!inscritos || inscritos.length < 2) {
      return res.status(400).json({
        erro: 'É necessário ter pelo menos 2 pilotos inscritos para sortear as chaves.',
      });
    }

    // Limpa chaves anteriores
    await supabase.from('match_participants').delete().neq('id', 0);
    await supabase.from('matches').delete().neq('id', 0);

    // Embaralha os inscritos (Fisher-Yates Shuffle)
    const embaralhados = [...inscritos];
    for (let i = embaralhados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
    }

    const tamanhoBateria = 4;
    const totalInscritos = embaralhados.length;
    
    // Calcula quantas baterias são necessárias na 1ª fase (arredondando para cima para caber todo mundo)
    const totalBateriasFase1 = Math.ceil(totalInscritos / tamanhoBateria);

    const copas = ['Copa Cogumelo', 'Copa Flor', 'Copa Estrela', 'Copa Especial'];

    // 1. CRIAÇÃO DA 1ª FASE (Classificatória)
    for (let i = 0; i < totalBateriasFase1; i++) {
      const inicio = i * tamanhoBateria;
      const grupo = embaralhados.slice(inicio, inicio + tamanhoBateria);
      const numeroBateria = i + 1;
      const copa = copas[i % copas.length];

      const { data: partidaCriada, error: errMatch } = await supabase
        .from('matches')
        .insert({
          round_name: '1ª Fase (Classificatória)',
          round_order: 1,
          match_code: `B${numeroBateria}`,
          station: `Switch 1 - ${copa}`,
          status: numeroBateria === 1 ? 'em_andamento' : 'aguardando',
        })
        .select('id')
        .single();

      if (errMatch) throw errMatch;

      // Insere os pilotos reais que caíram nessa bateria
      const participantesPayload = grupo.map((p) => ({
        match_id: partidaCriada.id,
        user_id: p.user_id,
        points: 0,
        advanced: false,
      }));

      if (participantesPayload.length > 0) {
        const { error: errPart } = await supabase
          .from('match_participants')
          .insert(participantesPayload);
        if (errPart) throw errPart;
      }
    }

    // 2. CRIAÇÃO DA FASE SEGUINTE (Semifinais de Grupo / Ex: 16 vencedores geram 4 baterias)
    const totalBateriasFase2 = Math.ceil(totalBateriasFase1 / tamanhoBateria);
    if (totalBateriasFase2 > 0 && totalBateriasFase1 > 1) {
      for (let i = 0; i < totalBateriasFase2; i++) {
        const numeroBateria = i + 1;
        const copa = copas[i % copas.length];

        await supabase.from('matches').insert({
          round_name: 'Semifinais',
          round_order: 2,
          match_code: `SF${numeroBateria}`,
          station: `Switch 1 - Semifinal ${numeroBateria}`,
          status: 'aguardando',
        });
      }
    }

    // 3. CRIAÇÃO DA GRANDE FINAL (Sempre 1 bateria final)
    await supabase.from('matches').insert({
      round_name: 'Grande Final',
      round_order: 3,
      match_code: 'F1',
      station: 'Telão Principal - Grande Final',
      status: 'aguardando',
    });

    const fasesAtualizadas = await buscarEstruturaChaves();
    io.to('torneio_geral').emit('chaves_atualizadas', fasesAtualizadas);

    res.status(201).json({
      mensagem: 'Chaves de 64 vagas sorteadas com sucesso!',
      fases: fasesAtualizadas,
    });
  } catch (err) {
    console.error('Erro ao gerar chaves:', err);
    res.status(500).json({ erro: 'Erro interno ao gerar as chaves.' });
  }
});



async function inicializarArvoreTorneio(embaralhados = []) {
  await supabase.from('match_participants').delete().neq('id', 0);
  await supabase.from('matches').delete().neq('id', 0);

  // Cria as 21 partidas estruturadas para 64 jogadores (Symmetric Bracket)
  const estruturaPartidas = [
    // Lado Esquerdo - 100cc (Partidas 1 a 8)
    ...Array.from({ length: 8 }, (_, i) => ({
      match_code: `P${i + 1}`,
      round_name: '100cc',
      round_order: 1,
      station: `Partida ${i + 1}`,
      status: i === 0 ? 'em_andamento' : 'aguardando',
    })),
    // Lado Esquerdo - Semi Final 150cc
    { match_code: 'SF1', round_name: 'Semi Final', round_order: 2, station: 'Semi Esquerda 1', status: 'aguardando' },
    { match_code: 'SF2', round_name: 'Semi Final', round_order: 2, station: 'Semi Esquerda 2', status: 'aguardando' },

    // Centro - Grande FINAL 200cc
    { match_code: 'FINAL', round_name: 'Grande FINAL', round_order: 3, station: 'Grande Final', status: 'aguardando' },

    // Lado Direito - Semi Final 150cc
    { match_code: 'SF3', round_name: 'Semi Final', round_order: 2, station: 'Semi Direita 1', status: 'aguardando' },
    { match_code: 'SF4', round_name: 'Semi Final', round_order: 2, station: 'Semi Direita 2', status: 'aguardando' },

    // Lado Direito - 100cc (Partidas 9 a 16)
    ...Array.from({ length: 8 }, (_, i) => ({
      match_code: `P${i + 9}`,
      round_name: '100cc',
      round_order: 1,
      station: `Partida ${i + 9}`,
      status: 'aguardando',
    })),
  ];

  const partidasCriadas = {};
  for (const p of estruturaPartidas) {
    const { data, error } = await supabase
      .from('matches')
      .insert(p)
      .select('id, match_code')
      .single();
    if (error) throw error;
    partidasCriadas[p.match_code] = data.id;
  }

  // Distribui os inscritos (até 64) nas 16 partidas iniciais (4 por partida)
  for (let i = 0; i < embaralhados.length; i++) {
    const indicePartida = Math.floor(i / 4) + 1; // P1 até P16
    if (indicePartida > 16) break;

    const codigoPartida = `P${indicePartida}`;
    const matchId = partidasCriadas[codigoPartida];

    if (matchId) {
      await supabase.from('match_participants').insert({
        match_id: matchId,
        user_id: embaralhados[i].user_id,
        points: 0,
        advanced: false,
      });
    }
  }
}








// IMPORTANTE: Usar server.listen em vez de app.listen
server.listen(PORT, () => {
  console.log(`Servidor HTTP + WebSocket rodando em http://localhost:${PORT}`);
});