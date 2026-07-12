import { createHash } from 'node:crypto';
import { access, chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { arch, platform } from 'node:os';
import { basename, join } from 'node:path';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { spawn, spawnSync } from 'node:child_process';
import { proxyConfigPath, proxyDir } from './config.mjs';

const repo = 'router-for-me/CLIProxyAPI';

function platformAsset(assets) {
  const os = platform() === 'win32' ? 'windows' : platform() === 'darwin' ? 'darwin' : platform() === 'linux' ? 'linux' : null;
  const cpu = arch() === 'arm64' ? (os === 'darwin' ? 'aarch64' : 'aarch64') : arch() === 'x64' ? 'amd64' : null;
  if (!os || !cpu) throw new Error(`Unsupported platform: ${platform()}/${arch()}`);
  const extension = os === 'windows' ? '.zip' : '.tar.gz';
  const expected = `_${os}_${cpu}${extension}`;
  const asset = assets.find((item) => item.name.endsWith(expected) && !item.name.includes('no-plugin'));
  if (!asset) throw new Error(`No CLIProxyAPI release asset for ${os}/${cpu}.`);
  return asset;
}

export function proxyExecutable() {
  return join(proxyDir, platform() === 'win32' ? 'cli-proxy-api.exe' : 'cli-proxy-api');
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'claudex' } });
  if (!response.ok) throw new Error(`GitHub request failed: HTTP ${response.status}`);
  return response.json();
}

async function download(url, target) {
  const response = await fetch(url, { headers: { 'User-Agent': 'claudex' }, redirect: 'follow' });
  if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`);
  await finished(Readable.fromWeb(response.body).pipe(createWriteStream(target)));
}

async function sha256(path) {
  const hash = createHash('sha256');
  hash.update(await readFile(path));
  return hash.digest('hex');
}

export async function installProxy(config) {
  await mkdir(proxyDir, { recursive: true });
  const release = await fetchJson(`https://api.github.com/repos/${repo}/releases/latest`);
  const asset = platformAsset(release.assets);
  const archive = join(proxyDir, asset.name);
  console.log(`Installing CLIProxyAPI ${release.tag_name}...`);
  await download(asset.browser_download_url, archive);
  if (asset.digest?.startsWith('sha256:')) {
    const actual = await sha256(archive);
    const expected = asset.digest.slice('sha256:'.length);
    if (actual !== expected) {
      await rm(archive, { force: true });
      throw new Error('CLIProxyAPI checksum mismatch.');
    }
  }
  const extractDir = join(proxyDir, '.extract');
  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });
  let result;
  if (platform() === 'win32') {
    result = spawnSync('tar', ['-xf', archive, '-C', extractDir], { stdio: 'inherit' });
  } else {
    result = spawnSync('tar', ['-xzf', archive, '-C', extractDir], { stdio: 'inherit' });
  }
  if (result.status !== 0) throw new Error('Could not extract CLIProxyAPI.');
  const source = join(extractDir, platform() === 'win32' ? 'cli-proxy-api.exe' : 'cli-proxy-api');
  await access(source);
  await rm(proxyExecutable(), { force: true });
  await rename(source, proxyExecutable());
  if (platform() !== 'win32') await chmod(proxyExecutable(), 0o755);
  await writeFile(join(proxyDir, 'version.txt'), `${release.tag_name}\n`);
  await rm(extractDir, { recursive: true, force: true });
  await rm(archive, { force: true });
  config.proxyVersion = release.tag_name;
  console.log(`Installed ${basename(proxyExecutable())}.`);
}

export async function authenticate(provider, config) {
  await access(proxyExecutable()).catch(() => { throw new Error('CLIProxyAPI is not installed. Run: claudex setup'); });
  const result = spawnSync(proxyExecutable(), [`-${provider}-login`, '-config', proxyConfigPath], { stdio: 'inherit', windowsHide: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${provider} login failed with exit code ${result.status}.`);
}

export async function proxyStatus(config) {
  try {
    const response = await fetch(`${config.baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
      signal: AbortSignal.timeout(2000)
    });
    if (!response.ok) return { running: true, healthy: false, status: response.status, models: [] };
    const payload = await response.json();
    return { running: true, healthy: true, models: (payload.data ?? []).map((model) => model.id).sort() };
  } catch {
    return { running: false, healthy: false, models: [] };
  }
}

export async function startProxy(config) {
  const current = await proxyStatus(config);
  if (current.healthy) return current;
  await access(proxyExecutable()).catch(() => { throw new Error('CLIProxyAPI is not installed. Run: claudex setup'); });
  const child = spawn(proxyExecutable(), ['-config', proxyConfigPath], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const status = await proxyStatus(config);
    if (status.healthy) return status;
  }
  throw new Error('CLIProxyAPI did not become healthy.');
}

export async function stopProxy(config) {
  if (!(await proxyStatus(config)).running) return;
  if (platform() === 'win32') {
    spawnSync('taskkill', ['/IM', basename(proxyExecutable()), '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    spawnSync('pkill', ['-f', proxyExecutable()], { stdio: 'ignore' });
  }
}
