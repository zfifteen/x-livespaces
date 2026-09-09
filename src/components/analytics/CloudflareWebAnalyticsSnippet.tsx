/**
 * Cloudflare Web Analytics. Token from env at deploy — never a real token in git.
 * Empty / placeholder tokens render nothing.
 */

type CloudflareWebAnalyticsSnippetProps = {
  readonly token: string | undefined;
};

export function isUsableWebAnalyticsToken(token: string | undefined): boolean {
  if (token === undefined) {
    return false;
  }
  const trimmed = token.trim();
  if (trimmed === "") {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (lower === "replace_me" || lower === "placeholder" || lower === "your-token-here") {
    return false;
  }
  return true;
}

export function CloudflareWebAnalyticsSnippet({
  token,
}: CloudflareWebAnalyticsSnippetProps) {
  if (token === undefined || !isUsableWebAnalyticsToken(token)) {
    return null;
  }
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: token.trim() })}
    />
  );
}
