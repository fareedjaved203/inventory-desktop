/**
 * Returns the spawn configuration for the backend server process.
 * In production (isDev=false), uses Electron's bundled Node.js runtime
 * with ELECTRON_RUN_AS_NODE=1. In development, uses system 'node'.
 *
 * @param {boolean} isDev - Whether the app is running in development mode
 * @param {object} env - The base environment variables to pass to the spawned process
 * @returns {{ execPath: string, spawnEnv: object }}
 */
function getSpawnConfig(isDev, env) {
  const execPath = isDev ? 'node' : process.execPath;
  const spawnEnv = isDev ? env : { ...env, ELECTRON_RUN_AS_NODE: '1' };
  return { execPath, spawnEnv };
}

module.exports = { getSpawnConfig };
