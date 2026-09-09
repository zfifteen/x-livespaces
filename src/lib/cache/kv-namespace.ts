/**
 * Minimal Cloudflare KV surface used by adapters. Tests supply a fake.
 */

export type KvNamespaceLike = {
  readonly get: (key: string) => Promise<string | null>;
  readonly put: (
    key: string,
    value: string,
    options?: { readonly expirationTtl?: number },
  ) => Promise<void>;
};
