var MyContract = artifacts.require("EthereumDIDRegistry");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(MyContract);
};