# Soul Hub — On-Chain Reputation on Bitcoin Layer 1

Soul Hub is an on-chain reputation and identity platform built natively on Bitcoin Layer 1, powered by the [MIDL network](https://midl.xyz).

---

## What is Soul Hub?

It lets users prove their on-chain activity by minting **Soulbound Tokens (SBTs)** — non-transferable badges permanently tied to their Bitcoin wallet.

Each badge represents a real action taken on the MIDL network (e.g. using the faucet, providing liquidity, being an early testnet participant). Users also earn reputation points (XP), level up, track daily streaks, and appear on a global leaderboard.

---

## Who is it for?

Soul Hub is built for:

- **MIDL testnet participants** who want recognition for their early contributions
- **Bitcoin-native users and developers** on the MIDL Protocol who want to prove their on-chain identity, activity, and reputation
- **Protocols and projects on MIDL** who want a verifiable, permissionless way to identify and reward active community members — by issuing non-transferable SBTs, projects can track authentic engagement, prevent people from buying/selling reputation, and confidently use badges to gate future perks, airdrops, or VIP community roles

---

## Why it matters

It brings the concept of on-chain identity and reputation — popularized in Ethereum's ecosystem — natively to **Bitcoin Layer 1 for the first time**, using MIDL's co-signed BTC + EVM transaction protocol.

---

## Features

- 🏅 **Soulbound Badge Minting** — Claim SBT badges tied to verified on-chain activity
- 📊 **Reputation & XP System** — Earn points and level up based on badges claimed
- 🏆 **Global Leaderboard** — Rank against other participants on the MIDL network
- ✅ **Daily Check-In** — Accumulate XP with daily streak tracking
- 👤 **On-Chain Profile** — View your badges, XP, and activity history in one place
- 🚀 **More exciting features coming soon...**

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS |
| Bitcoin L1 | MIDL JS SDK (`@midl/executor-react`, `@midl/react`) |
| Wallet | Xverse via `@midl/satoshi-kit` |
| EVM | Viem, Wagmi |
| Smart Contract | Solidity — `MidlSBT.sol` (Soulbound ERC721) |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Xverse Wallet](https://www.xverse.app/) browser extension
- MIDL Regtest network configured in Xverse

### Installation

```bash
git clone https://github.com/Jayanng/vibe-hub.git
cd vibe-hub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use

1. Install **Xverse wallet** and add the **MIDL Regtest** network
2. Get testnet BTC from the [MIDL Faucet](https://faucet.midl.xyz)
3. Connect your wallet on Soul Hub
4. Go to **Mint & Claim** and claim the badges you qualify for
5. Watch your reputation grow on the **Dashboard** and **Leaderboard**

---

## Smart Contract

- **Network:** MIDL Regtest (testnet)
- **Contract:** `MidlSBT.sol` — Soulbound Token (non-transferable NFT)
- **Address:** `0x254349F8D356ED15a774C318dC770ea1BC6912fc`
- **Explorer:** [blockscout.staging.midl.xyz](https://blockscout.staging.midl.xyz/address/0x254349F8D356ED15a774C318dC770ea1BC6912fc)

---

## Author

**Johnson Johnson Enyenihi**
- 🐦 Twitter/X: [@JohnsonEnyenih2](https://x.com/JohnsonEnyenih2)
- 📧 Email: johnenyenihi2017@gmail.com
- 💻 GitHub: [@Jayanng](https://github.com/Jayanng)

---

## License

© 2026 **Johnson Johnson Enyenihi** (Soul Hub). All Rights Reserved.
