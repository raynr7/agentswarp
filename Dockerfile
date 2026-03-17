FROM oven/bun:alpine
WORKDIR /app
COPY package.json .
RUN bun install --production
COPY src/ ./src/
COPY public/ ./public/
EXPOSE 3000
ENV PORT=3000
CMD ["bun", "run", "src/main.ts"]
