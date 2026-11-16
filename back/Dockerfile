FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (aproveita o cache do Docker)
COPY package*.json ./

# Instala todas as dependências (incluindo nodemon para ambiente dev)
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Expõe a porta configurada no Express
EXPOSE 3000

# Comando padrão (em dev será sobrescrito pelo docker-compose)
CMD ["npm", "start"]