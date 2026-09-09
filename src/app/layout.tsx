import type { ReactNode } from "react";
import { CloudflareWebAnalyticsSnippet } from "@/components/analytics/CloudflareWebAnalyticsSnippet";
import { liveSpacesMetadata } from "@/lib/seo/live-spaces-metadata";
import "./globals.css";

export const metadata = liveSpacesMetadata;

type RootLayoutProps = {
  readonly children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  const analyticsToken = process.env["CLOUDFLARE_WEB_ANALYTICS_TOKEN"];
  return (
    <html lang="en">
      <body>
        {children}
        <CloudflareWebAnalyticsSnippet token={analyticsToken} />
      </body>
    </html>
  );
}
