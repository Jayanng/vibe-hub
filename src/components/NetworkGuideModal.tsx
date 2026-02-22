"use client";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export const NetworkGuideModal = ({ onClose }: { onClose: () => void }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-9999 p-4">
            <div className="bg-[#1a1207] border border-orange-500/20 rounded-2xl p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-white font-bold text-lg">⚠️ Add MIDL Network to Xverse</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <span className="material-icons">close</span>
                    </button>
                </div>
                <p className="text-slate-400 text-sm mb-4">You need to add the MIDL Regtest network to your Xverse wallet before connecting. Follow these steps:</p>
                <ol className="space-y-3">
                    {[
                        "Open Xverse wallet and go to Settings",
                        "Select 'Bitcoin network configuration'",
                        "Click 'Add network'",
                        "Set Network name: MIDL Regtest",
                        "Set BTC URL: https://mempool.regtest.midl.xyz/api",
                        "Set Indexer URL: https://api-regtest-midl.xverse.app",
                        "Save and switch to MIDL Regtest network",
                        "Come back and connect your wallet"
                    ].map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-slate-300">
                            <span className="w-6 h-6 rounded-full bg-[#f7951d] text-black font-bold flex items-center justify-center shrink-0 text-xs">{i + 1}</span>
                            {step}
                        </li>
                    ))}
                </ol>
                <button onClick={onClose} className="w-full mt-6 py-2 bg-[#f7951d] text-black font-bold rounded-lg">Got it</button>
            </div>
        </div>,
        document.body
    );
};
