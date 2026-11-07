import axios from "axios";
import { backendHost, getConfig } from "@/config";

export function startLoginProcess(state: string): void {
  const { oauth } = getConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauth.clientId,
    state,
  });
  location.assign(`${oauth.authorizeUrl}?${params.toString()}`);
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
