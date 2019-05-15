FROM node:latest
WORKDIR /app
ENV NODE_ENV development
COPY package.json package.json
RUN npm install
COPY . .
EXPOSE 3000
CMD node server.js
