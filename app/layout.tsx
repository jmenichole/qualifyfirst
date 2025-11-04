/**
 * QualifyFirst - Root Layout
 * 
 * Copyright (c) 2025 Mischief Manager Inc dba QualifyFirst
 * All rights reserved.
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { NotificationProvider } from "./components/Notifications";
import { CookieConsentBanner } from "./components/CookieConsent";

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
      <body className="antialiased font-sans">
        <NotificationProvider>
          <ErrorBoundary>
            {children}
            <CookieConsentBanner />
          </ErrorBoundary>
        </NotificationProvider>
      </body>
    </html>
  );
}
