"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  refreshButtonDisabled,
  refreshButtonLabel,
} from "@/lib/directory/format-refreshed-ago";
import { postSpacesRefresh } from "@/lib/directory/post-spaces-refresh";

const DEFAULT_COOLDOWN_SECONDS = 1800;

export type DirectoryRefreshControlProps = {
  readonly generatedAtIso: string | undefined;
  readonly cooldownSeconds?: number;
  readonly now?: Date;
  readonly postRefresh?: typeof postSpacesRefresh;
};

export function DirectoryRefreshControl({
  generatedAtIso,
  cooldownSeconds = DEFAULT_COOLDOWN_SECONDS,
  now,
  postRefresh = postSpacesRefresh,
}: DirectoryRefreshControlProps) {
  const router = useRouter();
  const [inFlight, setInFlight] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const clock = now ?? new Date();
  const generatedAt = useMemo(() => {
    if (generatedAtIso === undefined) {
      return undefined;
    }
    const parsed = new Date(generatedAtIso);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }, [generatedAtIso]);

  const disabled = refreshButtonDisabled({
    generatedAt,
    now: clock,
    inFlight,
    cooldownSeconds,
  });
  const label = refreshButtonLabel({
    generatedAt,
    now: clock,
    inFlight,
  });

  const onClick = useCallback(async () => {
    if (disabled) {
      return;
    }
    setInFlight(true);
    setErrorMessage(undefined);
    const result = await postRefresh();
    setInFlight(false);
    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }
    router.refresh();
  }, [disabled, postRefresh, router]);

  return (
    <div className="directory-refresh">
      <button
        type="button"
        className="directory-refresh__button"
        disabled={disabled}
        aria-busy={inFlight}
        onClick={() => {
          void onClick();
        }}
      >
        {label}
      </button>
      {errorMessage !== undefined ? (
        <p className="directory-refresh__error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
