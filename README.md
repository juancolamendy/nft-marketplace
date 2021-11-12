## Init project
```bash
npx create-next-app .
```

## Add dependencies
```bash
npm install --save ethers hardhat @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers @openzeppelin/contracts axios ipfs-http-client web3modal
npm install --save-dev tailwindcss@latest postcss@latest autoprefixer@latest
```

## Init tailwindcss
```bash
npx tailwindcss init -p
```

## Init Solidity dev env
```bash
npx hardhat
```

## Run local node
```bash
npx hardhat node
```

## Compile contracts
```bash
npx hardhat compile
```
# Test
```bash
npx hardhat test
```

# Deploy
```bash
npx hardhat run scripts/deploy.js --network localhost
```

## Getting Started
Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
