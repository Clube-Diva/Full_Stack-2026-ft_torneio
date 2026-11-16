const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../secrets/.env') });
const express = require('express');
const crypto = require('crypto');
const supabase = require('./supabase');

const app = express();
app.use(express.json());

const {
  FT_CLIENT_ID,
  FT_CLIENT_SECRET,
  FT_REDIRECT_URI,
  PORT = 3000,
} = process.env;

const pendingStates = new Set();

app.get('/', (req, res) => {
  res.send(`
    <h2>Torneio Mario Kart 42 - Login</h2>
    <a href="/login">Entrar com a Intra 42</a>
  `);
});

// PASSO 1: Redireciona para a Intra
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

// PASSO 2: Callback -> Pega Token -> Identifica Aluno -> Salva no Supabase
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
    // 1. Troca o code pelo token na API da 42
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

    // 2. Identifica o aluno na API da 42
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
      .select('id, intra_id, login, display_name, avatar_url, is_admin, created_at')
      .single();

    if (dbError) {
      console.error('Erro ao salvar no Supabase:', dbError);
      return res.status(500).json({ erro: 'Falha ao salvar usuário no banco', detalhe: dbError.message });
    }

    res.json({
      mensagem: 'Login realizado e salvo no Supabase com sucesso!',
      usuario: usuarioSalvo,
    });
  } catch (err) {
    console.error('Erro no fluxo:', err);
    res.status(500).json({ erro: 'Erro interno no servidor', detalhe: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});