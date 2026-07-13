import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installPet, upsertSelectedAvatar } from '../src/pet.mjs';

test('selected avatar is inserted into an existing desktop section', () => {
  const input = ['model = "gpt-test"', '', '[desktop]', 'show-context-window-usage = true', '', '[features]', 'memories = true', ''].join('\n');
  const output = upsertSelectedAvatar(input);
  assert.match(output, /\[desktop\]\nselected-avatar-id = "claudex"\nshow-context-window-usage/);
});

test('selected avatar is replaced without adding a duplicate', () => {
  const input = ['[desktop]', 'selected-avatar-id = "codex"', 'avatar-overlay-mascot-width-px = 112', ''].join('\n');
  const output = upsertSelectedAvatar(input);
  assert.equal(output.match(/selected-avatar-id/g)?.length, 1);
  assert.match(output, /selected-avatar-id = "claudex"/);
});

test('pet installer copies the v2 package and selects Claudex', async () => {
  const codexHome = await mkdtemp(join(tmpdir(), 'claudex-pet-test-'));
  try {
    await writeFile(join(codexHome, 'config.toml'), '[desktop]\nselected-avatar-id = "codex"\n', 'utf8');
    const result = await installPet({ codexHome });
    const manifest = JSON.parse(await readFile(join(result.targetDirectory, 'pet.json'), 'utf8'));
    const config = await readFile(join(codexHome, 'config.toml'), 'utf8');
    const spritesheet = await readFile(join(result.targetDirectory, 'spritesheet.webp'));

    assert.equal(manifest.id, 'claudex');
    assert.equal(manifest.spriteVersionNumber, 2);
    assert.ok(spritesheet.length > 0);
    assert.match(config, /selected-avatar-id = "claudex"/);
    assert.ok(result.backupPath);
  } finally {
    await rm(codexHome, { recursive: true, force: true });
  }
});
