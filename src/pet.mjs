import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourcePetDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'pet', 'claudex');

function quoteTomlString(value) {
  return JSON.stringify(value);
}

export function upsertSelectedAvatar(configText, avatarId = 'claudex') {
  const eol = configText.includes('\r\n') ? '\r\n' : '\n';
  const hadTrailingNewline = /\r?\n$/.test(configText);
  const lines = configText ? configText.split(/\r?\n/) : [];
  if (hadTrailingNewline) lines.pop();

  const desktopStart = lines.findIndex((line) => /^\s*\[desktop\]\s*(?:#.*)?$/.test(line));
  const selectionLine = `selected-avatar-id = ${quoteTomlString(avatarId)}`;

  if (desktopStart === -1) {
    if (lines.length && lines.at(-1).trim()) lines.push('');
    lines.push('[desktop]', selectionLine);
  } else {
    let desktopEnd = lines.length;
    for (let index = desktopStart + 1; index < lines.length; index += 1) {
      if (/^\s*\[\[?[^\]]+\]\]?\s*(?:#.*)?$/.test(lines[index])) {
        desktopEnd = index;
        break;
      }
    }

    const selectedIndex = lines.findIndex(
      (line, index) => index > desktopStart && index < desktopEnd && /^\s*selected-avatar-id\s*=/.test(line)
    );
    if (selectedIndex === -1) lines.splice(desktopStart + 1, 0, selectionLine);
    else lines[selectedIndex] = selectionLine;
  }

  return `${lines.join(eol)}${eol}`;
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function installPet({ codexHome = process.env.CODEX_HOME || join(homedir(), '.codex'), select = true } = {}) {
  const targetDirectory = join(codexHome, 'pets', 'claudex');
  const sourceManifest = join(sourcePetDirectory, 'pet.json');
  const sourceSpritesheet = join(sourcePetDirectory, 'spritesheet.webp');

  if (!(await fileExists(sourceManifest)) || !(await fileExists(sourceSpritesheet))) {
    throw new Error(`Bundled Claudex pet resources are missing from ${sourcePetDirectory}`);
  }

  await mkdir(targetDirectory, { recursive: true });
  await copyFile(sourceManifest, join(targetDirectory, 'pet.json'));
  await copyFile(sourceSpritesheet, join(targetDirectory, 'spritesheet.webp'));

  let configPath = null;
  let backupPath = null;
  if (select) {
    await mkdir(codexHome, { recursive: true });
    configPath = join(codexHome, 'config.toml');
    const configExists = await fileExists(configPath);
    const currentConfig = configExists ? await readFile(configPath, 'utf8') : '';
    if (configExists) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      backupPath = `${configPath}.backup-claudex-${stamp}`;
      await copyFile(configPath, backupPath);
    }
    await writeFile(configPath, upsertSelectedAvatar(currentConfig), 'utf8');
  }

  return { targetDirectory, configPath, backupPath, selected: select };
}
