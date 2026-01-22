FROM node:20-slim
RUN apt-get update && apt-get install -y \
  libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev librsvg2-dev \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdbus-1-3 libxkbcommon0 libx11-6 libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 libgbm1 libpangocairo-1.0-0 libasound2 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json .
RUN npm install
COPY index.js .
EXPOSE 3000
CMD ["node", "index.js"]
