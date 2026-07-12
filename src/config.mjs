import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const appDir = join(homedir(), '.claudex');
export const configPath = join(appDir, 'config.json');
export const proxyDir = join(appDir, 'cliproxy');
export const proxyConfigPath = join(proxyDir, 'config.yaml');

export const defaults = Object.freeze({
  baseUrl: 'http://127.0.0.1:8317',
  model: 'gpt-5.6-sol',
  mainEffort: 'high',
  agentEffort: 'medium',
  agents: 8,
  concurrency: 3,
  proxyVersion: 'latest'
});

export async function loadConfig() {
  let raw;
  try {
    raw = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('Not configured. Run: claudex setup');
    throw error;
  }
  return { ...defaults, ...raw };
}

export async function setupConfig() {
  await mkdir(proxyDir, { recursive: true });
  let existing = {};
  try {
    existing = JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const config = {
    ...defaults,
    ...existing,
    apiToken: existing.apiToken || `claudex-${randomBytes(24).toString('hex')}`
  };
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  if (process.platform !== 'win32') await chmod(configPath, 0o600);
  await writeProxyConfig(config);
  return config;
}

export async function updateConfig(key, value) {
  const allowed = new Set(['model', 'mainEffort', 'agentEffort', 'agents', 'concurrency']);
  if (!allowed.has(key)) throw new Error(`Unsupported key: ${key}`);
  if (value == null || value === '') throw new Error('A value is required.');
  const config = await loadConfig();
  if (['agents', 'concurrency'].includes(key)) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 32) throw new Error(`${key} must be between 1 and 32.`);
    config[key] = parsed;
  } else if (['mainEffort', 'agentEffort'].includes(key)) {
    if (!['low', 'medium', 'high', 'xhigh', 'max'].includes(value)) throw new Error('Effort must be low, medium, high, xhigh or max.');
    config[key] = value;
  } else {
    config[key] = value;
  }
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  if (process.platform !== 'win32') await chmod(configPath, 0o600);
  await writeProxyConfig(config);
}

export async function writeProxyConfig(config) {
  const escapedToken = String(config.apiToken).replaceAll('"', '\\"');
  const yaml = `host: "127.0.0.1"
port: 8317
tls:
  enable: false
  cert: ""
  key: ""
remote-management:
  allow-remote: false
  secret-key: ""
  disable-control-panel: true
auth-dir: "~/.cli-proxy-api"
api-keys:
  - "${escapedToken}"
debug: false
request-log: false
usage-statistics-enabled: true
request-retry: 2
oauth-model-alias: {}
`;
  await mkdir(proxyDir, { recursive: true });
  await writeFile(proxyConfigPath, yaml, { mode: 0o600 });
  if (process.platform !== 'win32') await chmod(proxyConfigPath, 0o600);
}
