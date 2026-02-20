"use client";

import React from 'react';
import { MidlProvider } from "@midl/react";
import { WagmiMidlProvider } from "@midl/executor-react"; // For smart contract features
import { SatoshiKitProvider } from "@midl/satoshi-kit";
import { QueryClientProvider } from "@tanstack/react-query";
import { midlConfig } from "../midlConfig";
import { queryClient } from "../query-client";
import "@midl/satoshi-kit/styles.css";
import "./globals.css";
import { BalanceProvider } from "../components/BalanceProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#231a0f] text-slate-200 antialiased font-sans">
        {/* The Official Provider Stack */}
        <MidlProvider config={midlConfig}>
          <QueryClientProvider client={queryClient}>
            <WagmiMidlProvider>
              <SatoshiKitProvider config={midlConfig}>
                <BalanceProvider>
                  {children}
                </BalanceProvider>
              </SatoshiKitProvider>
            </WagmiMidlProvider>
          </QueryClientProvider>
        </MidlProvider>
      </body>
    </html>
  );
}