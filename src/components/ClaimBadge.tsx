"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAddTxIntention, useFinalizeBTCTransaction, useSignIntention, useSendBTCTransactions, useEVMAddress } from "@midl/executor-react";
import { useWaitForTransaction, useAccounts } from "@midl/react";
import { useReadContract } from "wagmi";
import { encodeFunctionData } from "viem";
import MidlSBTAbi from "../abi/MidlSBT.json";

// Contract Address
const SBT_CONTRACT_ADDRESS = "0x254349F8D356ED15a774C318dC770ea1BC6912fc";
const CURRENT_CONTRACT = "0x254349F8D356ED15a774C318dC770ea1BC6912fc";
const CONTRACT_VERSION_KEY = "vibe_contract_v3";

interface ClaimBadgeProps {
    badgeId?: string;
    badgeName?: string;
    badgeTypeId: number;
    onSuccess?: () => void;
}

export function ClaimBadge({ badgeId = "early-adopter", badgeName = "Early Adopter SBT", badgeTypeId, onSuccess }: ClaimBadgeProps) {
    // --- STATE ---
    const [isMinting, setIsMinting] = useState(false);
    const [status, setStatus] = useState<"idle" | "preparing" | "signing" | "broadcasting" | "confirming" | "success">("idle");
    const [countdown, setCountdown] = useState<number | null>(null);
    const [localClaimed, setLocalClaimed] = useState(false);
    const [txId, setTxId] = useState<string | null>(null);
    const [evmTxHash, setEvmTxHash] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const finalizedRef = useRef(false);

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
        if (txIntentions.length > 0 && status === "preparing" && isMinting && !finalizedRef.current) {
            finalizedRef.current = true;
            console.log("STEP 2: Finalizing...");
            finalizeBTCTransaction({ from: address, feeRate: 2 });
        }
    }, [txIntentions, status, isMinting]);

    // Reset the ref when minting stops
    useEffect(() => {
        if (!isMinting) {
            finalizedRef.current = false;
        }
    }, [isMinting]);

    useEffect(() => {
        if (btcData && status === "preparing") {
            setStatus("signing");
        }
    }, [btcData, status]);

    useEffect(() => {
        if (btcError) {
            console.error("[DEBUG] finalize error:", btcError);
            const errorMessage = btcError?.message || "";
            if (errorMessage.includes("No selected UTXOs") || errorMessage.includes("UTXOs")) {
                setErrorMsg("Insufficient balance. Please get testnet BTC from the faucet first, then try again.");
            } else {
                setErrorMsg(errorMessage || "Transaction failed.");
            }
            setIsMinting(true);
            setStatus("error" as any);
        }
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

    const isClaimed = balance !== undefined
        ? Number(balance) > 0          // on-chain is authoritative when loaded
        : localClaimed;                 // localStorage only as fallback while loading

    // Transaction Listener
    const { waitForTransaction } = useWaitForTransaction({
        mutation: {
            onSuccess: () => {
                console.log("Transaction Confirmed via waitForTransaction!");
                // Additional confirmation side-effect — UI gated by balance polling instead
                if (onSuccess) onSuccess();
            },
        },
    });

    // --- EFFECT: CONTRACT VERSION CHECK ---
    useEffect(() => {
        const storedContract = localStorage.getItem(CONTRACT_VERSION_KEY);
        if (storedContract !== CURRENT_CONTRACT) {
            // Clear ALL vibe related keys regardless of key name
            const keysToRemove: string[] = [];
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith("vibe_")) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            localStorage.setItem(CONTRACT_VERSION_KEY, CURRENT_CONTRACT);
        }
    }, []);

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

    // --- EFFECT: SELF-HEAL STALE LOCALSTORAGE ---
    // If on-chain balance resolves to 0 but localStorage says claimed, it's stale (e.g. old contract) — clear it
    useEffect(() => {
        if (balance !== undefined && Number(balance) === 0 && localClaimed && address && badgeId) {
            const key = `vibe_badge_claim_${address}_${badgeId}`;
            localStorage.removeItem(key);
            setLocalClaimed(false);
        }
    }, [balance, localClaimed, address, badgeId]);

    // --- LOGIC: THE 4-STEP FLOW ---
    const handleClaim = async () => {
        if (!address) return alert("Please connect wallet first.");

        // Full reset before starting
        setIsMinting(false);
        setStatus("idle");
        setErrorMsg(null);
        setCountdown(null);
        setTxId(null);
        setEvmTxHash(null);
        finalizedRef.current = false;

        // Small delay to let state settle before starting new flow
        await new Promise(resolve => setTimeout(resolve, 100));

        setIsMinting(true);
        setStatus("preparing");

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

    // STEP 3 + 4: Sign then immediately Broadcast using the direct return value
    // (Merged to avoid race condition where txIntentions is stale at broadcast time)
    useEffect(() => {
        const signAndBroadcast = async () => {
            if (status === "signing" && btcData && txIntentions.length > 0) {
                const unsigned = txIntentions.filter((i: any) => !i.signedEvmTransaction);
                if (unsigned.length > 0) {
                    try {
                        // STEP 3: Sign
                        console.log("STEP 3: Requesting Signature...");
                        setStatus("broadcasting");
                        // @ts-ignore
                        const signedIntention = await signIntentionAsync({
                            intention: unsigned[0],
                            txId: btcData.tx.id,
                        });
                        console.log("[DEBUG] signedIntention:", signedIntention);

                        // STEP 4: Broadcast using the direct return value — not stale txIntentions state
                        console.log("STEP 4: Broadcasting...");
                        // signIntentionAsync returns the signed EVM tx hex directly (0x07... type)
                        const signedEvmTx = signedIntention as `0x${string}`;
                        console.log("[DEBUG] signedEvmTx:", signedEvmTx ? signedEvmTx.slice(0, 20) + "..." : "MISSING");
                        console.log("[DEBUG] BTC tx.id:", btcData.tx.id);

                        if (!signedEvmTx) {
                            throw new Error("Signing produced no signed EVM transaction.");
                        }

                        // @ts-ignore
                        const result = await sendBTCTransactionsAsync({
                            serializedTransactions: [signedEvmTx] as `0x${string}`[],
                            btcTransaction: btcData.tx.hex,
                        });
                        console.log("Broadcast Success:", JSON.stringify(result));

                        // Capture EVM Hash
                        if (Array.isArray(result) && result.length > 0) {
                            setEvmTxHash(result[0]);
                        }

                        setTxId(btcData.tx.id);
                        setStatus("confirming"); // Balance polling will transition to success
                    } catch (err: any) {
                        console.error("Sign/Broadcast Error:", err);
                        setErrorMsg(err.message || "Signing or broadcast failed.");
                        setIsMinting(false);
                        setStatus("idle");
                    }
                }
            }
        };
        signAndBroadcast();
    }, [btcData, status, txIntentions, signIntentionAsync]);

    // --- EFFECT: POLL BALANCE FOR ON-CHAIN CONFIRMATION ---
    // Replaces waitForTransaction since BTC TXID may mismatch after co-signing
    useEffect(() => {
        if (status !== "confirming") return;
        let stopped = false;

        const poll = async () => {
            while (!stopped) {
                await new Promise(r => setTimeout(r, 3000));
                if (stopped) break;
                const { data } = await refetchBalance();
                if (data && Number(data) > 0) {
                    if (!stopped) {
                        console.log("[ClaimBadge] On-chain confirmed via balance polling!");
                        setStatus("success");
                        setLocalClaimed(true);
                        if (address && badgeId) {
                            localStorage.setItem(`vibe_badge_claim_${address}_${badgeId}`, Date.now().toString());
                        }
                    }
                    break;
                }
            }
        };

        poll();
        return () => { stopped = true; };
    }, [status]);

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
                        setIsMinting(false);
                        setStatus("idle");
                        setErrorMsg(null);
                        setCountdown(null);
                        if (status === "success") {
                            setLocalClaimed(true);
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

    if (!mounted) return null;
    if (status === 'idle' && !errorMsg) return null;

    const isError = !!errorMsg || status === "error";
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
    } else if (status === 'confirming') {
        title = "Confirming on-chain...";
        content = <p className="text-slate-400 text-sm">Waiting for the transaction to appear on-chain. This may take a moment.</p>;
    } else if (isSuccess) {
        title = "Badge Claimed!";
        icon = "check_circle";
        iconClass = "text-green-500";
        content = (
            <div className="flex flex-col gap-4 w-full">
                <p className="text-slate-400 text-sm">Transaction confirmed successfully.</p>
                <div className="bg-[#1c140d] p-3 rounded-lg flex flex-col gap-3 border border-[#f7951d]/30 shadow-inner shadow-[#f7951d]/10">
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
            </div>
        );
    } else if (isError) {
        title = "Mint Failed";
        icon = "error";
        iconClass = "text-red-500";
        content = (
            <div className="flex flex-col gap-3 w-full">
                <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded border border-red-500/20">{errorMsg}</p>
                {errorMsg?.includes("faucet") && (
                    <a href="https://faucet.midl.xyz" target="_blank" rel="noreferrer"
                        className="text-[#f7951d] text-sm hover:underline flex items-center justify-center gap-1 mt-2">
                        <span className="material-icons text-sm">open_in_new</span>
                        Go to faucet.midl.xyz
                    </a>
                )}
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
            <div className="relative bg-[#1c140d] border border-[#f7951d]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl shadow-orange-900/20 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
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
