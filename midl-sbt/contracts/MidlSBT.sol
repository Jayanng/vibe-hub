// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MidlSBT is ERC721, Ownable {
    uint256 private _nextTokenId;

    uint8 public constant EARLY_ADOPTER = 1;
    uint8 public constant FAUCET_FLYER = 2;
    uint8 public constant LIQUIDITY_LORD = 3;
    uint8 public constant YIELD_HARVESTER = 4;

    mapping(uint256 => uint8) public badgeType;
    mapping(address => mapping(uint8 => bool)) public hasClaimed;

    event BadgeMinted(address indexed to, uint256 tokenId, uint8 badgeType);

    constructor() ERC721("MIDL Soulbound", "MSBT") Ownable(msg.sender) {}

    function mint(uint8 _badgeType) public {
        require(_badgeType >= 1 && _badgeType <= 4, "Invalid badge type");
        require(!hasClaimed[msg.sender][_badgeType], "Badge already claimed");

        uint256 tokenId = _nextTokenId++;
        badgeType[tokenId] = _badgeType;
        hasClaimed[msg.sender][_badgeType] = true;
        _safeMint(msg.sender, tokenId);

        emit BadgeMinted(msg.sender, tokenId, _badgeType);
    }

    function balanceOfBadge(address owner, uint8 _badgeType) public view returns (uint256) {
        return hasClaimed[owner][_badgeType] ? 1 : 0;
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SBT: Transfer blocked. This badge is Soulbound.");
        }
        return super._update(to, tokenId, auth);
    }
}