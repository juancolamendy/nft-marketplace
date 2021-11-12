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
    try {
      const added = await client.add(
        file, {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      );
      const url = `https://ipfs.infura.io/ipfs/${added.path}`;
      setFileUrl(url);
    } catch (error) {
      console.log('Error uploading image file: ', error);
    }  
  }

  // handle create item
  const handleCreateItem = async () => {
    const url = await uploadItemMetada();
    await createItem(url);
    router.push('/');
  };

  // upload item metadata
  const uploadItemMetada = async () => {
    // get input from the state
    const { name, description, price } = state;
    
    // validation
    if (!name || !description || !price || !fileUrl) return;

    const metadata = JSON.stringify({
      name, description, image: fileUrl
    });

    try {
      const added = await client.add(metadata);
      return `https://ipfs.infura.io/ipfs/${added.path}`;
    } catch (error) {
      console.log('Error uploading metadata file: ', error);
      return;
    }    
  };

  // create item in ethereum
  const createItem = async (url) => {
  };

  return(
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="Asset Name"
          className="mt-8 border rounded p-4"
          onChange={e => setState({ ...state, name: e.target.value })}
        />
        <textarea
          placeholder="Asset Description"
          className="mt-2 border rounded p-4"
          onChange={e => setState({ ...state, description: e.target.value })}
        />
        <input
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
