import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

function pathDirectories() {
  return (process.env.PATH ?? '')
    .split(delimiter)
    .map((entry) => entry.trim().replace(/^"|"$/g, ''))
    .filter(Boolean);
}

function firstExisting(name) {
  for (const directory of pathDirectories()) {
    for (const extension of ['.exe', '.ps1', '.cmd', '.bat']) {
      const candidate = join(directory, `${name}${extension}`);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

export function resolveCommand(name, args = []) {
  if (process.platform !== 'win32') return { command: name, args };
  const executable = firstExisting(name);
  if (!executable) return { command: name, args };
  if (executable.toLowerCase().endsWith('.ps1')) {
    return {
      command: 'powershell.exe',
      args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', executable, ...args]
    };
  }
  if (/\.(cmd|bat)$/i.test(executable)) {
    const ps1 = executable.replace(/\.(cmd|bat)$/i, '.ps1');
    if (existsSync(ps1)) {
      return {
        command: 'powershell.exe',
        args: ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, ...args]
      };
    }
  }
  return { command: executable, args };
}
