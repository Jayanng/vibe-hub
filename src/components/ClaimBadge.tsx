"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAddTxIntention, useFinalizeBTCTransaction, useSignIntention, useSendBTCTransactions, useEVMAddress } from "@midl/executor-react";
import { useWaitForTransaction, useAccounts } from "@midl/react";
import { useReadContract } from "wagmi";
import { encodeFunctionData } from "viem";
import MidlSBTAbi from "../abi/MidlSBT.json";

// Contract Address
const SBT_CONTRACT_ADDRESS = "0x05C26E0D786Ccd5fea3A53251D78924d5c8BB568";

interface ClaimBadgeProps {
    badgeId?: string;
    badgeName?: string;
    badgeTypeId: number;
    onSuccess?: () => void;
}

export function ClaimBadge({ badgeId = "early-adopter", badgeName = "Early Adopter SBT", badgeTypeId, onSuccess }: ClaimBadgeProps) {
    // --- STATE ---
    const [isMinting, setIsMinting] = useState(false);
    const [status, setStatus] = useState<"idle" | "preparing" | "signing" | "broadcasting" | "success">("idle");
    const [countdown, setCountdown] = useState<number | null>(null);
    const [localClaimed, setLocalClaimed] = useState(false);
    const [txId, setTxId] = useState<string | null>(null);
    const [evmTxHash, setEvmTxHash] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // --- HOOKS ---
    const { accounts } = useAccounts();
    const address = accounts?.[0]?.address;
    const evmAddress = useEVMAddress({ from: address });
    console.log("[DEBUG] EVM Address:", evmAddress);
    const isEvmAddress = address?.startsWith("0x");

    // MIDL Executor Hooks
    const { addTxIntention, txIntentions } = useAddTxIntention();
    const { finalizeBTCTransaction, data: btcData, error: btcError } = useFinalizeBTCTransaction();

    useEffect(() => {
        if (txIntentions.length > 0 && status === "preparing" && isMinting) {
            console.log("STEP 2: Finalizing...");
            finalizeBTCTransaction({ from: address, feeRate: 2 });
        }
    }, [txIntentions, status, isMinting]);

    useEffect(() => {
        if (btcData && status === "preparing") {
            setStatus("signing");
        }
    }, [btcData, status]);

    useEffect(() => {
        if (btcError) console.error("[DEBUG] finalize error:", btcError);
    }, [btcError]);

    const { signIntentionAsync } = useSignIntention();
    const { sendBTCTransactionsAsync } = useSendBTCTransactions();

    // Check Ownership (On-Chain + Local Fallback)
    const { data: balance, refetch: refetchBalance } = useReadContract({
        address: SBT_CONTRACT_ADDRESS as `0x${string}`,
        abi: MidlSBTAbi,
        functionName: "balanceOfBadge",
        args: evmAddress && badgeTypeId ? [evmAddress, badgeTypeId] : undefined,
        query: { enabled: !!evmAddress && !!badgeTypeId }
    });

    const isClaimed = localClaimed || (balance ? Number(balance) > 0 : false);

    // Transaction Listener
    const { waitForTransaction } = useWaitForTransaction({
        mutation: {
            onSuccess: () => {
                console.log("Transaction Confirmed!");
                setLocalClaimed(true);
                // Persist to LocalStorage
                if (address && badgeId) {
                    const key = `vibe_badge_claim_${address}_${badgeId}`;
                    console.log("[ClaimBadge] Saving to storage:", key);
                    localStorage.setItem(key, Date.now().toString());
                }
                setCountdown(5); // Start Auto-Close Countdown
                if (onSuccess) onSuccess();
            },
        },
    });

    // --- EFFECT: CHECK LOCAL STORAGE ON MOUNT ---
    useEffect(() => {
        console.log("[ClaimBadge] Checking storage. Address:", address, "BadgeID:", badgeId);
        if (address && badgeId) {
            const key = `vibe_badge_claim_${address}_${badgeId}`;
            const storedClaim = localStorage.getItem(key);
            console.log("[ClaimBadge] Key:", key, "Value:", storedClaim);

            if (storedClaim) { // Check if truthy (could be "true" or a timestamp)
                console.log("[ClaimBadge] Restoration success!");
                setLocalClaimed(true);
            } else {
                setLocalClaimed(false);
            }
        } else {
            setLocalClaimed(false);
        }
    }, [address, badgeId]);

    // --- LOGIC: THE 4-STEP FLOW ---
    const handleClaim = async () => {
        if (!address) return alert("Please connect wallet first.");
        setIsMinting(true);
        setStatus("preparing");
        setErrorMsg(null);
        try {
            console.log("STEP 1: Creating Intention...");
            addTxIntention({
                reset: true,
                from: address,
                intention: {
                    evmTransaction: {
                        to: SBT_CONTRACT_ADDRESS as `0x${string}`,
                        data: encodeFunctionData({
                            abi: MidlSBTAbi,
                            functionName: "mint",
                            args: [badgeTypeId],
                        }),
                    },
                },
            });
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to start mint.");
            setIsMinting(false);
            setStatus("idle");
        }
    };

    // STEP 3: Sign (Triggered when btcData is ready)
    useEffect(() => {
        const sign = async () => {
            if (status === "signing" && btcData && txIntentions.length > 0) {
                const unsigned = txIntentions.filter((i: any) => !i.signedEvmTransaction);
                if (unsigned.length > 0) {
                    try {
                        console.log("STEP 3: Requesting Signature...");
                        await signIntentionAsync({ intention: unsigned[0], txId: btcData.tx.id });
                        setStatus("broadcasting");
                    } catch (err: any) {
                        setErrorMsg("Ordering Cancelled or Failed.");
                        setIsMinting(false);
                        setStatus("idle");
                    }
                }
            }
        };
        sign();
    }, [btcData, status, txIntentions, signIntentionAsync]);

    // STEP 4: Broadcast (Triggered when Signed)
    useEffect(() => {
        const broadcast = async () => {
            const hasSigned = txIntentions.some((i: any) => i.signedEvmTransaction);
            if (status === "broadcasting" && hasSigned && btcData) {
                try {
                    console.log("STEP 4: Broadcasting...");
                    // @ts-ignore
                    const result = await sendBTCTransactionsAsync({
                        serializedTransactions: txIntentions
                            .map((i: any) => i.signedEvmTransaction as `0x${string}`)
                            .filter(Boolean),
                        btcTransaction: btcData.tx.hex,
                    });
                    console.log("Broadcast Success:", result);

                    // Capture EVM Hash (First element of result array)
                    if (Array.isArray(result) && result.length > 0) {
                        setEvmTxHash(result[0]);
                    }

                    setTxId(btcData.tx.id); // Save BTC TXID for explorer
                    setStatus("success");

                    // Optimistically save claimed state instantly so it persists on refresh/reconnect
                    setLocalClaimed(true);
                    if (address && badgeId) {
                        const key = `vibe_badge_claim_${address}_${badgeId}`;
                        localStorage.setItem(key, Date.now().toString());
                    }

                    waitForTransaction({ txId: btcData.tx.id });
                } catch (err: any) {
                    console.error("Broadcast Error:", err);
                    setErrorMsg(err.message || "Broadcast Failed.");
                    setIsMinting(false);
                    setStatus("idle");
                }
            }
        };
        broadcast();
    }, [status, txIntentions, btcData, waitForTransaction]);

    // --- AUTO-CLOSE COUNTDOWN ---
    useEffect(() => {
        if (countdown !== null && countdown > 0) {
            const timer = setTimeout(() => setCountdown(prev => (prev ? prev - 1 : null)), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            // Reset to clean state (Consumed/Claimed)
            setIsMinting(false);
            setCountdown(null);
            setStatus("idle");
        }
    }, [countdown]);

    // --- RENDER ---

    return (
        <>
            {/* 1. Minting Modal (Handles all progress & success states) */}
            {status !== "idle" && (
                <MintingModal
                    status={status}
                    countdown={countdown}
                    txId={txId}
                    evmTxHash={evmTxHash}
                    errorMsg={errorMsg}
                    onRetry={handleClaim}
                    onClose={() => {
                        // If success/broadcasting, closing means we are done -> reset to idle but keep localClaimed if successful
                        if (status === 'success') {
                            setLocalClaimed(true);
                            setIsMinting(false);
                            setStatus('idle');
                            setCountdown(null);
                        } else if (errorMsg) {
                            setIsMinting(false);
                            setStatus('idle');
                            setErrorMsg(null);
                        }
                    }}
                />
            )}

            {/* 2. Main Button (Clean State Only) */}
            {isClaimed ? (
                <button disabled className="bg-green-500/10 border border-green-500/20 text-green-400 px-6 py-2 rounded-lg font-bold flex items-center gap-2 w-full justify-center">
                    <span className="material-icons">verified</span>
                    <span>Claimed</span>
                </button>
            ) : (
                <button
                    onClick={handleClaim}
                    disabled={isMinting || !address}
                    className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                        ${isMinting
                            ? "bg-[#f7951d]/50 cursor-wait text-black/80"
                            : "bg-[#f7951d] hover:bg-[#e68a19] text-black shadow-lg shadow-orange-500/20"
                        }
                    `}
                >
                    {isMinting ? (
                        <>
                            <span className="animate-spin material-icons text-sm">refresh</span>
                            <span>Minting...</span>
                        </>
                    ) : (
                        <>
                            <span className="material-icons">diamond</span>
                            <span>Claim Badge</span>
                        </>
                    )}
                </button>
            )}
        </>
    );
}

// --- INTERNAL MODAL COMPONENT ---
function MintingModal({ status, countdown, txId, evmTxHash, errorMsg, onRetry, onClose }: any) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (status === 'idle') return null;
    if (!mounted) return null;

    const isError = !!errorMsg;
    const isSuccess = status === 'success';

    let title = "Minting Badge...";
    let icon = "refresh";
    let iconClass = "animate-spin text-[#f7951d]";
    let content = <p className="text-slate-400 text-sm">Please follow validation steps in your wallet.</p>;

    if (status === 'preparing') {
        title = "Preparing Transaction";
    } else if (status === 'signing') {
        title = "Sign Transaction";
        content = <p className="text-slate-400 text-sm">Please sign the request in your wallet.</p>;
    } else if (status === 'broadcasting') {
        title = "Broadcasting...";
        content = <p className="text-slate-400 text-sm">Sending transaction to the network.</p>;
    } else if (isSuccess) {
        title = "Badge Claimed!";
        icon = "check_circle";
        iconClass = "text-green-500";
        content = (
            <div className="flex flex-col gap-4 w-full">
                <p className="text-slate-400 text-sm">Transaction confirmed successfully.</p>
                <div className="bg-[#231a0f] p-3 rounded-lg flex flex-col gap-3 border border-white/5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">BTC Transaction</span>
                        <a
                            href={`https://mempool.staging.midl.xyz/tx/${txId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#f7951d] text-xs hover:underline flex items-center gap-1"
                        >
                            View <span className="material-icons text-[10px]">open_in_new</span>
                        </a>
                    </div>
                    {evmTxHash && (
                        <div className="flex items-center justify-between border-t border-white/5 pt-2">
                            <span className="text-xs text-slate-500">EVM Transaction</span>
                            <a
                                href={`https://blockscout.staging.midl.xyz/tx/${evmTxHash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#f7951d] text-xs hover:underline flex items-center gap-1"
                            >
                                View <span className="material-icons text-[10px]">open_in_new</span>
                            </a>
                        </div>
                    )}
                </div>
                {countdown !== null && (
                    <p className="text-center text-xs text-slate-500">Auto-closing in {countdown}s...</p>
                )}
            </div>
        );
    } else if (isError) {
        title = "Mint Failed";
        icon = "error";
        iconClass = "text-red-500";
        content = (
            <div className="flex flex-col gap-3 w-full">
                <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">{errorMsg}</p>
                <button onClick={onRetry} className="bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm font-bold">
                    Retry
                </button>
            </div>
        );
    }

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            {/* Modal Content */}
            <div className="relative bg-[#1a140c] border border-[#f7951d]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-orange-900/20 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                    <span className="material-icons">close</span>
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10`}>
                        <span className={`material-icons text-3xl ${iconClass}`}>{icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <div className="mb-6 w-full">{content}</div>

                    {!isError && !isSuccess && (
                        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-[#f7951d] animate-progress-indeterminate"></div>
                        </div>
                    )}

                    {isSuccess && (
                        <button onClick={onClose} className="w-full bg-[#f7951d] hover:bg-[#e68a19] text-black font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-orange-500/20">
                            Awesome
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
