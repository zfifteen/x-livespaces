/**
 * Deserialize a KV JSON snapshot back into the domain DirectorySnapshot.
 */

import { spaceIdFromString } from "@/domain/branded-ids";
import type { DirectoryFilters } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard, SpaceLifecycleState } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";
import { err, ok, type Result } from "@/domain/result";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseLifecycle(value: unknown): SpaceLifecycleState | undefined {
  if (value === "live" || value === "scheduled" || value === "ended") {
    return value;
  }
  return undefined;
}

function parseCard(value: unknown): Result<LiveSpaceCard, LiveSpacesError> {
  if (!isRecord(value)) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV card is not an object",
    });
  }
  if (typeof value["spaceId"] !== "string" || typeof value["title"] !== "string") {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV card missing spaceId or title",
    });
  }
  const idResult = spaceIdFromString(value["spaceId"]);
  if (!idResult.ok) {
    return idResult;
  }
  const lifecycleState = parseLifecycle(value["lifecycleState"]);
  if (lifecycleState === undefined) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV card has invalid lifecycleState",
    });
  }
  if (typeof value["listenerCount"] !== "number" || typeof value["joinUrl"] !== "string") {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV card missing listenerCount or joinUrl",
    });
  }
  const topicTags = Array.isArray(value["topicTags"])
    ? value["topicTags"].filter((tag): tag is string => typeof tag === "string")
    : [];
  const languageRaw = value["languageCode"];
  const startedAt = parseDate(value["startedAt"]);
  const scheduledStart = parseDate(value["scheduledStart"]);
  const card: LiveSpaceCard = {
    spaceId: idResult.value,
    title: value["title"],
    listenerCount: value["listenerCount"],
    topicTags,
    languageCode: typeof languageRaw === "string" ? languageRaw : undefined,
    lifecycleState,
    startedAt,
    scheduledStart,
    joinUrl: value["joinUrl"],
    sourceKind: "official-api",
  };
  return ok(card);
}

export function parseDirectorySnapshotJson(
  raw: string,
): Result<DirectorySnapshot, LiveSpacesError> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV snapshot is not JSON",
    });
  }
  if (!isRecord(parsed)) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV snapshot is not an object",
    });
  }
  const generatedAt = parseDate(parsed["generatedAt"]);
  if (generatedAt === undefined || typeof parsed["liveCount"] !== "number") {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV snapshot missing generatedAt or liveCount",
    });
  }
  if (!isRecord(parsed["appliedFilters"])) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV snapshot missing appliedFilters",
    });
  }
  const filtersRaw = parsed["appliedFilters"];
  const languageCode =
    typeof filtersRaw["languageCode"] === "string"
      ? filtersRaw["languageCode"]
      : undefined;
  const appliedFilters: DirectoryFilters = {
    keywordQuery:
      typeof filtersRaw["keywordQuery"] === "string" ? filtersRaw["keywordQuery"] : "",
    liveOnly: filtersRaw["liveOnly"] !== false,
    minimumListenerCount:
      typeof filtersRaw["minimumListenerCount"] === "number"
        ? filtersRaw["minimumListenerCount"]
        : 0,
    languageCode,
  };
  if (!Array.isArray(parsed["visibleCards"])) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "KV snapshot visibleCards is not an array",
    });
  }
  const visibleCards: LiveSpaceCard[] = [];
  for (const row of parsed["visibleCards"]) {
    const cardResult = parseCard(row);
    if (!cardResult.ok) {
      return cardResult;
    }
    visibleCards.push(cardResult.value);
  }
  const coverageRaw = parsed["coverage"];
  const snapshot: DirectorySnapshot = {
    generatedAt,
    liveCount: parsed["liveCount"],
    appliedFilters,
    visibleCards,
  };
  if (coverageRaw === "official-search" || coverageRaw === "cached-after-failure") {
    return ok({ ...snapshot, coverage: coverageRaw });
  }
  return ok(snapshot);
}
