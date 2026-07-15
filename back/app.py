from typing import Any

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import criar_tabelas, popular_dados_iniciais, buscar_estado_do_torneio, atualizar_score_jogador

fastapi_app = FastAPI()
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

criar_tabelas()
popular_dados_iniciais()

@fastapi_app.get("/")
async def healthcheck() -> dict[str, str]:
    return {"message": "Servidor do ft_torneio rodando com sucesso! 🏆"}



@sio.event
async def connect(sid, environ, auth):
    print(f"⚡ Usuário conectado: {sid}")
    estado_atual = buscar_estado_do_torneio()
    await sio.emit("vagas_atualizadas", estado_atual, to=sid)

@sio.event
async def atualizar_placar(sid, dados_da_partida):
    partida_id = dados_da_partida.get("partidaId")
    jogador_id = dados_da_partida.get("jogadorId")
    pontos = dados_da_partida.get("pontos", 0)

    atualizar_score_jogador(partida_id, jogador_id, pontos)

    print(f"Placar atualizado: {dados_da_partida}")
    estado_atualizado = buscar_estado_do_torneio()
    await sio.emit("vagas_atualizadas", estado_atualizado)

@sio.event
async def disconnect(sid):
    print(f"❌ Usuário desconectado: {sid}")


app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app, socketio_path="socket.io")


if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=4001, reload=True)