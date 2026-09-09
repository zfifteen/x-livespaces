import type { Metadata } from "next";

export const LIVE_SPACES_TITLE = "LiveSpaces";

export const LIVE_SPACES_DESCRIPTION =
  "A broad sample of live Spaces — not every live Space on X.";

export const EMPTY_SNAPSHOT_COPY =
  "No snapshot yet. Refresh to load a broad sample of live Spaces.";

export const REFRESH_HTTP_ERROR_COPY =
  "Couldn't refresh this sample of live Spaces. Try again in a few minutes.";

export const REFRESH_NETWORK_ERROR_COPY =
  "Couldn't refresh this sample of live Spaces. Check your connection and try again.";

export const LIVE_SPACES_CANONICAL_URL =
  "https://x-livespaces.dionisio-lopez.workers.dev";

export const liveSpacesMetadata: Metadata = {
  metadataBase: new URL(LIVE_SPACES_CANONICAL_URL),
  title: LIVE_SPACES_TITLE,
  description: LIVE_SPACES_DESCRIPTION,
  robots: { index: true, follow: true },
  openGraph: {
    title: LIVE_SPACES_TITLE,
    description: LIVE_SPACES_DESCRIPTION,
    type: "website",
    siteName: LIVE_SPACES_TITLE,
    url: LIVE_SPACES_CANONICAL_URL,
  },
};
