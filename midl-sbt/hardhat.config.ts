import "hardhat-deploy";
import "@midl/hardhat-deploy";
import { midlRegtest } from "@midl/executor";
import { type HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-verify";

const midlNetworkConfig = {
  mnemonic: vars.get("MNEMONIC"),
  confirmationsRequired: 1,
  btcConfirmationsRequired: 1,
  hardhatNetwork: "regtest",
  network: {
    explorerUrl: "https://mempool.staging.midl.xyz",
    id: "regtest",
    network: "regtest",
  },
} as any;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "regtest",

  paths: {
    deploy: "deploy",
    deployments: "deployments",
  },

  namedAccounts: {
    deployer: {
      default: 0,
    },
  },

  midl: {
    path: "deployments",
    networks: {
      regtest: midlNetworkConfig,
      default: midlNetworkConfig,
    },
  },

  networks: {
    regtest: {
      url: midlRegtest.rpcUrls.default.http[0],
      chainId: midlRegtest.id,
      accounts: {
        mnemonic: vars.get("MNEMONIC"),
      },
    },
  },

  etherscan: {
    apiKey: {
      regtest: "empty",
    },
    customChains: [
      {
        network: "regtest",
        chainId: midlRegtest.id,
        urls: {
          apiURL: "https://blockscout.staging.midl.xyz/api",
          browserURL: "https://blockscout.staging.midl.xyz",
        },
      },
    ],
  },
};

export default config;