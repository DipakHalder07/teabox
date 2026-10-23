# TeaPay WhatsApp service. Mount a persistent volume at /app/auth so the login survives restarts.
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY server.mjs ./
ENV WHATSAPP_AUTH_DIR=/app/auth
EXPOSE 7071
CMD ["node", "server.mjs"]
