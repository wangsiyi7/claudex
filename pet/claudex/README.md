# Claudex animated Codex pet

The blue Codex terminal-cloud rides the classic orange Claude Code crab. During review it occasionally gives the crab a small, professionally calibrated quality-control tap.

This is a Codex v2 pet package:

- `pet.json` — pet metadata and v2 declaration
- `spritesheet.webp` — transparent `1536 × 2288` animation atlas
- `SHA256SUMS` — download integrity checks

## Fastest install

```powershell
npm install -g github:wangsiyi7/claudex
claudex pet install
```

The command installs the two required files under `~/.codex/pets/claudex`, backs up an existing `~/.codex/config.toml`, and sets:

```toml
[desktop]
selected-avatar-id = "claudex"
```

Restart Codex once if an already-open pet window does not refresh.

Use `claudex pet install --no-select` to install the resource without replacing the current pet.

## Direct downloads

- [Download the v2 spritesheet](https://raw.githubusercontent.com/wangsiyi7/claudex/main/pet/claudex/spritesheet.webp)
- [Download the pet manifest](https://raw.githubusercontent.com/wangsiyi7/claudex/main/pet/claudex/pet.json)
- [Download the complete repository ZIP](https://github.com/wangsiyi7/claudex/archive/refs/heads/main.zip)

## 中文

这是 Claudex 的 Codex v2 动态宠物包：蓝色 Codex 终端云骑着 Claude Code 经典橙色小螃蟹；进入 review 动画时，它会偶尔对小螃蟹进行一次经过专业校准的轻拍质检。

最快安装方式：

```powershell
npm install -g github:wangsiyi7/claudex
claudex pet install
```

该命令会把资源复制到 `~/.codex/pets/claudex`，备份已有的 `~/.codex/config.toml`，并自动把 Claudex 设为当前宠物。如果界面没有立即刷新，重启一次 Codex 即可。

如果只想安装资源、不替换当前宠物，请使用：

```powershell
claudex pet install --no-select
```

This independent parody project is not affiliated with OpenAI, Anthropic, Claude Code, or Codex.
