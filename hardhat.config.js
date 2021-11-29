require("@nomiclabs/hardhat-waffle");

const privateKey = process.env.PRIVATE_KEY;
const infuraId = process.env.INFURA_ID;

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("envs", "Prints the list of environment variables", async () => {
	console.log('Private Key:', privateKey);
	console.log('Infura Id:', infuraId);
});

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
