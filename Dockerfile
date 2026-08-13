FROM node:22-alpine

WORKDIR /app

# Staging listens on 5001; prod commonly uses 5000 — APP_PORT from env wins at runtime.
ENV APP_PORT=5001
ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.APP_PORT||5001)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
