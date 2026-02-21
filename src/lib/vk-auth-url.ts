/** Ключ в sessionStorage: при значении "1" callback /auth/vk передаёт code в opener для привязки (link), а не логина. */
export const VK_LINK_MODE_KEY = "vk_link_mode";

const VK_APP_ID = 54445438;
const VK_AUTH_BASE = "https://id.vk.ru";

function generateCodeVerifier(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  let s = "";
  for (let i = 0; i < 64; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

function generateState(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-";
  let s = "";
  for (let i = 0; i < 43; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
  return s;
}

async function sha256Base64Url(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Возвращает URL для авторизации VK ID (PKCE).
 * Если linkMode === true, в sessionStorage пишется vk_link_mode=1 — callback отдаст code в opener для привязки.
 */
export async function getVkAuthUrl(linkMode = false): Promise<string> {
  const redirectUri =
    typeof window !== "undefined" ? `${window.location.origin}/auth/vk` : "https://tomilo-lib.ru/auth/vk";
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const state = generateState();
  try {
    sessionStorage.setItem("vk_code_verifier", codeVerifier);
    sessionStorage.setItem("vk_state", state);
    if (linkMode) sessionStorage.setItem(VK_LINK_MODE_KEY, "1");
  } catch {
    // ignore
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: String(VK_APP_ID),
    redirect_uri: redirectUri,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    scope: "email",
  });
  return `${VK_AUTH_BASE}/authorize?${params.toString()}`;
}
