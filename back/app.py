from typing import Any

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


estado_do_torneio: list[dict[str, Any]] = [
    {
        "id": 1,
        "nomeChave": "Fase Inicial",
        "nomeDoGrupo": "Grupo A",
        "partidas": [
            {
                "id": 1,
                "nome": "Partida 1",
                "horario": "18:00",
                "estado": "SCHEDULED",
                "jogadores": [
                    {"id": 1, "name": "Jogador 1", "score": 0},
                    {"id": 2, "name": "Jogador 2", "score": 0},
                    {"id": 3, "name": "Jogador 3", "score": 0},
                    {"id": 4, "name": "Jogador 4", "score": 0},
                ],
            },
            {
                "id": 2,
                "nome": "Partida 2",
                "horario": "18:15",
                "estado": "SCHEDULED",
                "jogadores": [
                    {"id": 5, "name": "Jogador 5", "score": 0},
                    {"id": 6, "name": "Jogador 6", "score": 0},
                    {"id": 7, "name": "Jogador 7", "score": 0},
                    {"id": 8, "name": "Jogador 8", "score": 0},
                ],
            },
            {
                "id": 3,
                "nome": "Partida 3",
                "horario": "18:30",
                "estado": "SCHEDULED",
                "jogadores": [
                    {"id": 9, "name": "Jogador 9", "score": 0},
                    {"id": 10, "name": "Jogador 10", "score": 0},
                    {"id": 11, "name": "Jogador 11", "score": 0},
                    {"id": 12, "name": "Jogador 12", "score": 0},
                ],
            },
        ],
    },
    {
        "id": 4,
        "nomeChave": "Grupo B - Fase Inicial",
        "partidas": [
            {
                "id": 4,
                "nome": "Partida 4",
                "horario": "18:45",
                "estado": "SCHEDULED",
                "jogadores": [
                    {"id": 13, "name": "Jogador 13", "score": 0},
                    {"id": 14, "name": "Jogador 14", "score": 0},
                    {"id": 15, "name": "Jogador 15", "score": 0},
                    {"id": 16, "name": "Jogador 16", "score": 0},
                ],
            },
            {
                "id": 5,
                "nome": "Partida 5",
                "horario": "19:00",
                "estado": "SCHEDULED",
                "jogadores": [
                    {"id": 17, "name": "Jogador 17", "score": 0},
                    {"id": 18, "name": "Jogador 18", "score": 0},
                    {"id": 19, "name": "Jogador 19", "score": 0},
                    {"id": 20, "name": "Jogador 20", "score": 0},
                ],
            },
            {
                "id": 6,
                "nome": "Partida 6",
                "horario": "19:15",
                "estado": "SCHEDULED",
                "jogadores": [
                    {"id": 21, "name": "Jogador 21", "score": 0},
                    {"id": 22, "name": "Jogador 22", "score": 0},
                    {"id": 23, "name": "Jogador 23", "score": 0},
                    {"id": 24, "name": "Jogador 24", "score": 0},
                ],
            },
        ],
    },
]


fastapi_app = FastAPI()
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")


@fastapi_app.get("/")
async def healthcheck() -> dict[str, str]:
    return {"message": "Servidor do ft_torneio rodando com sucesso! 🏆"}


@sio.event
async def connect(sid, environ, auth):
    print(f"⚡ Usuário conectado: {sid}")
    await sio.emit("vagas_atualizadas", estado_do_torneio, to=sid)


@sio.event
async def atualizar_placar(sid, dados_da_partida):
    partida_id = dados_da_partida.get("partidaId")
    jogador_id = dados_da_partida.get("jogadorId")
    pontos = dados_da_partida.get("pontos", 0)

    for grupo in estado_do_torneio:
        partida = next((p for p in grupo["partidas"] if p["id"] == partida_id), None)
        if partida is None:
            continue

        jogador = next((j for j in partida["jogadores"] if j["id"] == jogador_id), None)
        if jogador is not None:
            jogador["score"] += pontos
        break

    print(f"Placar atualizado: {dados_da_partida}")
    await sio.emit("vagas_atualizadas", estado_do_torneio)


@sio.event
async def disconnect(sid):
    print(f"❌ Usuário desconectado: {sid}")


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="socket.io")


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=4001, reload=True)