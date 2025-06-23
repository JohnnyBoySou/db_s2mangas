# Use uma imagem Node LTS
FROM node:18

# Cria diretório de trabalho
WORKDIR /usr/src/app

# Copia arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install --production

# Copia o restante da aplicação
COPY . .

# Gera Prisma Client
RUN npx prisma generate

# Expõe a porta que a API roda (ajuste se for diferente)
EXPOSE 3000

# Comando para rodar a aplicação
CMD ["node", "dist/index.js"]
