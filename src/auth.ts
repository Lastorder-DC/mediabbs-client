import axios from "axios";
import { backendHost, getConfig } from "@/config";

const LOGIN_KEY = "mediabbs.login";

/**
 * Sends the browser to the wiki's OAuth page. `state` is a random value kept
 * in sessionStorage with the page to return to: the callback only accepts the
 * state it started, so another site cannot log the user in to its own account
 * with a code of its own (login CSRF).
 */
export function startLoginProcess(returnTo: string): void {
  const { oauth } = getConfig();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem(LOGIN_KEY, JSON.stringify({ state, returnTo }));
  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauth.clientId,
    state,
  });
  location.assign(`${oauth.authorizeUrl}?${params.toString()}`);
}

/** The page to return to if `state` is the one this tab started, else null. */
export function takeLoginState(state: unknown): string | null {
  const saved = sessionStorage.getItem(LOGIN_KEY);
  sessionStorage.removeItem(LOGIN_KEY);
  if (!saved || typeof state !== "string") return null;
  try {
    const { state: expected, returnTo } = JSON.parse(saved) as { state: string; returnTo: string };
    return expected === state ? returnTo : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await axios.post(`${backendHost}/auth/logout`, null, { withCredentials: true });
}

export async function getToken(code: string): Promise<void> {
  await axios.post(`${backendHost}/auth/login`, { code }, { withCredentials: true });
}

/** Refreshes the access token; concurrent callers wait for a single request. */
let pending: Promise<void> | null = null;

async function doRefresh(): Promise<void> {
  try {
    await axios.post(`${backendHost}/auth/refresh`, null, { withCredentials: true });
  } catch {
    await logout().catch(() => undefined);
    location.reload();
  }
}

export function refreshToken(): Promise<void> {
  // Web Locks coordinate the refresh across tabs; fall back to one per tab.
  if (!pending) {
    const run =
      "locks" in navigator
        ? navigator.locks.request("mediabbs-refresh-token", doRefresh)
        : doRefresh();
    pending = Promise.resolve(run).finally(() => {
      pending = null;
    });
  }
  return pending;
}
