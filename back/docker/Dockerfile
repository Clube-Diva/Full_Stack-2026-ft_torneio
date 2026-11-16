FROM node:22-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependências primeiro (aproveita o cache do Docker)
COPY package*.json ./

# Instala todas as dependências (incluindo nodemon para ambiente dev)
RUN npm install

# Copia o código da aplicação
COPY src ./src

# Expõe a porta configurada no Express
EXPOSE 3000

# Comando padrão (em dev será sobrescrito pelo docker-compose)
CMD ["npm", "start"]