import { describe, it, expect } from "vitest";
import { generateMarkdown } from "../src/generate-markdown.js";

describe("generateMarkdown", () => {
  it("Issue の情報から frontmatter 付き Markdown を生成する", () => {
    const issue = {
      number: 42,
      title: "新しい記事のタイトル",
      body: "Issue の本文がここに入ります。",
      created_at: "2025-01-01T00:00:00Z",
      labels: [{ name: "blog" }, { name: "documentation" }],
    };

    const result = generateMarkdown(issue);

    expect(result).toBe(
      `---
title: "新しい記事のタイトル"
issue_number: 42
created_at: "2025-01-01T00:00:00Z"
labels:
  - blog
  - documentation
---

Issue の本文がここに入ります。
`,
    );
  });

  it("ラベルがない場合は空配列で出力する", () => {
    const issue = {
      number: 1,
      title: "ラベルなし記事",
      body: "本文です。",
      created_at: "2025-06-15T12:00:00Z",
      labels: [],
    };

    const result = generateMarkdown(issue);

    expect(result).toBe(
      `---
title: "ラベルなし記事"
issue_number: 1
created_at: "2025-06-15T12:00:00Z"
labels: []
---

本文です。
`,
    );
  });

  it("本文が空の場合でも正しく生成する", () => {
    const issue = {
      number: 10,
      title: "本文なし",
      body: "",
      created_at: "2025-03-01T00:00:00Z",
      labels: [{ name: "test" }],
    };

    const result = generateMarkdown(issue);

    expect(result).toBe(
      `---
title: "本文なし"
issue_number: 10
created_at: "2025-03-01T00:00:00Z"
labels:
  - test
---

`,
    );
  });

  it("本文が null の場合でも正しく生成する", () => {
    const issue = {
      number: 5,
      title: "null本文",
      body: null,
      created_at: "2025-02-01T00:00:00Z",
      labels: [],
    };

    const result = generateMarkdown(issue);

    expect(result).toBe(
      `---
title: "null本文"
issue_number: 5
created_at: "2025-02-01T00:00:00Z"
labels: []
---

`,
    );
  });

  it("タイトルにダブルクォートが含まれる場合はエスケープする", () => {
    const issue = {
      number: 7,
      title: 'タイトルに"引用符"がある',
      body: "本文",
      created_at: "2025-04-01T00:00:00Z",
      labels: [],
    };

    const result = generateMarkdown(issue);

    expect(result).toContain('title: "タイトルに\\"引用符\\"がある"');
  });
});
