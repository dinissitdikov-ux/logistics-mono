FROM node:20
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
COPY prisma ./prisma

RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["sh","-c","npx prisma migrate deploy && node server.js"]
