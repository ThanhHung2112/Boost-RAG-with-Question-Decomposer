import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
const ModalControl = dynamic(
  () => import("@/components/modals/modal-control").then((mod) => mod.ModalControl),
  {
    ssr: false
  }
);

const RagsyWrapper = dynamic(
  () => import("@/components/chatbot/components/wrapper").then((mod) => mod.RagsyWrapper),
  {
    loading: () => <LazyLoading />,
    ssr: false
  }
);
import dynamic from "next/dynamic";
import { LazyLoading } from "@/components/lazyloading";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "white" }}>
          <div className="relative flex flex-col h-screen">
            <ModalControl />
            <RagsyWrapper>{children}</RagsyWrapper>
          </div>
        </Providers>
      </body>
    </html>
  );
}
