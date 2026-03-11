FROM node:20-alpine

WORKDIR /app

# 1. Copia config Root
COPY package*.json ./

# 2. Instala dependências do server
RUN npm install

# 3. Copia todo o código-fonte
COPY . .

# 4. Compila Frontend Admin, SQLite Seed e Prisma Client
RUN npm run build

# 5. Configurações de Deploy Easypanel
EXPOSE 3000
ENV PORT=3000

# 6. Inicializa o Backend
CMD ["npm", "start"]
