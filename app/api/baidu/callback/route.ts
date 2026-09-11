import { baiduConfig, cookieValue, sealSession, sessionCookie } from "@/lib/baidu";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const savedState = cookieValue(request, "baidu_oauth_state");
  const home = new URL("/", requestUrl.origin);
  if (!code || !state || state !== savedState) {
    home.searchParams.set("baidu", "error");
    return new Response(null, {
      status: 302,
      headers: { Location: home.toString() },
    });
  }
  try {
    const config = baiduConfig();
    const tokenUrl = new URL("https://openapi.baidu.com/oauth/2.0/token");
    tokenUrl.search = new URLSearchParams({ grant_type: "authorization_code", code, client_id: config.appKey, client_secret: config.secretKey, redirect_uri: config.redirectUri }).toString();
    const tokenResponse = await fetch(tokenUrl);
    const token = await tokenResponse.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
    if (!tokenResponse.ok || !token.access_token || !token.refresh_token) throw new Error(token.error_description || token.error || "授权失败");
    const sealed = await sealSession({ accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + (token.expires_in || 2_592_000) * 1000 });
    home.searchParams.set("baidu", "connected");
    const response = new Response(null, {
      status: 302,
      headers: { Location: home.toString() },
    });
    response.headers.append("Set-Cookie", sessionCookie(sealed));
    response.headers.append("Set-Cookie", "baidu_oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
    return response;
  } catch {
    home.searchParams.set("baidu", "error");
    return new Response(null, {
      status: 302,
      headers: { Location: home.toString() },
    });
  }
}
