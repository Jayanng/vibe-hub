import { createMidlConfig } from "@midl/satoshi-kit";
import { MaestroSymphonyProvider, MempoolSpaceProvider, regtest } from "@midl/core";
import { type Config } from "@midl/core";

export const midlConfig = createMidlConfig({
    networks: [regtest],
    runesProvider: new MaestroSymphonyProvider({
        regtest: "https://runes.staging.midl.xyz",
    }),
    provider: new MempoolSpaceProvider({
        regtest: "https://mempool.staging.midl.xyz",
    }),
    persist: true,
}) as Config;