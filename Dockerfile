# Use uma imagem Node LTS
FROM node:18

# Cria diretório de trabalho
WORKDIR /usr/src/app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências incluindo devDependencies para build
RUN npm install --legacy-peer-deps

# Copia o restante da aplicação
COPY . .

# Gera Prisma Client
RUN npx prisma generate

# Compila o TypeScript
RUN npm run build

# Expõe a porta que a API roda
EXPOSE 3000

# Comando para rodar a aplicação compilada
CMD ["node", "dist/server.js"]
