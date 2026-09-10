import { env } from "cloudflare:workers";

export type BaiduSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64Url(bytes: Uint8Array) {
  let raw = "";
  for (const byte of bytes) raw += String.fromCharCode(byte);
  return btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

async function encryptionKey() {
  if (!env.BAIDU_TOKEN_KEY) throw new Error("Baidu token encryption is not configured");
  return crypto.subtle.importKey("raw", fromBase64Url(env.BAIDU_TOKEN_KEY), "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sealSession(session: BaiduSession) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(), encoder.encode(JSON.stringify(session))));
  const result = new Uint8Array(iv.length + encrypted.length);
  result.set(iv);
  result.set(encrypted, iv.length);
  return base64Url(result);
}

export async function openSession(value: string | undefined): Promise<BaiduSession | null> {
  if (!value) return null;
  try {
    const payload = fromBase64Url(value);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: payload.slice(0, 12) }, await encryptionKey(), payload.slice(12));
    return JSON.parse(decoder.decode(decrypted)) as BaiduSession;
  } catch {
    return null;
  }
}

export function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

export function sessionCookie(value: string) {
  return `baidu_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`;
}

export function baiduConfig() {
  if (!env.BAIDU_APP_KEY || !env.BAIDU_SECRET_KEY || !env.BAIDU_REDIRECT_URI) {
    throw new Error("Baidu OAuth is not configured");
  }
  return { appKey: env.BAIDU_APP_KEY, secretKey: env.BAIDU_SECRET_KEY, redirectUri: env.BAIDU_REDIRECT_URI };
}

export async function refreshSession(session: BaiduSession): Promise<{ session: BaiduSession; cookie?: string }> {
  if (session.expiresAt > Date.now() + 60_000) return { session };
  const config = baiduConfig();
  const url = new URL("https://openapi.baidu.com/oauth/2.0/token");
  url.search = new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken, client_id: config.appKey, client_secret: config.secretKey }).toString();
  const response = await fetch(url);
  const data = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || "百度网盘授权已过期");
  const next = { accessToken: data.access_token, refreshToken: data.refresh_token || session.refreshToken, expiresAt: Date.now() + (data.expires_in || 2_592_000) * 1000 };
  return { session: next, cookie: sessionCookie(await sealSession(next)) };
}

export async function requireBaiduSession(request: Request) {
  const current = await openSession(cookieValue(request, "baidu_session"));
  if (!current) throw new Error("BAIDU_NOT_CONNECTED");
  return refreshSession(current);
}

export async function fileMeta(accessToken: string, fsid: string) {
  const url = new URL("https://pan.baidu.com/rest/2.0/xpan/multimedia");
  url.search = new URLSearchParams({ method: "filemetas", access_token: accessToken, fsids: `[${fsid}]`, dlink: "1" }).toString();
  const response = await fetch(url);
  const data = await response.json() as { errno?: number; errmsg?: string; list?: Array<{ dlink?: string; server_filename?: string; size?: number }> };
  const item = data.list?.[0];
  if (!response.ok || data.errno || !item?.dlink) throw new Error(data.errmsg || "无法读取网盘文件");
  return item;
}

export function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : "请求失败";
  return Response.json({ error: message === "BAIDU_NOT_CONNECTED" ? "请先连接百度网盘" : message }, { status: message === "BAIDU_NOT_CONNECTED" ? 401 : 502 });
}
