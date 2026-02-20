"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConnect, useAccounts, useDisconnect } from "@midl/react";
import { ConnectButton } from "@midl/satoshi-kit";
import { AddressPurpose, switchNetwork, regtest, addNetwork } from "@midl/core";
import { midlConfig } from "@/midlConfig";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 4. ZUSTAND STORE
interface AppConfigState {
  hasVisited: boolean;
  setHasVisited: () => void;
}

const useConfigStore = create<AppConfigState>(
  persist(
    (set) => ({
      hasVisited: false,
      setHasVisited: () => set({ hasVisited: true }),
    }),
    {
      name: 'midl-config-storage',
    }
  ) as any
);
// --- 1. SHARED DATA (Synced with Mint Page) ---
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

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { balance } = useGlobalBalance();

  // MIDL Hooks
  const { isConnected, accounts } = useAccounts();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect({
    purposes: [AddressPurpose.Ordinals, AddressPurpose.Payment],
  });

  const address = isConnected && accounts?.[0] ? accounts[0].address : null;

  const [claimedBadges, setClaimedBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    setMounted(true);

    if (isConnected && address) {
      const newClaimed: Record<string, number> = {};
      BADGES_DATA.forEach(badge => {
        const key = `vibe_badge_claim_${address}_${badge.id}`;
        const val = localStorage.getItem(key);
        if (val) {
          // Fallback: if they minted prior to the timestamp update, val is "true".
          newClaimed[badge.id] = val === "true" ? 1 : parseInt(val, 10);
        }
      });
      setClaimedBadges(newClaimed);
    } else {
      setClaimedBadges({});
    }
  }, [isConnected, address]);

  // --- 2. DYNAMIC CALCULATIONS ---

  // A. Filter Owned Data Dynamically
  // Only explicitly claimed badges by this wallet based on local storage
  const ownedBadges = BADGES_DATA.filter(b => claimedBadges[b.id] !== undefined);
  const nextQuest = BADGES_DATA.find(b => claimedBadges[b.id] === undefined); // The next unclaimed badge

  // Filter for visual "Recent Achievements" box (only 2, sorted newest to oldest)
  const recentAchievements = [...ownedBadges]
    .sort((a, b) => (claimedBadges[b.id] || 0) - (claimedBadges[a.id] || 0))
    .slice(0, 2);

  // B. XP & Level
  const totalXP = ownedBadges.reduce((acc, curr) => acc + curr.xp, 0);
  const maxPossibleXP = BADGES_DATA.reduce((acc, curr) => acc + curr.xp, 0); // Total XP of all badges
  const currentLevel = Math.floor(totalXP / 500) + 1; // Level 3 (1050 / 500 = 2.1 -> +1 = 3)
  const nextLevelThreshold = currentLevel * 500;
  const progressPercent = Math.min(((totalXP % 500) / 500) * 100, 100);

  // C. Reputation (Standard: XP * 10 Multiplier)
  // Gives a "Score" feel rather than just a raw stat.
  const reputation = isConnected && ownedBadges.length > 0 ? Math.floor(totalXP / 5) : 0;

  // D. Rank (Standard: Simulated Leaderboard)
  // Simulates a leaderboard of 10,000 early users. As you gain Rep, your rank # drops (improves).
  // Math.max(1, ...) ensures you never go below Rank #1.
  const baseRank = 10000;
  const rank = Math.max(1, baseRank - Math.floor(reputation / 2));

  // E. Dynamic Title
  // Only grant "Pioneer" if they have the specific Legendary badge.
  const hasEarlyAdopter = ownedBadges.some(b => b.id === "early-adopter");
  const userTitle = hasEarlyAdopter ? "Pioneer" : "Explorer";

  // Handlers
  const handleConnect = async () => {
    try {
      await connect({});
    } catch (error: any) {
      console.error('Connection error:', error);
      alert(`Connection Failed: ${error?.message || 'Please try again.'}`);
    }
  };

  const truncateAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex h-screen bg-[#231a0f] text-slate-200 font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 h-full border-r border-white/5 bg-[#f8f7f5]/5 dark:bg-[#231a0f]/95 flex flex-col justify-between z-20 transition-all duration-300">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
          <div className="w-10 h-10 rounded bg-[#f7951d] flex items-center justify-center shadow-lg shadow-[#f7951d]/20 shrink-0">
            <span className="material-icons text-white text-xl">token</span>
          </div>
          <span className="hidden lg:block ml-3 font-bold text-xl text-white tracking-wide">Soul Hub</span>
        </div>

        <nav className="flex-1 py-8 flex flex-col gap-2 px-3">
          <div className="flex items-center p-3 rounded-lg bg-[#f7951d]/10 text-[#f7951d] border border-[#f7951d]/20 transition-colors group cursor-pointer">
            <span className="material-icons">dashboard</span>
            <span className="hidden lg:block ml-3 font-medium">Dashboard</span>
            <span className="hidden lg:flex ml-auto w-2 h-2 rounded-full bg-[#f7951d] shadow-[0_0_8px_rgba(247,149,29,0.8)]"></span>
          </div>

          <Link href="/mint" className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group">
            <span className="material-icons group-hover:text-[#f7951d] transition-colors">diamond</span>
            <span className="hidden lg:block ml-3 font-medium">Mint & Claim</span>
          </Link>

          <div className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
            <span className="material-icons group-hover:text-[#f7951d] transition-colors">leaderboard</span>
            <span className="hidden lg:block ml-3 font-medium">Leaderboard</span>
          </div>
          <Link href="/profile" className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
            <span className="material-icons group-hover:text-[#f7951d] transition-colors">account_circle</span>
            <span className="hidden lg:block ml-3 font-medium">Profile</span>
          </Link>
          <div className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
            <span className="material-icons group-hover:text-[#f7951d] transition-colors">history</span>
            <span className="hidden lg:block ml-3 font-medium">Activity</span>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="mt-4 p-3 bg-white/5 rounded-lg hidden lg:flex items-center gap-3 border border-white/5">
            <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-xs font-bold text-white ${address ? 'bg-green-500' : 'bg-slate-700'}`}>
              {mounted && address ? "WB" : "?"}
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">Connected as</span>
              <span className="text-sm font-bold text-white truncate w-24">
                {mounted && address ? truncateAddress(address) : "Guest"}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-white/5 bg-[#231a0f]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Dashboard</h1>
            <p className="text-xs text-[#f7951d]/80 font-medium tracking-widest uppercase mt-0.5">Midl Network • Testnet</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Network Stable</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>

            <ConnectButton
              beforeConnect={async (connectorId) => {
                if (connectorId === 'xverse') {
                  try {
                    // @ts-ignore
                    await addNetwork(midlConfig, connectorId, {
                      id: "regtest", // Standard ID for regtest in Xverse
                      name: "MIDL Regtest",
                      rpcUrl: "https://api-regtest-midl.xverse.app", // Indexer URL provided by user
                      // Fallback or additional fields if needed
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

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-8 relative z-0 custom-scrollbar">
          <div className="mb-8 flex flex-col md:flex-row items-end justify-between gap-4">
            <div>
              {/* 3. DYNAMIC TITLE: Shows "Pioneer" only if connected & has badge */}
              <h2 className="text-3xl font-bold text-white">
                {mounted && isConnected
                  ? `Welcome back, ${userTitle}`
                  : "Connect to Begin"}
              </h2>
              <p className="text-slate-400 mt-1">Your on-chain reputation hub on Bitcoin Layer 1.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

            {/* SOUL LEVEL CHART */}
            <div className="xl:col-span-1 glass-card rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[400px]">
              <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#f7951d]/5 pointer-events-none"></div>
              <h3 className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-6 z-10">Soul Level Status</h3>

              <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-[#f7951d]/20 rounded-full blur-3xl animate-pulse"></div>
                <svg className="w-full h-full transform -rotate-90 z-10 block" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="3"
                  ></path>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f7951d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={isConnected ? `${progressPercent}, 100` : "0, 100"}
                    className="transition-all duration-1000 ease-out"
                  ></path>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <span className="text-5xl font-bold text-white drop-shadow-lg">{isConnected ? currentLevel : "0"}</span>
                  <span className="text-xs text-[#f7951d] font-bold uppercase tracking-wider mt-1">Level</span>
                </div>
              </div>

              <div className="text-center z-10 w-full max-w-xs">
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                  <span>XP Progress</span>
                  <span className="text-[#f7951d]">
                    {isConnected ? `${(totalXP % 500)} / 500` : "0 / 500"}
                  </span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#f7951d] h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: isConnected ? `${progressPercent}%` : "0%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right Column Stats */}
            <div className="xl:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Reputation</span>
                  <div className="mt-auto">
                    {/* Calculated Reputation */}
                    <span className="text-3xl font-bold text-white block">{isConnected ? reputation.toLocaleString() : "---"}</span>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Rank</span>
                  <div className="mt-auto">
                    {/* Calculated Rank */}
                    <span className="text-3xl font-bold text-white block">{isConnected ? `#${rank.toLocaleString()}` : "---"}</span>
                  </div>
                </div>
                <div className="glass-card p-6 rounded-xl flex flex-col justify-between h-32 relative group overflow-hidden">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Badges</span>
                  <div className="mt-auto">
                    {/* Real Badge Count */}
                    <span className="text-3xl font-bold text-white block">{isConnected ? `${ownedBadges.length}/12` : "---"}</span>
                  </div>
                </div>
              </div>

              {/* REAL ACHIEVEMENTS LIST */}
              <div className="flex-1 glass-card rounded-xl p-6 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Recent Achievements</h3>
                </div>
                <div className="space-y-4 flex flex-col justify-start flex-1 min-h-[160px]">
                  {isConnected && recentAchievements.length > 0 ? (
                    recentAchievements.map((badge, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                        <div className={`w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center shrink-0 ${badge.colorClass}`}>
                          <span className="material-icons text-white text-lg">{badge.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-bold text-sm truncate group-hover:text-[#f7951d] transition-colors">{badge.title}</h4>
                          <p className="text-slate-400 text-xs truncate mt-0.5">{badge.desc}</p>
                        </div>
                        <span className="text-xs font-bold text-[#f7951d] hidden sm:block">+{badge.xp} XP</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm">
                      <span className="material-icons text-4xl mb-2 opacity-30">inventory_2</span>
                      No achievements yet.
                      <Link href="/mint" className="text-[#f7951d] hover:underline ml-1">Start Minting</Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC RECOMMENDED QUEST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            <div className="glass-card rounded-xl p-6 border-l-4 border-l-[#f7951d] relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-[#f7951d] uppercase tracking-wide">Recommended Quest</span>
                  {/* Shows title of the first LOCKED badge */}
                  <h3 className="text-lg font-bold text-white mt-1">{nextQuest ? nextQuest.title : "All Quests Complete!"}</h3>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                  <span className="material-icons text-slate-400 text-sm">arrow_forward</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                {nextQuest ? nextQuest.desc : "You have mastered the ecosystem. Stay tuned for Phase 2."}
              </p>
              <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-2">
                <div className="bg-linear-to-r from-[#f7951d] to-yellow-500 h-2 rounded-full w-[0%]"></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Reward: <span className="text-white">{nextQuest ? nextQuest.rarity : "Glory"} Badge</span></span>
                <span>0% Complete</span>
              </div>
            </div>

            {/* Governance Card (Original 2-Button Version) */}
            <div className="glass-card rounded-xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Governance</span>
                  <h3 className="text-lg font-bold text-white mt-1">Active Proposal #42</h3>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase tracking-wide">
                  Voting Open
                </span>
              </div>

              <p className="text-slate-400 text-sm mb-4">
                "Proposal to integrate Vibe Hub minting fees into the community treasury."
              </p>

              <div className="flex gap-3 mt-auto">
                <button className="flex-1 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold text-xs transition-all">
                  Vote Yes
                </button>
                <button className="flex-1 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs transition-all">
                  Vote No
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}