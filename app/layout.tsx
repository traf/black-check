import type { Metadata } from "next";
import localFont from "next/font/local";
import Nav from "./components/Nav";

import Logo from "./components/Logo";
import PrivyWrapper from "./components/PrivyProvider";
import "./globals.css";

const carbon = localFont({
  src: [{ path: "../public/fonts/carbon.woff2" }],
  variable: "--font-mono",
});

const fk = localFont({
  src: [{ path: "../public/fonts/fk.woff2" }],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Black Check",
  description: "✓",
  openGraph: {
    images: [
      {
        url: "/og.png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Black Check",
    description: "✓",
    images: ["/og.png"],
  },
  icons: {
    shortcut: "/check-dark.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`flex flex-col lg:flex-row h-fit lg:h-screen bg-neutral-950 text-white antialiased selection:bg-white selection:text-black font-mono overscroll-none ${carbon.variable} ${fk.variable}`}>
        <PrivyWrapper>
          <div className="w-14 h-screen hidden lg:flex justify-between flex-col flex-shrink-0">
            <Logo />
            <div className="w-14 h-14 border-t border-neutral-800"></div>
          </div>
          <main className="flex flex-col w-full h-auto lg:h-full border-x border-neutral-800">
            <Nav />
            <div className="flex-1 overflow-auto lg:overflow-hidden">
              {children}
            </div>
          </main>
          <div className="w-14 h-screen hidden lg:flex justify-between flex-col flex-shrink-0">
            <div className="w-14 h-14 border-b border-neutral-800"></div>
            <div className="w-14 h-14 border-t border-neutral-800"></div>
          </div>
        </PrivyWrapper>
      </body>
    </html>
  );
}
