import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, presets } from '../src/config.mjs';
import { parseArgs } from '../src/team.mjs';

test('team defaults right-size investigators', () => {
  const parsed = parseArgs(['--', 'review', 'this', 'repo'], { ...defaults, apiToken: 'test' });
  assert.equal(parsed.agents, 8);
  assert.equal(parsed.concurrency, 3);
  assert.equal(parsed.agentEffort, 'medium');
  assert.equal(parsed.mainEffort, 'high');
  assert.equal(parsed.task, 'review this repo');
});

test('team accepts explicit effort and concurrency', () => {
  const parsed = parseArgs(['--agents', '4', '--concurrency', '2', '--agent-effort', 'low', '--main-effort', 'xhigh', '--', 'inspect'], defaults);
  assert.deepEqual(
    { agents: parsed.agents, concurrency: parsed.concurrency, agentEffort: parsed.agentEffort, mainEffort: parsed.mainEffort },
    { agents: 4, concurrency: 2, agentEffort: 'low', mainEffort: 'xhigh' }
  );
});

test('team rejects missing task', () => {
  assert.throws(() => parseArgs([], defaults), /Provide a task/);
});

test('balanced preset keeps main high and investigators medium', () => {
  assert.deepEqual(
    { mainEffort: presets.balanced.mainEffort, agentEffort: presets.balanced.agentEffort, concurrency: presets.balanced.concurrency },
    { mainEffort: 'high', agentEffort: 'medium', concurrency: 3 }
  );
});
