import { useState } from 'react';
import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import { useRouter } from 'next/router';
import Web3Modal from 'web3modal';

// ipfs client
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

// load configuration
import {
  nftaddress,
  nftmarketaddress,
  ethereumUrl
} from '../config';

// import ABI to interact with contract on the client-side
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import Market from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';

// print out node provider url (ethereumUrl)
console.log(`Env: ethereumUrl: ${ethereumUrl} nftaddress: ${nftaddress} nftmarketaddress: ${nftmarketaddress}`);

export default function CreateItem() {
  // router
  const router = useRouter();

  // state
  const [fileUrl, setFileUrl] = useState(null);
  const [state, setState] = useState({ price: '', name: '', description: '' });

  // functions
  // handle file change. post it to ipfs
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    console.log('Handling file:', file);
    try {
      const added = await client.add(
        file, {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      );
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      console.log(`image file uploded to url ${url}`);
      setFileUrl(url);
    } catch (error) {
      console.log('Error uploading image file: ', error);
    }  
  }

  // handle create item
  const handleCreateItem = async () => {
    const url = await uploadItemMetada();
    if(url) {
      console.log(`metadata file uploded to url ${url}`);
      await createItem(url);
    }
    router.push('/');
  };

  // upload item metadata
  const uploadItemMetada = async () => {
    // get input from the state
    const { name, description } = state;
    
    // validation
    if (!name || !description || !fileUrl) return;

    // build metadata
    const metadata = JSON.stringify({
      name, description, image: fileUrl
    });

    try {
      // post metadata and return url
      const added = await client.add(metadata);
      return `https://ipfs.infura.io/ipfs/${added.path}`;
    } catch (error) {
      console.log('Error uploading metadata file: ', error);
      return;
    }    
  };

  // create item in ethereum
  const createItem = async (url) => {
    // get input from state
    const { price } = state;

    // validation
    if(!price) return;

    try {
      // open modal to get a connection
      console.log('trying to connect');
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      // get provider
      const provider = new ethers.providers.Web3Provider(connection);
      // get signer to sign the trasaction
      console.log('get signer');
      const signer = provider.getSigner();

      // get reference to nft contract
      console.log('connecting to nft contract');
      const nftContract = new ethers.Contract(nftaddress, NFT.abi, signer);
      
      // run transaction
      console.log('creating token');
      let transaction = await nftContract.createToken(url);
      // wait for the transaction to finish
      const txRes = await transaction.wait();
      
      // get return value
      const event = txRes.events[0];
      let value = event.args[2];
      let tokenId = value.toNumber();
      console.log('token created: ', tokenId);

      // get price as ether
      const priceEth = ethers.utils.parseUnits(price, 'ether');

      // get reference to market contract
      console.log('connecting to market contract');
      const marketContract = new ethers.Contract(nftmarketaddress, Market.abi, signer);
      let listingPrice = await marketContract.getListingPrice();
      listingPrice = listingPrice.toString();

      // create item
      console.log('listing item');
      transaction = await marketContract.createMarketItem(nftaddress, tokenId, priceEth, { value: listingPrice });
      await transaction.wait();
      console.log('finished creating item');      
    } catch(error) {
      console.log('error: ', error);
    }
  };

  return(
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          value={state.name}
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => setState({ ...state, name: e.target.value })}
        />
        <textarea
          value={state.description}
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => setState({ ...state, description: e.target.value })}
        />
        <input
          value={state.price}
          placeholder="Asset Price in Eth"
          className="mt-2 border rounded p-4"
          onChange={e => setState({ ...state, price: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={handleFileChange}
        />
        {
          fileUrl && (
            <img className="rounded mt-4" width="350" src={fileUrl} />
          )
        }
        <button onClick={handleCreateItem} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create Digital Asset
        </button>
      </div>
    </div>    
  );
};
