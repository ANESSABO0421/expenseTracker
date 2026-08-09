import axios, { AxiosError, AxiosRequestConfig } from 'axios';

export const API_URL = 'https://expensetracker-4g98.onrender.com/api';

// Render's free tier spins the service down after ~15 min idle. The first
// request after that is held open while the container boots — typically
// 30–60s. These numbers are tuned around that reality:
const REQUEST_TIMEOUT = 60000;   // long enough to survive a cold start
const WAKING_THRESHOLD = 2500;   // after this, tell the UI "server is waking"
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1500, 4000];

export const api = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
});

// ── "server is waking" broadcast ────────────────────────────────────────────
// Any request still in flight past WAKING_THRESHOLD flips this on, so screens
// can show an honest "waking up the server" message instead of a dead spinner.
let inFlight = 0;
let wakingTimer: ReturnType<typeof setTimeout> | null = null;
let isWaking = false;
const listeners = new Set<(waking: boolean) => void>();

export function onWakingChange(cb: (waking: boolean) => void) {
  listeners.add(cb);
  cb(isWaking);
  return () => listeners.delete(cb);
}

function setWaking(next: boolean) {
  if (isWaking === next) return;
  isWaking = next;
  listeners.forEach(l => l(next));
}

function requestStarted() {
  inFlight += 1;
  if (inFlight === 1 && !wakingTimer) {
    wakingTimer = setTimeout(() => setWaking(true), WAKING_THRESHOLD);
  }
}

function requestFinished() {
  inFlight = Math.max(0, inFlight - 1);
  if (inFlight === 0) {
    if (wakingTimer) { clearTimeout(wakingTimer); wakingTimer = null; }
    setWaking(false);
  }
}

// ── retry on the failures a cold start actually produces ────────────────────
function isRetryable(error: AxiosError) {
  if (error.code === 'ECONNABORTED') return true;        // timeout
  if (!error.response) return true;                       // network / DNS drop
  return [502, 503, 504].includes(error.response.status); // Render booting
}

api.interceptors.request.use(config => {
  // Retries re-enter this interceptor. Only the first attempt increments, so a
  // request that retries twice still balances to exactly one finish() — and the
  // "waking" banner stays up across retries instead of flickering off.
  if (!(config as AxiosRequestConfig & { __retryCount?: number }).__retryCount) {
    requestStarted();
  }
  return config;
});

api.interceptors.response.use(
  response => {
    requestFinished();
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as (AxiosRequestConfig & { __retryCount?: number }) | undefined;

    if (config && isRetryable(error)) {
      const attempt = config.__retryCount ?? 0;
      if (attempt < MAX_RETRIES) {
        config.__retryCount = attempt + 1;
        await new Promise(r => setTimeout(r, RETRY_DELAYS[attempt] ?? 4000));
        return api(config); // re-enters the interceptors, keeping in-flight balanced
      }
    }

    requestFinished();
    return Promise.reject(error);
  }
);

/**
 * Fire-and-forget wake-up call, made the moment the app launches so Render
 * boots while the user is still looking at the splash screen rather than
 * after they've reached the dashboard. Never throws.
 */
export async function warmBackend(): Promise<boolean> {
  try {
    await api.get('/health');
    return true;
  } catch {
    return false;
  }
}
