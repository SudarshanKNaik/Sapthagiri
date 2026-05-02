const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export async function apiFetch(path, { sessionId, method = "GET", body, headers } = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...(sessionId ? { "x-session-id": sessionId } : {}),
      ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const msg = json?.error || json?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export function ocrLangFromUiLang(uiLang) {
  if (uiLang === "hi") return "hin";
  if (uiLang === "kn") return "kan";
  return "eng";
}
