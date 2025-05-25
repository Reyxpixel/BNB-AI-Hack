require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
console.log("Loaded MNEMONIC:", process.env.MNEMONIC ? "[OK]" : "[MISSING or EMPTY]");

module.exports = {
  networks: {
    // BSC Testnet configuration
    bsctestnet: {
      provider: () => new HDWalletProvider({
        mnemonic: {
          phrase: process.env.MNEMONIC
        },
        providerOrUrl: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
        // Optional: addressIndex, numberOfAddresses, shareNonce
      }),
      network_id: 97,           // BSC Testnet network id
      confirmations: 10,        // # of confs to wait between deployments. Adjust as needed.
      timeoutBlocks: 200,       // # of blocks before deployment times out
      skipDryRun: true          // Skip dry run before migrations? (for public nets)
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.20",        // Fetch exact version from solc-bin
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  }
};
