# Guia de instalação do backend

## Pré-requisitos

- Python 3.11 ou superior
- pip instalado

## Instalação

No terminal, entre na pasta do backend:

```bash
cd back
pip install -r requirements.txt
```

## Rodar o servidor

Para iniciar o backend em modo desenvolvimento:

```bash
python app.py
```

O servidor ficará disponível em:

```text
http://localhost:4001
```

## Teste básico no navegador ou Postman

1. Abra o navegador ou o Postman.
2. Faça uma requisição GET para:

```text
http://localhost:4001/
```

3. O resultado esperado é uma resposta JSON como:

```json
{"message":"Servidor do ft_torneio rodando com sucesso! 🏆"}
```

Se a resposta aparecer, o backend está funcionando corretamente.
