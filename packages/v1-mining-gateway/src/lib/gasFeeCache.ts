import type { GasFees } from "../types";

class GasFeesCacheManager {
  private cache: Map<string, { value: GasFees; timestamp: number }> = new Map();

  constructor(private readonly cacheDurationMs = 2000) {}

  set(key: string, value: GasFees) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string): GasFees | null {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > this.cacheDurationMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.value;
  }
}

export const gasFeeCache = new GasFeesCacheManager();
