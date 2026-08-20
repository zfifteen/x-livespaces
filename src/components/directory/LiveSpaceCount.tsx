/**
 * Hero counter: how many Spaces are live right now (CONCEPT §4).
 *
 * `count` is the unfiltered live tally from `DirectorySnapshot.liveCount`.
 * `generatedAt` is for a future "updated Xs ago" line.
 */

type LiveSpaceCountProps = {
  readonly count: number | undefined;
  readonly generatedAt: Date | undefined;
};

export function LiveSpaceCount({ count, generatedAt }: LiveSpaceCountProps) {
  const displayCount = count === undefined ? "—" : String(count);
  void generatedAt;
  return (
    <section className="live-space-count" aria-label="Live Spaces right now">
      <p className="live-space-count__value">{displayCount}</p>
      <p className="live-space-count__label">live Spaces</p>
    </section>
  );
}
