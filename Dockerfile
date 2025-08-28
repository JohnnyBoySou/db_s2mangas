# Stage 1: Build
FROM node:20 AS builder

WORKDIR /usr/src/app

# Copia apenas os arquivos necessários primeiro para otimizar cache
COPY package*.json ./

# Copia o diretório Prisma completo antes do npm install (necessário para postinstall)
COPY src/prisma/ ./src/prisma/

# Instala TODAS as dependências (incluindo dev para build)
RUN npm install --legacy-peer-deps

# Copia todo o código
COPY . .

# Compila o TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20

WORKDIR /usr/src/app

# Copia apenas o necessário do build anterior
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/prisma ./src/prisma
COPY --from=builder /usr/src/app/src/import ./src/import
COPY --from=builder /usr/src/app/src/templates ./src/templates
COPY --from=builder /usr/src/app/dist/templates ./dist/templates
COPY --from=builder /usr/src/app/start.js ./

# Variáveis de ambiente (opcional)
ENV NODE_ENV=production

# Expõe a porta
EXPOSE 3000

# Comando para rodar a aplicação usando o script start do package.json
CMD ["npm", "start"]
