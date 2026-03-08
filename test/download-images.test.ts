import { describe, it, expect, vi } from "vitest";
import { downloadImages } from "../src/download-images.js";

function createMockFetch(contentType = "image/png") {
  return vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    headers: new Headers({ "content-type": contentType }),
  });
}

function createFailingFetch() {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
  });
}

describe("downloadImages", () => {
  it("Markdown 画像の URL を検出してローカルパスに書き換える", async () => {
    const body = "テスト ![screenshot](https://example.com/photo.png) です";
    const mockFetch = createMockFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe("テスト ![screenshot](./image-001.png) です");
    expect(result.images.size).toBe(1);
    expect(result.images.has("image-001.png")).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("https://example.com/photo.png");
  });

  it("複数の画像を連番で処理する", async () => {
    const body = "![a](https://example.com/a.png)\n![b](https://example.com/b.jpg)";
    const mockFetch = createMockFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe("![a](./image-001.png)\n![b](./image-002.jpg)");
    expect(result.images.size).toBe(2);
    expect(result.images.has("image-001.png")).toBe(true);
    expect(result.images.has("image-002.jpg")).toBe(true);
  });

  it("HTML img タグの src を検出してローカルパスに書き換える", async () => {
    const body = '<img src="https://example.com/photo.png" alt="test">';
    const mockFetch = createMockFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe('<img src="./image-001.png" alt="test">');
    expect(result.images.size).toBe(1);
  });

  it("Markdown 画像と HTML img タグが混在するケースを処理する", async () => {
    const body = '![md](https://example.com/a.png)\n<img src="https://example.com/b.jpg">';
    const mockFetch = createMockFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe('![md](./image-001.png)\n<img src="./image-002.jpg">');
    expect(result.images.size).toBe(2);
  });

  it("画像がない場合は body をそのまま返す", async () => {
    const body = "画像のないテキストです";
    const mockFetch = createMockFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe(body);
    expect(result.images.size).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("ダウンロード失敗時は元の URL を維持する", async () => {
    const body = "![fail](https://example.com/missing.png)";
    const mockFetch = createFailingFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe("![fail](https://example.com/missing.png)");
    expect(result.images.size).toBe(0);
  });

  it("URL に拡張子がない場合は Content-Type から判定する", async () => {
    const body = "![img](https://example.com/image-data)";
    const mockFetch = createMockFetch("image/jpeg");

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe("![img](./image-001.jpg)");
    expect(result.images.has("image-001.jpg")).toBe(true);
  });

  it("拡張子も Content-Type も不明な場合は .png をデフォルトにする", async () => {
    const body = "![img](https://example.com/blob)";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      headers: new Headers({ "content-type": "application/octet-stream" }),
    });

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe("![img](./image-001.png)");
    expect(result.images.has("image-001.png")).toBe(true);
  });

  it("同一 URL が複数箇所にある場合は 1 回だけダウンロードする", async () => {
    const body = "![a](https://example.com/same.png)\n![b](https://example.com/same.png)";
    const mockFetch = createMockFetch();

    const result = await downloadImages(body, { fetch: mockFetch });

    expect(result.body).toBe("![a](./image-001.png)\n![b](./image-001.png)");
    expect(result.images.size).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
