import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CloudflareWebAnalyticsSnippet } from "@/components/analytics/CloudflareWebAnalyticsSnippet";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveSpaces",
  description: "A public directory of live X Spaces.",
};

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
