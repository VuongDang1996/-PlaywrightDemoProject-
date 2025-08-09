FROM mcr.microsoft.com/playwright:v1.45.1-jammy

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
