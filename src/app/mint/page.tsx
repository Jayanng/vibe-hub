"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from "@midl/satoshi-kit";
import { midlConfig } from "@/midlConfig";
import { addNetwork } from "@midl/core";
import { useConnect, useAccounts, useDisconnect, useConfig } from "@midl/react";
import { AddressPurpose } from "@midl/core";
import { useEVMAddress } from "@midl/executor-react";
import { ClaimBadge } from "@/components/ClaimBadge"; // New Component

// 🟢 YOUR LIVE CONTRACT ADDRESS
const SBT_CONTRACT_ADDRESS = "0x5FAd0EBEcB2dB5A2Ed763507A3A1B6cC0e060871";

// --- 1. BADGE DATA ---
const BADGES_DATA = [
    { id: "early-adopter", title: "Early Adopters", desc: "For the pioneers who helped stress-test the network before mainnet.", icon: "military_tech", colorClass: "bg-linear-to-br from-yellow-600 to-yellow-900", glowClass: "badge-glow-gold", tagClass: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10", rarity: "Legendary", rarityPct: "0.5%", xp: 1000, locked: false, badgeTypeId: 1 },
    { id: "faucet-flyer", title: "Faucet Frequent Flyer", desc: "Successfully claimed testnet tokens from the MIDL faucet 5+ times.", icon: "water_drop", colorClass: "bg-linear-to-br from-blue-400 to-blue-700", glowClass: "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]", tagClass: "text-blue-500 border-blue-500/30 bg-blue-500/10", rarity: "Common", rarityPct: "45%", xp: 50, locked: false, badgeTypeId: 2 },
    { id: "liquidity", title: "Liquidity Lord", desc: "Provided >0.01 BTC liquidity...", icon: "waves", colorClass: "bg-linear-to-br from-purple-600 to-purple-900", tagClass: "text-purple-500 border-purple-500/30 bg-purple-500/10", rarity: "Epic", rarityPct: "5%", xp: 450, locked: false, badgeTypeId: 3 },
    { id: "yield", title: "Yield Harvester", desc: "Staked assets in a MIDL lending...", icon: "agriculture", colorClass: "bg-linear-to-br from-emerald-600 to-emerald-900", tagClass: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10", rarity: "Rare", rarityPct: "15%", xp: 200, locked: false, badgeTypeId: 4 },
    { id: "atomic", title: "Atomic Swapper", desc: "Completed 50+ swaps on MIDL...", icon: "swap_horiz", colorClass: "bg-linear-to-br from-orange-600 to-orange-900", tagClass: "text-orange-500 border-orange-500/30 bg-orange-500/10", rarity: "Rare", rarityPct: "12%", xp: 300, locked: true },
    { id: "rune", title: "Rune Runner", desc: "Minted or transferred a Rune token...", icon: "auto_awesome", colorClass: "bg-linear-to-br from-pink-600 to-rose-900", tagClass: "text-pink-500 border-pink-500/30 bg-pink-500/10", rarity: "Rare", rarityPct: "18%", xp: 350, locked: true },
    { id: "ordinal", title: "Ordinal Curator", desc: "Holds at least 30 Bitcoin Ordinal...", icon: "collections", colorClass: "bg-linear-to-br from-indigo-600 to-indigo-900", tagClass: "text-indigo-500 border-indigo-500/30 bg-indigo-500/10", rarity: "Rare", rarityPct: "20%", xp: 300, locked: true },
    { id: "dao", title: "DAO Architect", desc: "Voted on at least 7 governance...", icon: "gavel", colorClass: "bg-linear-to-br from-teal-600 to-teal-900", tagClass: "text-teal-500 border-teal-500/30 bg-teal-500/10", rarity: "Uncommon", rarityPct: "30%", xp: 150, locked: true },
    { id: "sybil", title: "Social Sybil Slayer", desc: "Linked a verified X (Twitter)...", icon: "fingerprint", colorClass: "bg-linear-to-br from-sky-600 to-sky-900", tagClass: "text-sky-500 border-sky-500/30 bg-sky-500/10", rarity: "Common", rarityPct: "40%", xp: 100, locked: true },
    { id: "scout", title: "Ecosystem Scout", desc: "Held at least 10 different tokens...", icon: "travel_explore", colorClass: "bg-linear-to-br from-cyan-600 to-cyan-900", tagClass: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10", rarity: "Rare", rarityPct: "14%", xp: 400, locked: true },
    { id: "iron", title: "Iron Hands", desc: "Supplied collateral and maintained...", icon: "front_hand", colorClass: "bg-linear-to-br from-red-600 to-red-900", tagClass: "text-red-500 border-red-500/30 bg-red-500/10", rarity: "Epic", rarityPct: "6%", xp: 500, locked: true },
    { id: "dev", title: "Smart Contract Artisan", desc: "Deployed a smart contract on MIDL...", icon: "terminal", colorClass: "bg-linear-to-br from-slate-500 to-slate-800", tagClass: "text-slate-400 border-slate-400/30 bg-slate-500/10", rarity: "Legendary", rarityPct: "1%", xp: 900, locked: true }
];

import { useGlobalBalance } from '@/components/BalanceProvider';

// --- 2. MINT PAGE COMPONENT ---
export default function MintPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [mounted, setMounted] = useState(false);
    const { balance } = useGlobalBalance();

    // --- CONNECT HOOKS ---
    const { isConnected, accounts } = useAccounts();
    const address = accounts?.[0]?.address || "";
    const { connect, connectors } = useConnect({ purposes: [AddressPurpose.Payment, AddressPurpose.Ordinals] });

    const evmAddress = useEVMAddress({ from: address });
    console.log("[DEBUG] EVM Address:", evmAddress);

    useEffect(() => { setMounted(true); }, []);

    // --- HELPER FUNCTIONS ---
    const truncateAddress = (addr: string | null) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleConnect = () => {
        const xverse = connectors.find(c => c.id.toLowerCase().includes('xverse'));
        if (xverse) connect({ id: xverse.id });
    };

    if (!mounted) return null;

    const filteredBadges = BADGES_DATA.filter(badge =>
        badge.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-[#231a0f] text-slate-200 font-sans overflow-hidden">

            {/* SIDEBAR (Kept same as before) */}
            <aside className="w-20 lg:w-64 h-full border-r border-white/5 bg-[#f8f7f5]/5 dark:bg-[#231a0f]/95 flex flex-col justify-between z-20 transition-all duration-300">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded bg-[#f7951d] flex items-center justify-center shadow-lg shadow-[#f7951d]/20 shrink-0">
                        <span className="material-icons text-white text-xl">token</span>
                    </div>
                    <span className="hidden lg:block ml-3 font-bold text-xl text-white tracking-wide">Soul Hub</span>
                </div>

                <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
                    <Link href="/" className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">dashboard</span>
                        <span className="hidden lg:block ml-3 font-medium">Dashboard</span>
                    </Link>
                    <div className="flex items-center p-3 rounded-lg bg-[#f7951d]/10 text-[#f7951d] border border-[#f7951d]/20 cursor-default">
                        <span className="material-icons">diamond</span>
                        <span className="hidden lg:block ml-3 font-bold">Mint & Claim</span>
                        <span className="hidden lg:flex ml-auto w-2 h-2 rounded-full bg-[#f7951d] shadow-[0_0_8px_rgba(247,149,29,0.8)]"></span>
                    </div>
                    {/* Placeholder Nav Items */}
                    <div className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">leaderboard</span>
                        <span className="hidden lg:block ml-3 font-medium">Leaderboard</span>
                    </div>
                    <div className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">person</span>
                        <span className="hidden lg:block ml-3 font-medium">Profile</span>
                    </div>
                    <div className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">history</span>
                        <span className="hidden lg:block ml-3 font-medium">Activity</span>
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="mt-4 p-3 bg-white/5 rounded-lg hidden lg:flex items-center gap-3 border border-white/5">
                        <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold text-white ${address ? 'bg-green-500' : 'bg-slate-700'}`}>
                            {address ? "WB" : "?"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-slate-400">Connected as</span>
                            <span className="text-sm font-bold text-white truncate w-24">
                                {address ? truncateAddress(address) : "Guest"}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <header className="h-20 border-b border-white/5 bg-[#231a0f]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-white">Mint & Claim Badges</h1>
                        <p className="text-xs text-[#f7951d] uppercase tracking-widest">Midl Network • Soulbound Reputation</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-slate-300 text-xs font-medium hidden lg:block">Network Stable</span>
                        </div>
                        <div className="h-8 w-px bg-white/10 hidden md:block"></div>

                        <ConnectButton
                            beforeConnect={async (connectorId) => {
                                if (connectorId === 'xverse') {
                                    try {
                                        // @ts-ignore
                                        await addNetwork(midlConfig, connectorId, {
                                            id: "regtest",
                                            name: "MIDL Regtest",
                                            rpcUrl: "https://api-regtest-midl.xverse.app",
                                        } as any);
                                    } catch (e) {
                                        console.warn("Auto-network switch failed (optional feature):", e);
                                    }
                                }
                            }}
                        >
                            {({ openConnectDialog, openAccountDialog, isConnected, isConnecting }) => (
                                <button
                                    onClick={isConnected ? openAccountDialog : openConnectDialog}
                                    className="flex items-center gap-3 bg-[#f7951d] hover:bg-[#e68a19] text-black px-4 py-2 rounded-lg font-bold transition-all shadow-lg hover:shadow-orange-500/20"
                                >
                                    {isConnected ? (
                                        <>
                                            <span className="font-mono text-sm">{balance !== null ? Number(balance.toFixed(4)) : "0.00"} BTC</span>
                                            <div className="w-6 h-6 rounded-full bg-linear-to-tr from-blue-500 to-teal-400 border border-white/20"></div>
                                            <span className="text-sm opacity-80">{address ? truncateAddress(address) : "..."}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons text-xl">account_balance_wallet</span>
                                            <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </ConnectButton>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Available Soulbounds</h2>
                            <p className="text-slate-400">Mint unique badges that prove your on-chain activity.</p>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 material-icons text-sm">search</span>
                            <input
                                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white outline-none focus:ring-1 focus:ring-[#f7951d]"
                                placeholder="Search badges..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredBadges.map((badge) => {
                            const isEarlyAdopter = badge.id === "early-adopter";

                            return (
                                <div key={badge.id} className={`glass-card rounded-xl p-6 flex flex-col relative ${badge.locked ? 'opacity-60' : 'hover:border-[#f7951d]/50'}`}>
                                    <div className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${badge.tagClass}`}>
                                        {badge.locked ? 'Locked' : badge.rarity}
                                    </div>

                                    <div className="flex justify-center my-6">
                                        <div className={`w-24 h-24 hexagon flex items-center justify-center relative ${badge.colorClass}`}>
                                            <div className="absolute inset-[2px] hexagon bg-black/80 flex items-center justify-center">
                                                <span className="material-icons text-4xl text-white">{badge.icon}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-center mb-6">
                                        <h3 className="font-bold text-white">{badge.title}</h3>
                                        <p className="text-xs text-slate-400 mt-2 h-10 line-clamp-2">{badge.desc}</p>
                                    </div>

                                    {/* RARITY AND POINTS SECTION  */}
                                    <div className="flex justify-center items-center gap-4 text-xs font-medium text-slate-500 mb-6">
                                        <span>Rarity: {badge.rarityPct}</span>
                                        <span>Points: +{badge.xp}</span>
                                    </div>

                                    {/* MINT BUTTON AREA */}
                                    {!badge.locked ? (
                                        <ClaimBadge badgeId={badge.id} badgeTypeId={badge.badgeTypeId!} />
                                    ) : (
                                        <button disabled className="w-full py-2 rounded-lg border border-white/10 text-slate-500 text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                                            <span className="material-icons text-xs">lock</span>
                                            <span>Locked</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}