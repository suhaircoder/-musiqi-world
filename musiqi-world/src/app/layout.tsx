import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans_Arabic, Source_Sans_3 } from "next/font/google";
import { Providers } from "@/context/store";
import { Shell } from "@/components/Shell";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const arabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "600", "700"], variable: "--font-arabic" });

export const metadata: Metadata = {
  title: "MUSIQI WORLD",
  description: "Discover and listen to licensed Arabic and international music.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${display.variable} ${sans.variable} ${arabic.variable}`}>
      <body className="font-sans antialiased">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
