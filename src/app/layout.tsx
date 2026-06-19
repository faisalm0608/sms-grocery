import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import PWARegister from "@/components/shared/PWARegister";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SMS Grocery Shop - Fresh & Fast Online Supermarket",
  description: "Order fresh groceries online from SMS Grocery Shop in Thanjavur. Sourced fresh, packed cleanly, ready for pickup or delivery.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SMS Grocery",
  },
};

export const viewport: Viewport = {
  themeColor: "#0c831f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${outfit.className} min-h-full flex flex-col antialiased`}>
        <AppProvider>
          <PWARegister />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}


