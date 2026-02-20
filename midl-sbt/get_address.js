const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();
    console.log("Deployer Address:", signers[0].address);
}

main().catch(console.error);
