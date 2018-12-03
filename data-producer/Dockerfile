FROM node:8
MAINTAINER Can Elmas <can@commencis.com>

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]
