import type { DeployFunction } from "hardhat-deploy/types";

const deploy: DeployFunction = async (hre) => {
    console.log("Initializing MIDL deployment...");

    // 1. Initialize MIDL SDK
    await hre.midl.initialize();

    // 2. Prepare the deployment transaction
    const deployment = await hre.midl.deploy("MidlSBT", []);

    // 3. Execute on Bitcoin L1
    console.log("Executing deployment on Bitcoin L1...");
    await hre.midl.execute();

    console.log("----------------------------------------------------");
    console.log("✅ DEPLOYMENT SUCCESS!");
    console.log("----------------------------------------------------");
    console.log("📝 Contract Name: MidlSBT");
    console.log("📍 Contract Address:", deployment.address);
    console.log("----------------------------------------------------");
};

deploy.tags = ["MidlSBT"];
export default deploy;