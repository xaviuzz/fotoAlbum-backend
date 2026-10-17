FROM oven/bun:1.4.3-slim
WORKDIR /app
COPY package.json ./
COPY src ./src
EXPOSE 3000
CMD ["bun", "run", "start"]
