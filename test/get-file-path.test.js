import { describe, it, expect } from "vitest";
import { getFilePath } from "../src/generate-markdown.js";

describe("getFilePath", () => {
  it("Issue 番号からファイルパスを生成する", () => {
    expect(getFilePath("src/content/posts", 42)).toBe(
      "src/content/posts/42.md",
    );
  });

  it("出力ディレクトリ末尾のスラッシュを正規化する", () => {
    expect(getFilePath("src/content/posts/", 42)).toBe(
      "src/content/posts/42.md",
    );
  });

  it("異なるディレクトリでも正しく生成する", () => {
    expect(getFilePath("content/blog", 1)).toBe("content/blog/1.md");
  });
});
