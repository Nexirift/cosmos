import { ModeToggle } from "@/components/mode-toggle";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { checkCache } from "@/lib/actions";
import { SettingKey } from "@/lib/defaults";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <div className="font-sans">{children}</div>
            {/* Theme toggle button */}
            <div className="fixed bottom-4 right-4">
              <ModeToggle />
            </div>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
        <Script id="debug">{`localStorage.debug = '*'`}</Script>
      </body>
    </html>
  );
}

export async function generateMetadata() {
  const title = String(await checkCache(SettingKey.appName));
  const description = String(await checkCache(SettingKey.appDescription));
  return {
    title,
    description,
  } as Metadata;
}
