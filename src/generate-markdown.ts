export interface Issue {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  labels: { name: string }[];
}

export function generateMarkdown(issue: Issue): string {
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

export function getFilePath(outputDir: string, issueNumber: number): string {
  const dir = outputDir.replace(/\/+$/, "");
  return `${dir}/${issueNumber}.md`;
}
