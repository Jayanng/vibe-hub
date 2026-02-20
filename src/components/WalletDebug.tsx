"use client";

import { useState } from "react";
import { useConnect, useAccounts } from "@midl/react";
import { midlConfig } from "../midlConfig";
import {
    AddressPurpose,
    getBalance,
    getFeeRate,
    getBlockNumber,
    signMessage,
    waitForTransaction
} from "@midl/core";

export function WalletDebug() {
    // Hooks
    const { connectors, connect, isPending, error } = useConnect({
        purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
    });
    const { isConnected, accounts } = useAccounts();

    // Local State for Actions
    const [balance, setBalance] = useState<string>("");
    const [feeRate, setFeeRate] = useState<string>("");
    const [blockHeight, setBlockHeight] = useState<string>("");
    const [signature, setSignature] = useState<string>("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleConnect = async (connectorId: string) => {
        console.log("🔌 Attempting to connect with connector ID:", connectorId);
        try {
            await connect({ id: connectorId });
            console.log("✅ Connection successful!");
        } catch (err) {
            console.error("❌ Connection failed:", err);
        }
    };

    const runGetBalance = async () => {
        if (!accounts?.[0]?.address) return;
        setActionLoading("balance");
        try {
            // @ts-ignore
            const bal = await getBalance(midlConfig, accounts[0].address);
            setBalance(bal.toString() + " sats");
        } catch (e: any) {
            setBalance("Error: " + e.message);
        }
        setActionLoading(null);
    };

    const runGetFeeRate = async () => {
        setActionLoading("fee");
        try {
            const rate = await getFeeRate(midlConfig);
            setFeeRate(rate.fastestFee + " sat/vB");
        } catch (e: any) {
            setFeeRate("Error: " + e.message);
        }
        setActionLoading(null);
    };

    const runGetBlockNumber = async () => {
        setActionLoading("block");
        try {
            const num = await getBlockNumber(midlConfig);
            setBlockHeight(num.toString());
        } catch (e: any) {
            setBlockHeight("Error: " + e.message);
        }
        setActionLoading(null);
    };

    const runSignMessage = async () => {
        if (!accounts?.[0]?.address) return;
        setActionLoading("sign");
        try {
            // Demo message signing
            const res = await signMessage(midlConfig, {
                message: "Verify ownership for Vibe Hub",
                address: accounts[0].address
            });
            // Result is { signature: string, ... }
            const sig = res.signature;
            setSignature(sig.slice(0, 10) + "...");
        } catch (e: any) {
            setSignature("Error");
            console.error(e);
        }
        setActionLoading(null);
    };

    return (
        <div className="fixed bottom-4 right-4 bg-black/90 border border-white/20 rounded-lg p-4 max-w-md text-xs text-white z-50 overflow-y-auto max-h-[80vh]">
            <h3 className="font-bold mb-2 text-[#f7951d] flex justify-between items-center">
                <span>🔍 MIDL Toolbox</span>
                <span className="text-[10px] text-slate-500">v0.1</span>
            </h3>

            <div className="space-y-3">
                {/* 1. Connection Status */}
                <div className="p-2 bg-white/5 rounded">
                    <div className="flex justify-between">
                        <strong>Status:</strong>
                        <span>{isConnected ? "✅ Connected" : "❌ Disconnected"}</span>
                    </div>
                    {isConnected && accounts?.[0] && (
                        <div className="mt-1 text-[10px] text-green-400 truncate">
                            {accounts[0].address}
                        </div>
                    )}
                </div>

                {/* 2. Actions (Only if Connected) */}
                {isConnected && (
                    <div className="grid grid-cols-2 gap-2">
                        {/* Get Balance */}
                        <div className="p-2 bg-white/5 rounded">
                            <button
                                onClick={runGetBalance}
                                disabled={!!actionLoading}
                                className="w-full text-left font-bold hover:text-[#f7951d]"
                            >
                                💰 Get Balance
                            </button>
                            <div className="mt-1 text-slate-300 h-4">
                                {actionLoading === "balance" ? "Loading..." : balance || "-"}
                            </div>
                        </div>

                        {/* Get Fee Rate */}
                        <div className="p-2 bg-white/5 rounded">
                            <button
                                onClick={runGetFeeRate}
                                disabled={!!actionLoading}
                                className="w-full text-left font-bold hover:text-[#f7951d]"
                            >
                                ⛽ Get Fee Rate
                            </button>
                            <div className="mt-1 text-slate-300 h-4">
                                {actionLoading === "fee" ? "Loading..." : feeRate || "-"}
                            </div>
                        </div>

                        {/* Get Block Number */}
                        <div className="p-2 bg-white/5 rounded">
                            <button
                                onClick={runGetBlockNumber}
                                disabled={!!actionLoading}
                                className="w-full text-left font-bold hover:text-[#f7951d]"
                            >
                                🧱 Block Height
                            </button>
                            <div className="mt-1 text-slate-300 h-4">
                                {actionLoading === "block" ? "Loading..." : blockHeight || "-"}
                            </div>
                        </div>

                        {/* Sign Message */}
                        <div className="p-2 bg-white/5 rounded">
                            <button
                                onClick={runSignMessage}
                                disabled={!!actionLoading}
                                className="w-full text-left font-bold hover:text-[#f7951d]"
                            >
                                ✍️ Sign Message
                            </button>
                            <div className="mt-1 text-slate-300 h-4 truncate">
                                {actionLoading === "sign" ? "Check Wallet..." : signature || "-"}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. Connectors (If Disconnected) */}
                {!isConnected && (
                    <div>
                        <strong>Available Connectors:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                            {connectors.map((c) => (
                                <li key={c.id} className="flex justify-between items-center">
                                    <span className="text-slate-400">{c.id}</span>
                                    <button
                                        onClick={() => handleConnect(c.id)}
                                        className="px-2 py-0.5 bg-[#f7951d] text-black rounded text-[10px] font-bold hover:bg-orange-500"
                                    >
                                        Connect
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
