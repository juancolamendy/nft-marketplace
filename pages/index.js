import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from "web3modal";

// load configuration
import {
  nftaddress,
  nftmarketaddress,
  ethereumUrl
} from '../config'

// import ABI to interact with contract on the client-side
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

export default function Home() {
  const [nfts, setNfts] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded');

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    // Get provider
    const provider = new ethers.providers.JsonRpcProvider();
    
    // Reference contracts
    const tokenContract = new ethers.Contract(nftaddress, NFT.abi, provider)
    const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, provider)

    // Fetch market items
    const data = await marketContract.fetchMarketItems();

    // Get list of items
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await tokenContract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        itemId: i.itemId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item;
    }));
    
    // Update the view state
    setNfts(items)
    setLoadingState('loaded') 
  };

  const buyNft = async (nft) => {
    // web3Modal support multiple providers/wallets
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();

    // Get providers
    const provider = new ethers.providers.Web3Provider(connection);
    // Get signer because we are executing/signing a transaction
    const signer = provider.getSigner();

    // Reference the market contract
    const contract = new ethers.Contract(nftmarketaddress, Market.abi, signer);

    // Execute the transaction: createMarketSale
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
    const transaction = await contract.createMarketSale(nftaddress, nft.itemId, {
      value: price
    });
    // Wait for the transaction to finish
    await transaction.wait();

    // Reload the nfts
    loadNFTs();
  };  

  // return if there is no nfts
  if (loadingState === 'loaded' && !nfts.length) return (<h1 className="px-20 py-10 text-3xl">No items in marketplace</h1>);
  // if there are ntfs, render them out
  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {
            nfts.map((nft, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden">
                <img src={nft.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{nft.name}</p>
                  <div style={{ height: '70px', overflow: 'hidden' }}>
                    <p className="text-gray-400">{nft.description}</p>
                  </div>
                </div>
                <div className="p-4 bg-black">
                  <p className="text-2xl mb-4 font-bold text-white">{nft.price} ETH</p>
                  <button className="w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Buy</button>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}
