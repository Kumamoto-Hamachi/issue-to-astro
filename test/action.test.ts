import { describe, it, expect, vi, beforeEach } from "vitest";
import { runAction } from "../src/action.js";
import type { ActionContext, ActionDeps, Octokit } from "../src/action.js";

describe("runAction", () => {
  let mockContext: ActionContext;
  let mockExec: ActionDeps["exec"];
  let mockOctokit: ActionDeps["octokit"];
  let mockWriteFile: ActionDeps["writeFile"];

  beforeEach(() => {
    mockContext = {
      issue: {
        number: 42,
        title: "新しい記事のタイトル",
        body: "Issue の本文がここに入ります。",
        created_at: "2025-01-01T00:00:00Z",
        labels: [{ name: "blog" }, { name: "documentation" }],
      },
      inputs: {
        outputDir: "src/content/posts",
        branchPrefix: "content/issue-",
        commitType: "docs",
        baseBranch: "main",
      },
      repo: {
        owner: "kumamoto",
        repo: "my-blog",
      },
    };

    mockExec = vi.fn().mockResolvedValue(0);

    mockWriteFile = vi.fn();

    mockOctokit = {
      rest: {
        pulls: {
          create: vi.fn().mockResolvedValue({
            data: {
              html_url: "https://github.com/kumamoto/my-blog/pull/1",
            },
          }),
        },
      },
    } as unknown as Octokit;
  });

  it("正しいブランチ名を返す", async () => {
    const result = await runAction(mockContext, { exec: mockExec, octokit: mockOctokit, writeFile: mockWriteFile });

    expect(result.branchName).toBe("content/issue-42");
  });

  it("正しいファイルパスを返す", async () => {
    const result = await runAction(mockContext, { exec: mockExec, octokit: mockOctokit, writeFile: mockWriteFile });

    expect(result.filePath).toBe("src/content/posts/42.md");
  });

  it("PR の URL を返す", async () => {
    const result = await runAction(mockContext, { exec: mockExec, octokit: mockOctokit, writeFile: mockWriteFile });

    expect(result.pullRequestUrl).toBe(
      "https://github.com/kumamoto/my-blog/pull/1",
    );
  });

  it("git コマンドを正しい順序で実行する", async () => {
    await runAction(mockContext, { exec: mockExec, octokit: mockOctokit, writeFile: mockWriteFile });

    const calls = (mockExec as ReturnType<typeof vi.fn>).mock.calls.map(
      ([cmd, args]: [string, string[]]) => [cmd, ...args].join(" "),
    );

    expect(calls).toEqual([
      "git checkout -b content/issue-42",
      "mkdir -p src/content/posts",
      "git add src/content/posts/42.md",
      "git commit -m docs(content): add post from issue #42",
      "git push origin content/issue-42",
    ]);
  });

  it("PR を正しいパラメータで作成する", async () => {
    await runAction(mockContext, { exec: mockExec, octokit: mockOctokit, writeFile: mockWriteFile });

    expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: "kumamoto",
      repo: "my-blog",
      title: "docs(content): add post from issue #42",
      head: "content/issue-42",
      base: "main",
      body: "Closes #42",
    });
  });

  it("Markdown ファイルの内容を writeFile コールバックで書き出す", async () => {
    const writtenFiles: Record<string, string> = {};
    const localMockWriteFile = vi.fn((path: string, content: string) => {
      writtenFiles[path] = content;
    });

    await runAction(mockContext, {
      exec: mockExec,
      octokit: mockOctokit,
      writeFile: localMockWriteFile,
    });

    expect(localMockWriteFile).toHaveBeenCalledWith(
      "src/content/posts/42.md",
      expect.stringContaining('title: "新しい記事のタイトル"'),
    );
    expect(writtenFiles["src/content/posts/42.md"]).toContain(
      "Issue の本文がここに入ります。",
    );
  });
});
