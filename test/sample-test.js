const { expect } = require("chai");
const { ethers } = require("hardhat");

const printBalanceAsync = async (label, acct) => {
    let balance = await ethers.provider.getBalance(acct.address);
    balance = balance / 1000000000000000000;
    console.log(label, "=", acct.address, "=>", balance.toString());
};

describe("NFTMarket", function() {
  it("Should create and execute market sales", async function() {
    // Get accounts
    const [appAcct, sellerAcct, buyerAcct] = await ethers.getSigners()

    // Print out balances
    await printBalanceAsync("app", appAcct);
    await printBalanceAsync("seller", sellerAcct);
    await printBalanceAsync("buyer", buyerAcct);

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

    // Print out balances
    await printBalanceAsync("app", appAcct);

    // print out addresses
    console.log(`marketAddress: ${marketAddress} nftContractAddress: ${nftContractAddress}`)

    // Get listing pricing
    let listingPrice = await market.getListingPrice()
    listingPrice = listingPrice.toString()

    // Create tokens
    let tx = await nft.connect(sellerAcct).createToken("https://www.mytokenlocation1.com")
    let txRes = await tx.wait();
    const id1 = txRes.events[0].args[2].toNumber();
    console.log(id1);
    
    tx = await nft.connect(sellerAcct).createToken("https://www.mytokenlocation2.com")
    txRes = await tx.wait();
    const id2 = txRes.events[0].args[2].toNumber();

    // Print out token ids
    console.log(`minted tokens id => ${id1}, ${id2}`);
    
    // Print out balances
    await printBalanceAsync("app", appAcct);
    await printBalanceAsync("seller", sellerAcct); 
    await printBalanceAsync("buyer", buyerAcct);

    // Auction price. How much does the seller is willing to sell the tokens
    const auctionPrice = ethers.utils.parseUnits('1', 'ether')
    
    // List tokens in the marketplace
    tx = await market.connect(sellerAcct).createMarketItem(nftContractAddress, id1, auctionPrice, { value: listingPrice })
    await tx.wait()
    tx = await market.connect(sellerAcct).createMarketItem(nftContractAddress, id2, auctionPrice, { value: listingPrice })
    await tx.wait()
    
    // buyer connects to the marketplace. buyer becomes the msg.sender and call createMarketSale
    tx = await market.connect(buyerAcct).createMarketSale(nftContractAddress, 1, { value: auctionPrice})
    await tx.wait()

    // Print out balances
    console.log('Printing out balances after buying');
    await printBalanceAsync("app", appAcct);
    await printBalanceAsync("seller", sellerAcct);
    await printBalanceAsync("buyer", buyerAcct);
    
    // Get the list of available tokens in the marketplace 
    let items = await market.fetchMarketItems()
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
