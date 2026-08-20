/**
 * Directory home. Phase 1 renders chrome with an empty snapshot.
 *
 * Phase 3 will:
 * 1. Parse `searchParams` via `directoryFiltersFromSearchParams`.
 * 2. Call `loadLiveDirectory` with the shared cache.
 * 3. Pass the snapshot into `DirectoryPageShell`.
 */

import { DirectoryPageShell } from "@/components/directory/DirectoryPageShell";

export default function HomePage() {
  return <DirectoryPageShell snapshot={undefined} />;
}
