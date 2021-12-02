// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    
    // keep up with incrementing values
    Counters.Counter private _tokenIds;
    address marketAddress;

    constructor(address marketplaceAddress) ERC721("Metaverse", "METT") {
        marketAddress = marketplaceAddress;
	      console.log('Created a new NFT contract. marketAddress, sender', marketAddress, msg.sender);
    }

    function createToken(string memory tokenURI) public returns (uint) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
	
	      console.log('Minting a new NFT token. tokenURI, itemId, sender', tokenURI, newItemId, msg.sender);

        // mint the token
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        // approve the token in the market
        setApprovalForAll(marketAddress, true);
        
	      return newItemId;
    }
}
