import { spawn } from 'node:child_process';
import { proxyEnvironment } from './claude.mjs';
import { startProxy } from './proxy.mjs';

function parseArgs(args, config) {
  const options = {
    agents: config.agents,
    concurrency: config.concurrency,
    agentEffort: config.agentEffort,
    mainEffort: config.mainEffort,
    task: ''
  };
  const taskParts = [];
  let afterSeparator = false;
  for (let i = 0; i < args.length; i += 1) {
    const value = args[i];
    if (value === '--') { afterSeparator = true; continue; }
    if (!afterSeparator && value === '--agents') options.agents = Number.parseInt(args[++i], 10);
    else if (!afterSeparator && value === '--concurrency') options.concurrency = Number.parseInt(args[++i], 10);
    else if (!afterSeparator && value === '--agent-effort') options.agentEffort = args[++i];
    else if (!afterSeparator && value === '--main-effort') options.mainEffort = args[++i];
    else taskParts.push(value);
  }
  if (!Number.isInteger(options.agents) || options.agents < 1 || options.agents > 32) throw new Error('--agents must be between 1 and 32.');
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 16) throw new Error('--concurrency must be between 1 and 16.');
  for (const effort of [options.agentEffort, options.mainEffort]) {
    if (!['low', 'medium', 'high', 'xhigh', 'max'].includes(effort)) throw new Error(`Unsupported effort: ${effort}`);
  }
  options.task = taskParts.join(' ').trim();
  if (!options.task) throw new Error('Provide a task after --.');
  return options;
}

function claudePrint(prompt, { config, effort, cwd = process.cwd() }) {
  const args = [
    '-p', prompt,
    '--model', config.model,
    '--effort', effort,
    '--permission-mode', 'plan',
    '--output-format', 'text',
    '--no-session-persistence'
  ];
  const child = spawn('claude', args, {
    cwd,
    env: proxyEnvironment(config),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  let stdout = '';
  let stderr = '';
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(stderr.trim() || `investigator exited with code ${code}`)));
  });
}

async function runPool(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      results[index] = await tasks[index]();
      console.error(`Investigator ${index + 1}/${tasks.length} complete.`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
  return results;
}

export async function runTeam(args, config) {
  const options = parseArgs(args, config);
  await startProxy(config);
  console.error(`Launching ${options.agents} investigators at ${options.agentEffort} effort (concurrency ${options.concurrency}).`);
  const jobs = Array.from({ length: options.agents }, (_, index) => () => claudePrint(
    `You are independent investigator ${index + 1} of ${options.agents}. Analyze the task from a distinct angle. Work read-only. Return concise evidence, risks, and a recommended action.\n\nTask:\n${options.task}`,
    { config, effort: options.agentEffort }
  ));
  const findings = await runPool(jobs, options.concurrency);
  console.error(`Synthesizing at ${options.mainEffort} effort.`);
  const evidence = findings.map((finding, index) => `## Investigator ${index + 1}\n${finding}`).join('\n\n');
  const synthesis = await claudePrint(
    `Synthesize the independent investigations below into one decisive answer. Resolve contradictions, preserve concrete evidence, and state uncertainty.\n\nOriginal task:\n${options.task}\n\n${evidence}`,
    { config, effort: options.mainEffort }
  );
  console.log(synthesis);
}

export { parseArgs };
