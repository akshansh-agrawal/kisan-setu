FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.cjs ./
COPY server ./server
COPY dist ./dist
ENV NODE_ENV=production PORT=8787
EXPOSE 8787
USER node
CMD ["node", "server.cjs"]
