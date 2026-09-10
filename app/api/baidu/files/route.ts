import { jsonError, requireBaiduSession } from "@/lib/baidu";

export async function GET(request: Request) {
  try {
    const { session, cookie } = await requireBaiduSession(request);
    const requestUrl = new URL(request.url);
    const dir = requestUrl.searchParams.get("dir") || "/";
    if (!dir.startsWith("/") || dir.includes("..")) return Response.json({ error: "目录无效" }, { status: 400 });
    const url = new URL("https://pan.baidu.com/rest/2.0/xpan/file");
    url.search = new URLSearchParams({ method: "list", access_token: session.accessToken, dir, order: "name", desc: "0", start: "0", limit: "100", web: "web" }).toString();
    const upstream = await fetch(url);
    const data = await upstream.json() as { errno?: number; errmsg?: string; list?: Array<Record<string, unknown>> };
    if (!upstream.ok || data.errno) throw new Error(data.errmsg || "无法读取网盘目录");
    const files = (data.list || []).map((item) => ({ fs_id: String(item.fs_id), name: String(item.server_filename || ""), path: String(item.path || ""), isdir: Number(item.isdir) === 1, size: Number(item.size || 0) }));
    const response = Response.json({ dir, files });
    if (cookie) response.headers.append("Set-Cookie", cookie);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
