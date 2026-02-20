try {
    // Try v6 or higher
    const { ethers } = require("ethers");
    const mnemonic = "stereo moment city patrol tuition various mask tumble learn sock love spawn";

    if (ethers.Wallet && ethers.Wallet.fromPhrase) {
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        console.log("Address (v6):", wallet.address);
        process.exit(0);
    } else if (ethers.Wallet && ethers.Wallet.fromMnemonic) {
        // Try v5
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        console.log("Address (v5):", wallet.address);
        process.exit(0);
    }
} catch (e) {
    // Try v5 if v6 failed
    try {
        const { Wallet } = require("ethers");
        const mnemonic = "stereo moment city patrol tuition various mask tumble learn sock love spawn";
        const wallet = Wallet.fromMnemonic(mnemonic);
        console.log("Address:", wallet.address);
    } catch (e2) {
        console.error("Could not load ethers or derive address:", e.message, e2.message);
    }
}
