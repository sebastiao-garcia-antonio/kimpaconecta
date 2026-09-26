import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AuthSessionProvider } from "@/providers/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://kimpaconecta.vercel.app"),
  title: "Kimpa Connect | Plataforma Académica Colaborativa",
  description: "O portal de integração académica oficial da Universidade Kimpa Vita. Uma ponte de inovação, networking e conhecimento.",
  icons: {
    icon: "/logo-oficial.jpeg",
    apple: "/logo-oficial.jpeg",
    shortcut: "/logo-oficial.jpeg",
  },
  openGraph: {
    title: "Kimpa Connect | Universidade Kimpa Vita",
    description: "A comunidade académica da Universidade Kimpa Vita num só lugar.",
    images: ["/logo-oficial.jpeg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
