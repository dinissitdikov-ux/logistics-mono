FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
COPY prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD ["sh","-c","npx prisma migrate deploy && node server.js"]
