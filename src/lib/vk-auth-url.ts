/** Префикс state при привязке: callback определяет режим по URL. */
export const VK_STATE_LINK_PREFIX = "link_";
/** Ключ sessionStorage: после callback сюда кладётся JSON { code, redirect_uri, code_verifier?, device_id?, state? } для обработки на странице профиля. */
export const VK_LINK_PENDING_KEY = "vk_link_pending";
/** Ключ sessionStorage: перед редиректом на VK сохраняем сюда путь возврата (например /user/username). */
export const VK_LINK_RETURN_KEY = "vk_link_return";

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
 * При linkMode в state передаётся префикс link_ — callback в popup определяет привязку по нему (sessionStorage в popup пустой).
 */
export async function getVkAuthUrl(linkMode = false): Promise<string> {
  const redirectUri =
    typeof window !== "undefined" ? `${window.location.origin}/auth/vk` : "https://tomilo-lib.ru/auth/vk";
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const stateRaw = generateState();
  const state = linkMode ? `${VK_STATE_LINK_PREFIX}${stateRaw}` : stateRaw;
  try {
    sessionStorage.setItem("vk_code_verifier", codeVerifier);
    sessionStorage.setItem("vk_state", stateRaw);
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
