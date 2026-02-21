"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAccounts, useSignMessage } from "@midl/react";

export default function DailyCheckIn() {
    const { isConnected, accounts } = useAccounts();
    const address = isConnected && accounts?.[0] ? accounts[0].address : null;

    const [checkedIn, setCheckedIn] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<string>("");
    const [showModal, setShowModal] = useState<boolean>(false);
    const [isSigning, setIsSigning] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { signMessageAsync } = useSignMessage();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Check if already checked in today
    useEffect(() => {
        if (address) {
            const today = new Date().toDateString();
            const key = `vibe_checkin_${address}_${today}`;
            const isChecked = localStorage.getItem(key) === "true";
            setCheckedIn(isChecked);
        }
    }, [address]);

    // Countdown timer to midnight
    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);

            const diff = midnight.getTime() - now.getTime();

            if (diff <= 0) {
                setCheckedIn(false);
                setTimeLeft("");
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                setTimeLeft(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleCheckIn = async () => {
        if (!address || checkedIn) return;
        try {
            setIsSigning(true);
            const message = `MIDL Vibe Hub Daily Check-in: ${new Date().toDateString()}`;
            await signMessageAsync({ message, address });
            const key = `vibe_checkin_${address}_${new Date().toDateString()}`;
            localStorage.setItem(key, "true");

            // Add 2 reputation points
            const repKey = `vibe_reputation_${address}`;
            const currentRep = parseInt(localStorage.getItem(repKey) || "0");
            localStorage.setItem(repKey, String(currentRep + 2));
            // Dispatch event so other components can update
            window.dispatchEvent(new Event("reputation-updated"));

            setCheckedIn(true);
            setShowModal(true);
        } catch (err: any) {
            console.error("Sign error:", err);
        } finally {
            setIsSigning(false);
        }
    };

    console.log("DailyCheckIn render:", { address, checkedIn, mounted });
    if (!mounted || !address) return null;

    return createPortal(
        <>
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                {!checkedIn && !showModal && (
                    <button
                        onClick={handleCheckIn}
                        disabled={isSigning}
                        className="flex items-center gap-2 bg-[#f7951d] hover:bg-[#e68a19] text-black font-bold px-6 py-3 rounded-full shadow-lg shadow-orange-500/30 transition-all scale-100 active:scale-95 hover:scale-105"
                    >
                        <span className="material-icons">event_available</span>
                        {isSigning ? "Signing..." : "Daily Check-in"}
                    </button>
                )}
            </div>

            {showModal && <SuccessModal onClose={() => setShowModal(false)} />}
        </>,
        document.body
    );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-[#1c140d] border border-[#f7951d]/30 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="w-20 h-20 rounded-full bg-[#f7951d]/10 flex items-center justify-center mx-auto mb-6 border border-[#f7951d]/20">
                    <span className="material-icons text-5xl text-[#f7951d] drop-shadow-[0_0_10px_rgba(247,149,29,0.5)]">emoji_events</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Daily Bonus!</h3>
                <p className="text-slate-400 mb-8">You've earned 2 reputation points.</p>
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-[#f7951d] hover:bg-[#e68a19] text-black font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20"
                >
                    Awesome!
                </button>
            </div>
        </div>,
        document.body
    );
}
