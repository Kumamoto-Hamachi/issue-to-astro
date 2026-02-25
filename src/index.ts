import * as core from "@actions/core";
import * as github from "@actions/github";
import { exec } from "@actions/exec";
import { runAction } from "./action.js";
import type { Issue } from "./generate-markdown.js";

async function main(): Promise<void> {
  try {
    const issue = github.context.payload.issue;
    if (!issue) {
      core.setFailed("This action must be triggered by an issue event.");
      return;
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed("GITHUB_TOKEN environment variable is required.");
      return;
    }

    const octokit = github.getOctokit(token);

    const context = {
      issue: {
        number: issue.number,
        title: issue.title,
        body: issue.body ?? null,
        created_at: issue.created_at,
        labels: (issue.labels || []) as Issue["labels"],
      },
      inputs: {
        outputDir: core.getInput("output-dir") || "src/content/posts",
        branchPrefix: core.getInput("branch-prefix") || "content/issue-",
        commitType: core.getInput("commit-type") || "docs",
        baseBranch: core.getInput("base-branch") || "main",
      },
      repo: github.context.repo,
    };

    const execFn = (cmd: string, args: string[]): Promise<number> =>
      exec(cmd, args);

    const result = await runAction(context, { exec: execFn, octokit });

    core.setOutput("pull-request-url", result.pullRequestUrl);
    core.setOutput("branch-name", result.branchName);
    core.setOutput("file-path", result.filePath);

    core.info(`PR created: ${result.pullRequestUrl}`);
  } catch (error) {
    core.setFailed((error as Error).message);
  }
}

main();
