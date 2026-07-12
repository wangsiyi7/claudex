# 重磅发布｜我们“收购”了 Claude Code 和 Codex，并隆重推出 Claudex

> 一场完全没有发生的并购，一款确实可以运行的产品。Claudex 保留 Claude Code 的终端与工具框架，通过本地 CLIProxyAPI 使用 Codex OAuth 认证模型，并允许分别控制主代理与调查代理的 effort。

今天，我们隆重宣布：经过数小时的战略评估、两次提示词、一次 OAuth 回调，以及一场完全不存在的董事会投票，我们已经完成对 Claude Code 与 Codex 的战略性“收购”，并正式推出整合后的新一代开发者产品——**Claudex**。

本次交易金额未予披露，主要原因是交易并未真实发生。双方股东均未受到影响，监管部门也成功避免了加班。

## 两种优秀能力，一次极其大胆的组织调整

Claude Code 提供成熟的终端交互、工具调用与代理框架；Codex 提供强大的编码模型与认证能力。我们认为，这两者之间长期存在一种尚未被充分释放的战略协同：

**壳可以来自 Claude，脑子可以来自 Codex，effort 应该由用户自己决定。**

因此，Claudex 保留 Claude Code 的界面和工具系统，通过本地 CLIProxyAPI 将请求路由到 Codex OAuth 认证模型。用户无需配置 `OPENAI_API_KEY`，也无需假装同时启动八个最高 effort 的代理是一种节俭行为。

## 正式介绍 Claudex

Claudex 默认面向 `gpt-5.6-sol`，并提供四种可复用预设：

- `economy`：适合快速、低 token 工作；
- `balanced`：主代理 high，调查代理 medium，官方推荐；
- `quality`：适合困难编码与设计任务；
- `maximum`：适合真正困难的问题，以及希望账单也参与推理的人。

与全部继承同一 effort 的编排方式不同，Claudex 允许主代理与调查代理分别设置能力级别、数量和并发。我们相信，智能应该可以调节——尤其是在你准备一次启动八个智能体的时候。

## 合并后的管理团队

在新的组织架构中：

- 蓝色 Codex 终端宠物出任首席推理官；
- Claude Code 经典橙色小螃蟹继续担任首席外壳官；
- 小螃蟹同时兼任基础交通设施；
- 用户继续担任唯一需要为所有决定负责的人。

合并过程平稳完成。没有吉祥物受到伤害，只有一只螃蟹调整了汇报关系。

## 30 秒开始使用

```powershell
npm install -g github:wangsiyi7/claudex
claudex setup
claudex auth codex
claudex preset balanced --launch
```

运行 `claudex doctor` 可以检查 Claude Code、Codex CLI、本地代理、OAuth 状态，以及目标模型是否确实对当前账户开放。

## 安全与治理

Claudex 的代理默认只监听 `127.0.0.1`，管理 API 默认关闭，本地 bearer token 随机生成，OAuth 文件不会进入项目仓库。程序化调查代理默认使用只读 `plan` 模式。

这是一次认真实现的技术实验，也是一次不太认真的品牌发布。

## 可用性

Claudex 现已在 GitHub 开源：<https://github.com/wangsiyi7/claudex>

配套的 Codex 全局调用 Skill：<https://github.com/wangsiyi7/codex-claude-code-skill>

## 特别声明

本文为戏仿性质的项目发布稿。我们没有收购 OpenAI、Anthropic、Claude Code、Codex 或任何相关公司、团队、产品与吉祥物。Claudex 是独立社区项目，与上述主体不存在官方隶属或合作关系。

唯一真实完成的收购，是蓝色宠物对小螃蟹背部有限空间的长期占用。
