import type { SDKConfig } from "./types";
import { ApiError, AuthError, NetworkError, ValidationError } from "./errors";

const DEFAULT_RETRY_DELAY = 500;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface TokenCache {
  value: string;
  expiresAt: number;
}

export class HttpClient {
  private token: TokenCache | null = null;
  readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryBaseDelay: number;

  constructor(private readonly config: SDKConfig) {
    this.baseUrl = config.baseUrl ?? "/api/challenge-13/v1";
    this.timeout = config.timeout ?? 30_000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryBaseDelay = config.retryBaseDelay ?? DEFAULT_RETRY_DELAY;
  }

  private async ensureToken(): Promise<void> {
    const needsRefresh = !this.token || this.token.expiresAt < Date.now() + 60_000;
    if (!needsRefresh) return;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: this.config.apiKey }),
        signal: controller.signal,
      });
    } catch (err) {
      throw new NetworkError(err instanceof Error ? err.message : "Network error during auth");
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 401 || res.status === 403) {
      throw new AuthError("Invalid API key");
    }
    if (!res.ok) {
      throw new ApiError(`Auth failed: ${res.statusText}`, res.status);
    }

    const data = await res.json() as { token: string; expiresAt: number };
    this.token = { value: data.token, expiresAt: data.expiresAt };
  }

  private async executeRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
    await this.ensureToken();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token!.value}`,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new NetworkError(`Request timed out after ${this.timeout}ms`);
      }
      throw new NetworkError(err instanceof Error ? err.message : "Network error");
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 400) {
      const data = await res.json() as { message?: string; errors?: Record<string, string> };
      throw new ValidationError(data.message ?? "Validation failed", data.errors ?? {});
    }
    if (res.status === 401 || res.status === 403) {
      this.token = null; // invalidate cached token
      throw new AuthError(`Authentication failed: ${res.statusText}`);
    }
    if (res.status === 503) {
      throw new ApiError("Service temporarily unavailable", 503);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { message?: string };
      throw new ApiError(data.message ?? res.statusText, res.status);
    }

    return res.json() as Promise<T>;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await this.executeRequest<T>(method, path, body);
      } catch (err) {
        const isRetriable =
          err instanceof NetworkError ||
          (err instanceof ApiError && err.statusCode === 503);

        if (!isRetriable || attempt >= this.maxRetries) throw err;

        await sleep(this.retryBaseDelay * Math.pow(2, attempt));
        attempt++;
      }
    }
  }
}
