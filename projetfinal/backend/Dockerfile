FROM node:22-bookworm

WORKDIR /src

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p /src/data

ENV PORT=5000
ENV DB_FILE=/src/data/database.sqlite

EXPOSE 5000

CMD ["npm", "run", "dev"]