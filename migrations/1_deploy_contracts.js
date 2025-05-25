const MemoryProof = artifacts.require("MemoryProof");
const NPCTraitStorage = artifacts.require("NPCTraitStorage");

module.exports = async function (deployer) {
  await deployer.deploy(MemoryProof);
  await deployer.deploy(NPCTraitStorage);
};
