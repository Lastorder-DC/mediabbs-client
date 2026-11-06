import axios from "axios";
import { backendHost, getConfig } from "@/config";

function startLoginProcess(state: string): void {
  const { oauth } = getConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: oauth.clientId,
    state,
  });
  location.replace(`${oauth.authorizeUrl}?${params.toString()}`);
}

async function logout(): Promise<void> {
  await axios.post(`${backendHost}/auth/logout`, null, {
    withCredentials: true,
  });
}

async function getToken(code: string): Promise<void> {
  await axios.post(
    `${backendHost}/auth/login`,
    { code },
    {
      withCredentials: true,
    }
  );
}

// refresh token or wait until it is refreshed by another one
async function refreshToken(): Promise<void> {
  // make sure only one refresh request is sent
  await navigator.locks.request(
    "refreshToken",
    { ifAvailable: true },
    async (lock) => {
      try {
        if (lock) {
          await axios.post(`${backendHost}/auth/refresh`, null, {
            withCredentials: true,
          });
        } else {
          await navigator.locks.request("refresh", () => null); // wait first refresh request done
        }
      } catch {
        logout();
        location.reload();
      }
    }
  );
}

export { startLoginProcess, getToken, refreshToken, logout };
