import type { Metadata } from "next";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/500.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppProvider } from "@/lib/store";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "DengueNet BD",
  description: "Dengue risk map, hospitals, ambulances and medicine for all of Bangladesh",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <AppProvider>
          <TopNav />
          <div className="flex flex-1 flex-col">{children}</div>
        </AppProvider>
      </body>
    </html>
  );
}
