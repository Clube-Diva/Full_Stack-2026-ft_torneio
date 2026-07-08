# Guia de instalação do backend

## Pré-requisitos

- Node.js instalado
- npm instalado

## Instalação

No terminal, entre na pasta do backend:

```bash
cd back
npm install
```

## Rodar o servidor

Para iniciar o backend em modo desenvolvimento:

```bash
npm run dev
```

Ou, para rodar em modo normal:

```bash
npm start
```

O servidor ficará disponível em:

```text
http://localhost:4000
```

## Teste básico no Postman

1. Abra o Postman.
2. Crie uma nova requisição do tipo GET.
3. Coloque a URL:

```text
http://localhost:4000/
```

4. Clique em Send.
5. O resultado esperado é um status 200 e uma resposta como:

```text
Servidor do ft_torneio rodando com sucesso! 🏆
```

Se a resposta aparecer, o backend está funcionando corretamente.
