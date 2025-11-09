FROM node:20

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 5000

CMD bash -lc "node database/setup.js && node server.js"
