var RevReg = artifacts.require("RevocationRegistry");

module.exports = function(deployer) {
  // deployment steps
  deployer.deploy(RevReg);
};