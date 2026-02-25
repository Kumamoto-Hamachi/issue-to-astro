import { writeFileSync } from "node:fs";
import type * as github from "@actions/github";
import { generateMarkdown, getFilePath } from "./generate-markdown.js";
import type { Issue } from "./generate-markdown.js";

export type Octokit = ReturnType<typeof github.getOctokit>;

export interface ActionContext {
  issue: Issue;
  inputs: {
    outputDir: string;
    branchPrefix: string;
    commitType: string;
    baseBranch: string;
  };
  repo: {
    owner: string;
    repo: string;
  };
}

export interface ActionDeps {
  exec: (cmd: string, args: string[]) => Promise<number>;
  octokit: Octokit;
  writeFile?: (path: string, content: string) => void;
}

export interface ActionResult {
  branchName: string;
  filePath: string;
  pullRequestUrl: string;
}

export async function runAction(
  context: ActionContext,
  deps: ActionDeps,
): Promise<ActionResult> {
  const { issue, inputs, repo } = context;
  const { exec, octokit, writeFile = writeFileSync } = deps;

  const branchName = `${inputs.branchPrefix}${issue.number}`;
  const filePath = getFilePath(inputs.outputDir, issue.number);
  const markdown = generateMarkdown(issue);
  const commitMessage = `${inputs.commitType}(content): add post from issue #${issue.number}`;

  // Docker コンテナ内の所有者不一致を回避
  await exec("git", ["config", "--global", "safe.directory", "/github/workspace"]);

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
