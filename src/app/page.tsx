/**
 * Directory home. SSR via loadLiveDirectory. GET / never calls X.
 */

import { DirectoryPageShell } from "@/components/directory/DirectoryPageShell";
import { getSharedLiveDirectoryCache } from "@/lib/cache/shared-live-directory-cache";
import { loadHomeDirectorySnapshot } from "@/lib/directory/load-home-directory";

type HomePageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function searchParamsToURLSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const raw = await searchParams;
  const snapshot = await loadHomeDirectorySnapshot(
    searchParamsToURLSearchParams(raw),
    {
      cache: getSharedLiveDirectoryCache(),
      now: new Date(),
    },
  );
  return <DirectoryPageShell snapshot={snapshot} />;
}
