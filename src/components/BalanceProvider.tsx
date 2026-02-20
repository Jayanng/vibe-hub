"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccounts } from "@midl/react";

interface BalanceContextType {
    balance: number | null;
}

const BalanceContext = createContext<BalanceContextType>({ balance: null });

export const useGlobalBalance = () => useContext(BalanceContext);

export const BalanceProvider = ({ children }: { children: ReactNode }) => {
    const [balance, setBalance] = useState<number | null>(null);
    const { isConnected, accounts } = useAccounts();

    useEffect(() => {
        const fetchBalance = async () => {
            if (!isConnected || !accounts || accounts.length === 0) {
                setBalance(null);
                return;
            }

            try {
                let totalWalletBalance = 0;
                for (const account of accounts) {
                    const address = account.address;
                    const response = await fetch(`/api/balance?address=${address}`);
                    if (response.ok) {
                        const utxos = await response.json();
                        if (Array.isArray(utxos)) {
                            const addressSats = utxos.reduce((sum: number, utxo: any) => sum + (utxo.value || 0), 0);
                            totalWalletBalance += addressSats;
                        }
                    }
                }
                setBalance(totalWalletBalance / 100000000); // Convert satoshis to BTC
            } catch (error) {
                console.error('[Global Balance] Failed to fetch balance:', error);
                setBalance(0);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000);
        return () => clearInterval(interval);
    }, [isConnected, accounts]);

    return (
        <BalanceContext.Provider value={{ balance }}>
            {children}
        </BalanceContext.Provider>
    );
};
