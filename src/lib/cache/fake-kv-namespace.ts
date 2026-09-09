/**
 * Test double for Cloudflare KV. Not used in production.
 */

import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";

export type KvPutRecord = {
  readonly key: string;
  readonly value: string;
  readonly expirationTtl: number | undefined;
};

export type FakeKvNamespace = KvNamespaceLike & {
  readonly puts: readonly KvPutRecord[];
};

export function createFakeKvNamespace(
  initial: Readonly<Record<string, string>> = {},
): FakeKvNamespace {
  const map = new Map<string, string>(Object.entries(initial));
  const puts: KvPutRecord[] = [];
  return {
    get puts() {
      return puts;
    },
    get: async (key: string): Promise<string | null> => {
      await Promise.resolve();
      return map.get(key) ?? null;
    },
    put: async (
      key: string,
      value: string,
      options?: { readonly expirationTtl?: number },
    ): Promise<void> => {
      await Promise.resolve();
      puts.push({
        key,
        value,
        expirationTtl: options?.expirationTtl,
      });
      map.set(key, value);
    },
  };
}
