import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

export function handleRequest(_request: IncomingMessage, response: ServerResponse): void {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ service: 'tensor-chain-indexer-backend', status: 'ok' }));
}

export function createBackendServer() {
  return createServer(handleRequest);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 3000);
  createBackendServer().listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}
