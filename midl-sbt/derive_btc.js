const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');

const bip32 = BIP32Factory(ecc);

const mnemonic = "stereo moment city patrol tuition various mask tumble learn sock love spawn";
// Using Regtest network (bcrt1 prefix)
const network = bitcoin.networks.regtest;

const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed, network);

// 1. Native Segwit (P2WPKH) - m/84'/1'/0'/0/0 (Note: coin_type 1 is typically testnet/regtest)
const pathSegwit = "m/84'/1'/0'/0/0";
const childSegwit = root.derivePath(pathSegwit);

const { address: addressSegwit } = bitcoin.payments.p2wpkh({
    pubkey: childSegwit.publicKey,
    network: network,
});

// 2. Taproot (P2TR) - m/86'/1'/0'/0/0
const pathTaproot = "m/86'/1'/0'/0/0";
const childTaproot = root.derivePath(pathTaproot);

const { address: addressTaproot } = bitcoin.payments.p2tr({
    internalPubkey: childTaproot.publicKey.slice(1, 33), // Taproot uses x-only pubkey
    network: network,
});

console.log("Bitcoin Addresses (Regtest - bcrt1):");
console.log("---------------------------------------------------");
console.log("Native Segwit (P2WPKH):", addressSegwit);
console.log("Taproot (P2TR):        ", addressTaproot);
console.log("---------------------------------------------------");
console.log("EVM Address:           0xA3260793e113226D420E9DA9e81D92D13346B4f5");
