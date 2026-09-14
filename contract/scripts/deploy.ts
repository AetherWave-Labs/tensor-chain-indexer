import { network } from "hardhat";

const { viem } = await network.create();

const deployment = await viem.deployContract("ContractWorkspace");

console.log(`ContractWorkspace deployed at: ${deployment.address}`);