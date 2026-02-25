# issue-to-astro

GitHub Issue を close したときに、Issue の内容を Markdown ファイルとして指定ディレクトリに自動生成し、PR を作成する GitHub Action です。

## 概要

```
Issue close → ブランチ作成 → Markdown ファイル生成 → コミット → プッシュ → PR 作成
```

## 機能

- Issue を close すると自動でワークフローが起動
- Issue のタイトル・本文から Markdown ファイルを生成
- 指定ディレクトリに配置
- Conventional Commit でコミット（`npx git-cz` を使用）
- 自動で PR を作成

## 使い方

### ワークフロー例

```yaml
name: Issue to Markdown

on:
  issues:
    types: [closed]

jobs:
  create-md:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: kumamoto/issue-to-astro@v1
        with:
          output-dir: "src/content/posts"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Inputs

| Name | 説明 | 必須 | デフォルト |
| --- | --- | --- | --- |
| `output-dir` | Markdown ファイルの出力先ディレクトリ | No | `src/content/posts` |
| `branch-prefix` | 作成するブランチのプレフィックス | No | `content/issue-` |
| `commit-type` | Conventional Commit のタイプ | No | `docs` |
| `base-branch` | PR のベースブランチ | No | `main` |

### Outputs

| Name | 説明 |
| --- | --- |
| `pull-request-url` | 作成された PR の URL |
| `branch-name` | 作成されたブランチ名 |
| `file-path` | 生成された Markdown ファイルのパス |

## 生成されるファイル

Issue #42 のタイトルが「新しい記事のタイトル」の場合:

**ファイルパス:** `src/content/posts/42.md`

**ファイル内容:**

```markdown
---
title: "新しい記事のタイトル"
issue_number: 42
created_at: "2025-01-01T00:00:00Z"
labels:
  - blog
  - documentation
---

Issue の本文がここに入ります。
```

## コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) に従い、`npx git-cz` を使用してコミットメッセージを生成します。

```
feat(content): add post from issue #42
```

## リリース管理

[release-please](https://github.com/googleapis/release-please) を使用してバージョン管理とリリースノートの自動生成を行います。

## 開発

### 必要環境

- Node.js 24.x
- pnpm 10.x
- Docker

### セットアップ

```bash
pnpm install
```

### テスト

```bash
pnpm test
```

### ローカルでの Docker ビルド

```bash
docker build -t issue-to-astro .
```

## ライセンス

MIT
