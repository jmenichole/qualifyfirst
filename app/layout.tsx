import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotificationProvider } from "./components/Notifications";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QualifyFirst - Qualify First, Survey Second",
  description: "Complete your profile once and only see surveys you actually qualify for. No more wasted time on disqualifications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NotificationProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </NotificationProvider>
      </body>
    </html>
  );
}
