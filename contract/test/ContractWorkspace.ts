import { network } from "hardhat";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { viem } = await network.create();

describe("ContractWorkspace", () => {
  it("can be deployed and exposes the workspace version", async () => {
    const contract = await viem.deployContract("ContractWorkspace");

    const version = await contract.read.workspaceVersion();

    assert.equal(version, 1n);
  });
});