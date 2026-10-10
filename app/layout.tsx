import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../src/index.css";

// oxlint-disable-next-line react/only-export-components -- Next.js requires metadata beside the layout.
export const metadata: Metadata = {
  title: "Chart & Design",
  description:
    "Real-time astrology and Human Design transit charts with personalized daily interpretation.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
