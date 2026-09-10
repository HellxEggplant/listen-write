import { baiduConfig } from "@/lib/baidu";

export async function GET() {
  try {
    const config = baiduConfig();
    const state = crypto.randomUUID();
    const authorize = new URL("https://openapi.baidu.com/oauth/2.0/authorize");
    authorize.search = new URLSearchParams({ response_type: "code", client_id: config.appKey, redirect_uri: config.redirectUri, scope: "basic,netdisk", state }).toString();
    const response = Response.redirect(authorize, 302);
    response.headers.append("Set-Cookie", `baidu_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
    return response;
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "百度网盘连接尚未配置" }, { status: 503 });
  }
}
