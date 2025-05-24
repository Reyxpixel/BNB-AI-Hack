const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    // BNB Smart Chain Testnet Configuration
    testnet: {
      provider: () => new HDWalletProvider(
        mnemonic,
        "https://data-seed-prebsc-1-s1.binance.org:8545"
      ),
      network_id: 97,           // BSC Testnet network id
      confirmations: 10,        // # of confirmations to wait between deployments
      timeoutBlocks: 200,       // # of blocks before deployment times out
      skipDryRun: true          // Skip dry run before migrations
    }
    // You can add more networks here (e.g., mainnet, development, etc.)
  },

  // Mocha testing framework options
  mocha: {
    // timeout: 100000
  },

  // Solidity compiler configuration
  compilers: {
    solc: {
      version: "0.8.21",        // Use a specific solc version
      // Uncomment below for advanced settings
      // settings: {
      //   optimizer: {
      //     enabled: false,
      //     runs: 200
      //   },
      //   evmVersion: "byzantium"
      // }
    }
  }

  // Truffle DB is disabled by default
  // db: {
  //   enabled: false
  // }
};
