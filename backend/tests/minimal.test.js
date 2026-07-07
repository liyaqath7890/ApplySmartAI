import { app } from '../../src/server.js';

describe('Minimal Import Test', () => {
  it('should import app successfully', () => {
    expect(app).toBeDefined();
  });
});
