import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nagara — A public memory for Bengaluru’s infrastructure",
  description:
    "A source-linked record of public infrastructure projects, commitments, changes and evidence in Bengaluru.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
