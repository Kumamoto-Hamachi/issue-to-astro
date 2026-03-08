export interface ImageDownloadResult {
  body: string;
  images: Map<string, Buffer>;
}

export interface DownloadImagesDeps {
  fetch: typeof globalThis.fetch;
}

const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
const HTML_IMG_REGEX = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const KNOWN_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

function getExtensionFromUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname;
    const lastDot = pathname.lastIndexOf(".");
    if (lastDot === -1) return null;
    const ext = pathname.slice(lastDot).toLowerCase();
    return KNOWN_EXTENSIONS.has(ext) ? ext : null;
  } catch {
    return null;
  }
}

function getExtensionFromContentType(contentType: string): string {
  const mime = contentType.split(";")[0].trim().toLowerCase();
  return CONTENT_TYPE_TO_EXT[mime] ?? ".png";
}

export async function downloadImages(
  body: string,
  deps: DownloadImagesDeps,
): Promise<ImageDownloadResult> {
  // 全画像URLを出現順に収集
  const urlEntries: { url: string; index: number }[] = [];

  for (const match of body.matchAll(MD_IMAGE_REGEX)) {
    urlEntries.push({ url: match[2], index: match.index! });
  }
  for (const match of body.matchAll(HTML_IMG_REGEX)) {
    urlEntries.push({ url: match[1], index: match.index! });
  }

  // 出現順にソート
  urlEntries.sort((a, b) => a.index - b.index);

  if (urlEntries.length === 0) {
    return { body, images: new Map() };
  }

  // 重複排除しつつダウンロード
  const urlToFilename = new Map<string, string>();
  const images = new Map<string, Buffer>();
  let counter = 0;

  for (const { url } of urlEntries) {
    if (urlToFilename.has(url)) continue;

    try {
      const response = await deps.fetch(url);
      if (!response.ok) continue;

      counter++;
      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = getExtensionFromUrl(url) ??
        getExtensionFromContentType(response.headers.get("content-type") ?? "");
      const filename = `image-${String(counter).padStart(3, "0")}${ext}`;

      urlToFilename.set(url, filename);
      images.set(filename, buffer);
    } catch {
      // ダウンロード失敗時は元URLを維持
    }
  }

  // body内のURLを置換
  let result = body.replace(MD_IMAGE_REGEX, (_match, alt, url) => {
    const filename = urlToFilename.get(url);
    return filename ? `![${alt}](./${filename})` : `![${alt}](${url})`;
  });

  result = result.replace(HTML_IMG_REGEX, (match, url) => {
    const filename = urlToFilename.get(url);
    return filename ? match.replace(url, `./${filename}`) : match;
  });

  return { body: result, images };
}
