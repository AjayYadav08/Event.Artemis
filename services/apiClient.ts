const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
export const isProductionApiConfigured = !import.meta.env.PROD || Boolean(rawApiUrl);
const API_BASE_URL = (rawApiUrl || 'http://localhost:4000/api/v1').replace(/\/+$/, '');

if (import.meta.env.PROD && !rawApiUrl) {
  console.error(
    '[Event Artemis] VITE_API_URL is not configured in the production build. Set VITE_API_URL in Vercel Environment Variables and redeploy.'
  );
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly errors?: unknown[];

  constructor(status: number, message: string, errors?: unknown[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
let onSessionExpiredCallback: (() => void) | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const setOnSessionExpired = (cb: (() => void) | null) => {
  onSessionExpiredCallback = cb;
};

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        setAccessToken(null);
        return null;
      }
      const json = await res.json();
      const newToken = json?.data?.accessToken ?? null;
      setAccessToken(newToken);
      return newToken;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit & { skipAuthRefresh?: boolean } = {}
): Promise<T> {
  const { skipAuthRefresh, headers, body, ...rest } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const requestHeaders: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(headers as Record<string, string>),
  };

  if (accessToken) {
    requestHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
    body,
    credentials: 'include',
  });

  if (res.status === 401 && !skipAuthRefresh) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      requestHeaders['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...rest,
        headers: requestHeaders,
        body,
        credentials: 'include',
      });
    } else if (onSessionExpiredCallback) {
      onSessionExpiredCallback();
    }
  }

  const json = await res.json().catch(() => ({
    success: false,
    message: res.statusText || 'Request failed',
  }));

  if (!res.ok || json.success === false) {
    throw new ApiClientError(
      res.status,
      json.message || 'An unexpected error occurred',
      json.errors
    );
  }

  return json as T;
}

export const getBackendOrigin = () => {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, '');
};

