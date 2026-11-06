// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {UserRegistry} from "@ensv2/registry/UserRegistry.sol";
import {IPermissionedRegistry} from "@ensv2/registry/interfaces/IPermissionedRegistry.sol";

/// Proves the pinned ENSv2 submodule and the re-rooted remappings compile.
contract Ensv2PinTest is Test {
    function test_ensv2SourcesCompile() public pure {
        assertGt(type(UserRegistry).creationCode.length, 0);
        assertTrue(type(IPermissionedRegistry).interfaceId != bytes4(0));
    }
}
