import { describe, expect, it } from 'vitest';
import { createBackendServer } from '../../src/main.js';

describe('backend foundation', () => {
  it('creates an HTTP server without indexing behavior', () => {
    const server = createBackendServer();

    expect(server.listening).toBe(false);
    server.close();
  });
});
