# 🏆 Full_Stack-2026-ft_torneio

> Uma plataforma leve, rápida e em tempo real para gerenciar torneios e entreter estudantes!

O **ft_torneio** nasceu para resolver aquela velha bagunça na hora de organizar campeonatos entre amigos da faculdade ou da escola. Chega de usar papel de pão ou planilhas complexas. Com uma interface simples e atualização em tempo real, organizar o próximo campeonato de FIFA, Counter-Strike, Xadrez ou Pingue-Pongue ficou muito mais divertido.

---

## 🚀 Tecnologias Utilizadas

Para que o projeto fosse dinâmico e responsivo, escolhemos a "santíssima trindade" do tempo real:

* **Frontend:** React (Interface moderna, rápida e componentizada)
* **Backend:** FastAPI + python-socketio (Robustez no servidor e tempo real)
* **Comunicação:** Socket.io (O coração do projeto, garantindo que as atualizações dos placares e chaves aconteçam **ao vivo** para todos os usuários conectados)

---

## ✨ Funcionalidades Principais

* 🔄 **Atualização em Tempo Real:** Altere o resultado em uma tela e veja a mágica acontecer em todas as outras sem precisar dar F5.
* 📊 **Chaves Automatizadas:** Criação visual do chaveamento do torneio de forma simples.
* 🎯 **Foco em Entretenimento:** Feito de estudante para estudante, com foco na resenha e na diversão.

---

## 🛠️ Como Rodar o Projeto na Sua Máquina

Para colocar o torneio de pé no Lab da faculdade ou no seu PC, siga os passos abaixo:

### Pré-requisitos
Você vai precisar do **Node.js** e do **npm** instalados.

O frontend usa **Node 20.19.0**. Se o seu ambiente estiver com uma versão mais antiga, os scripts do front baixam e usam essa versão automaticamente na primeira execução.

### 1. Clonar o Repositório
```bash
git clone https://github.com/Clube-Diva/Full_Stack-2026-ft_torneio.git
cd Full_Stack-2026-ft_torneio
```
2. Configurar o Backend
```bash
# Entre na pasta do servidor
cd back

# Instale as dependências Python
pip install -r requirements.txt

# Inicie o servidor
python app.py
```
3. Configurar o Frontend
```bash
# Abra um novo terminal e entre na pasta do front
cd front/ft_torneio

# Instale as dependências
npm install

# Inicie a aplicação React
npm run dev
```
Agora é só abrir http://localhost:5173 no seu navegador e começar a jogatina! 🎮

## 🤝 Como Contribuir

Achou algum erro ou possiveis melhorias, entre para o clube D.i.V.A. crie, melhore e aprenda.
📝 Licença
Este projeto está sob a licença MIT. Sinta-se livre para usar, modificar e rodar campeonatos na sua instituição!

⭐ Gostou do projeto? Deixa uma estrelinha para motivar o time de dev!
