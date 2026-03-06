FROM node:22-alpine

WORKDIR /src

# ✅ build deps pour sqlite3
RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
RUN npm ci

COPY . .

RUN mkdir -p /src/data

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_FILE=/src/data/database.sqlite

EXPOSE 5000
CMD ["npm", "start"]