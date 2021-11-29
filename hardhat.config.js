require("@nomiclabs/hardhat-waffle");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("envs", "Prints the list of environment variables", async () => {
  console.log('INFURA_KEY:', process.env.INFURA_KEY);
  console.log(`ROPSTEN_ACCT_SECRET: 0x${process.env.ROPSTEN_ACCT_SECRET}`);
});

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: [`0x${process.env.ROPSTEN_ACCT_SECRET}`]
    }    
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
