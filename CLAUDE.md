# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Issue の close をトリガーに、Issue 内容を Markdown ファイルとして自動生成し PR を作成する Docker Container Action。

**フロー:** Issue close → ブランチ作成 → MD ファイル生成 → コミット → プッシュ → PR 作成

## Tech Stack

- **Runtime:** Node.js 24.x (mise.toml で管理)
- **Package Manager:** pnpm 10.x
- **Action 形式:** Docker Container Action
- **コミット:** Conventional Commits (`npx git-cz`)
- **リリース:** release-please

## Commands

```bash
pnpm install          # 依存関係インストール
pnpm test             # テスト実行
docker build -t issue-to-astro .  # Docker ビルド
```

## Architecture

### Action Inputs/Outputs

**Inputs:**
- `output-dir` (default: `src/content/posts`) - MD ファイル出力先
- `branch-prefix` (default: `content/issue-`) - ブランチ名プレフィックス
- `commit-type` (default: `docs`) - Conventional Commit タイプ
- `base-branch` (default: `main`) - PR のベースブランチ

**Outputs:** `pull-request-url`, `branch-name`, `file-path`

### 生成ファイル形式

ファイル名: `{issue_number}.md`。frontmatter に `title`, `issue_number`, `created_at`, `labels` を含む。

## Conventions

- コミットメッセージは Conventional Commits 形式: `docs(content): add post from issue #42`
- ユーザーへの返答は日本語で行う
- TDD で開発を進める（テスト作成 → 失敗確認 → 実装）
