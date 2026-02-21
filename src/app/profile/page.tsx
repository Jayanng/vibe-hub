"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectButton } from "@midl/satoshi-kit";
import { midlConfig } from "@/midlConfig";
import { addNetwork } from "@midl/core";
import { useConnect, useAccounts, useDisconnect } from "@midl/react";
import { AddressPurpose } from "@midl/core";
import { useGlobalBalance } from '@/components/BalanceProvider';

// Shared data from other pages
const BADGES_DATA = [
    { id: "early-adopter", title: "Early Adopters", desc: "For the pioneers who helped stress-test the network before mainnet.", icon: "military_tech", colorClass: "bg-linear-to-br from-yellow-600 to-yellow-900", glowClass: "badge-glow-gold", tagClass: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10", tagText: "Legendary", rarityPct: "0.5%", xp: 1000, locked: false, badgeTypeId: 1 },
    { id: "faucet-flyer", title: "Faucet Frequent Flyer", desc: "Successfully claimed testnet tokens from the MIDL faucet 5+ times.", icon: "water_drop", colorClass: "bg-linear-to-br from-blue-400 to-blue-700", glowClass: "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]", tagClass: "text-blue-500 border-blue-500/30 bg-blue-500/10", tagText: "Common", rarityPct: "45%", xp: 50, locked: false, badgeTypeId: 2 },
    { id: "liquidity", title: "Liquidity Lord", desc: "Provided >0.01 BTC liquidity...", icon: "waves", colorClass: "bg-linear-to-br from-purple-600 to-purple-900", tagClass: "text-purple-500 border-purple-500/30 bg-purple-500/10", tagText: "Epic", rarityPct: "5%", xp: 450, locked: false, badgeTypeId: 3 },
    { id: "yield", title: "Yield Harvester", desc: "Staked assets in a MIDL lending...", icon: "agriculture", colorClass: "bg-linear-to-br from-emerald-600 to-emerald-900", tagClass: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10", tagText: "Rare", rarityPct: "15%", xp: 200, locked: false, badgeTypeId: 4 },
    { id: "atomic", title: "Atomic Swapper", desc: "Completed 50+ swaps on MIDL...", icon: "swap_horiz", colorClass: "bg-linear-to-br from-orange-600 to-orange-900", tagClass: "text-orange-500 border-orange-500/30 bg-orange-500/10", tagText: "Rare", rarityPct: "12%", xp: 300, locked: true },
    { id: "rune", title: "Rune Runner", desc: "Minted or transferred a Rune token...", icon: "auto_awesome", colorClass: "bg-linear-to-br from-pink-600 to-rose-900", tagClass: "text-pink-500 border-pink-500/30 bg-pink-500/10", tagText: "Rare", rarityPct: "18%", xp: 350, locked: true },
    { id: "ordinal", title: "Ordinal Curator", desc: "Holds at least 30 Bitcoin Ordinal...", icon: "collections", colorClass: "bg-linear-to-br from-indigo-600 to-indigo-900", tagClass: "text-indigo-500 border-indigo-500/30 bg-indigo-500/10", tagText: "Rare", rarityPct: "20%", xp: 300, locked: true },
    { id: "dao", title: "DAO Architect", desc: "Voted on at least 7 governance...", icon: "gavel", colorClass: "bg-linear-to-br from-teal-600 to-teal-900", tagClass: "text-teal-500 border-teal-500/30 bg-teal-500/10", tagText: "Uncommon", rarityPct: "30%", xp: 150, locked: true },
    { id: "sybil", title: "Social Sybil Slayer", desc: "Linked a verified X (Twitter)...", icon: "fingerprint", colorClass: "bg-linear-to-br from-sky-600 to-sky-900", tagClass: "text-sky-500 border-sky-500/30 bg-sky-500/10", tagText: "Common", rarityPct: "40%", xp: 100, locked: true },
    { id: "scout", title: "Ecosystem Scout", desc: "Held at least 10 different tokens...", icon: "travel_explore", colorClass: "bg-linear-to-br from-cyan-600 to-cyan-900", tagClass: "text-cyan-500 border-cyan-500/30 bg-cyan-500/10", tagText: "Rare", rarityPct: "14%", xp: 400, locked: true },
    { id: "iron", title: "Iron Hands", desc: "Supplied collateral and maintained...", icon: "front_hand", colorClass: "bg-linear-to-br from-red-600 to-red-900", tagClass: "text-red-500 border-red-500/30 bg-red-500/10", tagText: "Epic", rarityPct: "6%", xp: 500, locked: true },
    { id: "dev", title: "Smart Contract Artisan", desc: "Deployed a smart contract on MIDL...", icon: "terminal", colorClass: "bg-linear-to-br from-slate-500 to-slate-800", tagClass: "text-slate-400 border-slate-400/30 bg-slate-500/10", tagText: "Legendary", rarityPct: "1%", xp: 900, locked: true }
];

export default function ProfilePage() {
    const [mounted, setMounted] = useState(false);
    const { balance } = useGlobalBalance();

    const { isConnected, accounts } = useAccounts();
    const address = isConnected && accounts?.[0] ? accounts[0].address : null;

    const [claimedBadges, setClaimedBadges] = useState<Record<string, number>>({});
    const [extraReputation, setExtraReputation] = useState(0);

    // Profile Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);

        if (isConnected && address) {
            const newClaimed: Record<string, number> = {};
            BADGES_DATA.forEach(badge => {
                const key = `vibe_badge_claim_${address}_${badge.id}`;
                const val = localStorage.getItem(key);
                if (val) {
                    newClaimed[badge.id] = val === "true" ? 1 : parseInt(val, 10);
                }
            });
            setClaimedBadges(newClaimed);

            // Load custom profile data
            const savedName = localStorage.getItem(`vibe_profile_name_${address}`);
            const savedBio = localStorage.getItem(`vibe_profile_bio_${address}`);
            const savedAvatar = localStorage.getItem(`vibe_profile_avatar_${address}`);

            setDisplayName(savedName || "");
            setBio(savedBio || `A certified Pioneer on the MIDL network, accumulating on-chain reputation through verified interactions.`);
            setAvatarUrl(savedAvatar || "");

        } else {
            setClaimedBadges({});
            setDisplayName("");
            setBio("");
            setAvatarUrl("");
            setExtraReputation(0);
            setIsEditing(false);
        }

        const loadExtraRep = () => {
            if (address) {
                const saved = localStorage.getItem(`vibe_reputation_${address}`);
                setExtraReputation(parseInt(saved || "0"));
            }
        };
        loadExtraRep();

        window.addEventListener("reputation-updated", loadExtraRep);
        return () => window.removeEventListener("reputation-updated", loadExtraRep);
    }, [isConnected, address]);

    const handleSaveProfile = () => {
        if (!address) return;
        localStorage.setItem(`vibe_profile_name_${address}`, displayName);
        localStorage.setItem(`vibe_profile_bio_${address}`, bio);
        localStorage.setItem(`vibe_profile_avatar_${address}`, avatarUrl);
        setIsEditing(false);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // DYNAMIC STATS
    const ownedBadges = BADGES_DATA.filter(b => claimedBadges[b.id] !== undefined);
    const totalXP = ownedBadges.reduce((acc, curr) => acc + curr.xp, 0);
    const currentLevel = Math.floor(totalXP / 500) + 1;
    const baseReputation = isConnected && ownedBadges.length > 0 ? Math.floor(totalXP / 5) : 0;
    const reputation = baseReputation + extraReputation;
    const hasEarlyAdopter = ownedBadges.some(b => b.id === "early-adopter");
    const userTitle = hasEarlyAdopter ? "Pioneer" : "Explorer";

    // Tier Logic
    const getTierInfo = (rep: number) => {
        if (rep >= 900) return { current: "Grandmaster", next: "MAX", nextReq: 0, color: "text-[#f7951d]" };
        if (rep >= 700) return { current: "Master", next: "Grandmaster", nextReq: 900, color: "text-purple-400" };
        if (rep >= 500) return { current: "Veteran", next: "Master", nextReq: 700, color: "text-blue-400" };
        if (rep >= 300) return { current: "Adept", next: "Veteran", nextReq: 500, color: "text-emerald-400" };
        if (rep >= 100) return { current: "Apprentice", next: "Adept", nextReq: 300, color: "text-slate-300" };
        return { current: "Novice", next: "Apprentice", nextReq: 100, color: "text-slate-400" };
    };
    const tierInfo = getTierInfo(reputation);

    // Rarest Badges
    const rarestBadges = [...ownedBadges]
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 4);

    // Recent Activity Logs
    const recentActivity = [...ownedBadges]
        .sort((a, b) => (claimedBadges[b.id] || 0) - (claimedBadges[a.id] || 0))
        .slice(0, 3);

    const getRelativeTime = (timestamp: number) => {
        if (timestamp === 1) return "Legacy Claim";
        const diffInSeconds = Math.floor((Date.now() - timestamp) / 1000);
        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    const truncateAddress = (addr: string | null) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (!mounted) return null;

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
                    <Link href="/" className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">dashboard</span>
                        <span className="hidden lg:block ml-3 font-medium">Dashboard</span>
                    </Link>
                    <Link href="/mint" className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">diamond</span>
                        <span className="hidden lg:block ml-3 font-medium">Mint & Claim</span>
                    </Link>
                    <div className="flex items-center p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors group cursor-pointer">
                        <span className="material-icons group-hover:text-[#f7951d] transition-colors">leaderboard</span>
                        <span className="hidden lg:block ml-3 font-medium">Leaderboard</span>
                    </div>
                    <div className="flex items-center p-3 rounded-lg bg-[#f7951d]/10 text-[#f7951d] border border-[#f7951d]/20 cursor-default">
                        <span className="material-icons">account_circle</span>
                        <span className="hidden lg:block ml-3 font-medium">Profile</span>
                        <span className="hidden lg:flex ml-auto w-2 h-2 rounded-full bg-[#f7951d] shadow-[0_0_8px_rgba(247,149,29,0.8)]"></span>
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
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#231a0f]">
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#f7951d]/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#f7951d]/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                <header className="h-20 border-b border-white/5 bg-[#231a0f]/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">Soul Identity</h1>
                        <p className="text-xs text-[#f7951d]/80 font-medium tracking-widest uppercase mt-0.5">Your On-Chain Reputation</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-slate-300">Network Stable</span>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>

                        <ConnectButton>
                            {({ openConnectDialog, openAccountDialog, isConnected, isConnecting }) => (
                                <button
                                    onClick={isConnected ? openAccountDialog : openConnectDialog}
                                    className="flex items-center gap-3 bg-[#f7951d] hover:bg-[#e68a19] text-black px-4 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(247,149,29,0.3)]"
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

                <div className="flex-1 overflow-y-auto p-8 relative z-0 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Hero Banner Profile Section */}
                        <div className="w-full rounded-2xl bg-linear-to-b from-[#2a2015] to-[#231a0f] border border-white/10 p-0 relative overflow-hidden group shadow-2xl">
                            <div className="h-48 w-full bg-[url('https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center relative">
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                                <div className="absolute bottom-0 left-0 w-full h-24 bg-linear-to-t from-[#2a2015] to-transparent"></div>
                                <div className="absolute top-6 right-6 flex gap-2">
                                    {isConnected && (
                                        <button
                                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                            className={`p-2 rounded-full backdrop-blur-md text-white/70 hover:text-white hover:bg-black/50 border border-white/10 transition-all ${isEditing ? 'bg-green-500/30 border-green-500/50 text-green-400' : 'bg-black/30'}`}
                                        >
                                            <span className="material-icons">{isEditing ? "save" : "edit"}</span>
                                        </button>
                                    )}
                                    <button className="p-2 rounded-full bg-black/30 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/50 border border-white/10 transition-all">
                                        <span className="material-icons">share</span>
                                    </button>
                                </div>
                            </div>

                            <div className="px-8 pb-8 relative -mt-16 flex flex-col md:flex-row gap-8 items-start">
                                <div className="relative shrink-0 group">
                                    <div
                                        className={`w-32 h-32 rounded-2xl p-1 bg-linear-to-br from-[#f7951d] to-yellow-600 shadow-xl shadow-black/50 ${isEditing ? 'cursor-pointer' : ''}`}
                                        onClick={() => isEditing && fileInputRef.current?.click()}
                                    >
                                        <div className="w-full h-full rounded-xl bg-gray-900 flex items-center justify-center border border-white/10 overflow-hidden relative">
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-icons text-6xl text-white/50 blur-sm absolute">person</span>
                                            )}

                                            {isEditing && (
                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="material-icons text-white">add_a_photo</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Hidden File Input */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                    />

                                    {isConnected && !isEditing && (
                                        <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#2a2015] rounded-full flex items-center justify-center p-1">
                                            <div className="w-full h-full rounded-full bg-linear-to-br from-green-400 to-emerald-600 flex items-center justify-center border-2 border-[#2a2015]">
                                                <span className="material-icons text-white text-sm">verified</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 pt-16 md:pt-16">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <h2 className="text-3xl font-bold text-white flex flex-col md:flex-row md:items-center gap-2">
                                                {isConnected ? (
                                                    isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                            placeholder={truncateAddress(address)}
                                                            className="bg-black/40 border border-[#f7951d]/50 rounded px-3 py-1 text-2xl font-bold text-white focus:outline-hidden focus:border-[#f7951d] w-full max-w-xs"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span>{displayName || truncateAddress(address)}</span>
                                                    )
                                                ) : "Guest Wallet"}

                                                {hasEarlyAdopter && !isEditing && (
                                                    <span className="px-2 py-0.5 mt-2 md:mt-0 w-max rounded-full bg-[#f7951d]/10 border border-[#f7951d]/20 text-[#f7951d] font-bold uppercase tracking-wider text-[10px]">
                                                        OG Member
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-slate-400 font-mono text-sm mt-1 flex items-center gap-2">
                                                {isConnected ? address : "Not connected"}
                                            </p>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">{isConnected ? currentLevel : 0}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide">Soul Level</div>
                                            </div>
                                            <div className="w-px h-10 bg-white/10"></div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">{isConnected ? reputation : 0}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide">Reputation</div>
                                            </div>
                                            <div className="w-px h-10 bg-white/10"></div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-white">{isConnected ? ownedBadges.length : 0}</div>
                                                <div className="text-xs text-slate-500 uppercase tracking-wide">Badges</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Soul Bio</h3>
                                        {isEditing ? (
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="w-full bg-black/40 border border-[#f7951d]/50 rounded p-2 text-sm text-white focus:outline-hidden focus:border-[#f7951d] min-h-[80px] resize-y"
                                                placeholder="Tell the network about your soul..."
                                            />
                                        ) : (
                                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                {isConnected ? bio : "Please connect your wallet to view your soulbound reputation and on-chain interactions."}
                                            </p>
                                        )}
                                        {isConnected && !isEditing && (
                                            <div className="flex gap-2 mt-4">
                                                <span className="px-2 py-1 rounded bg-black/20 text-xs text-slate-400 border border-white/5">#Bitcoin</span>
                                                <span className="px-2 py-1 rounded bg-black/20 text-xs text-slate-400 border border-white/5">#MIDL</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rarest badges and Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* RAREST BADGES */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Rarest Badges Showcase</h3>
                                </div>

                                {isConnected && rarestBadges.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {rarestBadges.map(badge => (
                                            <div key={badge.id} className="glass-card bg-white/5 p-5 rounded-xl flex items-center gap-4 group cursor-pointer border-l-4 border-l-[#f7951d]/50 hover:border-l-[#f7951d] transition-all">
                                                <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-lg group-hover:scale-105 transition-transform ${badge.colorClass}`}>
                                                    <span className="material-icons text-3xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">{badge.icon}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white group-hover:text-[#f7951d] transition-colors">{badge.title}</h4>
                                                    <p className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{badge.desc}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.tagClass}`}>{badge.tagText.toUpperCase()}</span>
                                                        <span className="text-[10px] text-slate-500">+{badge.xp} XP</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="glass-card bg-white/5 border border-white/5 p-8 rounded-xl flex items-center justify-center flex-col text-center">
                                        <span className="material-icons text-4xl text-slate-600 mb-2">sentiment_dissatisfied</span>
                                        <p className="text-slate-400 font-medium">No badges claimed yet.</p>
                                        <p className="text-xs text-slate-500 mt-1">Head over to the Mint page to earn your first soulbound token.</p>
                                    </div>
                                )}
                            </div>

                            {/* REPUTATION AND STATS SIDEBAR */}
                            <div className="space-y-6">
                                <div className="bg-[#1c140d] border border-white/5 p-6 rounded-xl">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Reputation Score</h3>
                                    <div className="relative w-44 h-44 mx-auto mb-6">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle className="text-[#2a2016]" cx="88" cy="88" fill="transparent" r="76" stroke="currentColor" strokeWidth="16"></circle>
                                            {isConnected && (
                                                <circle
                                                    className="text-[#f7951d] transition-all duration-1000 ease-out"
                                                    cx="88" cy="88" fill="transparent" r="76"
                                                    stroke="currentColor"
                                                    strokeDasharray="477.5"
                                                    strokeDashoffset={477.5 - (477.5 * (Math.min(reputation, 1000) / 1000))}
                                                    strokeWidth="16"
                                                    strokeLinecap="butt"
                                                ></circle>
                                            )}
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                                            <span className="text-4xl font-bold text-white tracking-tight">{isConnected ? reputation : 0}</span>
                                            <span className="text-xs text-slate-500 font-medium tracking-wide mt-1">OUT OF 1000</span>
                                        </div>
                                    </div>
                                    <div className="text-center mt-2">
                                        {isConnected ? (
                                            <>
                                                <p className="text-base font-bold text-slate-200">Current Tier: <span className={tierInfo.color}>{tierInfo.current}</span></p>
                                                {tierInfo.nextReq > 0 ? (
                                                    <p className="text-xs text-slate-500 mt-1">Next Tier: {tierInfo.next} ({tierInfo.nextReq}+)</p>
                                                ) : (
                                                    <p className="text-xs text-slate-500 mt-1">Maximum reputation achieved!</p>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm font-medium text-slate-400">Unranked</p>
                                                <p className="text-xs text-slate-600 mt-1">Acquire reputation to rank up</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* RECENT ACTIVITY */}
                            <div className="pt-6 lg:col-span-3">
                                <h3 className="text-xl font-bold text-white mb-4">Recent On-Chain Activity</h3>
                                <div className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
                                    {isConnected && recentActivity.length > 0 ? (
                                        recentActivity.map(badge => (
                                            <div key={`act-${badge.id}`} className="p-4 border-b border-white/5 flex items-center justify-between hover:bg-white/5/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#f7951d]/10 flex items-center justify-center text-[#f7951d]">
                                                        <span className="material-icons text-sm">{badge.icon}</span>
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white truncate max-w-[120px]">Minted: {badge.title}</div>
                                                        <div className="text-xs text-slate-500">SBT Contract Execution</div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-slate-400">{getRelativeTime(claimedBadges[badge.id] || 0)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 flex items-center justify-center">
                                            <p className="text-slate-500 text-sm">No recent activity detected.</p>
                                        </div>
                                    )}
                                    <div className="p-4 flex items-center justify-center">
                                        <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                                            View Full History <span className="material-icons text-[10px]">arrow_forward</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-16 border-t border-white/5 pt-8 pb-4 text-center">
                        <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Bitcoin Soul Hub. Built on Midl Network.</p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
