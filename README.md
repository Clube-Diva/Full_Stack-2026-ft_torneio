# Torneio Mario Kart 42

Backend Node.js para autenticação pela Intra 42 e persistência de usuários no Supabase.

## Estrutura

- `src/`: servidor Express e cliente Supabase.
- `docker/`: Dockerfile e configuração do Docker Compose.
- `secrets/`: arquivo local de variáveis de ambiente e modelo `.env.example`.
- `data/`: dados de exemplo do torneio.

## Configuração local

1. Copie `secrets/.env.example` para `secrets/.env` e preencha as credenciais.
2. Na raiz do projeto, instale as dependências e inicie o servidor:

   ```sh
   npm install
   npm run dev
   ```

O servidor fica disponível em `http://localhost:3000`.

## Docker

Com `secrets/.env` configurado, inicie o serviço a partir da raiz:

```sh
docker compose -f docker/docker-compose.yml up --build
```

Não versionar `secrets/.env` nem incluir credenciais em imagens Docker.
