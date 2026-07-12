#!/usr/bin/env node

import { loadConfig, setupConfig, updateConfig } from '../src/config.mjs';
import { authenticate, installProxy, proxyStatus, startProxy, stopProxy } from '../src/proxy.mjs';
import { runClaude, runDoctor } from '../src/claude.mjs';
import { runTeam } from '../src/team.mjs';

const args = process.argv.slice(2);
const command = args[0];

function help() {
  console.log(`claudex - Claude Code harness, Codex-authenticated GPT model

Usage:
  claudex                         Start interactive Claude Code with GPT-5.6 Sol
  claudex --continue              Forward normal Claude Code arguments
  claudex setup                   Install CLIProxyAPI and create local config
  claudex auth codex|claude       Run the provider OAuth login
  claudex proxy start|stop|status Manage the local proxy
  claudex doctor                  Check binaries, proxy, auth and model routing
  claudex config                  Show safe, non-secret configuration
  claudex config set <key> <val>  Set model, mainEffort, agentEffort or concurrency
  claudex team [options] -- <task> Run medium-effort investigators and high-effort synthesis

Team options:
  --agents <n>                    Number of independent investigators (default 8)
  --concurrency <n>               Maximum simultaneous investigators (default 3)
  --agent-effort <level>          Investigator effort (default medium)
  --main-effort <level>           Synthesis effort (default high)
`);
}

try {
  if (!command || command.startsWith('-')) {
    await runClaude(args);
  } else if (command === 'setup') {
    const config = await setupConfig();
    await installProxy(config);
    console.log('Setup complete. Next run: claudex auth codex');
    console.log('Optional reverse route: claudex auth claude');
  } else if (command === 'auth') {
    const provider = args[1];
    if (!['codex', 'claude'].includes(provider)) throw new Error('Use: claudex auth codex|claude');
    await authenticate(provider, await loadConfig());
  } else if (command === 'proxy') {
    const action = args[1] ?? 'status';
    const config = await loadConfig();
    if (action === 'start') await startProxy(config);
    else if (action === 'stop') await stopProxy(config);
    else if (action === 'status') console.log(JSON.stringify(await proxyStatus(config), null, 2));
    else throw new Error('Use: claudex proxy start|stop|status');
  } else if (command === 'doctor') {
    await runDoctor(await loadConfig());
  } else if (command === 'team') {
    await runTeam(args.slice(1), await loadConfig());
  } else if (command === 'config') {
    if (args[1] === 'set') {
      await updateConfig(args[2], args[3]);
      console.log(`Updated ${args[2]}.`);
    } else {
      const { apiToken: _hidden, ...safe } = await loadConfig();
      console.log(JSON.stringify({ ...safe, apiToken: '<redacted>' }, null, 2));
    }
  } else if (command === 'help' || command === '--help' || command === '-h') {
    help();
  } else {
    await runClaude(args);
  }
} catch (error) {
  console.error(`claudex: ${error.message}`);
  process.exitCode = 1;
}
