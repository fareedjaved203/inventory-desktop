import { describe, it, expect } from 'vitest';
import { getSpawnConfig } from './spawn-config.js';

const baseEnv = {
  PORT: '3000',
  NODE_ENV: 'production',
  ELECTRON_APP: 'true',
  DATABASE_URL: 'file:/some/path/inventory.db',
  ELECTRON_USER_DATA: '/some/path/userData',
};

// 3.1 - Production mode spawn uses process.execPath and includes ELECTRON_RUN_AS_NODE
describe('getSpawnConfig - production mode (isDev=false)', () => {
  it('uses process.execPath as the executable', () => {
    const { execPath } = getSpawnConfig(false, baseEnv);
    expect(execPath).toBe(process.execPath);
  });

  it('includes ELECTRON_RUN_AS_NODE="1" in the environment', () => {
    const { spawnEnv } = getSpawnConfig(false, baseEnv);
    expect(spawnEnv.ELECTRON_RUN_AS_NODE).toBe('1');
  });
});

// 3.2 - Development mode spawn uses 'node' and does not include ELECTRON_RUN_AS_NODE
describe('getSpawnConfig - development mode (isDev=true)', () => {
  it("uses 'node' as the executable", () => {
    const { execPath } = getSpawnConfig(true, baseEnv);
    expect(execPath).toBe('node');
  });

  it('does not include ELECTRON_RUN_AS_NODE in the environment', () => {
    const { spawnEnv } = getSpawnConfig(true, baseEnv);
    expect(spawnEnv).not.toHaveProperty('ELECTRON_RUN_AS_NODE');
  });
});

// 3.3 - All other environment variables are passed through in both modes
describe('getSpawnConfig - environment variable passthrough', () => {
  it('passes PORT, NODE_ENV, ELECTRON_APP, DATABASE_URL in production mode', () => {
    const { spawnEnv } = getSpawnConfig(false, baseEnv);
    expect(spawnEnv.PORT).toBe('3000');
    expect(spawnEnv.NODE_ENV).toBe('production');
    expect(spawnEnv.ELECTRON_APP).toBe('true');
    expect(spawnEnv.DATABASE_URL).toBe('file:/some/path/inventory.db');
  });

  it('passes PORT, NODE_ENV, ELECTRON_APP, DATABASE_URL in development mode', () => {
    const { spawnEnv } = getSpawnConfig(true, baseEnv);
    expect(spawnEnv.PORT).toBe('3000');
    expect(spawnEnv.NODE_ENV).toBe('production');
    expect(spawnEnv.ELECTRON_APP).toBe('true');
    expect(spawnEnv.DATABASE_URL).toBe('file:/some/path/inventory.db');
  });
});
