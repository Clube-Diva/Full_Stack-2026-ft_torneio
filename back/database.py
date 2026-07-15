import sqlite3

DB_PATH = "torneio.db"


def conectar():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def criar_tabelas():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS grupos (
            id INTEGER PRIMARY KEY,
            nome_chave TEXT,
            nome_do_grupo TEXT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS partidas (
            id INTEGER PRIMARY KEY,
            nome TEXT,
            horario TEXT,
            estado TEXT,
            grupo_id INTEGER,
            FOREIGN KEY (grupo_id) REFERENCES grupos(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jogadores (
            id INTEGER PRIMARY KEY,
            name TEXT,
            score INTEGER DEFAULT 0,
            intra_id TEXT,
            partida_id INTEGER,
            FOREIGN KEY (partida_id) REFERENCES partidas(id)
        )
    """)

    conn.commit()
    conn.close()

def popular_dados_iniciais():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM grupos")
    if cursor.fetchone()[0] > 0:
        conn.close()
        return

    grupos_iniciais = [
        (1, "Fase Inicial", "Grupo A"),
        (4, "Grupo B - Fase Inicial", None),
    ]
    cursor.executemany(
        "INSERT INTO grupos (id, nome_chave, nome_do_grupo) VALUES (?, ?, ?)",
        grupos_iniciais
    )

    partidas_iniciais = [
        (1, "Partida 1", "18:00", "SCHEDULED", 1),
        (2, "Partida 2", "18:15", "SCHEDULED", 1),
        (3, "Partida 3", "18:30", "SCHEDULED", 1),
        (4, "Partida 4", "18:45", "SCHEDULED", 4),
        (5, "Partida 5", "19:00", "SCHEDULED", 4),
        (6, "Partida 6", "19:15", "SCHEDULED", 4),
    ]
    cursor.executemany(
        "INSERT INTO partidas (id, nome, horario, estado, grupo_id) VALUES (?, ?, ?, ?, ?)",
        partidas_iniciais
    )

    jogadores_iniciais = [
        (i, f"Jogador {i}", 0, None, partida_id)
        for partida_id in range(1, 7)
        for i in range(1 + (partida_id - 1) * 4, 5 + (partida_id - 1) * 4)
    ]
    cursor.executemany(
        "INSERT INTO jogadores (id, name, score, intra_id, partida_id) VALUES (?, ?, ?, ?, ?)",
        jogadores_iniciais
    )

    conn.commit()
    conn.close()

def buscar_estado_do_torneio():
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM grupos")
    grupos = cursor.fetchall()

    resultado = []
    for grupo in grupos:
        cursor.execute("SELECT * FROM partidas WHERE grupo_id = ?", (grupo["id"],))
        partidas = cursor.fetchall()

        lista_partidas = []
        for partida in partidas:
            cursor.execute("SELECT * FROM jogadores WHERE partida_id = ?", (partida["id"],))
            jogadores = cursor.fetchall()

            lista_partidas.append({
                "id": partida["id"],
                "nome": partida["nome"],
                "horario": partida["horario"],
                "estado": partida["estado"],
                "jogadores": [dict(j) for j in jogadores]
            })

        resultado.append({
            "id": grupo["id"],
            "nomeChave": grupo["nome_chave"],
            "nomeDoGrupo": grupo["nome_do_grupo"],
            "partidas": lista_partidas
        })

    conn.close()
    return resultado


def atualizar_score_jogador(partida_id, jogador_id, pontos):
    conn = conectar()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE jogadores SET score = score + ? WHERE id = ? AND partida_id = ?",
        (pontos, jogador_id, partida_id)
    )

    conn.commit()
    conn.close()