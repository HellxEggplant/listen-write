import { fileMeta, jsonError, requireBaiduSession } from "@/lib/baidu";

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const fsid = requestUrl.searchParams.get("fsid");
    if (!fsid || !/^\d+$/.test(fsid)) return Response.json({ error: "文件编号无效" }, { status: 400 });
    const { session, cookie } = await requireBaiduSession(request);
    const meta = await fileMeta(session.accessToken, fsid);
    if ((meta.size || 0) > 5 * 1024 * 1024) return Response.json({ error: "字幕文件不能超过 5 MB" }, { status: 413 });
    const download = new URL(meta.dlink!);
    download.searchParams.set("access_token", session.accessToken);
    const upstream = await fetch(download, { headers: { "User-Agent": "pan.baidu.com" } });
    if (!upstream.ok) throw new Error("字幕文件读取失败");
    const response = new Response(await upstream.arrayBuffer(), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
    if (cookie) response.headers.append("Set-Cookie", cookie);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
