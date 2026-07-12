import { spawn, spawnSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { loadConfig } from './config.mjs';
import { proxyExecutable, proxyStatus, startProxy } from './proxy.mjs';

export function proxyEnvironment(config) {
  const env = {
    ...process.env,
    ANTHROPIC_BASE_URL: config.baseUrl,
    ANTHROPIC_AUTH_TOKEN: config.apiToken,
    ANTHROPIC_CUSTOM_MODEL_OPTION: config.model,
    ANTHROPIC_CUSTOM_MODEL_OPTION_NAME: 'GPT-5.6 Sol via Codex',
    CLAUDE_CODE_SUBAGENT_MODEL: config.model,
    CLAUDE_CODE_ALWAYS_ENABLE_EFFORT: '1',
    CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY: String(config.concurrency),
    ENABLE_TOOL_SEARCH: 'false'
  };
  delete env.ANTHROPIC_API_KEY;
  return env;
}

function hasOption(args, name) {
  return args.some((value) => value === name || value.startsWith(`${name}=`));
}

export async function runClaude(args = [], overrides = {}) {
  const config = overrides.config ?? await loadConfig();
  await startProxy(config);
  const forwarded = [...args];
  if (!hasOption(forwarded, '--model')) forwarded.unshift('--model', overrides.model ?? config.model);
  if (!hasOption(forwarded, '--effort')) forwarded.unshift('--effort', overrides.effort ?? config.mainEffort);
  const child = spawn('claude', forwarded, {
    cwd: overrides.cwd ?? process.cwd(),
    env: proxyEnvironment(config),
    stdio: overrides.stdio ?? 'inherit',
    windowsHide: false
  });
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) reject(new Error(`Claude Code exited on signal ${signal}.`));
      else if (code !== 0) reject(new Error(`Claude Code exited with code ${code}.`));
      else resolve(code);
    });
  });
}

export async function runDoctor(config) {
  const checks = [];
  const claude = spawnSync('claude', ['--version'], { encoding: 'utf8', windowsHide: true });
  checks.push({ check: 'Claude Code', ok: claude.status === 0, detail: claude.stdout?.trim() || claude.error?.message });
  const codex = spawnSync('codex', ['--version'], { encoding: 'utf8', windowsHide: true });
  checks.push({ check: 'Codex CLI', ok: codex.status === 0, detail: codex.stdout?.trim() || codex.error?.message });
  let proxyInstalled = true;
  await access(proxyExecutable()).catch(() => { proxyInstalled = false; });
  checks.push({ check: 'CLIProxyAPI', ok: proxyInstalled, detail: proxyExecutable() });
  const status = proxyInstalled ? await startProxy(config).catch(() => ({ healthy: false, models: [] })) : { healthy: false, models: [] };
  checks.push({ check: 'Local proxy', ok: status.healthy, detail: config.baseUrl });
  checks.push({ check: `Model ${config.model}`, ok: status.models?.includes(config.model), detail: status.models?.includes(config.model) ? 'available' : `available models: ${(status.models ?? []).join(', ') || 'none'}` });
  for (const item of checks) console.log(`${item.ok ? 'PASS' : 'FAIL'}  ${item.check}  ${item.detail ?? ''}`);
  if (checks.some((item) => !item.ok)) process.exitCode = 1;
  return checks;
}
