import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "F.R.I.D.A.Y - AI Assistant",
  description: "Your free AI assistant powered by open-source models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
