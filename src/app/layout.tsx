import type { Metadata } from "next";
import { Cairo, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Soly's Space | Cozy Girls-Only Club 🎀",
  description: "A cozy, strictly girls-only club to take classes, join workshops, and make new besties at Soly's Space.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" className={`${cairo.variable} ${playfair.variable} ${outfit.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ConfirmProvider>
            {children}
            <Toaster position="bottom-left" richColors />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
