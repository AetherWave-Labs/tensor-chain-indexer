// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

/// @title Contract Workspace
/// @notice Minimal contract used to validate the Tensor Chain Indexer
///         smart-contract development workspace.
contract ContractWorkspace {
    /// @notice Returns the current workspace contract version.
    function workspaceVersion() external pure returns (uint256) {
        return 1;
    }
}