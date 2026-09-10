import { describe, expect, it } from 'vitest';
import prettierConfig from '../.prettierrc.json';

describe('code quality tooling', () => {
  it('defines the expected prettier configuration', () => {
    expect(prettierConfig.singleQuote).toBe(true);
    expect(prettierConfig.semi).toBe(true);
    expect(prettierConfig.printWidth).toBe(100);
  });
});
