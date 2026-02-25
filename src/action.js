import { writeFileSync } from "node:fs";
import { generateMarkdown, getFilePath } from "./generate-markdown.js";

/**
 * Action のメインロジック
 * @param {object} context - Action の実行コンテキスト
 * @param {object} context.issue - GitHub Issue 情報
 * @param {object} context.inputs - Action inputs
 * @param {object} context.repo - リポジトリ情報 { owner, repo }
 * @param {object} deps - 依存関係（テスト時にモック可能）
 * @param {Function} deps.exec - コマンド実行関数
 * @param {object} deps.octokit - GitHub API クライアント
 * @param {Function} [deps.writeFile] - ファイル書き出し関数
 * @returns {Promise<{branchName: string, filePath: string, pullRequestUrl: string}>}
 */
export async function runAction(context, deps) {
  const { issue, inputs, repo } = context;
  const { exec, octokit, writeFile = writeFileSync } = deps;

  const branchName = `${inputs.branchPrefix}${issue.number}`;
  const filePath = getFilePath(inputs.outputDir, issue.number);
  const markdown = generateMarkdown(issue);
  const commitMessage = `${inputs.commitType}(content): add post from issue #${issue.number}`;

  // ブランチ作成
  await exec("git", ["checkout", "-b", branchName]);

  // ディレクトリ作成 & ファイル書き出し
  await exec("mkdir", ["-p", inputs.outputDir]);
  writeFile(filePath, markdown);

  // コミット & プッシュ
  await exec("git", ["add", filePath]);
  await exec("git", ["commit", "-m", commitMessage]);
  await exec("git", ["push", "origin", branchName]);

  // PR 作成
  const { data: pr } = await octokit.rest.pulls.create({
    owner: repo.owner,
    repo: repo.repo,
    title: commitMessage,
    head: branchName,
    base: inputs.baseBranch,
    body: `Closes #${issue.number}`,
  });

  return {
    branchName,
    filePath,
    pullRequestUrl: pr.html_url,
  };
}
