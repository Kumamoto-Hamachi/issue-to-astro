/**
 * Issue の情報から frontmatter 付き Markdown 文字列を生成する
 * @param {object} issue - GitHub Issue オブジェクト
 * @param {number} issue.number - Issue 番号
 * @param {string} issue.title - Issue タイトル
 * @param {string|null} issue.body - Issue 本文
 * @param {string} issue.created_at - 作成日時 (ISO 8601)
 * @param {Array<{name: string}>} issue.labels - ラベル配列
 * @returns {string} frontmatter 付き Markdown 文字列
 */
export function generateMarkdown(issue) {
  const title = issue.title.replace(/"/g, '\\"');
  const body = issue.body || "";

  const labelsYaml =
    issue.labels.length === 0
      ? "labels: []"
      : `labels:\n${issue.labels.map((l) => `  - ${l.name}`).join("\n")}`;

  const content = body ? `\n${body}\n` : "\n";

  return `---
title: "${title}"
issue_number: ${issue.number}
created_at: "${issue.created_at}"
${labelsYaml}
---
${content}`;
}

/**
 * Issue 番号と出力ディレクトリからファイルパスを生成する
 * @param {string} outputDir - 出力先ディレクトリ
 * @param {number} issueNumber - Issue 番号
 * @returns {string} ファイルパス
 */
export function getFilePath(outputDir, issueNumber) {
  const dir = outputDir.replace(/\/+$/, "");
  return `${dir}/${issueNumber}.md`;
}
