FROM node:24.19.0-bookworm@sha256:4196d66a565c6f195728d9952f161f4adfe2ad753052a08b7ec7f1c5a6bda42b
RUN apt-get update && apt-get install -y --no-install-recommends openssl docker.io ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --fetch-timeout=30000 --fetch-retries=1 --no-audit --no-fund
COPY . .
RUN mkdir -p .test-runtime && chown node:node .test-runtime
USER node
CMD ["npm", "start"]
