const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", function() {
  it("Should create and execute market sales", async function() {
    // Deploy marketplace contract
    const Market = await ethers.getContractFactory("NFTMarket")
    const market = await Market.deploy()
    await market.deployed()
    const marketAddress = market.address

    // Deploy NTF contract
    const NFT = await ethers.getContractFactory("NFT")
    const nft = await NFT.deploy(marketAddress)
    await nft.deployed()
    const nftContractAddress = nft.address

    // Get listing pricing
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    // Auction price. How much does the seller is willing to sell the tokens
    const auctionPrice = ethers.utils.parseUnits('1', 'ether')

    // Create tokens
    await nft.createToken("https://www.mytokenlocation.com")
    await nft.createToken("https://www.mytokenlocation2.com")
  
    // List tokens in the marketplace
    await market.createMarketItem(nftContractAddress, 1, auctionPrice, { value: listingPrice })
    await market.createMarketItem(nftContractAddress, 2, auctionPrice, { value: listingPrice })

    // Get second account as the buyer
    const [_, buyerAddress] = await ethers.getSigners()

    // buyer connects to the marketplace. buyer becomes the msg.sender and call createMarketSale
    await market.connect(buyerAddress).createMarketSale(nftContractAddress, 1, { value: auctionPrice})

    // Get the list of available tokens in the marketplace 
    items = await market.fetchMarketItems()
    items = await Promise.all(items.map(async i => {
      const tokenUri = await nft.tokenURI(i.tokenId)
      let item = {
        price: i.price.toString(),
        tokenId: i.tokenId.toString(),
        seller: i.seller,
        owner: i.owner,
        tokenUri
      }
      return item
    }))
    console.log('items: ', items)
  })
})
