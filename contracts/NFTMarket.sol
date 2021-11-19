// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard {
  using Counters for Counters.Counter;

  // counters
  Counters.Counter private _itemIds;
  Counters.Counter private _itemsSold;

  // who is the owner of market contract
  address payable owner;
  
  // commission to pay for listing in the market 
  uint256 listingPrice = 0.025 ether;

  // market item struct
  struct MarketItem {
    uint256 itemId;
    address nftContract;
    uint256 tokenId;
    address payable seller;
    address payable owner;
    uint256 price;
    bool sold;
  }

  // map of itemId => marketItem
  mapping(uint256 => MarketItem) private idToMarketItem;

  // notification event
  event MarketItemCreated (
    uint256 indexed itemId,
    address indexed nftContract,
    uint256 indexed tokenId,
    address seller,
    address owner,
    uint256 price,
    bool sold
  );

  // Constructor
  constructor() {
    // owner is the person deploying the contract
    // owner is the marketplace owner
    owner = payable(msg.sender);
    console.log('Created a new NFTMarket contract. owner', msg.sender);
  }
  
  /* Returns the listing price of the contract */
  function getListingPrice() public view returns (uint256) {
    return listingPrice;
  }
  
  /* Places an item for sale on the marketplace. Lister must pay listing price */
  // msg.sender is the seller listing its products
  function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public payable nonReentrant {
    // Validations
    require(price > 0, "Price must be at least 1 wei");
    require(msg.value == listingPrice, "Price must be equal to listing price");

    _itemIds.increment();
    uint256 itemId = _itemIds.current();
 
    // add marketItem. ms.sender is seller. No owner.
    idToMarketItem[itemId] =  MarketItem(
      itemId,
      nftContract,
      tokenId,
      payable(msg.sender),
      payable(address(0)),
      price,
      false
    );

    // transfer the ownership to the contract address.
    // right now, the person executing the transaction owns the contract item.
    // then we transfer the ownership to the contract
    IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

    emit MarketItemCreated(
      itemId,
      nftContract,
      tokenId,
      msg.sender,
      address(0),
      price,
      false
    );
  }

  /* Creates the sale of a marketplace item */
  /* Transfers ownership of the item, as well as funds between parties */
  // msg.sender is the buyer
  function createMarketSale(address nftContract, uint256 itemId) public payable nonReentrant {
    // get values
    uint256 price = idToMarketItem[itemId].price;
    uint256 tokenId = idToMarketItem[itemId].tokenId;
    
    // Validations
    // verify the buyer writing the transaction is sending the right price
    require(msg.value == price, "Please submit the asking price in order to complete the purchase");

    // two operations:
    // 1- send money to the seller
    // 2- transfer ownership to the buyer
    // transfer the value of the transaction to the seller 
    idToMarketItem[itemId].seller.transfer(msg.value);
    // transfer ownership of the contract item to the buyer from the contract address
    IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
   
    // update the stored mapping
    idToMarketItem[itemId].owner = payable(msg.sender);
    idToMarketItem[itemId].sold = true;
    
    // increment items sold
    _itemsSold.increment();
    
    // pay to the marketplace the listing price (commission)
    payable(owner).transfer(listingPrice);
  }

  /* Returns all unsold market items */
  function fetchMarketItems() public view returns (MarketItem[] memory) {
    uint256 itemCount = _itemIds.current();
    uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
    uint256 currentIndex = 0;

    MarketItem[] memory items = new MarketItem[](unsoldItemCount);
    for (uint i = 0; i < itemCount; i++) {
      if (idToMarketItem[i + 1].owner == address(0)) {
        MarketItem storage currentItem = idToMarketItem[i + 1];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    
    return items;
  }

  /* Returns onlyl items that a user has purchased */
  // msg.sender is the caller
  function fetchMyNFTs() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemCount = 0;
    uint256 currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].owner == msg.sender) {
        MarketItem storage currentItem = idToMarketItem[i + 1];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    
    return items;
  }

  /* Returns only items a user has created */
  // msg.sender is the caller
  function fetchItemsCreated() public view returns (MarketItem[] memory) {
    uint256 totalItemCount = _itemIds.current();
    uint256 itemCount = 0;
    uint256 currentIndex = 0;

    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].seller == msg.sender) {
        itemCount += 1;
      }
    }

    MarketItem[] memory items = new MarketItem[](itemCount);
    for (uint i = 0; i < totalItemCount; i++) {
      if (idToMarketItem[i + 1].seller == msg.sender) {
        MarketItem storage currentItem = idToMarketItem[i + 1];
        items[currentIndex] = currentItem;
        currentIndex += 1;
      }
    }
    
    return items;
  }
}
