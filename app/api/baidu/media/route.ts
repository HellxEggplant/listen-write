import { fileMeta, jsonError, requireBaiduSession } from "@/lib/baidu";

const FORWARDED_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
];

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const fsid = requestUrl.searchParams.get("fsid");
    if (!fsid || !/^\d+$/.test(fsid)) {
      return Response.json({ error: "文件编号无效" }, { status: 400 });
    }

    const { session, cookie } = await requireBaiduSession(request);
    const meta = await fileMeta(session.accessToken, fsid);
    const download = new URL(meta.dlink!);
    download.searchParams.set("access_token", session.accessToken);

    const headers = new Headers({ "User-Agent": "pan.baidu.com" });
    const range = request.headers.get("range");
    if (range) headers.set("Range", range);

    const upstream = await fetch(download, { headers, redirect: "follow" });
    if (!upstream.ok && upstream.status !== 206) {
      throw new Error("视频流读取失败");
    }

    const responseHeaders = new Headers({ "Cache-Control": "private, no-store" });
    for (const name of FORWARDED_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    if (!responseHeaders.has("Content-Type")) {
      responseHeaders.set("Content-Type", "application/octet-stream");
    }
    if (cookie) responseHeaders.append("Set-Cookie", cookie);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return jsonError(error);
  }
}
